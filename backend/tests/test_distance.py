import pytest
from app.core.distance import MonocularHeuristicEstimator
from app.models.schemas import BoundingBox


def make_bbox(x1=0.2, y1=0.3, x2=0.4, y2=0.8):
    w = x2 - x1
    h = y2 - y1
    return BoundingBox(
        x1=x1, y1=y1, x2=x2, y2=y2,
        width=w, height=h,
        center_x=x1 + w / 2, center_y=y1 + h / 2,
        area=w * h
    )


def test_distance_scaling_with_bounding_box_size():
    estimator = MonocularHeuristicEstimator()

    # Large box (close person)
    large_box = make_bbox(y1=0.1, y2=0.9)  # height = 0.8
    # Small box (distant person)
    small_box = make_bbox(y1=0.4, y2=0.55)  # height = 0.15

    dist_close = estimator.estimate_distance(large_box, "person")
    dist_far = estimator.estimate_distance(small_box, "person")

    assert dist_close.distance_m < dist_far.distance_m
    assert dist_close.distance_m >= 0.4
    assert dist_close.is_approximate is True


def test_distance_object_class_priors():
    estimator = MonocularHeuristicEstimator()
    box = make_bbox(y1=0.2, y2=0.7)  # height = 0.5

    # A car of height 0.5 is farther away than a small chair of height 0.5
    dist_car = estimator.estimate_distance(box, "car")
    dist_chair = estimator.estimate_distance(box, "chair")

    assert dist_car.distance_m > dist_chair.distance_m
