import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_chat_endpoint():
    payload = {
        "question": "Kiểm tra hệ thống, hôm nay có bao nhiêu xe?",
        "camera_id": "CAM_01"
    }
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/chat/", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "query_type" in data
  
