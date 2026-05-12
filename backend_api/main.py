from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from api.routers import camera

app = FastAPI(title="ITMS Backend API")

# Configure CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(camera.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to ITMS Backend API", "status": "running"}

@app.get("/db-status")
def db_status():
    db_url = os.getenv("DATABASE_URL")
    return {"database_url": db_url, "info": "Connect to this URL using SQLAlchemy"}
