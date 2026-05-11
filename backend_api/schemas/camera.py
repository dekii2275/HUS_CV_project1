from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Tuple
from datetime import datetime

class CameraBase(BaseModel):
    camera_id: str
    location: Optional[Tuple[float, float]] = None
    rtsp_url: Optional[str] = None
    is_active: bool = True
    camera_metadata: Dict[str, Any] = {}

    class Config:
        populate_by_name = True

class CameraResponse(CameraBase):
    created_at: datetime

    class Config:
        from_attributes = True
