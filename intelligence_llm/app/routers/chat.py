# app/routers/chat.py
from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse
from rag.chain import TrafficRAGChain
from rag.query_router import QueryRouter

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# Khởi tạo Chain (Nên dùng Dependency Injection nếu scale lớn, ở đây init global để nhanh)
rag_system = TrafficRAGChain()
router_logic = QueryRouter()

@router.post("/", response_model=ChatResponse)
async def chat_with_itms(request: ChatRequest):
    try:
        # 1. Xác định loại query
        q_type = router_logic.route_query(request.question)
        
        # 2. Gọi RAG Chain xử lý
        # Lưu ý: Ở Task L04/05 ta trả về string, ở đây ta bọc lại cho đúng contract
        answer = rag_system.ask(request.question)
        
        # 3. Giả lập lấy sources (Nếu là vector search thì lấy từ retriever)
        sources = []
        if q_type in ["vector", "hybrid"]:
            docs = rag_system.retriever.vector_store.similarity_search(request.question, k=2)
            sources = [doc.metadata.get("source", "unknown") for doc in docs]

        return ChatResponse(
            answer=answer,
            sources=list(set(sources)),
            query_type=q_type,
            confidence=0.85 if q_type == "sql" else 0.75
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
