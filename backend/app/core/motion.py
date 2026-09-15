from typing import List, Dict, Tuple, Optional
import time
from app.models.schemas import (
    MotionAnalysisResult,
    MotionStateEnum,
    SpatialDirection,
    Point2D,
    BoundingBox,
)
from app.config import settings


class TrackHistoryItem:
    def __init__(self, timestamp: float, center: Point2D, bbox: BoundingBox):
        self.timestamp = timestamp
        self.center = center
        self.bbox = bbox


class MotionAnalyzer:
    """Analyzes temporal trajectory and bounding box area dynamics to determine motion."""

    def __init__(
        self,
        smoothing_alpha: float = settings.SMOOTHING_ALPHA,
        history_len: int = settings.TRACK_HISTORY_LENGTH,
    ):
        self.smoothing_alpha = smoothing_alpha
        self.history_len = history_len
        # track_id -> List[TrackHistoryItem]
        self._history: Dict[int, List[TrackHistoryItem]] = {}
        # track_id -> smoothed (vx, vy, area_rate)
        self._smoothed_metrics: Dict[int, Tuple[float, float, float]] = {}

    def update(
        self, track_id: int, center: Point2D, bbox: BoundingBox, timestamp: Optional[float] = None
    ) -> MotionAnalysisResult:
        now = timestamp or time.time()
        
        if track_id not in self._history:
            self._history[track_id] = []
        
        history = self._history[track_id]
        history.append(TrackHistoryItem(now, center, bbox))
        if len(history) > self.history_len:
            history.pop(0)

        # Need at least 2 observations for velocity & area rate
        if len(history) < 2:
            return MotionAnalysisResult(
                state=MotionStateEnum.STATIONARY,
                velocity_x=0.0,
                velocity_y=0.0,
                area_growth_rate=0.0,
                is_approaching=False,
                is_moving=False,
                movement_direction=None,
            )

        # Compare current with an earlier sample (~0.2s - 0.5s ago) for stable derivatives
        prev_idx = max(0, len(history) - min(len(history), 6))
        prev_item = history[prev_idx]
        dt = max(now - prev_item.timestamp, 0.03)

        raw_vx = (center.x - prev_item.center.x) / dt
        raw_vy = (center.y - prev_item.center.y) / dt
        
        prev_area = max(prev_item.bbox.area, 0.001)
        raw_area_rate = (bbox.area - prev_area) / (prev_area * dt)

        # Exponential moving average smoothing
        if track_id in self._smoothed_metrics:
            svx, svy, s_rate = self._smoothed_metrics[track_id]
            vx = self.smoothing_alpha * raw_vx + (1 - self.smoothing_alpha) * svx
            vy = self.smoothing_alpha * raw_vy + (1 - self.smoothing_alpha) * svy
            area_rate = self.smoothing_alpha * raw_area_rate + (1 - self.smoothing_alpha) * s_rate
        else:
            vx, vy, area_rate = raw_vx, raw_vy, raw_area_rate

        self._smoothed_metrics[track_id] = (vx, vy, area_rate)

        # Thresholds
        speed_magnitude = (vx**2 + vy**2) ** 0.5
        is_moving = speed_magnitude > 0.05 or abs(area_rate) > 0.12
        is_approaching = area_rate > 0.10 or (vy > 0.08 and bbox.y2 > 0.5)
        is_moving_away = area_rate < -0.10 or (vy < -0.08 and not is_approaching)

        # Determine directional heading
        move_dir = None
        if abs(vx) > 0.06:
            move_dir = SpatialDirection.RIGHT if vx > 0 else SpatialDirection.LEFT

        # State classification
        if is_approaching:
            state = MotionStateEnum.APPROACHING
        elif is_moving_away:
            state = MotionStateEnum.MOVING_AWAY
        elif is_moving:
            if move_dir == SpatialDirection.RIGHT:
                state = MotionStateEnum.CROSSING_RIGHT
            elif move_dir == SpatialDirection.LEFT:
                state = MotionStateEnum.CROSSING_LEFT
            else:
                state = MotionStateEnum.MOVING
        else:
            state = MotionStateEnum.STATIONARY

        return MotionAnalysisResult(
            state=state,
            velocity_x=round(vx, 3),
            velocity_y=round(vy, 3),
            area_growth_rate=round(area_rate, 3),
            is_approaching=is_approaching,
            is_moving=is_moving,
            movement_direction=move_dir,
        )

    def prune(self, active_track_ids: List[int]):
        """Clean up state for tracks that are no longer visible."""
        current_active = set(active_track_ids)
        to_delete = [tid for tid in self._history if tid not in current_active]
        for tid in to_delete:
            self._history.pop(tid, None)
            self._smoothed_metrics.pop(tid, None)
