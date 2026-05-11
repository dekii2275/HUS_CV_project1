# ITMS Database Setup & Deployment Guide

Tài liệu này tóm tắt các bước thiết lập và triển khai cơ sở dữ liệu cho hệ thống ITMS, giúp các thành viên trong nhóm nhanh chóng đồng bộ môi trường phát triển.

## 1. Cấu hình Môi trường (.env)
Đảm bảo file `.env` tại thư mục gốc có đầy đủ các thông số sau:
```env
POSTGRES_USER=itms_user
POSTGRES_PASSWORD=itms_password_123
POSTGRES_DB=itms_db
DB_PORT_EXTERNAL=15432
```

## 2. Cấu hình Docker (docker-compose.yml)
Database sử dụng image **TimescaleDB** để hỗ trợ dữ liệu chuỗi thời gian (time-series).
- **Image**: `timescale/timescaledb-ha:pg15`
- **Volume Mount**: Thư mục `./db_init` được mount vào `/docker-entrypoint-initdb.d` để tự động khởi tạo bảng.

## 3. Script Khởi tạo (init.sql)
File `db_init/init.sql` chứa toàn bộ DDL cho hệ thống, bao gồm:
- **Extensions**: `timescaledb`, `postgis`, `uuid-ossp`.
- **Tables**: `cameras`, `frames`, `detections`, `events`.
- **Optimization**: Thiết lập **Hypertables** cho các bảng dữ liệu lớn và cấu hình chính sách nén (**Compression Policy**) sau 7 ngày.

## 4. Các bước Triển khai
Mở terminal tại thư mục gốc và chạy lệnh:
```bash
# Khởi động riêng service database
docker compose up -d db

# Kiểm tra trạng thái container
docker ps | grep itms-db

## 5. Đồng bộ cấu hình Camera
Sau khi Database đã sẵn sàng, chạy script để đồng bộ danh sách camera từ `config.yaml`:
```bash
# Kích hoạt môi trường ảo (đã cài sẵn thư viện)
source venv/bin/activate

# Chạy script đồng bộ
python db/sync_cameras.py
```

## 6. Kiểm tra & Kết nối
### Truy vấn nhanh qua Terminal:
```bash
docker exec -it itms-db psql -U itms_user -d itms_db -c "\dt"
```

### Kết nối từ IDE (pgAdmin / DBeaver):
- **Host**: `localhost`
- **Port**: `15432`
- **Maintenance DB**: `itms_db`
- **Username**: `itms_user`
- **Password**: `itms_password_123`

*Lưu ý: Trong pgAdmin, các bảng nằm trong đường dẫn: `itms_db > Schemas > public > Tables`.*

---
**Senior AI Architect**  
*Hệ thống ITMS - Đảm bảo hiệu năng và tính mở rộng.*
