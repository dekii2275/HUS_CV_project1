"""
utils/bbox_utils.py
Tiện ích xử lý bounding box, tính tốc độ, IoU.
"""

import numpy as np
from typing import List, Tuple, Optional


def get_bottom_center(box: List[float]) -> Tuple[float, float]:
    """
    Lấy điểm chân xe (bottom center của bbox) để chiếu xuống BEV.

    Args:
        box: [x1, y1, x2, y2] – tọa độ bbox (pixel).

    Returns:
        (cx, y2) – điểm giữa cạnh dưới.
    """
    x1, y1, x2, y2 = box
    cx = (x1 + x2) / 2.0
    return (cx, y2)


def get_center(box: List[float]) -> Tuple[float, float]:
    """
    Lấy tâm bbox.

    Args:
        box: [x1, y1, x2, y2].

    Returns:
        (cx, cy).
    """
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


def estimate_speed_kmh(pos_prev: Tuple[float, float],
                       pos_curr: Tuple[float, float],
                       mpp: float,
                       fps: float,
                       smoothing_factor: float = 0.3,
                       prev_speed: float = 0.0) -> float:
    """
    Ước tính tốc độ xe với EMA smoothing để tránh nhiễu.

    Công thức:
        raw_speed = Δpixel × mpp × fps × 3.6
        speed = α × raw_speed + (1 - α) × prev_speed

    Args:
        pos_prev:         Vị trí BEV frame trước (x, y).
        pos_curr:         Vị trí BEV frame hiện tại (x, y).
        mpp:              Tỷ lệ meters/pixel (BEV space). Dùng giá trị
                          trung bình của mpp_x và mpp_y nếu khác nhau.
        fps:              FPS của camera.
        smoothing_factor: Alpha EMA (0–1). Cao = phản ứng nhanh, thấp = mượt.
        prev_speed:       Tốc độ frame trước để EMA. Mặc định 0.

    Returns:
        Tốc độ ước tính (km/h).
    """
    if fps <= 0 or mpp <= 0:
        return 0.0

    dx = pos_curr[0] - pos_prev[0]
    dy = pos_curr[1] - pos_prev[1]
    dist_pixel = np.sqrt(dx ** 2 + dy ** 2)
    dist_meter = dist_pixel * mpp

    # m/frame → km/h
    raw_speed = dist_meter * fps * 3.6

    # EMA smoothing
    speed = smoothing_factor * raw_speed + (1.0 - smoothing_factor) * prev_speed
    return max(speed, 0.0)


def compute_iou(box_a: List[float], box_b: List[float]) -> float:
    """
    Tính Intersection over Union giữa 2 bounding box.

    Args:
        box_a: [x1, y1, x2, y2].
        box_b: [x1, y1, x2, y2].

    Returns:
        IoU (0.0 – 1.0).
    """
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union_area = area_a + area_b - inter_area

    if union_area <= 0:
        return 0.0
    return inter_area / union_area


def pixel_to_meters(dx_pixel: float, dy_pixel: float,
                    mpp_x: float, mpp_y: float) -> Tuple[float, float]:
    """
    Chuyển đổi khoảng cách pixel BEV → khoảng cách thực (mét).

    Args:
        dx_pixel: Khoảng cách pixel theo X.
        dy_pixel: Khoảng cách pixel theo Y.
        mpp_x:    meters/pixel trục X.
        mpp_y:    meters/pixel trục Y.

    Returns:
        (dx_meter, dy_meter).
    """
    return dx_pixel * mpp_x, dy_pixel * mpp_y


def box_area(box: List[float]) -> float:
    """Diện tích bounding box (pixel²)."""
    x1, y1, x2, y2 = box
    return max(0.0, x2 - x1) * max(0.0, y2 - y1)


def clip_box(box: List[float],
             frame_width: int,
             frame_height: int) -> List[float]:
    """
    Clamp tọa độ bbox vào trong giới hạn frame.

    Args:
        box:          [x1, y1, x2, y2].
        frame_width:  Chiều rộng frame.
        frame_height: Chiều cao frame.

    Returns:
        bbox đã clamp.
    """
    x1, y1, x2, y2 = box
    x1 = max(0.0, min(x1, frame_width))
    x2 = max(0.0, min(x2, frame_width))
    y1 = max(0.0, min(y1, frame_height))
    y2 = max(0.0, min(y2, frame_height))
    return [x1, y1, x2, y2]