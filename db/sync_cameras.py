import yaml
import psycopg2
import os
import sys
import requests
from dotenv import load_dotenv

# LƯU Ý: Đảm bảo chạy script này trong môi trường ảo (source venv/bin/activate)

# Load biến môi trường từ file .env
load_dotenv()

# Lấy cấu hình từ .env
DB_USER = os.getenv("POSTGRES_USER", "itms_user")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "itms_password_123")
DB_NAME = os.getenv("POSTGRES_DB", "itms_db")
DB_PORT = os.getenv("DB_PORT_EXTERNAL", "15432")
DB_HOST = "localhost" # Khi chạy script này từ host

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
CONFIG_PATH = "realtime_ytb/config.yaml"

def check_url_active(url: str) -> bool:
    """Kiểm tra xem URL (YouTube/RTSP) có khả dụng hay không."""
    try:
        # Thử gửi request để kiểm tra trạng thái
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, timeout=5, headers=headers, stream=True)
        return response.status_code == 200
    except Exception:
        return False

def sync_cameras():
    """Đồng bộ danh sách camera từ config.yaml vào PostgreSQL và kiểm tra trạng thái active."""
    if not os.path.exists(CONFIG_PATH):
        print(f"Error: File cấu hình không tồn tại tại {CONFIG_PATH}")
        return

    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    cameras = config.get('cameras', {})
    if not cameras:
        print("Warning: Không tìm thấy danh sách camera trong config.yaml")
        return

    print(f"Đang kết nối tới Database tại {DB_HOST}:{DB_PORT}...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for cam_id, url in cameras.items():
            print(f" -> Kiểm tra trạng thái {cam_id}...")
            is_active = check_url_active(url)
            status_str = "✅ Online" if is_active else "❌ Offline"
            
            print(f"    URL: {url} [{status_str}]")
            
            cur.execute("""
                INSERT INTO cameras (camera_id, rtsp_url, is_active)
                VALUES (%s, %s, %s)
                ON CONFLICT (camera_id) DO UPDATE 
                SET rtsp_url = EXCLUDED.rtsp_url,
                    is_active = EXCLUDED.is_active;
            """, (cam_id, url, is_active))
        
        conn.commit()
        print("✅ Đồng bộ camera và trạng thái hoàn tất.")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Lỗi kết nối Database: {e}")
    except Exception as e:
        print(f"❌ Lỗi không xác định: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    sync_cameras()
