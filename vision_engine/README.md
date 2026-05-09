# 🚦 Vision Engine – Traffic Monitoring System

Hệ thống giám sát giao thông thời gian thực sử dụng YOLOv8 + ByteTrack.  
Nhận video từ camera IP / RTSP / YouTube Live → phát hiện xe → theo dõi → ước tính tốc độ.

---

## 📁 Cấu trúc dự án

```
vision_engine/
|
│
├── preprocessing/             ← Xử lý & chuẩn hoá dữ liệu ảnh
│   ├── clahe.py               # Tăng cường chất lượng ảnh (đêm, sương mù, mưa)
│   └── roi_transform.py       # ROI Masking + Perspective Transform (BEV)
│
├── tracking/                  ← ByteTrack
│   ├── tracker.py             # ByteTrack wrapper (TODO)
│   └── track_manager.py       # Quản lý track ID, lost track (TODO)
│
├── utils/
│   ├── visualizer.py          # Vẽ bbox, track ID, speed lên frame
│   └── bbox_utils.py          # IoU, pixel → mét, speed estimation
│
├── config/
│   ├── cameras.yaml           # ROI coords, RTSP URL, meters/pixel mỗi camera
│   └── model.yaml             # Đường dẫn model, confidence, tracking params
│
├── notebooks/
│   ├── fine_tune_model.ipynb  # Pipeline fine-tune YOLOv11n trên Kaggle GPU
│   └── notebookc39584e4cb.ipynb
│
├── requirements.txt
└── Dockerfile
```

---

## 🎯 Module 1 – Data Preprocessing

Module 1 là bước đầu tiên trong pipeline, chịu trách nhiệm **chuẩn hoá dữ liệu đầu vào** trước khi đưa vào AI.

### Tại sao cần Module 1?

Camera giao thông ngoài trời gặp nhiều thách thức:

| Vấn đề | Hậu quả | Giải pháp |
|---|---|---|
| Ban đêm / thiếu sáng | YOLO miss detection, bbox sai | CLAHE + Gamma correction |
| Sương mù / mưa | Ảnh mờ, contrast thấp | Dark Channel Dehazing |
| Nhiễu sensor | False positive tăng | Bilateral Filter |
| Góc camera nghiêng | Không đo được khoảng cách thực | Perspective Transform |
| Vùng không liên quan | False positive từ biển quảng cáo, bầu trời | ROI Masking |

### Luồng xử lý Module 1

```
              Frame gốc (BGR)
                  │
                  ▼
┌─────────────────────────────────────┐
│  1. ROI Masking                     │
│     Che vùng bầu trời, vỉa hè       │
│     → roi_transform.py: ROIMask     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  2. Gamma Correction                │
│     Sửa độ sáng tổng thể            │
│   → clahe.py: apply_gamma_correction│
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  3. Dehazing (tuỳ chọn)             │
│     Dark Channel Prior              │
│     → clahe.py: apply_dehazing      │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  4. CLAHE                           │
│     Tăng tương phản cục bộ (kênh L) │
│     → clahe.py: apply_clahe         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  5. Bilateral Denoising             │
│     Khử nhiễu, giữ cạnh sắc nét     │
│     → clahe.py: apply_denoising     │
└──────────────────┬──────────────────┘
                   │
                   ▼
         Frame chuẩn hoá (BGR)
         → Đưa vào YOLO
```

---

## ⚡ Cài đặt nhanh

### 1. Clone & cài thư viện

```bash
git clone https://github.com/your-repo/vision_engine
cd vision_engine
pip install -r requirements.txt
```

### 2. Đặt model weights

```bash
# Đặt model đã fine-tune vào:
weights/best.pt

# Nếu chưa có best.pt, hệ thống tự dùng:
weights/yolov11n.pt   (pretrained COCO – ít chính xác hơn với traffic VN)
```

### 3. Chạy pipeline

```bash
# Demo toàn bộ pipeline với YouTube Live
python main.py

# Với file video local
python main.py --source data/raw/test.mp4

# Với webcam
python main.py --source 0

# Demo chỉ Module 1 (không cần YOLO)
python main.py --demo-preprocess --source data/raw/test.mp4
```

