import os
import asyncpg
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://itms_user:itms_pass@localhost:5432/itms_db")

_pool: asyncpg.Pool | None = None

async def init_pool():
    """Khởi tạo connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=POSTGRES_URL,
            min_size=1,
            max_size=10
        )
    return _pool

async def get_pool() -> asyncpg.Pool:
    """Lấy pool hiện tại, nếu chưa có thì tạo mới."""
    if _pool is None:
        await init_pool()
    return _pool

async def get_connection():
    """Dependency injection để lấy 1 connection từ pool (dùng cho FastAPI sau này)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn

async def close_pool():
    """Đóng pool khi shutdown app."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
