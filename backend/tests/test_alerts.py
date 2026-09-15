import pytest
import time
from app.core.alert_engine import AlertEngine
from app.models.schemas import (
    TrackedObject,
    BoundingBox,
    Point2D,
    DistanceEstimate,
    MotionAnalysisResult,
    PathAnalysisResult,
    RiskAssessment,
    RiskLevel,
    SpatialDirection,
    SpatialZone,
    UserMode,
    HapticPattern,
    PathRelationshipEnum,
    MotionStateEnum,
)


def create_mock_tracked_obj(
    track_id: int,
    class_name: str,
    direction: SpatialDirection,
    distance_m: float,
    risk_score: float,
    risk_level: RiskLevel,
    is_approaching: bool = True,
    relationship: PathRelationshipEnum = PathRelationshipEnum.ENTERING_PATH
) -> TrackedObject:
    bbox = BoundingBox(
        x1=0.1, y1=0.2, x2=0.3, y2=0.8,
        width=0.2, height=0.6,
        center_x=0.2, center_y=0.5,
        area=0.12
    )
    return TrackedObject(
        track_id=track_id,
        class_name=class_name,
        confidence=0.92,
        bbox=bbox,
        center=Point2D(x=0.2, y=0.5),
        direction=direction,
        spatial_zone=SpatialZone.LEFT_CLOSE,
        distance=DistanceEstimate(distance_m=distance_m, confidence=0.85),
        motion=MotionAnalysisResult(
            state=MotionStateEnum.APPROACHING if is_approaching else MotionStateEnum.STATIONARY,
            is_approaching=is_approaching,
            velocity_x=0.1,
            is_moving=True
        ),
        path=PathAnalysisResult(relationship=relationship, is_intersecting=True),
        risk=RiskAssessment(score=risk_score, level=risk_level, explanation="test"),
    )


def test_alert_debouncing_and_cooldown():
    engine = AlertEngine(cooldown_sec=2.0)
    obj = create_mock_tracked_obj(
        track_id=101,
        class_name="bicycle",
        direction=SpatialDirection.LEFT,
        distance_m=1.8,
        risk_score=78.0,
        risk_level=RiskLevel.CRITICAL
    )

    # Frame 1: Alert should trigger
    alerts1, _ = engine.evaluate_alerts([obj], mode=UserMode.DRIVER)
    assert len(alerts1) == 1
    assert alerts1[0].haptic_pattern == HapticPattern.RAPID_ALERT
    assert "left" in alerts1[0].message.lower()

    # Frame 2 (immediately after): Alert should be suppressed by cooldown
    alerts2, _ = engine.evaluate_alerts([obj], mode=UserMode.DRIVER)
    assert len(alerts2) == 0


def test_mode_differentiation_message_templates():
    engine = AlertEngine()
    obj = create_mock_tracked_obj(
        track_id=102,
        class_name="person",
        direction=SpatialDirection.LEFT,
        distance_m=2.0,
        risk_score=65.0,
        risk_level=RiskLevel.HIGH
    )

    msg_driver = engine.format_message(obj, UserMode.DRIVER)
    msg_wheelchair = engine.format_message(obj, UserMode.WHEELCHAIR)
    msg_visual = engine.format_message(obj, UserMode.VISUAL_ASSISTANCE)

    assert "Pedestrian" in msg_driver or "pedestrian" in msg_driver.lower()
    assert "Person" in msg_wheelchair or "person" in msg_wheelchair.lower()
    assert "left" in msg_driver.lower()
    assert "left" in msg_visual.lower()
