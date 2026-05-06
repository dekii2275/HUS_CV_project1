from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

app = FastAPI(title="ITMS Backend API")

# Configure CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL (e.g., http://localhost:13000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to ITMS Backend API", "status": "running"}

@app.get("/db-status")
def db_status():
    db_url = os.getenv("DATABASE_URL")
    return {"database_url": db_url, "info": "Connect to this URL using SQLAlchemy"}

@app.get("/api/v1/cameras")
def get_cameras():
    # Mock data modeling the future Database structure
    # This matches the schema we will create in PostgreSQL
    return [
        {
            "id": "cam_w11",
            "name": "CAM W11",
            "location": "I-95 Northbound",
            "youtube_url": "https://www.youtube.com/watch?v=1EiC9bvVGnk",
            "status": "ACTIVE",
            "bitrate": "4.2 MB/S",
            "latency": "18ms",
            "metadata": {
                "latitude": 38.8951,
                "longitude": -77.0364,
                "azimuth": 182.4,
                "pitch": -14.2,
                "fov": 75.0
            }
        },
        {
            "id": "cam_c04",
            "name": "CAM C04",
            "location": "Main St Intersection",
            "youtube_url": "https://www.youtube.com/watch?v=MNn9qKG2PNI",
            "status": "ACTIVE",
            "bitrate": "3.8 MB/S",
            "latency": "12ms",
            "metadata": None
        },
        {
            "id": "cam_s12",
            "name": "CAM S12",
            "location": "Beltway Junction",
            "youtube_url": None,
            "status": "OFFLINE",
            "bitrate": "0.0 MB/S",
            "latency": "---",
            "metadata": None
        }
    ]
