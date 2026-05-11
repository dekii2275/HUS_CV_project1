from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from db.database import get_db
from db.models import Camera
from schemas.camera import CameraResponse

router = APIRouter(
    prefix="/cameras",
    tags=["cameras"]
)

@router.get("/", response_model=List[CameraResponse])
async def get_cameras(db: AsyncSession = Depends(get_db)):
    """Lấy danh sách toàn bộ camera từ Database."""
    result = await db.execute(select(Camera))
    cameras = result.scalars().all()
    return cameras

@router.get("/{camera_id}/stream")
async def get_camera_stream(camera_id: str, db: AsyncSession = Depends(get_db)):
    """Lấy link stream chuẩn cho camera (chuyển đổi YouTube sang embed nếu cần)."""
    result = await db.execute(select(Camera).where(Camera.camera_id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if not camera.is_active:
        raise HTTPException(status_code=400, detail="Camera is offline")
    
    original_url = camera.rtsp_url or ""
    stream_url = original_url
    stream_type = "rtsp"

    # Logic xử lý YouTube
    if "youtube.com" in original_url or "youtu.be" in original_url:
        stream_type = "youtube"
        # Chuyển đổi sang embed link
        import re
        reg_exp = r'^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*'
        match = re.match(reg_exp, original_url)
        if match and len(match.group(2)) == 11:
            stream_url = f"https://www.youtube.com/embed/{match.group(2)}?autoplay=1&mute=1"

    return {
        "camera_id": camera_id,
        "stream_url": stream_url,
        "stream_type": stream_type,
        "is_active": camera.is_active
    }
