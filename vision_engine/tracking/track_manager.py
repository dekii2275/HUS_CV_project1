"""
tracking/track_manager.py
Quản lý lịch sử track ID, tốc độ, lost track, thống kê phương tiện.
"""

from __future__ import annotations
import time
from collections import defaultdict, deque
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

from tracking.tracker import TrackResult


@dataclass
class TrackState:
    """Trạng thái đầy đủ của một xe đang được theo dõi."""
    track_id: int
    class_name: str
    # Vị trí BEV (x, y) – dùng để tính tốc độ
    bev_positions: deque = field(default_factory=lambda: deque(maxlen=10))
    # Tốc độ lịch sử (km/h) – EMA smoothed
    speed_history: deque = field(default_factory=lambda: deque(maxlen=10))
    speed_kmh: float = 0.0
    # Bbox gần nhất
    last_box: Optional[List[float]] = None
    confidence: float = 0.0
    # Quản lý lost
    frames_since_seen: int = 0
    is_active: bool = True
    # Metadata
    first_seen_time: float = field(default_factory=time.time)
    last_seen_time: float = field(default_factory=time.time)
    frame_count: int = 0
    # Cảnh báo tốc độ
    speed_violations: int = 0


class TrackManager:
    """
    Quản lý toàn bộ track ID trong pipeline.

    Chức năng:
      - Lưu lịch sử vị trí BEV và tốc độ mỗi track
      - Phát hiện và xử lý lost track (occlusion)
      - Thống kê đếm phương tiện theo class
      - Cảnh báo vượt tốc độ

    Args:
        max_lost_frames:    Số frame mất tích tối đa trước khi xóa track.
        speed_limit_kmh:    Ngưỡng tốc độ để ghi nhận vi phạm (km/h).
        smoothing_factor:   Alpha cho EMA tốc độ (0–1).

    Usage:
        manager = TrackManager(max_lost_frames=30)
        manager.update(track_results, bev_positions, fps=25)
        speed = manager.get_speed(track_id)
    """

    def __init__(self,
                 max_lost_frames: int = 30,
                 speed_limit_kmh: float = 50.0,
                 smoothing_factor: float = 0.3):
        self.max_lost_frames = max_lost_frames
        self.speed_limit_kmh = speed_limit_kmh
        self.smoothing_factor = smoothing_factor

        self._tracks: Dict[int, TrackState] = {}
        self._total_count: Dict[str, int] = defaultdict(int)
        self._seen_ids: set = set()

    # ─────────────────────────────────────────────────────────
    # Update chính
    # ─────────────────────────────────────────────────────────

    def update(self,
               track_results: List[TrackResult],
               bev_positions: Dict[int, Tuple[float, float]],
               fps: float = 25.0):
        """
        Cập nhật TrackManager với kết quả tracker frame hiện tại.

        Args:
            track_results: Danh sách TrackResult từ ByteTrackWrapper.update().
            bev_positions: {track_id: (x_bev, y_bev)} – vị trí BEV mỗi xe.
            fps:           FPS camera (để tính tốc độ).
        """
        active_ids = set()

        for result in track_results:
            tid = result.track_id
            active_ids.add(tid)

            # Track mới
            if tid not in self._tracks:
                self._tracks[tid] = TrackState(
                    track_id=tid,
                    class_name=result.class_name,
                )
                if tid not in self._seen_ids:
                    self._seen_ids.add(tid)
                    self._total_count[result.class_name] += 1

            state = self._tracks[tid]
            state.last_box = result.box
            state.confidence = result.confidence
            state.frames_since_seen = 0
            state.is_active = True
            state.last_seen_time = time.time()
            state.frame_count += 1

            # Cập nhật vị trí BEV và tính tốc độ
            if tid in bev_positions:
                bev_pos = bev_positions[tid]
                if len(state.bev_positions) > 0:
                    prev_pos = state.bev_positions[-1]
                    raw_speed = self._calc_speed(prev_pos, bev_pos, fps)
                    # EMA smoothing
                    alpha = self.smoothing_factor
                    state.speed_kmh = alpha * raw_speed + (1 - alpha) * state.speed_kmh
                state.bev_positions.append(bev_pos)
                state.speed_history.append(state.speed_kmh)

                # Kiểm tra vi phạm tốc độ
                if state.speed_kmh > self.speed_limit_kmh:
                    state.speed_violations += 1

        # Xử lý lost track
        for tid, state in self._tracks.items():
            if tid not in active_ids:
                state.frames_since_seen += 1
                if state.frames_since_seen > self.max_lost_frames:
                    state.is_active = False

        # Xóa track đã quá hạn
        self._tracks = {
            tid: s for tid, s in self._tracks.items()
            if s.is_active or s.frames_since_seen <= self.max_lost_frames
        }

    # ─────────────────────────────────────────────────────────
    # Query API
    # ─────────────────────────────────────────────────────────

    def get_speed(self, track_id: int) -> float:
        """Tốc độ hiện tại của track (km/h). 0.0 nếu không tồn tại."""
        state = self._tracks.get(track_id)
        return state.speed_kmh if state else 0.0

    def get_state(self, track_id: int) -> Optional[TrackState]:
        """Trả về TrackState đầy đủ hoặc None."""
        return self._tracks.get(track_id)

    def get_active_tracks(self) -> List[TrackState]:
        """Danh sách các track đang active (không bị lost)."""
        return [s for s in self._tracks.values() if s.is_active]

    def get_total_count(self) -> Dict[str, int]:
        """Tổng số phương tiện đã đi qua frame theo class."""
        return dict(self._total_count)

    def get_current_count(self) -> Dict[str, int]:
        """Số phương tiện đang hiện diện trong frame."""
        counts: Dict[str, int] = defaultdict(int)
        for s in self.get_active_tracks():
            counts[s.class_name] += 1
        return dict(counts)

    def get_speed_violations(self) -> List[TrackState]:
        """Danh sách xe đã vi phạm tốc độ."""
        return [s for s in self._tracks.values() if s.speed_violations > 0]

    # ─────────────────────────────────────────────────────────
    # Internal helpers
    # ─────────────────────────────────────────────────────────

    @staticmethod
    def _calc_speed(pos_prev: Tuple[float, float],
                    pos_curr: Tuple[float, float],
                    fps: float,
                    mpp: float = 1.0) -> float:
        """
        Tính tốc độ thô từ 2 vị trí BEV.
        Lưu ý: mpp nên được cấu hình từ PerspectiveTransformer.
               Mặc định mpp=1.0 nếu vị trí BEV đã ở đơn vị mét.
        """
        if fps <= 0:
            return 0.0
        dx = (pos_curr[0] - pos_prev[0]) * mpp
        dy = (pos_curr[1] - pos_prev[1]) * mpp
        dist = (dx ** 2 + dy ** 2) ** 0.5
        return dist * fps * 3.6  # km/h

    def reset(self):
        """Xóa toàn bộ track (dùng khi restart camera)."""
        self._tracks.clear()
        self._total_count.clear()
        self._seen_ids.clear()