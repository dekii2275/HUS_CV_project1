"""
tracking/tracker.py
ByteTrack wrapper – giao tiếp với thư viện ByteTrack.

Yêu cầu: pip install bytetracker
         hoặc pip install boxmot  (hỗ trợ nhiều tracker)

TODO: Cài đặt ByteTrack và kết nối thực sự.
      Hiện tại module này chứa interface + stub để tích hợp sau.
"""

from __future__ import annotations
import numpy as np
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass, field


@dataclass
class TrackResult:
    """Kết quả theo dõi một phương tiện trong một frame."""
    track_id: int
    box: List[float]          # [x1, y1, x2, y2]
    class_id: int
    class_name: str
    confidence: float
    is_new: bool = False      # True nếu track mới xuất hiện frame này
    is_lost: bool = False     # True nếu track đang bị mất (occlusion)


class ByteTrackWrapper:
    """
    Wrapper xung quanh ByteTrack để tích hợp vào Vision Engine pipeline.

    Args:
        track_thresh:  Confidence threshold để tạo track mới. Mặc định 0.5.
        track_buffer:  Số frame giữ track trước khi xóa. Mặc định 30.
        match_thresh:  IoU threshold để match detection với track. Mặc định 0.8.
        frame_rate:    FPS của camera. Mặc định 25.

    Usage:
        tracker = ByteTrackWrapper(frame_rate=25)
        tracks = tracker.update(detections, frame)
    """

    def __init__(self,
                 track_thresh: float = 0.5,
                 track_buffer: int = 30,
                 match_thresh: float = 0.8,
                 frame_rate: int = 25,
                 class_names: Optional[Dict[int, str]] = None):
        self.track_thresh = track_thresh
        self.track_buffer = track_buffer
        self.match_thresh = match_thresh
        self.frame_rate = frame_rate
        self._tracker = None
        self._class_names = class_names or {}
        self._init_tracker()

    def _init_tracker(self):
        """Sử dụng Ultralytics built-in tracker (không cần boxmot)."""
        print("[Tracker] ✓ Sử dụng Ultralytics ByteTrack")
        self._tracker = "internal"

    def update_from_results(self, results) -> List[TrackResult]:
        """
        Chuyển đổi kết quả từ model.track() sang định dạng TrackResult.
        """
        if not results or len(results) == 0 or results[0].boxes.id is None:
            return []
        
        boxes = results[0].boxes
        res = []
        for i in range(len(boxes)):
            box = boxes.xyxy[i].cpu().numpy()
            tid = int(boxes.id[i].cpu().numpy())
            conf = float(boxes.conf[i].cpu().numpy())
            cls_id = int(boxes.cls[i].cpu().numpy())
            cls_name = self._class_names.get(cls_id, f"unknown_{cls_id}")
            
            res.append(TrackResult(
                track_id=tid,
                box=box.tolist(),
                class_id=cls_id,
                class_name=cls_name,
                confidence=conf
            ))
        return res

    def update(self,
               detections: np.ndarray,
               frame: Optional[np.ndarray] = None) -> List[TrackResult]:
        """
        Cập nhật tracker với các detection của frame hiện tại.

        Args:
            detections: np.ndarray shape (N, 6)
                        Mỗi hàng: [x1, y1, x2, y2, confidence, class_id]
            frame:      Frame hiện tại (uint8, BGR). Cần cho một số tracker
                        dùng visual feature (ReID). Có thể None cho ByteTrack.

        Returns:
            Danh sách TrackResult cho frame này.
        """
        if detections is None or len(detections) == 0:
            return []

        # ByteTrack / boxmot output: (x1, y1, x2, y2, track_id, conf, cls, ...)
        if frame is not None:
            raw = self._tracker.update(detections, frame)
        else:
            raw = self._tracker.update(detections)

        results = []
        for row in raw:
            if len(row) < 7:
                continue
            x1, y1, x2, y2, tid, conf, cls_id = row[:7]
            cls_id = int(cls_id)
            cls_name = self._class_names.get(cls_id, f"unknown_{cls_id}")
            results.append(TrackResult(
                track_id=int(tid),
                box=[float(x1), float(y1), float(x2), float(y2)],
                class_id=cls_id,
                class_name=cls_name,
                confidence=float(conf),
            ))
        return results

    def reset(self):
        """Reset tracker – xóa toàn bộ track hiện tại."""
        self._init_tracker()


class _StubTracker:
    """
    Stub tracker đơn giản (không cần ByteTrack).
    Gán track_id tăng dần, không có re-identification hay occlusion handling.
    Chỉ dùng để test pipeline khi chưa cài ByteTrack.
    """

    def __init__(self):
        self._next_id = 1
        self._active: dict = {}   # track_id → box

    def update(self, detections: np.ndarray, frame=None) -> np.ndarray:
        results = []
        for det in detections:
            x1, y1, x2, y2, conf, cls_id = det[:6]
            tid = self._next_id
            self._next_id += 1
            results.append([x1, y1, x2, y2, tid, conf, cls_id])
        return np.array(results) if results else np.empty((0, 7))