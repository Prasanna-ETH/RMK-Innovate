import pytest
import time
from app.core.motion import MotionAnalyzer
from app.models.schemas import BoundingBox, Point2D, MotionStateEnum, SpatialDirection


def make_bbox(x1=0.2, y1=0.3, x2=0.4, y2=0.8):
    w = x2 - x1
    h = y2 - y1
    return BoundingBox(
        x1=x1, y1=y1, x2=x2, y2=y2,
        width=w, height=h,
        center_x=x1 + w / 2, center_y=y1 + h / 2,
        area=w * h
    )


def test_motion_approaching():
    analyzer = MotionAnalyzer()
    t0 = 1000.0

    # Frame 1: Small object at t0
    box1 = make_bbox(x1=0.4, y1=0.4, x2=0.5, y2=0.5)  # area = 0.01
    analyzer.update(track_id=1, center=Point2D(x=0.45, y=0.45), bbox=box1, timestamp=t0)

    # Frame 2: Much larger object at t0 + 0.3s (approaching user)
    box2 = make_bbox(x1=0.3, y1=0.2, x2=0.7, y2=0.8)  # area = 0.24
    res = analyzer.update(track_id=1, center=Point2D(x=0.5, y=0.5), bbox=box2, timestamp=t0 + 0.3)

    assert res.is_approaching is True
    assert res.state == MotionStateEnum.APPROACHING


def test_motion_crossing_right():
    analyzer = MotionAnalyzer()
    t0 = 1000.0

    # Object moving horizontally across from left to right with constant area
    box1 = make_bbox(x1=0.1, y1=0.4, x2=0.2, y2=0.6)
    analyzer.update(track_id=2, center=Point2D(x=0.15, y=0.5), bbox=box1, timestamp=t0)

    box2 = make_bbox(x1=0.4, y1=0.4, x2=0.5, y2=0.6)
    res = analyzer.update(track_id=2, center=Point2D(x=0.45, y=0.5), bbox=box2, timestamp=t0 + 0.3)

    assert res.is_moving is True
    assert res.velocity_x > 0
    assert res.movement_direction == SpatialDirection.RIGHT
    assert res.state == MotionStateEnum.CROSSING_RIGHT
