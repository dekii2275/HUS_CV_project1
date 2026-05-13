from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager
from api.routers import camera, chat, reports
from core_llm.reporting.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    print("🚀 Starting ITMS Backend with LLM integration...")
    scheduler = start_scheduler()
    yield
    # SHUTDOWN
    print("🛑 Shutting down ITMS Backend...")
    scheduler.shutdown()

app = FastAPI(
    title="ITMS Backend API",
    description="Backend chính tích hợp AI Intelligence Module",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(camera.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to ITMS Backend API", "status": "running"}

@app.get("/db-status")
def db_status():
    db_url = os.getenv("DATABASE_URL")
    return {"database_url": db_url, "info": "Connect to this URL using SQLAlchemy"}
