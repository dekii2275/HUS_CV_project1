# Kinetix Traffic Control - Bảng Thiết Kế API (Đồng Bộ Với Kiến Trúc Hiện Tại)

# Kiến trúc hiện tại

```text
Frontend: React + Firebase Auth
Backend: FastAPI
Database: PostgreSQL + TimescaleDB
Realtime: WebSocket
Storage: PostgreSQL / Object Storage
```

---

# BẢNG THIẾT KẾ API

| API | Đầu vào | Đầu ra | Logic dự kiến |
|---|---|---|---|
| GET /api/v1/cameras | query: status/location | danh sách camera | Query bảng cameras |
| GET /api/v1/cameras/{camera_id} | camera_id | chi tiết camera | Query metadata camera |
| POST /api/v1/cameras | payload camera | camera mới được tạo | Validate + insert camera |
| PATCH /api/v1/cameras/{camera_id} | metadata cập nhật | camera đã cập nhật | Update metadata |
| DELETE /api/v1/cameras/{camera_id} | camera_id | trạng thái thành công | Soft delete camera |
| GET /api/v1/cameras/{camera_id}/stream | camera_id | token/url stream | Tạo quyền truy cập stream |
| GET /api/v1/cameras/{camera_id}/health | camera_id | trạng thái online/offline | Đọc trạng thái health từ cache |
| POST /api/v1/ingestion/frame-batch | payload batch frame | kết quả ingestion | Insert frame + detections + events |
| POST /api/v1/frames | metadata frame | frame_id | Insert frame record |
| POST /api/v1/detections/batch | mảng detections | tóm tắt insert | Bulk insert detections |
| POST /api/v1/events | mảng events | tóm tắt insert | Bulk insert events |
| GET /api/v1/events | filters/time range | danh sách sự kiện | Query hypertable events |
| GET /api/v1/events/{event_id} | event_id | chi tiết sự kiện | Query một event |
| PATCH /api/v1/events/{event_id}/status | status | event đã cập nhật | Update trạng thái event |
| GET /api/v1/dashboard/summary | optional filters | KPI dashboard | Aggregate metrics dashboard |
| GET /api/v1/analytics/traffic-volume | from/to/bucket/camera_id | biểu đồ lưu lượng | Aggregate bằng TimescaleDB |
| GET /api/v1/analytics/vehicle-mix | filters | phân bố phương tiện | Aggregate detections theo class |
| GET /api/v1/analytics/event-frequency | from/to/bucket | biểu đồ sự kiện | Aggregate tần suất sự kiện |
| GET /api/v1/analytics/camera-load | from/to | tải camera | Đếm detections/events theo camera |
| GET /api/v1/tracks/{track_id} | track_id | lịch sử di chuyển | Query timeline detection |
| GET /api/v1/tracks/{track_id}/timeline | track_id | trajectory | Trả trajectory theo thời gian |
| GET /api/v1/vehicles/search | plate/class/color | danh sách phương tiện | Search vehicle observations |
| GET /api/v1/vehicles/{vehicle_id} | vehicle_id | chi tiết phương tiện | Query metadata vehicle |
| GET /api/v1/vehicles/{vehicle_id}/history | vehicle_id | lịch sử di chuyển | Query observations vehicle |
| GET /api/v1/violations | filters | danh sách vi phạm | Query bảng violations |
| GET /api/v1/violations/{violation_id} | violation_id | chi tiết vi phạm | Query violation |
| PATCH /api/v1/violations/{violation_id}/status | status | violation đã cập nhật | Update trạng thái violation |
| POST /api/v1/violations | payload violation | violation mới | Insert violation |
| GET /api/v1/operators/me | Firebase token | profile operator | Verify token Firebase + query user |
| PATCH /api/v1/operators/me | profile update | profile đã cập nhật | Update metadata operator |
| GET /api/v1/operators | filters | danh sách operator | Query operator cho admin |
| GET /api/v1/settings | Firebase token | settings người dùng | Query user settings |
| PATCH /api/v1/settings | payload settings | settings đã cập nhật | Persist UI settings |
| POST /api/v1/auth/verify | Firebase ID token | kết quả xác thực | Verify Firebase token |
| POST /api/v1/auth/sync-user | payload user Firebase | user đã đồng bộ | Đồng bộ user Firebase vào PostgreSQL |
| GET /api/v1/ws/realtime | websocket token | realtime stream | Subscribe realtime events |
| GET /api/v1/health | none | trạng thái hệ thống | Aggregate trạng thái service |
| GET /api/v1/health/db | none | trạng thái database | Ping PostgreSQL |
| GET /api/v1/health/vision-engine | none | trạng thái AI pipeline | Check ingestion service |
| GET /api/v1/metrics | none | metrics Prometheus | Export metrics backend |
| POST /api/v1/dev/seed | config dataset | kết quả seed | Insert dữ liệu demo |
| DELETE /api/v1/dev/seed | config dataset | kết quả clear | Xóa dữ liệu demo |
| GET /api/v1/audit-logs | filters | audit logs | Query immutable logs |

