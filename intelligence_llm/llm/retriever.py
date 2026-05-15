# rag/retriever.py
from ingestion.vector_store import TrafficVectorStore

class TrafficRetriever:
    def __init__(self):
        self.vector_store = TrafficVectorStore()

    def get_context(self, query: str, k: int = 5) -> str:
        """Lấy ngữ cảnh dạng text từ Vector DB"""
        docs = self.vector_store.similarity_search(query, k=k)
        context = "\n---\n".join([doc.page_content for doc in docs])
        return context
