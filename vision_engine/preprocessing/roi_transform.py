"""
preprocessing/roi_transform.py
ROI Masking + Perspective Transform (Bird's Eye View).
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional


# ─────────────────────────────────────────────
# ROI Masking
# ─────────────────────────────────────────────

class ROIMask:
    """
    Che các vùng không liên quan (bầu trời, vỉa hè, biển quảng cáo).

    Args:
        roi_points: Danh sách tọa độ (x, y) tạo thành polygon ROI.
                    Ví dụ: [(150,1080), (550,480), (1370,480), (1770,1080)]
        frame_size: Kích thước frame (width, height).

    Usage:
        roi = ROIMask(points, (1920, 1080))
        frame_masked = roi.apply(frame)
    """

    def __init__(self, roi_points: List[Tuple[int, int]], frame_size: Tuple[int, int]):
        self.roi_points = np.array(roi_points, dtype=np.int32)
        self.frame_size = frame_size  # (width, height)
        self._mask: Optional[np.ndarray] = None
        self._build_mask()

    def _build_mask(self):
        """Tạo binary mask từ polygon ROI."""
        w, h = self.frame_size
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(mask, [self.roi_points], 255)
        self._mask = mask

    def apply(self, frame: np.ndarray) -> np.ndarray:
        """
        Áp dụng ROI mask lên frame – vùng ngoài ROI bị đen.

        Args:
            frame: BGR image (uint8).

        Returns:
            Frame đã mask (uint8).
        """
        if self._mask is None:
            self._build_mask()
        return cv2.bitwise_and(frame, frame, mask=self._mask)

    def draw_roi(self, frame: np.ndarray,
                 color: Tuple[int, int, int] = (0, 255, 0),
                 thickness: int = 2) -> np.ndarray:
        """
        Vẽ đường viền ROI lên frame để debug.

        Args:
            frame:     BGR image.
            color:     Màu đường viền (BGR). Mặc định xanh lá.
            thickness: Độ dày đường. Mặc định 2.

        Returns:
            Frame có đường viền ROI.
        """
        result = frame.copy()
        cv2.polylines(result, [self.roi_points], isClosed=True,
                      color=color, thickness=thickness)
        # Đánh số các điểm
        for i, pt in enumerate(self.roi_points):
            cv2.circle(result, tuple(pt), 5, (0, 0, 255), -1)
            cv2.putText(result, str(i), (pt[0] + 8, pt[1] - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
        return result

    def update_points(self, new_points: List[Tuple[int, int]]):
        """Cập nhật tọa độ ROI và rebuild mask."""
        self.roi_points = np.array(new_points, dtype=np.int32)
        self._build_mask()


# ─────────────────────────────────────────────
# Perspective Transform (BEV)
# ─────────────────────────────────────────────

class PerspectiveTransformer:
    """
    Chuyển đổi góc nhìn camera → Bird's Eye View (BEV).
    Dùng để tính khoảng cách thực và tốc độ xe.

    Args:
        src_points:        4 điểm trên frame gốc (mặt đường).
                           [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        dst_points:        4 điểm tương ứng trong BEV.
        output_size:       Kích thước ảnh BEV (width, height).
        meters_per_pixel_x: Tỷ lệ m/pixel theo trục X (BEV).
        meters_per_pixel_y: Tỷ lệ m/pixel theo trục Y (BEV).

    Usage:
        transformer = PerspectiveTransformer(src, dst, (800,600), 0.058, 0.065)
        bev_frame = transformer.warp_frame(frame)
        speed_kmh = transformer.compute_speed(pos_prev, pos_curr, fps=25)
    """

    def __init__(self,
                 src_points: List[List[int]],
                 dst_points: List[List[int]],
                 output_size: Tuple[int, int],
                 meters_per_pixel_x: float = 0.05,
                 meters_per_pixel_y: float = 0.05):
        self.src_points = np.float32(src_points)
        self.dst_points = np.float32(dst_points)
        self.output_size = output_size  # (width, height)
        self.mpp_x = meters_per_pixel_x
        self.mpp_y = meters_per_pixel_y

        # Ma trận biến đổi
        self.M = cv2.getPerspectiveTransform(self.src_points, self.dst_points)
        self.M_inv = cv2.getPerspectiveTransform(self.dst_points, self.src_points)

    def warp_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Warp toàn bộ frame sang Bird's Eye View.

        Args:
            frame: BGR image (uint8).

        Returns:
            BEV image với kích thước output_size.
        """
        return cv2.warpPerspective(frame, self.M, self.output_size)

    def warp_point(self, point: Tuple[float, float]) -> Tuple[float, float]:
        """
        Chiếu 1 điểm từ camera coordinates → BEV coordinates (pixel).

        Args:
            point: (x, y) trong frame gốc.

        Returns:
            (x_bev, y_bev) trong BEV frame (pixel).
        """
        pt = np.array([[[point[0], point[1]]]], dtype=np.float32)
        pt_bev = cv2.perspectiveTransform(pt, self.M)
        return (float(pt_bev[0][0][0]), float(pt_bev[0][0][1]))

    def warp_point_meters(self, point: Tuple[float, float]) -> Tuple[float, float]:
        """
        Chiếu 1 điểm từ camera coordinates → BEV coordinates (mét).
        Dùng để tính toán khoảng cách thực và vận tốc.

        Args:
            point: (x, y) trong frame gốc.

        Returns:
            (x_m, y_m) – tọa độ BEV tính bằng mét.
        """
        px, py = self.warp_point(point)
        return (px * self.mpp_x, py * self.mpp_y)

    def warp_point_inverse(self, point: Tuple[float, float]) -> Tuple[float, float]:
        """
        Chiếu ngược: BEV coordinates → camera coordinates.

        Args:
            point: (x_bev, y_bev) trong BEV frame.

        Returns:
            (x, y) trong frame gốc.
        """
        pt = np.array([[[point[0], point[1]]]], dtype=np.float32)
        pt_cam = cv2.perspectiveTransform(pt, self.M_inv)
        return (float(pt_cam[0][0][0]), float(pt_cam[0][0][1]))

    def compute_speed(self,
                      pos_prev: Tuple[float, float],
                      pos_curr: Tuple[float, float],
                      fps: float) -> float:
        """
        Tính tốc độ xe từ 2 vị trí BEV liên tiếp.

        Công thức: speed = Δpixel × mpp × fps × 3.6

        Args:
            pos_prev: Vị trí BEV frame trước (x, y).
            pos_curr: Vị trí BEV frame hiện tại (x, y).
            fps:      Tốc độ khung hình của camera.

        Returns:
            Tốc độ (km/h). Trả về 0.0 nếu fps <= 0.
        """
        if fps <= 0:
            return 0.0
        dx = (pos_curr[0] - pos_prev[0]) * self.mpp_x
        dy = (pos_curr[1] - pos_prev[1]) * self.mpp_y
        dist_meters = np.sqrt(dx ** 2 + dy ** 2)
        speed_mps = dist_meters * fps          # m/s (per frame → per second)
        return speed_mps * 3.6                 # km/h

    def update_calibration(self,
                           meters_per_pixel_x: float,
                           meters_per_pixel_y: float):
        """Cập nhật tỷ lệ m/pixel khi đo lại thực địa."""
        self.mpp_x = meters_per_pixel_x
        self.mpp_y = meters_per_pixel_y