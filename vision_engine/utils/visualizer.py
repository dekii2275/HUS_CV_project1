"""
utils/visualizer.py
Vẽ bbox, track ID, tốc độ, FPS lên frame để hiển thị.
"""

import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple

# Màu theo class (BGR)
CLASS_COLORS: Dict[str, Tuple[int, int, int]] = {
    "car":        (0, 200, 255),   # vàng nhạt
    "motorcycle": (0, 255, 100),   # xanh lá
    "bus":        (255, 100, 0),   # xanh dương
    "truck":      (0, 80, 255),    # đỏ-cam
}
DEFAULT_COLOR = (200, 200, 200)


def draw_track(frame: np.ndarray,
               box: List[float],
               track_id: int,
               class_name: str,
               speed_kmh: float,
               conf: Optional[float] = None,
               thickness: int = 2) -> np.ndarray:
    """
    Vẽ bbox + track ID + tên class + tốc độ lên frame.

    Args:
        frame:      BGR image (uint8). Vẽ in-place.
        box:        [x1, y1, x2, y2] (float/int).
        track_id:   ID theo dõi của ByteTrack.
        class_name: Tên class ('car', 'motorcycle', ...).
        speed_kmh:  Tốc độ ước tính (km/h).
        conf:       Confidence score (optional, để debug).
        thickness:  Độ dày đường bbox.

    Returns:
        Frame đã vẽ (cùng đối tượng).
    """
    x1, y1, x2, y2 = [int(v) for v in box]
    color = CLASS_COLORS.get(class_name, DEFAULT_COLOR)

    # Bbox
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)

    # Label: "ID:5 car 42.3 km/h"
    speed_str = f"{speed_kmh:.1f} km/h" if speed_kmh > 0 else "-- km/h"
    conf_str  = f" {conf:.2f}" if conf is not None else ""
    label = f"ID:{track_id} {class_name}{conf_str} {speed_str}"

    # Nền label
    (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    label_y = max(y1 - 4, th + baseline)
    cv2.rectangle(frame,
                  (x1, label_y - th - baseline),
                  (x1 + tw, label_y + baseline),
                  color, cv2.FILLED)
    cv2.putText(frame, label, (x1, label_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
    return frame


def draw_fps(frame: np.ndarray,
             fps: float,
             position: Tuple[int, int] = (10, 30)) -> np.ndarray:
    """
    Hiển thị FPS góc trên trái.

    Args:
        frame:    BGR image.
        fps:      FPS hiện tại.
        position: Vị trí text (x, y). Mặc định (10, 30).

    Returns:
        Frame đã vẽ.
    """
    text = f"FPS: {fps:.1f}"
    cv2.putText(frame, text, position,
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2, cv2.LINE_AA)
    return frame


def draw_vehicle_count(frame: np.ndarray,
                       counts: Dict[str, int],
                       position: Tuple[int, int] = (10, 60)) -> np.ndarray:
    """
    Hiển thị số lượng từng loại phương tiện.

    Args:
        frame:    BGR image.
        counts:   {'car': 5, 'motorcycle': 12, ...}
        position: Vị trí bắt đầu vẽ (x, y).

    Returns:
        Frame đã vẽ.
    """
    x, y = position
    for cls, count in counts.items():
        color = CLASS_COLORS.get(cls, DEFAULT_COLOR)
        text = f"{cls}: {count}"
        cv2.putText(frame, text, (x, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2, cv2.LINE_AA)
        y += 25
    return frame


def draw_roi_overlay(frame: np.ndarray,
                     roi_points: np.ndarray,
                     alpha: float = 0.15,
                     color: Tuple[int, int, int] = (0, 255, 0)) -> np.ndarray:
    """
    Vẽ ROI polygon bán trong suốt lên frame (debug).

    Args:
        frame:      BGR image.
        roi_points: np.array shape (N, 2) – tọa độ polygon.
        alpha:      Độ trong suốt (0 = trong suốt, 1 = đục hoàn toàn).
        color:      Màu fill BGR.

    Returns:
        Frame đã vẽ overlay.
    """
    overlay = frame.copy()
    cv2.fillPoly(overlay, [roi_points.astype(np.int32)], color)
    return cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)


def draw_speed_warning(frame: np.ndarray,
                       box: List[float],
                       speed_kmh: float,
                       limit_kmh: float = 50.0) -> np.ndarray:
    """
    Đánh dấu đỏ phương tiện vượt tốc độ.

    Args:
        frame:      BGR image.
        box:        [x1, y1, x2, y2].
        speed_kmh:  Tốc độ phương tiện (km/h).
        limit_kmh:  Ngưỡng tốc độ cho phép. Mặc định 60 km/h.

    Returns:
        Frame đã vẽ (cảnh báo nếu vượt tốc).
    """
    if speed_kmh <= limit_kmh:
        return frame
    x1, y1, x2, y2 = [int(v) for v in box]
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
    cv2.putText(frame, "SPEED!", (x1, y1 - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
    
    return frame