import cv2
import time
import yaml
import torch
import threading
import queue
import numpy as np
from ultralytics import YOLO
from utils import get_stream_url
from stream_reader import StreamReader


def load_config(config_path="realtime_ytb/config.yaml"):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


class InferenceThread(threading.Thread):
    """
    Thread riêng cho YOLO inference.
    Đọc frame từ frame_queue, trả kết quả vào result_queue.
    Tách biệt hoàn toàn với display loop → không bao giờ block nhau.
    """
    def __init__(self, model, yolo_cfg: dict, device, use_half: bool, frame_queue_size: int = 60):
        super().__init__(daemon=True)
        self.model = model
        self.yolo_cfg = yolo_cfg
        self.device = device
        self.use_half = use_half

        # Queue đầu vào: buffer 60 frame để không bị đói khi HLS pause giữa chunk
        self.frame_queue = queue.Queue(maxsize=frame_queue_size)
        # Queue đầu ra: chỉ giữ 1 kết quả mới nhất cho display
        self.result_queue = queue.Queue(maxsize=1)
        self._stop_event = threading.Event()

    def push_frame(self, frame):
        """Main loop gọi hàm này để gửi frame mới vào."""
        # Với queue lớn: chỉ drop khi thực sự đầy (hiếm xảy ra)
        try:
            self.frame_queue.put_nowait(frame)
        except queue.Full:
            # Queue đầy: drop frame cũ nhất để nhường chỗ cho mới hơn
            try:
                self.frame_queue.get_nowait()
            except queue.Empty:
                pass
            try:
                self.frame_queue.put_nowait(frame)
            except queue.Full:
                pass

    def get_result(self):
        """Main loop gọi hàm này để lấy kết quả mới nhất (không block)."""
        try:
            return self.result_queue.get_nowait()
        except queue.Empty:
            return None

    def run(self):
        sz = self.yolo_cfg['img_size']
        while not self._stop_event.is_set():
            try:
                frame = self.frame_queue.get(timeout=1.0)
            except queue.Empty:
                continue

            small = cv2.resize(frame, (sz, sz))
            results = self.model.predict(
                small,
                verbose=False,
                conf=self.yolo_cfg['conf_threshold'],
                classes=self.yolo_cfg['classes'],
                imgsz=sz,
                device=self.device,
                half=self.use_half,
            )
            annotated = results[0].plot().copy()

            # Đưa kết quả ra queue đầu ra
            if self.result_queue.full():
                try:
                    self.result_queue.get_nowait()
                except queue.Empty:
                    pass
            try:
                self.result_queue.put_nowait(annotated)
            except queue.Full:
                pass

    def stop(self):
        self._stop_event.set()
        self.join(timeout=3.0)


def main(camera_id="cam_traffic_1"):
    config = load_config()
    yolo_cfg = config['model']
    video_cfg = config['video']

    # ── Khởi tạo GPU & Model ──
    device = 0 if torch.cuda.is_available() else "cpu"
    use_half = (device == 0)
    print(f"[Main] Thiết bị: {'GPU (CUDA)' if device == 0 else 'CPU'}")

    print(f"[Main] Đang load YOLO: {yolo_cfg['path']}")
    model = YOLO(yolo_cfg['path'])

    # Warm-up
    print("[Main] Warm-up model...")
    dummy = np.zeros((yolo_cfg['img_size'], yolo_cfg['img_size'], 3), dtype=np.uint8)
    model.predict(dummy, verbose=False, device=device, half=use_half)
    print("[Main] Warm-up xong!")

    # ── Lấy stream URL ──
    url = config['cameras'].get(camera_id)
    if not url:
        print(f"[Error] Không tìm thấy: {camera_id}")
        return

    stream_url = get_stream_url(url, resolution=video_cfg['resolution'])
    if not stream_url:
        return

    # ── Khởi động các thread ──
    # max_queue_size=60: buffer ~2s video (HLS chunk) thay vì drop hết frame
    reader = StreamReader(stream_url, max_queue_size=60)
    reader.start()

    # frame_queue_size=60 trong InferenceThread để không bị đói frame
    infer = InferenceThread(model, yolo_cfg, device, use_half, frame_queue_size=60)
    infer.start()

    # ── Các biến đếm FPS ──
    fps_start = time.time()
    fps_counter = 0
    fps = 0
    infer_fps_start = time.time()
    infer_fps_counter = 0
    infer_fps = 0
    last_display = None

    print(f"[Main] Bắt đầu. Nhấn 'q' để thoát.")

    while True:
        # Lấy frame mới nhất từ stream (không block nếu queue trống)
        frame = reader.get_frame(timeout=0.05)  # Chờ tối đa 50ms
        if frame is not None:
            infer.push_frame(frame)  # Gửi frame sang InferenceThread

        # Lấy kết quả AI mới nhất (không block)
        result = infer.get_result()
        if result is not None:
            last_display = result
            infer_fps_counter += 1
            if time.time() - infer_fps_start >= 1.0:
                infer_fps = infer_fps_counter / (time.time() - infer_fps_start)
                infer_fps_counter = 0
                infer_fps_start = time.time()

        # Hiển thị: dùng kết quả AI mới nhất, hoặc frame gốc nếu chưa có
        display = last_display if last_display is not None else frame
        if display is None:
            continue

        # Tính display FPS
        fps_counter += 1
        if time.time() - fps_start >= 1.0:
            fps = fps_counter / (time.time() - fps_start)
            fps_counter = 0
            fps_start = time.time()
            # In ra terminal để theo dõi mà không cần nhìn cửa sổ nhỏ
            print(f"[FPS] Display: {fps:.1f} | AI Inference: {infer_fps:.1f} | "
                  f"Stream queue: {reader.frame_queue.qsize()} | "
                  f"Result queue: {infer.result_queue.qsize()}", flush=True)

        cv2.putText(
            display,
            f"Cam:{camera_id} | Display:{fps:.0f} | AI:{infer_fps:.0f} FPS",
            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
        )

        cv2.imshow("Realtime Detection", display)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    infer.stop()
    reader.stop()
    cv2.destroyAllWindows()
    print("[Main] Đã dừng.")


if __name__ == "__main__":
    main(camera_id="cam_traffic_1")
