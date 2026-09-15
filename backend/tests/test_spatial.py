import pytest
from app.core.spatial import SpatialAnalyzer
from app.models.schemas import SpatialDirection, SpatialDepth, SpatialZone


def test_spatial_horizontal_classification():
    analyzer = SpatialAnalyzer(left_boundary=0.33, right_boundary=0.67)

    assert analyzer.classify_direction(0.15) == SpatialDirection.LEFT
    assert analyzer.classify_direction(0.32) == SpatialDirection.LEFT
    assert analyzer.classify_direction(0.50) == SpatialDirection.CENTER
    assert analyzer.classify_direction(0.60) == SpatialDirection.CENTER
    assert analyzer.classify_direction(0.75) == SpatialDirection.RIGHT
    assert analyzer.classify_direction(0.95) == SpatialDirection.RIGHT


def test_spatial_depth_classification():
    analyzer = SpatialAnalyzer(close_threshold_m=3.0)

    assert analyzer.classify_depth(1.5) == SpatialDepth.CLOSE
    assert analyzer.classify_depth(3.0) == SpatialDepth.CLOSE
    assert analyzer.classify_depth(4.5) == SpatialDepth.MID
    assert analyzer.classify_depth(8.0) == SpatialDepth.FAR


def test_spatial_zone_mapping():
    analyzer = SpatialAnalyzer(left_boundary=0.33, right_boundary=0.67, close_threshold_m=3.0)

    assert analyzer.get_spatial_zone(0.15, 2.0) == SpatialZone.LEFT_CLOSE
    assert analyzer.get_spatial_zone(0.15, 5.0) == SpatialZone.LEFT_FAR
    assert analyzer.get_spatial_zone(0.50, 1.8) == SpatialZone.CENTER_CLOSE
    assert analyzer.get_spatial_zone(0.50, 6.0) == SpatialZone.CENTER_FAR
    assert analyzer.get_spatial_zone(0.85, 2.5) == SpatialZone.RIGHT_CLOSE
    assert analyzer.get_spatial_zone(0.85, 7.0) == SpatialZone.RIGHT_FAR