## ⚙️ Cấu hình camera (`config/cameras.yaml`)

Mỗi camera cần cấu hình riêng. Ví dụ cho `cam_01`:

```yaml
cameras:
  cam_01:
    name: "Ngã tư Lý Thường Kiệt"
    rtsp_url: "rtsp://admin:password@192.168.1.101:554/stream1"
    frame_size: [1920, 1080]
    fps: 25

    roi:
      points:
        - [150, 1080]    # bottom-left
        - [550, 480]     # top-left
        - [1370, 480]    # top-right
        - [1770, 1080]   # bottom-right

    perspective:
      src_points: [[550,480], [1370,480], [1770,1080], [150,1080]]
      dst_points: [[100,50], [700,50], [700,550], [100,550]]
      output_size: [800, 600]
      meters_per_pixel_x: 0.058   # đo thực tế từ bản đồ
      meters_per_pixel_y: 0.065
```

### Cách lấy tọa độ ROI và Perspective

1. Chạy `python main.py --source cam_url --debug` để thấy frame đầu tiên
2. Dùng bất kỳ tool chỉnh ảnh (Paint, GIMP) để xác định toạ độ pixel
3. Chọn 4 điểm trên **mặt đường** (tốt nhất là vạch kẻ đường)
4. Đo khoảng cách thực giữa các điểm (thước / Google Maps)
5. Tính `meters_per_pixel = khoảng_cách_thực / khoảng_cách_pixel_BEV`

---

## 🧠 Module 1 – API Reference

### `preprocessing/clahe.py`

| Hàm | Mô tả | Dùng khi |
|---|---|---|
| `auto_enhance(frame)` | Tự động phát hiện điều kiện, chọn thông số | Mặc định – dùng cho mọi trường hợp |
| `enhance_frame(frame, ...)` | Tùy chỉnh từng bước | Cần kiểm soát chi tiết |
| `apply_clahe(frame)` | Chỉ CLAHE | Ảnh đủ sáng nhưng thiếu tương phản |
| `apply_denoising(frame)` | Chỉ Bilateral Filter | Khử nhiễu đơn thuần |
| `apply_gamma_correction(frame, gamma)` | Chỉ Gamma | Điều chỉnh độ sáng |
| `apply_dehazing(frame)` | Dark Channel Prior | Sương mù nặng |
| `is_dark_frame(frame)` | Kiểm tra frame có tối không | Trigger điều kiện ban đêm |

```python
from preprocessing.clahe import auto_enhance, is_dark_frame

# Cách đơn giản nhất
frame_enhanced = auto_enhance(frame)

# Kiểm tra điều kiện
if is_dark_frame(frame):
    frame = enhance_frame(frame, gamma=1.8, use_clahe=True)
```

### `preprocessing/roi_transform.py`

| Class/Hàm | Mô tả |
|---|---|
| `ROIMask(roi_points, frame_size)` | Tạo ROI mask từ danh sách điểm |
| `roi.apply(frame)` | Áp dụng mask lên frame |
| `roi.draw_roi(frame)` | Vẽ đường viền ROI để debug |
| `PerspectiveTransformer(src, dst, ...)` | Khởi tạo BEV transformer |
| `transformer.warp_frame(frame)` | Warp toàn bộ frame sang BEV |
| `transformer.warp_point(point)` | Chiếu 1 điểm camera → BEV |
| `transformer.compute_speed(p1, p2, fps)` | Tính tốc độ từ 2 vị trí BEV |

```python
from preprocessing.roi_transform import ROIMask, PerspectiveTransformer

# ROI
roi = ROIMask([(150,1080),(550,480),(1370,480),(1770,1080)], (1920,1080))
frame_masked = roi.apply(frame)

# Perspective Transform
transformer = PerspectiveTransformer(
    src_points=src, dst_points=dst, output_size=(800,600),
    meters_per_pixel_x=0.058, meters_per_pixel_y=0.065
)
bev_frame = transformer.warp_frame(frame)
speed = transformer.compute_speed(pos_prev, pos_curr, fps=25)
```

### `utils/bbox_utils.py`

