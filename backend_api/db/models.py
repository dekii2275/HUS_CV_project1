from sqlalchemy import Column, String, Boolean, JSON, DateTime, func
from sqlalchemy.types import UserDefinedType
from db.database import Base

class Point(UserDefinedType):
    """Kiểu dữ liệu Point tùy chỉnh cho PostgreSQL."""
    def get_col_spec(self, **kw):
        return "POINT"

    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            return f"({value[0]},{value[1]})"
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is None:
                return None
            # Trả về (x, y) từ chuỗi "(x,y)"
            # Format Postgres trả về: (x,y)
            res = value.strip('()').split(',')
            return (float(res[0]), float(res[1]))
        return process

class Camera(Base):
    __tablename__ = "cameras"

    camera_id = Column(String, primary_key=True, index=True)
    location = Column(Point)
    rtsp_url = Column(String)
    is_active = Column(Boolean, default=True)
    camera_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
