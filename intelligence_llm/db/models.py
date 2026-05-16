from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID

class CameraModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    camera_id: str
    location: Optional[Any] = None  # POINT
    rtsp_url: Optional[str] = None
    is_active: bool = True
    camera_metadata: Dict[str, Any] = {}
    created_at: datetime

class FrameModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    frame_uuid: UUID
    frame_id: int
    timestamp: datetime
    camera_id: str

class DetectionModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    detection_id: int
    frame_uuid: UUID
    timestamp: datetime
    track_id: Optional[int] = None
    class_name: str = Field(alias="class")
    confidence: float
    bbox: List[int]
    bottom_center: Optional[Any] = None

class EventModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    event_id: int
    frame_uuid: UUID
    timestamp: datetime
    event_type: Optional[str] = None
    track_id: Optional[int] = None
    description: Optional[str] = None

class DailyReport(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    report_date: datetime
    content: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
