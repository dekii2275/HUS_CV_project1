import pytest
from rag.query_router import QueryRouter

def test_route_sql():
    router = QueryRouter()
    # Kiểm tra các câu hỏi về con số
    assert router.route_query("Có bao nhiêu xe máy đi qua trạm CAM_01?") == "sql"
    assert router.route_query("Thống kê vận tốc trung bình sáng nay") == "sql"

def test_route_vector():
    router = QueryRouter()
    # Kiểm tra các câu hỏi về sự kiện/mô tả
    assert router.route_query("Mô tả vụ tai nạn ở đường Nguyễn Trãi") == "vector"
    assert router.route_query("Có xe nào đi ngược chiều không?") == "vector"
