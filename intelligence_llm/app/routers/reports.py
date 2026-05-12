# app/routers/reports.py
from fastapi import APIRouter, HTTPException, Query
from app.schemas import ReportResponse
import asyncpg
import os
import json
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reporting"])

@router.get("/daily", response_model=ReportResponse)
async def get_daily_report(date: str = Query(..., description="Format: YYYY-MM-DD")):
    db_url = os.getenv("POSTGRES_URL")
    conn = await asyncpg.connect(db_url)
    try:
        # Chuyển string sang date object
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        row = await conn.fetchrow(
            "SELECT content, summary FROM daily_reports WHERE report_date = $1", 
            target_date
        )
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy báo cáo cho ngày {date}")
        
        return ReportResponse(
            date=date,
            report=row['content'],
            summary=json.loads(row['summary'])
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD")
    finally:
        await conn.close()
