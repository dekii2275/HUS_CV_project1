# ingestion/embedder.py
import os
from typing import List
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

class TrafficEmbedder:
    def __init__(self):
        # Model được chỉ định trong file .env
        self.model_name = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-base")
        
        # Cấu hình cho HuggingFaceEmbeddings
        # E5 yêu cầu prefix "passage: " cho tài liệu cần index
        self.encode_kwargs = {'normalize_embeddings': True}
        self.query_instruction = "query: "
        self.document_instruction = "passage: "

        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.model_name,
            model_kwargs={'device': 'cpu'}, # Chuyển thành 'cuda' nếu có GPU
            encode_kwargs=self.encode_kwargs,
            show_progress=True
        )

    def get_embedding_engine(self):
        """Trả về instance của LangChain Embeddings để dùng cho Vector Store"""
        return self.embeddings

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Nhúng danh sách văn bản (đã thêm prefix)"""
        prefixed_texts = [f"{self.document_instruction}{t}" for t in texts]
        return self.embeddings.embed_documents(prefixed_texts)

    def embed_query(self, text: str) -> List[float]:
        """Nhúng câu hỏi của người dùng (đã thêm prefix)"""
        return self.embeddings.embed_query(f"{self.query_instruction}{text}")
