"""
benchmark.py - Chạy file này để xác định bottleneck là mạng hay AI
Chạy lệnh: python realtime_ytb/benchmark.py
"""
import cv2
import time
import torch
import numpy as np
import yaml
from ultralytics import YOLO
from utils import get_stream_url
from stream_reader import StreamReader


def load_config(config_path="realtime_ytb/config.yaml"):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def test_inference_speed(model_path, img_size, device, use_half, n_runs=100):
    """Test tốc độ YOLO thuần túy, không có stream."""
    print(f"\n{'='*50}")
    print(f"[BENCH] Test 1: YOLO Inference Speed (không có stream)")
    print(f"  model={model_path}, imgsz={img_size}, device={device}, half={use_half}")

    model = YOLO(model_path)
    dummy = np.random.randint(0, 255, (img_size, img_size, 3), dtype=np.uint8)

    # Warm-up
    for _ in range(3):
        model.predict(dummy, verbose=False, device=device, half=use_half)

    # Benchmark
    start = time.time()
    for _ in range(n_runs):
        model.predict(dummy, verbose=False, device=device, half=use_half)
    elapsed = time.time() - start

    fps = n_runs / elapsed
    ms = (elapsed / n_runs) * 1000
    print(f"  → {n_runs} lần predict trong {elapsed:.2f}s")
    print(f"  → Inference FPS: {fps:.1f} | Latency: {ms:.1f} ms/frame")
    return fps


def test_stream_speed(stream_url, n_frames=60):
    """Test tốc độ đọc frame từ YouTube stream."""
    print(f"\n{'='*50}")
    print(f"[BENCH] Test 2: Stream Read Speed (không có AI)")
    print(f"  URL: {stream_url[:60]}...")

    reader = StreamReader(stream_url)
    reader.start()

    # Chờ stream ổn định
    time.sleep(2)

    count = 0
    start = time.time()
    while count < n_frames:
        frame = reader.get_frame(timeout=5.0)
        if frame is not None:
            count += 1

    elapsed = time.time() - start
    fps = count / elapsed
    print(f"  → Đọc {count} frames trong {elapsed:.2f}s")
    print(f"  → Stream FPS: {fps:.1f}")
    reader.stop()
    return fps


def main():
    config = load_config()
    yolo_cfg = config['model']
    video_cfg = config['video']

    device = 0 if torch.cuda.is_available() else "cpu"
    use_half = (device == 0)
    print(f"[BENCH] Thiết bị: {'GPU (CUDA)' if device == 0 else 'CPU'}")

    # Test 1: Tốc độ inference thuần túy
    infer_fps = test_inference_speed(
        yolo_cfg['path'],
        yolo_cfg['img_size'],
        device,
        use_half
    )

    # Test 2: Tốc độ stream
    url = config['cameras']['cam_traffic_1']
    stream_url = get_stream_url(url, resolution=video_cfg['resolution'])
    stream_fps = test_stream_speed(stream_url)

    # Kết luận
    print(f"\n{'='*50}")
    print(f"[KẾT LUẬN]")
    print(f"  YOLO Inference: {infer_fps:.1f} FPS")
    print(f"  YouTube Stream: {stream_fps:.1f} FPS")
    bottleneck = "MẠNG (Stream quá chậm)" if stream_fps < infer_fps else "AI (Inference chậm hơn stream)"
    print(f"  → Bottleneck chính: {bottleneck}")
    print(f"  → FPS thực tế tối đa có thể đạt: ~{min(infer_fps, stream_fps):.1f} FPS")


if __name__ == "__main__":
    main()
