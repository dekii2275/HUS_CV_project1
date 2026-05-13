# ingestion/vector_store.py
import os
import chromadb
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from ingestion.embedder import TrafficEmbedder

load_dotenv()

class TrafficVectorStore:
    def __init__(self):
        self.persist_directory = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
        self.collection_name = os.getenv("CHROMA_COLLECTION_NAME", "traffic_events")
        
        # Khởi tạo embedding engine từ task trên
        self.embedder = TrafficEmbedder().get_embedding_engine()
        
        # Khởi tạo client ChromaDB
        self.vector_store = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embedder,
            persist_directory=self.persist_directory
        )

    def upsert_documents(self, documents: List[Document]):
        """Thêm hoặc cập nhật documents vào ChromaDB"""
        if not documents:
            print("⚠️ Không có tài liệu nào để thêm.")
            return
        
        # Tạo IDs duy nhất từ metadata (đã có từ Task L02) để tránh trùng lặp
        ids = [f"{doc.metadata['source']}_{doc.metadata['id']}" for doc in documents]
        
        self.vector_store.add_documents(documents=documents, ids=ids)
        print(f"✅ Đã upsert {len(documents)} tài liệu vào ChromaDB.")

    def get_last_timestamp(self) -> Optional[datetime]:
        """Lấy timestamp mới nhất hiện có trong Vector Store để phục vụ cập nhật tăng cường"""
        results = self.vector_store.get(
            include=['metadatas']
        )
        
        metadatas = results.get('metadatas', [])
        if not metadatas:
            return None
        
        # Trích xuất timestamps và tìm giá trị lớn nhất
        timestamps = []
        for meta in metadatas:
            if 'time' in meta:
                timestamps.append(datetime.fromisoformat(meta['time']))
        
        return max(timestamps) if timestamps else None

    async def incremental_update(self, loader):
        """
        Quy trình cập nhật tăng cường:
        1. Kiểm tra thời gian cuối cùng trong DB
        2. Load data mới từ DB thông qua loader
        3. Upsert vào ChromaDB
        """
        last_time = self.get_last_timestamp()
        now = datetime.now()
        
        if last_time:
            print(f"🔄 Tìm kiếm dữ liệu mới từ sau: {last_time}")
            start_time = last_time
        else:
            print("🆕 Vector Store trống. Đang thực hiện load toàn bộ dữ liệu.")
            # Mặc định lấy dữ liệu 30 ngày trước nếu store trống
            from datetime import timedelta
            start_time = now - timedelta(days=30)

        # Sử dụng loader từ Task L02
        new_docs = await loader.load_documents(start_time, now)
        
        if new_docs:
            self.upsert_documents(new_docs)
        else:
            print("✨ Đã cập nhật. Không có dữ her mới.")

    def similarity_search(self, query: str, k: int = 5):
        """Tìm kiếm các sự kiện liên quan dựa trên câu hỏi"""
        return self.vector_store.similarity_search(query, k=k)

# --- Code chạy thử nghiệm (Sanity Check) ---
if __name__ == "__main__":
    import asyncio
    from ingestion.loader import TrafficDataLoader

    async def test_vector_store():
        store = TrafficVectorStore()
        loader = TrafficDataLoader()
        
        # Thực hiện cập nhật tăng cường
        await store.incremental_update(loader)
        
        # Test tìm kiếm thử một câu hỏi sự kiện
        query = "Có tai nạn nào xảy ra ở đường Nguyễn Trãi không?"
        print(f"\n🔍 Đang tìm kiếm: '{query}'")
        results = store.similarity_search(query, k=2)
        
        for i, doc in enumerate(results):
            print(f"Kết quả {i+1}: {doc.page_content}")
            print(f"Metadata: {doc.metadata}\n")

    asyncio.run(test_vector_store())