---

# GHI CHÚ TÍCH HỢP FIREBASE AUTH

# Kiến trúc khuyến nghị

```text
Firebase Auth
      ↓
Frontend React
      ↓
Firebase ID Token
      ↓
FastAPI Backend
      ↓
PostgreSQL / TimescaleDB
```

---

# LƯU Ý QUAN TRỌNG

# 1. KHÔNG TỰ VIẾT HỆ THỐNG LOGIN

## Không implement:

```text
POST /login
POST /register
POST /refresh-token
```

Firebase đã xử lý:
- authentication
- reset password
- OAuth
- session management
- refresh token lifecycle

---

# 2. BACKEND CHỈ VERIFY FIREBASE TOKEN

## Nhiệm vụ của FastAPI:

```text
verify Firebase ID token
extract uid/email/role
authorize request
```

---

# Package cần cài

```bash
pip install firebase-admin
```

---

# Ví dụ flow verify

```python
from firebase_admin import auth

decoded_token = auth.verify_id_token(token)

uid = decoded_token["uid"]
email = decoded_token["email"]
```

---

# 3. VẪN CẦN BẢNG users

## Schema khuyến nghị

```sql
CREATE TABLE users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT,
    role TEXT DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# Mục đích của bảng users

```text
lưu:
- role
- permissions
- metadata
- audit references
```

---

# Không lưu

```text
password
refresh token
oauth secrets
```

---

# 4. FLOW REQUEST AUTH

## Frontend

```text
Firebase login
↓
nhận ID token
↓
gửi Authorization Bearer token
```

---

## Backend

```text
verify token
↓
inject current user
↓
cho phép truy cập API protected
```

---

# 5. FASTAPI AUTH MIDDLEWARE

## Structure khuyến nghị

```text
backend_api/
├── core/
│   ├── security.py
│   ├── firebase.py
│   └── dependencies.py
```

---

# Ví dụ dependency

```python
def get_current_user():
    token = extract_token()
    decoded = auth.verify_id_token(token)
    return decoded
```

---

# 6. ROLE-BASED ACCESS CONTROL

## Role khuyến nghị

```text
ADMIN
SUPERVISOR
OPERATOR
AI_ANALYST
```

---

# Ví dụ

```python
if user["role"] != "ADMIN":
    raise HTTPException(status_code=403)
```

---

# 7. KHÔNG LƯU INCIDENTS TRONG FIRESTORE

## Sai

```text
Firestore:
- incidents
- violations

PostgreSQL:
- detections
- events
```

---

## Đúng

### PostgreSQL là nguồn dữ liệu chính

```text
PostgreSQL:
- incidents
- detections
- events
- violations
- analytics
```

---

# Firebase chỉ nên xử lý

```text
authentication
optional user preferences
```

---

# 8. WEBSOCKET AUTH

## Flow khuyến nghị

```text
Frontend gửi Firebase token
↓
Backend verify token
↓
Thiết lập WebSocket session
```

---

# 9. DATABASE EXTENSIONS BẮT BUỘC

## PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

# 10. BẢNG MỚI CẦN THÊM

## vehicle_observations

```sql
CREATE TABLE vehicle_observations (
    observation_id SERIAL PRIMARY KEY,
    track_id INTEGER,
    plate_number TEXT,
    vehicle_class TEXT,
    color TEXT,
    manufacturer TEXT,
    timestamp TIMESTAMPTZ,
    camera_id TEXT
);
```

---

## violations

```sql
CREATE TABLE violations (
    violation_id SERIAL PRIMARY KEY,
    event_id INTEGER,
    plate_number TEXT,
    violation_type TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 11. FILE BACKEND CẦN THÊM

```text
backend_api/
├── api/
│   ├── routers/
│   │   ├── analytics.py
│   │   ├── events.py
│   │   ├── ingestion.py
│   │   ├── vehicles.py
│   │   ├── violations.py
│   │   ├── websocket.py
│   │   └── operators.py
```

---

# 12. MODEL CẦN THÊM

## models.py

```text
Frame
Detection
Event
VehicleObservation
Violation
User
```

---

# 13. FRONTEND CẦN SỬA

## Bỏ Firestore query ở

```text
Dashboard.tsx
IncidentLog.tsx
VehicleSearch.tsx
```

---

## Thay bằng

```text
axios/fetch → FastAPI endpoints
```

---

# 14. THỨ TỰ IMPLEMENT KHUYẾN NGHỊ

## Phase 1

```text
models.py
ingestion API
events API
dashboard summary
Firebase verification
```

---

## Phase 2

```text
analytics API
vehicle search
violations
```

---

## Phase 3

```text
websocket realtime
AI analytics
prediction layer
```