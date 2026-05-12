# ITMS Backend — AI Architecture & Implementation Guide

Tài liệu này định nghĩa các nhiệm vụ và quy tắc triển khai cho phần Backend của hệ thống ITMS, giúp AI Assistant và các nhà phát triển nắm vững luồng xử lý dữ liệu Vision.

## 1. Mục tiêu Chính
Xây dựng một hệ thống backend hiệu năng cao, xử lý luồng video thời gian thực (low-latency), thực hiện AI inference và cung cấp giao diện truy vấn dữ liệu thông qua REST API và RAG.

## 2. Các Thành phần Cốt lõi (Core Components)

### 2.1 Video Stream Manager (`pipelines/`)
- **Nhiệm vụ**: Quản lý việc kết nối tới các luồng RTSP hoặc file MP4.
- **Yêu cầu**: Sử dụng `async generators` để đẩy frame vào pipeline. Đảm bảo xử lý lỗi kết nối (reconnect) tự động.
- **Pre-processing**: Áp dụng CLAHE để tối ưu hình ảnh trước khi đưa vào model.

### 2.2 AI Inference Engine (`core/detection/` & `core/tracking/`)
- **Model**: YOLOv11 cho Detection và BoT-SORT/ByteTrack cho Tracking.
- **Lifecycle**: Model phải được load **duy nhất một lần** thông qua FastAPI `lifespan` event.
- **Optimization**: Bắt buộc sử dụng `torch.inference_mode()` và ưu tiên **Batch Inference** để tối ưu GPU throughput.

### 2.3 Analytics Engine (`core/analytics/`)
- **Logic**:
    - **Vận tốc**: Tính dựa trên Perspective Transform và khoảng cách Euclid.
    - **Vi phạm**: Phát hiện đi ngược chiều, dừng đỗ sai quy định dựa trên quỹ đạo (trajectory) của `track_id`.
    - **Ùn tắc**: Tính toán mật độ xe đứng yên trong vùng ROI (> 60s).

### 2.4 Data Manager (`db/`)
- **ORM**: Sử dụng SQLAlchemy với `AsyncSession`.
- **TimescaleDB**: Tận dụng các tính năng nâng cao như `time_bucket` để thống kê lưu lượng.

### 2.5 RAG Layer (`llm/`)
- **Framework**: LangChain.
- **Model**: `claude-sonnet-4-20250514`.
- **Nhiệm vụ**: Chuyển đổi ngôn ngữ tự nhiên của người dùng thành các truy vấn SQL chuyên biệt cho TimescaleDB.

## 3. Quy tắc Triển khai (Bắt buộc)

- **Port**: Luôn chạy trên port `18000`.
- **Async/Await**: Tuyệt đối không sử dụng hàm blocking. Sử dụng `run_in_threadpool` nếu phải chạy code sync nặng.
- **Type Hints**: Bắt buộc 100% function signature phải có type hints.
- **GPU Management**: Luôn kiểm tra VRAM, không vượt quá 80%. Sử dụng `torch.cuda.empty_cache()` sau các batch xử lý lớn.
- **Virtual Environment**: Luôn kích hoạt môi trường ảo trước khi chạy code hoặc script:
  ```bash
  source venv/bin/activate
  ```

## 4. Luồng Dữ liệu (Internal Data Flow)
1. `StreamReader` (Async) -> Trả về `Frame`.
2. `InferenceEngine` -> Trả về `List[Detection]` (bbox, class, track_id).
3. `AnalyticsEngine` -> Tính toán `velocity`, `events`.
4. `DBManager` -> Lưu `Frames`, `Detections`, `Events` vào TimescaleDB.
5. `WebSocketManager` -> Broadcast kết quả cho Dashboard.

## 5. Cấu trúc Thư mục
```
backend_api/
├── api/          # Routers (FastAPI) & Pydantic Schemas
├── core/         # AI Logic (Detector, Tracker, Analytics)
├── db/           # Database Models & Session management
├── pipelines/    # Video stream processing
├── llm/          # LangChain & RAG logic
└── config/       # Pydantic Settings
```

---
**Ghi chú cho AI**: Luôn tham chiếu file `architect.md` để nắm rõ cấu trúc bảng database trước khi viết code repository.
