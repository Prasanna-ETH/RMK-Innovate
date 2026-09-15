from typing import List, Dict, Optional, Tuple
import time
import uuid
from app.models.schemas import (
    TrackedObject,
    AlertEvent,
    UserMode,
    RiskLevel,
    SpatialDirection,
    HapticPattern,
    PathRelationshipEnum,
    MotionStateEnum,
)
from app.config import settings


class AlertEngine:
    """Context-aware alert engine with cooldown, debouncing, prioritization, and mode-specific templates."""

    def __init__(
        self,
        cooldown_sec: float = settings.ALERT_COOLDOWN_SECONDS,
        repeat_delta_risk: float = settings.ALERT_REPEAT_DELTA_RISK,
    ):
        self.cooldown_sec = cooldown_sec
        self.repeat_delta_risk = repeat_delta_risk
        # track_id -> last alert timestamp
        self._last_alert_time: Dict[int, float] = {}
        # track_id -> last alert risk score
        self._last_alert_risk: Dict[int, float] = {}

    def update_cooldown(self, cooldown_sec: float):
        self.cooldown_sec = max(0.5, cooldown_sec)

    def generate_haptic_pattern(
        self, direction: SpatialDirection, severity: RiskLevel
    ) -> HapticPattern:
        if severity == RiskLevel.CRITICAL:
            return HapticPattern.RAPID_ALERT
        elif direction == SpatialDirection.LEFT:
            return HapticPattern.LEFT_PULSE
        elif direction == SpatialDirection.RIGHT:
            return HapticPattern.RIGHT_PULSE
        else:
            return HapticPattern.CENTER_PULSE

    def format_message(self, obj: TrackedObject, mode: UserMode) -> str:
        cls_name = obj.class_name.lower()
        dir_val = obj.direction.value.lower()
        dist = obj.distance.distance_m
        is_approaching = obj.motion.is_approaching
        is_crossing = obj.motion.state in [MotionStateEnum.CROSSING_LEFT, MotionStateEnum.CROSSING_RIGHT]
        is_blocking = obj.path.relationship == PathRelationshipEnum.BLOCKING_PATH
        is_entering = obj.path.relationship == PathRelationshipEnum.ENTERING_PATH
        is_critical = obj.risk.level == RiskLevel.CRITICAL

        # Friendly object terms
        friendly_name = {
            "person": "Pedestrian" if mode == UserMode.DRIVER else "Person",
            "bicycle": "Cyclist",
            "motorcycle": "Motorcycle",
            "car": "Vehicle",
            "bus": "Bus",
            "truck": "Truck",
            "chair": "Obstacle",
            "couch": "Obstacle",
            "dining table": "Obstacle",
            "backpack": "Obstacle",
            "suitcase": "Obstacle",
            "dog": "Animal",
            "cat": "Animal",
        }.get(cls_name, "Obstacle")

        # ==================== MODE 1: DRIVER ====================
        if mode == UserMode.DRIVER:
            if is_critical and is_approaching:
                return f"Caution! {friendly_name} approaching rapidly from your {dir_val}."
            if is_entering:
                return f"{friendly_name} entering your path from the {dir_val}."
            if is_approaching and dir_val in ["left", "right"]:
                return f"{friendly_name} approaching from your {dir_val}."
            if dir_val in ["left", "right"] and dist <= 3.0:
                return f"{friendly_name} in your {dir_val} blind spot."
            if obj.path.is_intersecting:
                return f"{friendly_name} ahead in your path."
            return f"{friendly_name} detected on your {dir_val}."

        # ==================== MODE 2: WHEELCHAIR ====================
        elif mode == UserMode.WHEELCHAIR:
            if is_blocking:
                return f"Obstacle ahead. Path blocked."
            if is_crossing:
                return f"{friendly_name} crossing your path."
            if is_entering:
                return f"{friendly_name} entering your path from the {dir_val}."
            if is_approaching:
                return f"{friendly_name} approaching on your {dir_val}."
            if obj.direction == SpatialDirection.CENTER and dist <= 2.5:
                return f"Obstacle ahead, approximately {dist} meters."
            return f"{friendly_name} on your {dir_val}."

        # ==================== MODE 3: VISUAL ASSISTANCE ====================
        else:
            if is_blocking or (obj.direction == SpatialDirection.CENTER and dist <= 2.0):
                return f"Obstacle directly ahead, {dist} meters."
            if is_approaching and dir_val in ["left", "right"]:
                return f"{friendly_name} approaching from your {dir_val}."
            if is_entering:
                return f"{friendly_name} entering path from your {dir_val}."
            if is_approaching:
                return f"{friendly_name} approaching ahead."
            if dir_val in ["left", "right"]:
                return f"{friendly_name} on your {dir_val}."
            return f"{friendly_name} ahead."

    def evaluate_alerts(
        self, tracked_objects: List[TrackedObject], mode: UserMode = UserMode.DRIVER
    ) -> Tuple[List[AlertEvent], Optional[TrackedObject]]:
        now = time.time()
        active_alerts: List[AlertEvent] = []
        primary_threat: Optional[TrackedObject] = None
        highest_risk = -1.0

        for obj in tracked_objects:
            if obj.risk.score > highest_risk:
                highest_risk = obj.risk.score
                primary_threat = obj

            # Alert threshold filter: Only alert on HIGH or CRITICAL, or close inside-path obstacles
            should_consider = (
                obj.risk.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
                or (obj.risk.level == RiskLevel.MEDIUM and obj.path.is_intersecting and obj.distance.distance_m <= 2.5)
            )

            if not should_consider:
                continue

            last_time = self._last_alert_time.get(obj.track_id, 0.0)
            last_risk = self._last_alert_risk.get(obj.track_id, 0.0)

            time_elapsed = now - last_time
            risk_jump = obj.risk.score - last_risk

            # Cooldown check: allow if cooldown expired OR significant risk escalation (> 18 points)
            if time_elapsed < self.cooldown_sec and risk_jump < self.repeat_delta_risk:
                continue

            # Record alert firing
            self._last_alert_time[obj.track_id] = now
            self._last_alert_risk[obj.track_id] = obj.risk.score

            message = self.format_message(obj, mode)
            haptic = self.generate_haptic_pattern(obj.direction, obj.risk.level)
            priority = int(min(max(obj.risk.score / 10.0, 1.0), 10.0))

            alert = AlertEvent(
                alert_id=str(uuid.uuid4())[:8],
                timestamp=now,
                severity=obj.risk.level,
                message=message,
                direction=obj.direction,
                haptic_pattern=haptic,
                priority=priority,
                track_id=obj.track_id,
                object_class=obj.class_name,
                risk_score=obj.risk.score,
            )
            active_alerts.append(alert)

        # Sort alerts by priority descending
        active_alerts.sort(key=lambda a: a.priority, reverse=True)

        return active_alerts, primary_threat

    def prune(self, active_track_ids: List[int]):
        current = set(active_track_ids)
        to_remove = [tid for tid in self._last_alert_time if tid not in current]
        for tid in to_remove:
            self._last_alert_time.pop(tid, None)
            self._last_alert_risk.pop(tid, None)
