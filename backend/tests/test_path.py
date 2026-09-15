import pytest
from app.core.path_analysis import PathAnalyzer
from app.models.schemas import (
    BoundingBox,
    MotionAnalysisResult,
    MotionStateEnum,
    PathRelationshipEnum,
)


def make_bbox(x1, y1, x2, y2):
    w = x2 - x1
    h = y2 - y1
    return BoundingBox(
        x1=x1, y1=y1, x2=x2, y2=y2,
        width=w, height=h,
        center_x=x1 + w / 2, center_y=y1 + h / 2,
        area=w * h
    )


def test_object_inside_and_blocking_path():
    analyzer = PathAnalyzer(corridor_left=0.30, corridor_right=0.70)
    
    # Large stationary object centered in corridor
    box = make_bbox(0.35, 0.40, 0.65, 0.90)  # area = 0.15
    motion_stat = MotionAnalysisResult(
        state=MotionStateEnum.STATIONARY,
        velocity_x=0.0,
        velocity_y=0.0,
        is_moving=False
    )
    
    res = analyzer.analyze_object_path(box, motion_stat)
    assert res.relationship == PathRelationshipEnum.BLOCKING_PATH
    assert res.is_intersecting is True


def test_object_entering_path_from_left():
    analyzer = PathAnalyzer(corridor_left=0.30, corridor_right=0.70)
    
    # Cyclist on left moving right towards corridor
    box = make_bbox(0.10, 0.40, 0.25, 0.80)
    motion_entering = MotionAnalysisResult(
        state=MotionStateEnum.CROSSING_RIGHT,
        velocity_x=0.25,
        velocity_y=0.0,
        is_moving=True
    )
    
    res = analyzer.analyze_object_path(box, motion_entering)
    assert res.relationship == PathRelationshipEnum.ENTERING_PATH
    assert res.is_intersecting is True
