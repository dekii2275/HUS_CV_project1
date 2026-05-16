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

# core/ingestion/loader.py
import asyncio
import os
from datetime import datetime
from typing import List
import asyncpg
from config.settings import settings
from langchain_core.documents import Document

class TrafficDataLoader:
    def __init__(self, dsn: str = settings.POSTGRES_URL):
        self.dsn = dsn

    async def load_documents(self, start_time: datetime, end_time: datetime) -> List[Document]:
        """
        Đọc các bản ghi từ bảng events (JOIN với frames/cameras) trong khoảng thời gian xác định.
        """
        documents: List[Document] = []
        conn = await asyncpg.connect(self.dsn)
        
        try:
            # JOIN để lấy thông tin camera và vị trí cho từng sự kiện
            query = """
                SELECT e.event_id, e.timestamp, c.camera_id, e.event_type, e.description, c.location
                FROM events e
                JOIN frames f ON e.frame_uuid = f.frame_uuid AND e.timestamp = f.timestamp
                JOIN cameras c ON f.camera_id = c.camera_id
                WHERE e.timestamp >= $1 AND e.timestamp <= $2
                ORDER BY e.timestamp ASC
            """
            event_rows = await conn.fetch(query, start_time, end_time)
            
            for row in event_rows:
                time_str = row['timestamp'].strftime("%H:%M:%S ngày %d/%m/%Y")
                
                # location trong Postgres là POINT, asyncpg trả về object hoặc tuple
                loc = row['location']
                loc_str = f"({loc[0]}, {loc[1]})" if isinstance(loc, (list, tuple)) else str(loc)
                
                page_content = (
                    f"Sự kiện giao thông: Vào lúc {time_str}, tại tọa độ {loc_str} "
                    f"(Camera: {row['camera_id']}) đã xảy ra sự vụ '{row['event_type']}'. "
                    f"Chi tiết: {row['description']}"
                )
                
                metadata = {
                    "source": "events",
                    "id": row['event_id'],
                    "time": row['timestamp'].isoformat(),
                    "camera_id": row['camera_id'],
                    "event_type": row['event_type'],
                    "location": loc_str
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
