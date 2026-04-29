# Realtime YouTube Traffic Detection with YOLO

Module này cung cấp giải pháp nhận diện đối tượng thời gian thực từ các luồng trực tiếp trên YouTube (Live Stream) sử dụng mô hình YOLO (phiên bản 11) với kiến trúc đa luồng tối ưu hóa độ trễ.

## 🚀 Tính năng nổi bật

- **Kiến trúc 3 luồng độc lập (Triple-Threading):** 
    - `StreamReader`: Đọc video từ YouTube HLS, xử lý hiện tượng burst-download và buffer frame.
    - `InferenceThread`: Chuyên trách chạy mô hình YOLO trên GPU (hoặc CPU).
    - `MainThread`: Hiển thị kết quả (GUI) và xử lý tương tác người dùng.
- **Tối ưu hóa hiệu năng (Performance Optimization):**
    - **GPU Acceleration:** Tự động phát hiện và sử dụng CUDA, hỗ trợ chế độ Half Precision (FP16).
    - **HLS Buffering:** Cơ chế Queue linh hoạt giúp duy trì AI FPS ổn định ngay cả khi luồng YouTube bị ngắt quãng.
    - **Skip Frame & Resizing:** Cho phép đánh đổi độ phân giải lấy tốc độ xử lý (đạt >170 FPS trong điều kiện lý tưởng).
- **Cấu hình tập trung:** Quản lý mọi thông số mô hình và danh sách Camera thông qua file `config.yaml`.

## 📁 Cấu trúc thư mục

```text
realtime_ytb/
├── config.yaml          # Cấu hình Model, Video và danh sách Camera
├── utils.py             # Tiện ích trích xuất URL stream từ YouTube
├── stream_reader.py     # Xử lý đa luồng đọc video (Producer)
├── benchmark.py         # Công cụ đo đạc bottleneck (AI vs Network)
├── detector.py          # Script chính chạy nhận diện đa luồng
└── requirements.txt     # Danh sách thư viện cần thiết
```

## 🛠️ Cài đặt

1. Tạo môi trường ảo và cài đặt dependencies:
```bash
python -m venv venv
source venv/bin/activate  # Trên Linux
pip install -r realtime_ytb/requirements.txt
```

2. (Tùy chọn) Cài đặt PyTorch hỗ trợ CUDA để chạy GPU:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## ⚙️ Cấu hình (config.yaml)

Bạn có thể chỉnh sửa `realtime_ytb/config.yaml` để thay đổi:
- `model`: Đường dẫn `.pt` hoặc `.engine`, ngưỡng tin cậy, và kích thước ảnh đầu vào (`img_size`).
- `cameras`: Danh sách các ID camera và link YouTube tương ứng.
- `video`: Độ phân giải luồng (ưu tiên 480 hoặc 720 để cân bằng tốc độ).

## 🖥️ Cách sử dụng

### 1. Kiểm tra hiệu năng hệ thống
Trước khi chạy, hãy dùng benchmark để biết giới hạn phần cứng và tốc độ mạng:
```bash
python realtime_ytb/benchmark.py
```

### 2. Chạy nhận diện thời gian thực
Chạy script chính để bắt đầu nhận diện:
```bash
python realtime_ytb/detector.py
```
*Nhấn **'q'** để thoát ứng dụng.*

## 📈 Kết quả đạt được
Dựa trên các thử nghiệm thực tế:
- **Inference Speed:** ~5.7ms/frame (YOLO11n, GPU CUDA).
- **Throughput:** Có khả năng xử lý lên tới 170+ FPS đối với dữ liệu local.
- **YouTube Live:** Duy trì mức FPS ổn định từ 12-25 FPS (phụ thuộc vào luồng dữ liệu của YouTube).

## 📝 Lưu ý
- Nếu gặp lỗi `Segmentation fault`, hệ thống đã có cơ chế `.copy()` frame để tránh xung đột bộ nhớ giữa CUDA và OpenCV.
- Độ trễ của luồng YouTube (HLS) thường từ 2-5 giây so với thực tế, đây là đặc tính của nền tảng.
