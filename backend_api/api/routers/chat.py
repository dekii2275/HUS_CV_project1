import traceback
import httpx
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/chat", tags=["AI Chat Proxy"])

# URL của LLM Service (Chạy trong Docker nội bộ)
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://itms-llm:18001")

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = []
    query_type: Optional[str] = None
    confidence: Optional[float] = None

@router.post("/", response_model=ChatResponse)
async def chat_with_itms(request: ChatRequest):
    """
    Gateway chuyển tiếp yêu cầu sang service LLM xử lý nặng.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{LLM_SERVICE_URL}/api/v1/chat/",
                json={"question": request.question}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"LLM Service Error: {response.text}"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        print(f"❌ Lỗi kết nối đến LLM Service: {e}")
        raise HTTPException(status_code=503, detail="LLM Service is currently unavailable")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))