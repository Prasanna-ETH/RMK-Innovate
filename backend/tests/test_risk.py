import pytest
from app.core.risk import RiskEngine
from app.models.schemas import (
    UserMode,
    RiskLevel,
    DistanceEstimate,
    MotionAnalysisResult,
    PathAnalysisResult,
    PathRelationshipEnum,
    MotionStateEnum,
)


def test_high_risk_approaching_cyclist():
    engine = RiskEngine()

    dist = DistanceEstimate(distance_m=1.8, confidence=0.85)
    motion = MotionAnalysisResult(
        state=MotionStateEnum.APPROACHING,
        is_approaching=True,
        area_growth_rate=0.35,
        velocity_x=0.15,
        is_moving=True
    )
    path = PathAnalysisResult(
        relationship=PathRelationshipEnum.ENTERING_PATH,
        is_intersecting=True
    )

    assessment = engine.assess_risk(
        class_name="bicycle",
        distance=dist,
        motion=motion,
        path=path,
        mode=UserMode.DRIVER
    )

    assert assessment.score >= 50.0
    assert assessment.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]


def test_low_risk_distant_stationary_chair():
    engine = RiskEngine()

    dist = DistanceEstimate(distance_m=9.0, confidence=0.60)
    motion = MotionAnalysisResult(
        state=MotionStateEnum.STATIONARY,
        is_approaching=False,
        is_moving=False
    )
    path = PathAnalysisResult(
        relationship=PathRelationshipEnum.OUTSIDE_PATH,
        is_intersecting=False
    )

    assessment = engine.assess_risk(
        class_name="chair",
        distance=dist,
        motion=motion,
        path=path,
        mode=UserMode.DRIVER
    )

    assert assessment.score < 25.0
    assert assessment.level == RiskLevel.LOW
