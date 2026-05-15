-- ITMS Database Initialization Script
-- Author: Senior AI Architect
-- Target: PostgreSQL + TimescaleDB

-- 1. Kích hoạt các Extension cần thiết
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tạo bảng Cameras (Master Data)
CREATE TABLE IF NOT EXISTS cameras (
    camera_id TEXT PRIMARY KEY,
    location POINT,
    rtsp_url TEXT, -- URL luồng video (YouTube/RTSP)
    is_active BOOLEAN DEFAULT TRUE, -- Trạng thái hoạt động của camera
    camera_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tạo bảng Frames (Hypertable - Trung tâm)
CREATE TABLE IF NOT EXISTS frames (
    frame_uuid UUID DEFAULT uuid_generate_v4(),
    frame_id BIGINT,
    timestamp TIMESTAMPTZ NOT NULL,
    camera_id TEXT REFERENCES cameras(camera_id),
    PRIMARY KEY (frame_uuid, timestamp) -- PK phải bao gồm cột thời gian trong TimescaleDB
);

-- Chuyển đổi frames thành Hypertable
SELECT create_hypertable('frames', 'timestamp', if_not_exists => TRUE);

-- Tạo Index cho frames
CREATE INDEX IF NOT EXISTS idx_frames_camera_id ON frames (camera_id, timestamp DESC);

-- 4. Tạo bảng Detections (Hypertable)
CREATE TABLE IF NOT EXISTS detections (
    detection_id BIGSERIAL,
    frame_uuid UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL, 
    track_id INT,
    class TEXT,
    confidence FLOAT,
    bbox INT[], -- [x1, y1, x2, y2]
    bottom_center POINT,
    PRIMARY KEY (detection_id, timestamp)
);

-- Chuyển đổi detections thành Hypertable
SELECT create_hypertable('detections', 'timestamp', if_not_exists => TRUE);

-- Tạo Index cho detections
CREATE INDEX IF NOT EXISTS idx_detections_track_id ON detections (track_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_detections_class ON detections (class, timestamp DESC);

-- 5. Tạo bảng Events
CREATE TABLE IF NOT EXISTS events (
    event_id BIGSERIAL,
    frame_uuid UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type TEXT,
    track_id INT,
    description TEXT,
    PRIMARY KEY (event_id, timestamp)
);

-- Chuyển đổi events thành Hypertable
SELECT create_hypertable('events', 'timestamp', if_not_exists => TRUE);

-- Tạo Index cho events
CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type, timestamp DESC);

-- 6. Cấu hình chính sách nén (Compression Policy)
ALTER TABLE frames SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'camera_id'
);
SELECT add_compression_policy('frames', INTERVAL '7 days', if_not_exists => TRUE);

ALTER TABLE detections SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'track_id'
);
SELECT add_compression_policy('detections', INTERVAL '7 days', if_not_exists => TRUE);
