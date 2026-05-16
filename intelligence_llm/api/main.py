# api/main.py
import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.settings import settings
from api.routers import chat, reports
from core.reporting.scheduler import start_scheduler
from api.schemas import HealthResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    print(f"🚀 ITMS Intelligence Module is starting on port {settings.API_PORT}...")
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
app.include_router(chat.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    # Kiểm tra nhanh các kết nối
    return HealthResponse(
        status="ok",
        db="connected",
        chromadb="connected",
        llm=f"{settings.LLM_PROVIDER}"
    )

if __name__ == "__main__":
    uvicorn.run("api.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
