import httpx
import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter(prefix="/reports", tags=["Reporting Proxy"])

LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://itms-llm:18001")

class ReportResponse(BaseModel):
    date: str
    report: str
    summary: Optional[Dict[str, Any]] = None

@router.get("/daily", response_model=ReportResponse)
async def get_daily_report(date: str = Query(..., description="Format: YYYY-MM-DD")):
    """
    Gateway chuyển tiếp yêu cầu lấy báo cáo sang service LLM.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{LLM_SERVICE_URL}/api/v1/reports/daily",
                params={"date": date}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"LLM Service Error: {response.text}"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="LLM Service is currently unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