```python
from utils.bbox_utils import get_bottom_center, estimate_speed_kmh, compute_iou

# Lấy điểm chân xe để chiếu BEV
foot = get_bottom_center(box)   # (cx, y2)

# Tính tốc độ với EMA smoothing
speed = estimate_speed_kmh(pos_prev, pos_curr, mpp=0.058, fps=25,
                           smoothing_factor=0.3, prev_speed=prev_speed)

# Tính IoU
iou = compute_iou(box_a, box_b)
```

---

## 🏋️ Fine-tune Model (notebooks/)

Notebook `fine_tune_model.ipynb` hướng dẫn fine-tune YOLOv11n trên dataset giao thông Việt Nam (Kaggle GPU T4).

**Classes:** `car`, `motorcycle`, `bus`, `truck`

**Kết quả mục tiêu:**

| Chỉ số | Mức chấp nhận | Mức tốt |
|---|---|---|
| mAP50 | > 0.70 | > 0.85 |
| mAP50-95 | > 0.45 | > 0.60 |
| Recall (motorcycle) | > 0.65 | > 0.80 |

**Bước thực hiện:**
1. Mở notebook trên Kaggle (miễn phí GPU 30h/tuần)
2. Điền Roboflow API key và thông tin project
3. Chạy từng cell theo thứ tự
4. Download `best.pt` → đặt vào `weights/best.pt`

---

## 🐳 Docker

```bash
# Build
docker build -t vision-engine .

# Run với webcam
docker run --device=/dev/video0 -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix vision-engine

# Run headless, lưu video
docker run -v $(pwd)/outputs:/app/outputs \
    vision-engine python main.py \
    --source data/raw/test.mp4 --no-display --save
```

---

## 🔧 Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `ModuleNotFoundError: ultralytics` | Chưa cài | `pip install ultralytics` |
| `ModuleNotFoundError: yt_dlp` | Chưa cài | `pip install yt-dlp` |
| YOLO không tìm thấy weights | Sai đường dẫn | Kiểm tra `weights/best.pt` tồn tại |
| FPS thấp (< 5) | Dùng CPU, ảnh lớn | Thêm `--device cuda:0` hoặc giảm `--scale 0.5` |
| Xe bị miss detection ban đêm | Ảnh tối, CLAHE chưa đủ | Thêm `--gamma 1.8 --auto-enhance` |
| Speed = 0.0 km/h | Chưa có track ID | Đảm bảo `persist=True` trong YOLO track |
| ROI cắt nhầm vào xe | Tọa độ ROI sai | Chạy `--debug --show-roi` để kiểm tra |

---

## 📊 Kiến trúc Pipeline đầy đủ

```
Camera (RTSP/YouTube/File)
         │
         ▼
  ┌──────────────┐
  │ Frame Reader │  cv2.VideoCapture
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────────────────────────┐
  │           MODULE 1: PREPROCESSING        │
  │                                          │
  │  ROI Mask → Gamma → Dehaze → CLAHE      │
  │  → Bilateral Denoise                     │
  │                                          │
  │  roi_transform.py  +  clahe.py           │
  └──────┬───────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────┐
  │           MODULE 2a: DETECTION           │
  │                                          │
  │  YOLOv11n inference                        │
  │  conf=0.5, iou=0.45                     │
  │  Classes: car, moto, bus, truck          │
  └──────┬───────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────┐
  │           MODULE 2b: TRACKING            │
  │                                          │
  │  ByteTrack – assign consistent Track ID  │
  │  Handle occlusion, re-entry              │
  └──────┬───────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────┐
  │       PERSPECTIVE + SPEED ESTIMATION     │
  │                                          │
  │  Foot point → BEV space                  │
  │  Δpixel × mpp × fps × 3.6 = km/h        │
  └──────┬───────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────┐
  │              VISUALIZER + OUTPUT         │
  │                                          │
  │  Draw bbox, ID, speed, FPS               │
  │  Show with cv2                           |
  └──────────────────────────────────────────┘
```

---

## 👥 Đóng góp

1. Fork repo
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: mô tả ngắn"`
4. Push và tạo Pull Request

---

## 📄 License

MIT License – Sử dụng tự do cho học thuật và nghiên cứu.

# Gắn luồng cam lên web
