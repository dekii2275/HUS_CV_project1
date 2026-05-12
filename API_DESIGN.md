# Kinetix Traffic Control - API Design Table (Current Architecture Compatible)

# Current Architecture

```text
Frontend: React + Firebase Auth
Backend: FastAPI
Database: PostgreSQL + TimescaleDB
Realtime: WebSocket
Storage: PostgreSQL / Object Storage
```

---

# API DESIGN TABLE

| API | Input | Output | Expected Logic |
|---|---|---|---|
| GET /api/v1/cameras | query: status/location | camera list | Query cameras table |
| GET /api/v1/cameras/{camera_id} | camera_id | camera detail | Query camera metadata |
| POST /api/v1/cameras | camera payload | created camera | Validate + insert camera |
| PATCH /api/v1/cameras/{camera_id} | metadata update | updated camera | Update metadata |
| DELETE /api/v1/cameras/{camera_id} | camera_id | success status | Soft delete camera |
| GET /api/v1/cameras/{camera_id}/stream | camera_id | stream token/url | Generate streaming access |
| GET /api/v1/cameras/{camera_id}/health | camera_id | online/offline status | Read cached health status |
| POST /api/v1/ingestion/frame-batch | frame batch payload | ingestion result | Insert frame + detections + events |
| POST /api/v1/frames | frame metadata | frame_id | Insert frame record |
| POST /api/v1/detections/batch | detection array | insert summary | Bulk insert detections |
| POST /api/v1/events | events array | insert summary | Bulk insert events |
| GET /api/v1/events | filters/time range | event list | Query events hypertable |
| GET /api/v1/events/{event_id} | event_id | event detail | Query single event |
| PATCH /api/v1/events/{event_id}/status | status | updated event | Update event state |
| GET /api/v1/dashboard/summary | optional filters | KPI summary | Aggregate dashboard metrics |
| GET /api/v1/analytics/traffic-volume | from/to/bucket/camera_id | traffic chart | Timescale aggregation |
| GET /api/v1/analytics/vehicle-mix | filters | class distribution | Aggregate detections by class |
| GET /api/v1/analytics/event-frequency | from/to/bucket | event chart | Aggregate event frequency |
| GET /api/v1/analytics/camera-load | from/to | camera workload | Count detections/events per camera |
| GET /api/v1/tracks/{track_id} | track_id | movement history | Query detection timeline |
| GET /api/v1/tracks/{track_id}/timeline | track_id | trajectory | Return ordered tracking points |
| GET /api/v1/vehicles/search | plate/class/color | vehicle list | Search vehicle observations |
| GET /api/v1/vehicles/{vehicle_id} | vehicle_id | vehicle detail | Query vehicle metadata |
| GET /api/v1/vehicles/{vehicle_id}/history | vehicle_id | movement history | Query vehicle observations |
| GET /api/v1/violations | filters | violations list | Query violations table |
| GET /api/v1/violations/{violation_id} | violation_id | violation detail | Query violation |
| PATCH /api/v1/violations/{violation_id}/status | status | updated violation | Update violation state |
| POST /api/v1/violations | violation payload | created violation | Insert violation |
| GET /api/v1/operators/me | Firebase token | operator profile | Verify Firebase token + query user |
| PATCH /api/v1/operators/me | profile update | updated profile | Update operator metadata |
| GET /api/v1/operators | filters | operators list | Admin query operators |
| GET /api/v1/settings | Firebase token | user settings | Query user settings |
| PATCH /api/v1/settings | settings payload | updated settings | Persist UI settings |
| POST /api/v1/auth/verify | Firebase ID token | verification result | Verify Firebase token |
| POST /api/v1/auth/sync-user | Firebase user payload | synced user | Sync Firebase user to PostgreSQL |
| GET /api/v1/ws/realtime | websocket token | realtime stream | Subscribe realtime events |
| GET /api/v1/health | none | system health | Aggregate service health |
| GET /api/v1/health/db | none | db health | Ping PostgreSQL |
| GET /api/v1/health/vision-engine | none | AI pipeline status | Check ingestion service |
| GET /api/v1/metrics | none | Prometheus metrics | Export backend metrics |
| POST /api/v1/dev/seed | dataset config | seed result | Insert demo data |
| DELETE /api/v1/dev/seed | dataset config | clear result | Remove demo data |
| GET /api/v1/audit-logs | filters | audit logs | Query immutable logs |

---

# FIREBASE AUTH INTEGRATION NOTES

# Recommended Architecture

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

# IMPORTANT DESIGN NOTES

# 1. DO NOT CREATE CUSTOM LOGIN SYSTEM

## Do NOT implement:

```text
POST /login
POST /register
POST /refresh-token
```

Firebase already handles:
- authentication
- password reset
- OAuth
- session management
- refresh token lifecycle

---

# 2. BACKEND ONLY VERIFIES FIREBASE TOKEN

## FastAPI responsibility:

```text
verify Firebase ID token
extract uid/email/role
authorize request
```

---

# Required package

```bash
pip install firebase-admin
```

---

# Example verification flow

```python
from firebase_admin import auth

decoded_token = auth.verify_id_token(token)

uid = decoded_token["uid"]
email = decoded_token["email"]
```

---

# 3. USERS TABLE IS STILL REQUIRED

## Required schema

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

# Purpose of users table

```text
store:
- role
- permissions
- metadata
- audit references
```

---

# Do NOT store

```text
password
refresh token
oauth secrets
```

---

# 4. REQUEST AUTH FLOW

## Frontend

```text
Firebase login
↓
receive ID token
↓
send Authorization Bearer token
```

---

## Backend

```text
verify token
↓
inject current user
↓
allow protected API access
```

---

# 5. FASTAPI AUTH MIDDLEWARE

## Recommended structure

```text
backend_api/
├── core/
│   ├── security.py
│   ├── firebase.py
│   └── dependencies.py
```

---

# Example dependency

```python
def get_current_user():
    token = extract_token()
    decoded = auth.verify_id_token(token)
    return decoded
```

---

# 6. ROLE-BASED ACCESS CONTROL

## Recommended roles

```text
ADMIN
SUPERVISOR
OPERATOR
AI_ANALYST
```

---

# Example

```python
if user["role"] != "ADMIN":
    raise HTTPException(status_code=403)
```

---

# 7. FIRESTORE SHOULD NOT STORE INCIDENTS

## BAD

```text
Firestore:
- incidents
- violations

PostgreSQL:
- detections
- events
```

---

# GOOD

## PostgreSQL is single source of truth

```text
PostgreSQL:
- incidents
- detections
- events
- violations
- analytics
```

---

# Firebase should only handle

```text
authentication
optional user preferences
```

---

# 8. WEBSOCKET AUTH

## Recommended flow

```text
Frontend sends Firebase token
↓
Backend verifies token
↓
WebSocket session established
```

---

# 9. REQUIRED DATABASE EXTENSIONS

## PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

# 10. REQUIRED NEW TABLES

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

# 11. REQUIRED BACKEND FILES

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

# 12. REQUIRED MODEL ADDITIONS

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

# 13. REQUIRED FRONTEND CHANGES

## Replace Firestore queries

### Current

```text
Dashboard.tsx
IncidentLog.tsx
VehicleSearch.tsx
```

---

## Replace with

```text
axios/fetch → FastAPI endpoints
```

---

# 14. RECOMMENDED IMPLEMENTATION ORDER

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
