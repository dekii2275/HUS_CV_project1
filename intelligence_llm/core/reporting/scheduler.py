# core/reporting/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from core.reporting.report_generator import ReportGenerator
from config.settings import settings
import logging

# Cấu hình logging để theo dõi scheduler
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ITMS_Scheduler")

async def daily_report_job():
    """Job chạy định kỳ"""
    try:
        generator = ReportGenerator()
        # Chạy báo cáo cho chính ngày hôm nay
        today = datetime.now().date()
        await generator.generate_and_save(today)
        logger.info(f"Successfully generated daily report for {today}")
    except Exception as e:
        logger.error(f"Error in daily_report_job: {str(e)}")

def start_scheduler():
    scheduler = AsyncIOScheduler()
    
    hour = settings.REPORT_SCHEDULE_HOUR
    minute = settings.REPORT_SCHEDULE_MINUTE
    
    scheduler.add_job(
        daily_report_job, 
        'cron', 
        hour=hour, 
        minute=minute,
        id='daily_traffic_report'
    )
    
    scheduler.start()
    logger.info(f"⏰ Scheduler started. Daily report set at {hour:02d}:{minute:02d}")
    return scheduler

if __name__ == "__main__":
    import asyncio
    start_scheduler()
    # Giữ loop chạy để test
    asyncio.get_event_loop().run_forever()
