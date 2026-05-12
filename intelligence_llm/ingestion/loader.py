# ingestion/loader.py
import asyncio
import os
from datetime import datetime
from typing import List
import asyncpg
from dotenv import load_dotenv
from langchain_core.documents import Document

load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://itms_user:itms_pass@localhost:5432/itms_db")

class TrafficDataLoader:
    def __init__(self, dsn: str = POSTGRES_URL):
        self.dsn = dsn

    async def load_documents(self, start_time: datetime, end_time: datetime) -> List[Document]:
        """
        Đọc các bản ghi từ bảng traffic_events và violations trong khoảng thời gian xác định
        và chuyển đổi thành danh sách các LangChain Documents.
        """
        documents: List[Document] = []
        conn = await asyncpg.connect(self.dsn)
        
        try:
            # 1. Trích xuất dữ liệu từ bảng traffic_events
            event_rows = await conn.fetch(
                """
                SELECT id, time, camera_id, event_type, severity, description, vehicle_id, location, resolved_at
                FROM traffic_events
                WHERE time >= $1 AND time <= $2
                ORDER BY time ASC
                """, start_time, end_time
            )
            
            for row in event_rows:
                # Định dạng lại chuỗi văn bản thuần bằng tiếng Việt để nhúng (Embedding)
                time_str = row['time'].strftime("%H:%M:%S ngày %d/%m/%Y")
                resolved_str = f"được xử lý lúc {row['resolved_at'].strftime('%H:%M:%S')}" if row['resolved_at'] else "chưa được xử lý"
                
                page_content = (
                    f"Sự kiện giao thông: Vào lúc {time_str}, tại vị trí {row['location']} "
                    f"(Camera: {row['camera_id']}) đã xảy ra sự vụ '{row['event_type']}' "
                    f"mức độ {row['severity']}. Chi tiết: {row['description']} "
                    f"Phương tiện liên quan có mã theo dõi: {row['vehicle_id']}. Tình trạng: {resolved_str}."
                )
                
                # Metadata đi kèm phục vụ Filter/Rerank sau này
                metadata = {
                    "source": "traffic_events",
                    "id": row['id'],
                    "time": row['time'].isoformat(),
                    "camera_id": row['camera_id'],
                    "event_type": row['event_type'],
                    "severity": row['severity'],
                    "location": row['location']
                }
                documents.append(Document(page_content=page_content, metadata=metadata))

            # 2. Trích xuất dữ liệu từ bảng violations
            violation_rows = await conn.fetch(
                """
                SELECT id, time, camera_id, violation_type, vehicle_id, speed, location
                FROM violations
                WHERE time >= $1 AND time <= $2
                ORDER BY time ASC
                """, start_time, end_time
            )
            
            for row in violation_rows:
                time_str = row['time'].strftime("%H:%M:%S ngày %d/%m/%Y")
                speed_info = f" với vận tốc đo được là {row['speed']} km/h" if row['speed'] else ""
                
                page_content = (
                    f"Vi phạm giao thông: Vào lúc {time_str}, tại vị trí {row['location']} "
                    f"(Camera: {row['camera_id']}), phát hiện phương tiện mang mã tracking {row['vehicle_id']} "
                    f"mắc lỗi vi phạm hành vi '{row['violation_type']}'{speed_info}."
                )
                
                metadata = {
                    "source": "violations",
                    "id": row['id'],
                    "time": row['time'].isoformat(),
                    "camera_id": row['camera_id'],
                    "violation_type": row['violation_type'],
                    "location": row['location']
                }
                documents.append(Document(page_content=page_content, metadata=metadata))

        finally:
            await conn.close()
            
        print(f"📊 Đã tải thành công {len(documents)} Documents từ DB sang cấu trúc LangChain.")
        return documents

# Đoạn code để kiểm tra trực tiếp (Sanity Check) khi chạy file độc lập
if __name__ == "__main__":
    async def main():
        loader = TrafficDataLoader()
        # Mock thử khoảng thời gian lấy dữ liệu của 1 ngày trước đến hiện tại
        end = datetime.now()
        start = end - ValueError if not end else end - (end - end) # Tạo mốc an toàn
        start = end - (end - end) # Hack để reset delta thủ công bên dưới
        from datetime import timedelta
        start = end - timedelta(days=1)
        
        docs = await loader.load_documents(start, end)
        if docs:
            print("\n🔍 Bản dịch Document mẫu đầu tiên:")
            print(f"Content: {docs[0].page_content}")
            print(f"Metadata: {docs[0].metadata}")
            
    asyncio.run(main())
