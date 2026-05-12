from datetime import datetime, date
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class VehicleCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    time: datetime
    camera_id: str
    location: Optional[str] = None
    motorbike: int = 0
    car: int = 0
    truck: int = 0
    bus: int = 0
    bicycle: int = 0
    total: int = 0
    avg_speed: Optional[float] = None
    density: Optional[float] = None

class TrafficEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    time: datetime
    camera_id: str
    event_type: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    vehicle_id: Optional[str] = None
    location: Optional[str] = None
    resolved_at: Optional[datetime] = None

class Violation(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    time: datetime
    camera_id: Optional[str] = None
    violation_type: Optional[str] = None
    vehicle_id: Optional[str] = None
    speed: Optional[float] = None
    image_path: Optional[str] = None
    location: Optional[str] = None

class DailyReport(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    report_date: date
    content: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
