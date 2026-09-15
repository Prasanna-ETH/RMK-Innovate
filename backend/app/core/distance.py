from abc import ABC, abstractmethod
from typing import Dict
from app.models.schemas import BoundingBox, DistanceEstimate


class DistanceEstimator(ABC):
    """Abstract interface for distance estimation, allowing future stereo/LiDAR/depth models."""

    @abstractmethod
    def estimate_distance(self, bbox: BoundingBox, class_name: str) -> DistanceEstimate:
        pass


class MonocularHeuristicEstimator(DistanceEstimator):
    """
    Practical monocular distance estimator based on calibrated physical dimensions
    and bounding-box geometry heuristics.
    """

    # Physical height prior in meters
    REAL_HEIGHTS_METERS: Dict[str, float] = {
        "person": 1.70,
        "bicycle": 1.05,
        "motorcycle": 1.20,
        "car": 1.50,
        "bus": 3.20,
        "truck": 3.00,
        "dog": 0.60,
        "cat": 0.30,
        "horse": 1.60,
        "chair": 0.85,
        "couch": 0.85,
        "dining table": 0.75,
        "potted plant": 0.60,
        "bed": 0.70,
        "backpack": 0.45,
        "handbag": 0.35,
        "suitcase": 0.65,
        "bottle": 0.25,
    }
    DEFAULT_REAL_HEIGHT: float = 1.00

    def __init__(self, focal_length_norm: float = 0.85, camera_height_m: float = 1.3):
        # Normalized focal length assuming typical 60-70 degree FOV webcams
        self.focal_length_norm = focal_length_norm
        self.camera_height_m = camera_height_m

    def estimate_distance(self, bbox: BoundingBox, class_name: str) -> DistanceEstimate:
        real_h = self.REAL_HEIGHTS_METERS.get(class_name.lower(), self.DEFAULT_REAL_HEIGHT)
        
        # Avoid zero-division on tiny bounding boxes
        h_norm = max(bbox.height, 0.02)
        
        # 1. Height-based geometric approximation
        dist_height = (self.focal_length_norm * real_h) / h_norm
        
        # 2. Ground-plane contact heuristic: objects near bottom of frame are closer
        # y2 = bottom of bounding box (0.0 top, 1.0 bottom)
        bottom_y = min(max(bbox.y2, 0.1), 0.98)
        # Horizon is roughly at y=0.5; distance increases as bottom_y -> 0.5
        ground_factor = max(1.0 - bottom_y, 0.05)
        dist_ground = (self.camera_height_m * 1.5) / ground_factor
        
        # Blend height and ground-plane estimates
        estimated_dist = 0.70 * dist_height + 0.30 * dist_ground
        
        # Clamp to realistic bounds for human/wheelchair/vehicle perception
        clamped_dist = round(float(min(max(estimated_dist, 0.4), 25.0)), 1)
        
        # Confidence heuristic: larger bounding boxes and known classes have higher confidence
        class_known = class_name.lower() in self.REAL_HEIGHTS_METERS
        size_conf = min(h_norm * 2.5, 0.90)
        confidence = round(0.50 + (0.35 if class_known else 0.15) * size_conf, 2)
        
        return DistanceEstimate(
            distance_m=clamped_dist,
            confidence=min(confidence, 0.95),
            source="monocular_heuristic",
            is_approximate=True
        )
