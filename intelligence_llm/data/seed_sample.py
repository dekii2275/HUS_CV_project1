# data/seed_sample.py
import asyncio
import os
import random
from datetime import datetime, timedelta
import asyncpg
from dotenv import load_dotenv

load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://itms_user:itms_pass@localhost:5432/itms_db")

CAMERAS = [
    {"id": "CAM_01", "location": "Ngã tư Nguyễn Trãi - Khuất Duy Tiến, Thanh Xuân, Hà Nội"},
    {"id": "CAM_02", "location": "Cầu vượt Chùa Bộc - Thái Hà, Đống Đa, Hà Nội"},
    {"id": "CAM_03", "location": "Đường Điện Biên Phủ, Quận 1, TP. Hồ Chí Minh"},
]

EVENT_TYPES = ["accident", "congestion", "wrong_way", "illegal_stop"]
SEVERITIES = ["low", "medium", "high"]
VIOLATION_TYPES = ["wrong_way", "illegal_stop", "speeding"]

def is_peak_hour(dt: datetime) -> bool:
    hour = dt.hour
    return (7 <= hour < 9) or (17 <= hour < 19)

async def seed_data():
    print("🚀 Bắt đầu sinh dữ liệu mẫu (Seed Data) cho TimescaleDB...")
    try:
        conn = await asyncpg.connect(POSTGRES_URL)
        print("🔗 Kết nối cơ sở dữ liệu thành công.")
    except Exception as e:
        print(f"❌ Không thể kết nối DB: {e}. Vui lòng kiểm tra lại cấu hình .env hoặc Docker.")
        return

    # --- TỰ ĐỘNG KHỞI TẠO BẢNG NẾU CHƯA CÓ ---
    print("🛠️ Đang kiểm tra và khởi tạo cấu trúc bảng (Schema)...")
    await conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")
    
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_counts (
        time TIMESTAMPTZ NOT NULL, camera_id VARCHAR(50) NOT NULL, location VARCHAR(100),
        motorbike INTEGER DEFAULT 0, car INTEGER DEFAULT 0, truck INTEGER DEFAULT 0,
        bus INTEGER DEFAULT 0, bicycle INTEGER DEFAULT 0, total INTEGER DEFAULT 0,
        avg_speed FLOAT, density FLOAT
    );
    """)
    try:
        await conn.execute("SELECT create_hypertable('vehicle_counts', 'time', if_not_exists => TRUE);")
    except Exception:
        pass

    await conn.execute("""
    CREATE TABLE IF NOT EXISTS traffic_events (
        id SERIAL, time TIMESTAMPTZ NOT NULL, camera_id VARCHAR(50) NOT NULL,
        event_type VARCHAR(50), severity VARCHAR(20), description TEXT,
        vehicle_id VARCHAR(50), location VARCHAR(100), resolved_at TIMESTAMPTZ,
        PRIMARY KEY (id, time)
    );
    """)
    try:
        await conn.execute("SELECT create_hypertable('traffic_events', 'time', if_not_exists => TRUE);")
    except Exception:
        pass

    await conn.execute("""
    CREATE TABLE IF NOT EXISTS violations (
        id SERIAL, time TIMESTAMPTZ NOT NULL, camera_id VARCHAR(50),
        violation_type VARCHAR(50), vehicle_id VARCHAR(50), speed FLOAT,
        image_path TEXT, location VARCHAR(100),
        PRIMARY KEY (id, time)
    );
    """)
    try:
        await conn.execute("SELECT create_hypertable('violations', 'time', if_not_exists => TRUE);")
    except Exception:
        pass

    await conn.execute("""
    CREATE TABLE IF NOT EXISTS daily_reports (
        id SERIAL PRIMARY KEY, report_date DATE NOT NULL UNIQUE,
        content TEXT, summary JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)
    print("✅ Đã chuẩn bị xong cấu trúc bảng.")

    # Xác định khoảng thời gian sinh data: 7 ngày gần nhất
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    
    vehicle_counts_data = []
    traffic_events_data = []
    violations_data = []
    
    current_time = start_time
    while current_time <= end_time:
        for cam in CAMERAS:
            peak = is_peak_hour(current_time)
            
            if peak:
                motorbike = random.randint(150, 300)
                car = random.randint(30, 70)
                truck = random.randint(2, 8)
                bus = random.randint(3, 10)
                bicycle = random.randint(5, 15)
                avg_speed = random.uniform(15.0, 30.0)
                density = random.uniform(0.6, 0.9)
            else:
                motorbike = random.randint(20, 80)
                car = random.randint(5, 25)
                truck = random.randint(1, 5)
                bus = random.randint(1, 4)
                bicycle = random.randint(1, 8)
                avg_speed = random.uniform(40.0, 60.0)
                density = random.uniform(0.1, 0.4)
                
            total = motorbike + car + truck + bus + bicycle
            
            vehicle_counts_data.append((
                current_time, cam["id"], cam["location"],
                motorbike, car, truck, bus, bicycle, total, avg_speed, density
            ))
            
            if random.random() < 0.002:
                event_type = random.choice(EVENT_TYPES)
                severity = random.choice(SEVERITIES) if event_type != "accident" else "high"
                desc_map = {
                    "accident": "Xảy ra va chạm giữa 2 xe máy, gây ùn tắc cục bộ.",
                    "congestion": "Mật độ phương tiện quá đông, di chuyển rất chậm.",
                    "wrong_way": "Phát hiện phương tiện đi ngược chiều nguy hiểm.",
                    "illegal_stop": "Xe ô tô dừng đỗ không đúng nơi quy định dưới lòng đường."
                }
                resolved_at = current_time + timedelta(minutes=random.randint(15, 60)) if random.random() > 0.2 else None
                
                traffic_events_data.append((
                    current_time, cam["id"], event_type, severity,
                    desc_map[event_type], f"TRK_{random.randint(1000, 9999)}", cam["location"], resolved_at
                ))
                
            if random.random() < 0.003:
                v_type = random.choice(VIOLATION_TYPES)
                speed = random.uniform(65.0, 90.0) if v_type == "speeding" else None
                
                violations_data.append((
                    current_time, cam["id"], v_type,
                    f"TRK_{random.randint(1000, 9999)}", speed,
                    f"/storage/violations/{current_time.strftime('%Y%m%d')}/{cam['id']}_{random.randint(1,100)}.jpg",
                    cam["location"]
                ))
                
        current_time += timedelta(minutes=1)

    print(f"📦 Đang nạp {len(vehicle_counts_data)} dòng vào 'vehicle_counts'...")
    await conn.executemany(
        """
        INSERT INTO vehicle_counts (time, camera_id, location, motorbike, car, truck, bus, bicycle, total, avg_speed, density)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, vehicle_counts_data
    )

    print(f"📦 Đang nạp {len(traffic_events_data)} dòng vào 'traffic_events'...")
    await conn.executemany(
        """
        INSERT INTO traffic_events (time, camera_id, event_type, severity, description, vehicle_id, location, resolved_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, traffic_events_data
    )

    print(f"📦 Đang nạp {len(violations_data)} dòng vào 'violations'...")
    await conn.executemany(
        """
        INSERT INTO violations (time, camera_id, violation_type, vehicle_id, speed, image_path, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, violations_data
    )

    await conn.close()
    print("✅ Đã tạo dữ liệu mẫu thành công!")

if __name__ == "__main__":
    asyncio.run(seed_data())