# app/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DateRange(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None

class ChatRequest(BaseModel):
    question: str = Field(..., example="Hôm nay có bao nhiêu xe máy qua CAM_01?")
    camera_id: Optional[str] = None
    date_range: Optional[DateRange] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    query_type: str  # vector_search | sql_agent | hybrid
    confidence: float = 0.9

class DailyReportSummary(BaseModel):
    total_vehicles: int
    peak_hour: str
    violations_count: int
    incidents_count: int

class ReportResponse(BaseModel):
    date: str
    report: str
    summary: DailyReportSummary

class HealthResponse(BaseModel):
    status: str
    db: str
    chromadb: str
    llm: str
