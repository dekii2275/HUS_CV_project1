# reporting/report_generator.py
import os
import json
import asyncio
from datetime import datetime, date
import asyncpg
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from rag.sql_agent import get_llm

load_dotenv()

class ReportGenerator:
    def __init__(self):
        self.db_url = os.getenv("POSTGRES_URL")
        self.llm = get_llm()
        
        # Load template
        template_path = os.path.join(os.path.dirname(__file__), "templates/daily_report.txt")
        with open(template_path, "r", encoding="utf-8") as f:
            self.prompt_template = PromptTemplate.from_template(f.read())

    async def get_daily_summary(self, target_date: date):
        """Truy vấn các chỉ số tổng hợp từ DB"""
        conn = await asyncpg.connect(self.db_url)
        try:
            # 1. Tổng số xe & Giờ cao điểm (peak hour)
            # Giả định peak hour là giờ có sum(total) cao nhất
            stats = await conn.fetchrow("""
                SELECT 
                    SUM(total) as total_vehicles,
                    TO_CHAR(time, 'HH24:00') as hour
                FROM vehicle_counts 
                WHERE time::date = $1
                GROUP BY hour 
                ORDER BY SUM(total) DESC 
                LIMIT 1
            """, target_date)
            
            # 2. Đếm sự kiện và vi phạm
            incidents_count = await conn.fetchval("SELECT COUNT(*) FROM traffic_events WHERE time::date = $1", target_date)
            violations_count = await conn.fetchval("SELECT COUNT(*) FROM violations WHERE time::date = $1", target_date)
            
            # 3. Lấy danh sách mô tả sự kiện để LLM phân tích
            event_rows = await conn.fetch("""
                SELECT description FROM traffic_events 
                WHERE time::date = $1 AND severity IN ('medium', 'high')
            """, target_date)
            events_detail = "\n".join([f"- {r['description']}" for r in event_rows]) or "Không có sự cố nghiêm trọng."

            return {
                "report_date": target_date.strftime("%d/%m/%Y"),
                "total_vehicles": stats['total_vehicles'] if stats else 0,
                "peak_hour": stats['hour'] if stats else "N/A",
                "incidents_count": incidents_count,
                "violations_count": violations_count,
                "events_detail": events_detail
            }
        finally:
            await conn.close()

    async def generate_and_save(self, target_date: date):
        """Quy trình chính: Tổng hợp -> Viết -> Lưu"""
        print(f"📋 Đang tạo báo cáo cho ngày: {target_date}")
        
        summary_data = await self.get_daily_summary(target_date)
        
        # Gọi LLM viết báo cáo văn bản
        chain = self.prompt_template | self.llm
        report_content = await chain.ainvoke(summary_data)
        
        # Xử lý output (Ollama trả về BaseMessage, OpenAI cũng vậy)
        if hasattr(report_content, 'content'):
            report_text = report_content.content
        else:
            report_text = str(report_content)

        # Lưu vào bảng daily_reports
        conn = await asyncpg.connect(self.db_url)
        try:
            summary_json = json.dumps({
                "total_vehicles": summary_data['total_vehicles'],
                "peak_hour": summary_data['peak_hour'],
                "violations_count": summary_data['violations_count'],
                "incidents_count": summary_data['incidents_count']
            })
            
            await conn.execute("""
                INSERT INTO daily_reports (report_date, content, summary)
                VALUES ($1, $2, $3)
                ON CONFLICT (report_date) DO UPDATE 
                SET content = EXCLUDED.content, summary = EXCLUDED.summary
            """, target_date, report_text, summary_json)
            
            print(f"✅ Báo cáo ngày {target_date} đã được lưu vào Database.")
            return report_text
        finally:
            await conn.close()

if __name__ == "__main__":
    # Test thử tạo báo cáo cho ngày hôm nay
    generator = ReportGenerator()
    asyncio.run(generator.generate_and_save(datetime.now().date()))
