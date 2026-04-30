from fastapi import FastAPI
import os

app = FastAPI(title="ITMS Backend API")

@app.get("/")
def read_root():
    return {"message": "Welcome to ITMS Backend API", "status": "running"}

@app.get("/db-status")
def db_status():
    db_url = os.getenv("DATABASE_URL")
    return {"database_url": db_url, "info": "Connect to this URL using SQLAlchemy"}
