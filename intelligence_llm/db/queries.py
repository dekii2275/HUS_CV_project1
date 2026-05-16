# Đếm số lượng xe tổng hợp theo từng giờ trong một khoảng thời gian
COUNT_VEHICLES_BY_HOUR = """
SELECT
    time_bucket('1 hour', time) AS hour_bucket,
    SUM(total) AS total_vehicles
FROM vehicle_counts
WHERE time >= $1 AND time < $2
GROUP BY hour_bucket
ORDER BY hour_bucket;
"""

# Lấy các sự kiện giao thông (tai nạn, ùn tắc) trong khoảng thời gian
GET_EVENTS_BY_TIME_RANGE = """
SELECT *
FROM traffic_events
WHERE time >= $1 AND time < $2
ORDER BY time DESC;
"""

# Thống kê tổng hợp số liệu trong 1 ngày (dùng cho báo cáo auto)
AGGREGATE_DAILY_STATS = """
SELECT
    SUM(total) AS total_vehicles,
    SUM(motorbike) AS total_motorbikes,
    SUM(car) AS total_cars
FROM vehicle_counts
WHERE time >= $1 AND time < $2;
"""
