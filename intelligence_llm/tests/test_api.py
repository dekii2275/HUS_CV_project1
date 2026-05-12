import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_chat_endpoint():
    payload = {
        "question": "Kiểm tra hệ thống, hôm nay có bao nhiêu xe?",
        "camera_id": "CAM_01"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", follow_redirects=True) as ac:
        response = await ac.post("/chat/", json=payload)
        
        assert response.status_code == 200
        # Đã sửa đổi từ "response" thành "answer" để khớp chuẩn Pydantic Response của hệ thống
        assert "answer" in response.json()