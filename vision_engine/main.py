# vision_engine/main.py

import cv2
import yaml
import time
import numpy as np
import yt_dlp
import os
import sys
from ultralytics import YOLO
from pathlib import Path

# Đảm bảo có thể import các module từ vision_engine
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import các module của vision_engine
from vision_engine.preprocessing.clahe import AutoEnhancer
from vision_engine.preprocessing.roi_transform import ROIMask, PerspectiveTransformer
from vision_engine.tracking.tracker import ByteTrackWrapper
from vision_engine.tracking.track_manager import TrackManager
from vision_engine.utils.visualizer import draw_track, draw_fps, draw_vehicle_count, draw_roi_overlay, draw_speed_warning
from vision_engine.utils.bbox_utils import get_bottom_center

def get_youtube_stream(url):
    """Lấy trực tiếp link video từ YouTube URL"""
    print(f"[Stream] Đang kết nối tới YouTube: {url}")
    ydl_opts = {
        'format': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['url']
    except Exception as e:
        print(f"❌ Lỗi khi lấy link YouTube: {e}")
        return None

def main():
    # 1. Load Cấu hình
    try:
        with open("vision_engine/config/model.yaml", "r", encoding="utf-8") as f:
            m_cfg = yaml.safe_load(f)
        with open("vision_engine/config/cameras.yaml", "r", encoding="utf-8") as f:
            c_cfg = yaml.safe_load(f)
    except FileNotFoundError as e:
        print(f"❌ Lỗi: Không tìm thấy file cấu hình: {e}")
        return

    cam_id = "youtube_demo"
    if cam_id not in c_cfg['cameras']:
        print(f"❌ Lỗi: Không tìm thấy camera '{cam_id}' trong cameras.yaml")
        return
        
    cam_cfg = c_cfg['cameras'][cam_id]
    print(f"🚀 Khởi động Vision Engine cho: {cam_cfg['name']}")

    # 2. Khởi tạo AI & Tracking
    model_path = m_cfg['model']['weights']
    if not Path(model_path).exists():
        print(f"⚠️ Cảnh báo: Không tìm thấy model tại {model_path}, đang thử tải yolo11n.pt mặc định...")
        model_path = "yolo11n.pt"

    print(f"[AI] Đang tải model: {model_path} trên thiết bị: {m_cfg['model']['device']}")
    model = YOLO(model_path)
    
    # Lấy danh sách class từ model hoặc config
    class_names = model.names
    if 'classes' in m_cfg['model'] and m_cfg['model']['classes']:
        # Chuyển key sang int nếu từ yaml (đôi khi yaml load key là string)
        config_classes = {int(k): v for k, v in m_cfg['model']['classes'].items()}
        class_names.update(config_classes)

    tracker = ByteTrackWrapper(
        frame_rate=cam_cfg['fps'],
        track_thresh=m_cfg['tracking']['track_thresh'],
        class_names=class_names
    )
    track_manager = TrackManager(
        speed_limit_kmh=m_cfg['tracking']['speed_limit_kmh'],
        smoothing_factor=m_cfg['tracking']['speed_smoothing']
    )

    # 3. Khởi tạo Preprocessing & Enhancer
    enhancer = AutoEnhancer(check_interval=60)
    roi = ROIMask(cam_cfg['roi']['points'], cam_cfg['frame_size'])
    transformer = PerspectiveTransformer(
        src_points=cam_cfg['perspective']['src_points'],
        dst_points=cam_cfg['perspective']['dst_points'],
        output_size=cam_cfg['perspective']['output_size'],
        meters_per_pixel_x=cam_cfg['perspective']['meters_per_pixel_x'],
        meters_per_pixel_y=cam_cfg['perspective']['meters_per_pixel_y']
    )

    # 4. Mở luồng Video
    stream_url = get_youtube_stream(cam_cfg['youtube_url'])
    if not stream_url:
        print("❌ Không thể lấy link stream. Thoát.")
        return
    
    cap = cv2.VideoCapture(stream_url)
    if not cap.isOpened():
        print("❌ Không thể mở stream video qua OpenCV.")
        return
    
    # Thiết lập cửa sổ hiển thị có thể thay đổi kích thước
    window_name = f"Vision Engine - {cam_cfg['name']}"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1280, 720) # Đặt kích thước cửa sổ mặc định lớn hơn
    
    print("[System] Bắt đầu xử lý. Nhấn 'q' để thoát.")
    prev_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Mất luồng video, đang thử lấy lại link...")
            stream_url = get_youtube_stream(cam_cfg['youtube_url'])
            if stream_url:
                cap = cv2.VideoCapture(stream_url)
            continue

        # Resize frame nếu kích thước không khớp cấu hình (để ROI mask đúng vị trí)
        # ⚡ Tối ưu: Nếu frame quá lớn (Full HD+), cân nhắc downscale xuống 1280 (720p) để tăng tốc
        target_size = tuple(cam_cfg['frame_size'])
        if frame.shape[1] > 1280:
             # Nếu cấu hình vẫn là 1920, nhưng ta muốn nhanh hơn, ta có thể ghi đè ở đây
             # Tuy nhiên để an toàn, ta chỉ resize theo config.
             pass

        if (frame.shape[1], frame.shape[0]) != target_size:
            frame = cv2.resize(frame, target_size)

        # --- BƯỚC 1: Tiền xử lý ---
        # Tăng cường chất lượng ảnh (Dùng class có cache để nhanh hơn)
        if m_cfg['preprocessing'].get('auto_enhance', True):
            processed_frame = enhancer.enhance(frame)
        else:
            processed_frame = frame
            
        # Áp dụng ROI Mask
        masked_frame = roi.apply(processed_frame)

        # --- BƯỚC 2 & 3: AI Detection & Tracking ---
        # Sử dụng model.track để tự động chạy ByteTrack tích hợp
        results = model.track(
            source=masked_frame,
            conf=m_cfg['model']['confidence'],
            device=m_cfg['model']['device'],
            half=m_cfg['model']['half_precision'],
            classes=m_cfg['model']['filter_classes'],
            persist=True,  # Quan trọng: giữ ID qua các frame
            tracker="bytetrack.yaml", # Sử dụng ByteTrack mặc định
            verbose=False
        )
        
        # Chuyển đổi kết quả sang định dạng chuẩn của Engine
        track_results = tracker.update_from_results(results)
        
        # Tính vị trí BEV (mét) cho từng xe để tính vận tốc chính xác
        bev_positions = {}
        for tr in track_results:
            foot_point = get_bottom_center(tr.box)
            # ⚡ Dùng đơn vị mét thay vì pixel
            bev_pos_m = transformer.warp_point_meters(foot_point)
            bev_positions[tr.track_id] = bev_pos_m
            
        track_manager.update(track_results, bev_positions, fps=cam_cfg['fps'])

        # --- BƯỚC 4: Visualizer ---
        display_frame = frame.copy()
        # Vẽ ROI overlay
        display_frame = draw_roi_overlay(display_frame, np.array(cam_cfg['roi']['points']))
        
        for tr in track_results:
            state = track_manager.get_state(tr.track_id)
            if state:
                speed = state.speed_kmh
                draw_track(display_frame, tr.box, tr.track_id, tr.class_name, speed)
                if m_cfg['output']['speed_warning']:
                    draw_speed_warning(display_frame, tr.box, speed, limit_kmh=track_manager.speed_limit_kmh)

        # FPS và Đếm xe
        curr_time = time.time()
        fps = 1.0 / (curr_time - prev_time)
        prev_time = curr_time
        if m_cfg['output']['show_fps']:
            draw_fps(display_frame, fps)
        if m_cfg['output']['show_count']:
            draw_vehicle_count(display_frame, track_manager.get_current_count())

        # Hiển thị kết quả
        cv2.imshow(window_name, display_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
