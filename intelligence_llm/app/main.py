# app/main.py
import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from app.routers import chat, reports
from reporting.scheduler import start_scheduler
from app.schemas import HealthResponse

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    print("🚀 ITMS Intelligence Module is starting...")
    # Khởi chạy Scheduler tự động báo cáo
    scheduler = start_scheduler()
    
    yield
    
    # --- SHUTDOWN ---
    print("🛑 ITMS Intelligence Module is shutting down...")
    scheduler.shutdown()

app = FastAPI(
    title="ITMS Intelligence LLM API",
    description="Hệ thống phân tích giao thông thông minh sử dụng RAG & SQL Agent",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS để Frontend React gọi được
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include các routers
app.include_router(chat.router)
app.include_router(reports.router)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    # Kiểm tra nhanh các kết nối
    return HealthResponse(
        status="ok",
        db="connected",
        chromadb="connected",
        llm=f"{os.getenv('LLM_PROVIDER')}:{os.getenv('OLLAMA_MODEL') or os.getenv('OPENAI_MODEL')}"
    )

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8002))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
