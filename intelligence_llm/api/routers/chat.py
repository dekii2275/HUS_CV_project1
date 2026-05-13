import traceback
from fastapi import APIRouter, HTTPException
from api.schemas import ChatRequest, ChatResponse
from llm.chain import TrafficRAGChain
from llm.query_router import QueryRouter

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# Khởi tạo Chain (Nên dùng Dependency Injection hoặc Lifespan trong thực tế)
rag_system = TrafficRAGChain()
router_logic = QueryRouter()

@router.post("/", response_model=ChatResponse)
async def chat_with_itms(request: ChatRequest):
    try:
        # 1. Xác định loại câu hỏi (SQL / Vector / Hybrid)
        q_type = await router_logic.route_query(request.question)
        
        # 2. Gọi RAG Chain xử lý (Async)
        raw_answer = await rag_system.ask(request.question)
        
        # 3. Trích xuất nguồn tài liệu nếu là tìm kiếm ngữ nghĩa
        sources = []
        if q_type in ["vector", "hybrid"]:
            try:
                docs = rag_system.retriever.vector_store.similarity_search(request.question, k=2)
                sources = [doc.metadata.get("source", "unknown") for doc in docs]
            except Exception as e:
                print(f"⚠️ Cảnh báo lỗi lấy nguồn Vector Store: {e}")
                sources = ["ChromaDB Error"]

        # 4. Trả về đúng cấu trúc Pydantic
        return ChatResponse(
            answer=str(raw_answer),
            sources=list(set(sources)),
            query_type=q_type,
            confidence=0.85 if q_type == "sql" else 0.75
        )
    except Exception as e:
        print("\n❌ 🛑 [API ROUTER ERROR] 🛑 ❌")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))