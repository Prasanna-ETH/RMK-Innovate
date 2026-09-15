from typing import List, Optional, Tuple, Dict
from app.models.schemas import (
    BoundingBox,
    Point2D,
    MotionAnalysisResult,
    PathAnalysisResult,
    PathRelationshipEnum,
    PassageAnalysis,
    SpatialDirection,
)
from app.config import settings


class PathAnalyzer:
    """Evaluates spatial intersection and encroachment between detected objects and the user's travel corridor."""

    def __init__(
        self,
        corridor_left: float = settings.PATH_CORRIDOR_LEFT,
        corridor_right: float = settings.PATH_CORRIDOR_RIGHT,
        corridor_top: float = settings.PATH_CORRIDOR_TOP,
        corridor_bottom: float = settings.PATH_CORRIDOR_BOTTOM,
    ):
        self.corridor_left = corridor_left
        self.corridor_right = corridor_right
        self.corridor_top = corridor_top
        self.corridor_bottom = corridor_bottom

    def update_corridor(self, left: float, right: float):
        self.corridor_left = max(0.05, left)
        self.corridor_right = min(0.95, right)

    def analyze_object_path(
        self, bbox: BoundingBox, motion: MotionAnalysisResult
    ) -> PathAnalysisResult:
        # Check geometric overlap with corridor
        overlap_x = max(0.0, min(bbox.x2, self.corridor_right) - max(bbox.x1, self.corridor_left))
        in_vertical_range = bbox.y2 >= self.corridor_top and bbox.y1 <= self.corridor_bottom

        is_inside = overlap_x > 0.05 and in_vertical_range
        
        # Calculate distance to corridor boundary
        if bbox.x2 < self.corridor_left:
            dist_to_corridor = self.corridor_left - bbox.x2
            is_left_of_corridor = True
            is_right_of_corridor = False
        elif bbox.x1 > self.corridor_right:
            dist_to_corridor = bbox.x1 - self.corridor_right
            is_left_of_corridor = False
            is_right_of_corridor = True
        else:
            dist_to_corridor = 0.0
            is_left_of_corridor = False
            is_right_of_corridor = False

        # Heading toward corridor?
        heading_towards = False
        time_to_corridor = None

        if is_left_of_corridor and motion.velocity_x > 0.03:
            heading_towards = True
            time_to_corridor = dist_to_corridor / max(motion.velocity_x, 0.01)
        elif is_right_of_corridor and motion.velocity_x < -0.03:
            heading_towards = True
            time_to_corridor = dist_to_corridor / max(abs(motion.velocity_x), 0.01)

        # Classification
        if is_inside:
            if not motion.is_moving and bbox.area > 0.06:
                relationship = PathRelationshipEnum.BLOCKING_PATH
            else:
                relationship = PathRelationshipEnum.INSIDE_PATH
        elif heading_towards and dist_to_corridor < 0.25:
            relationship = PathRelationshipEnum.ENTERING_PATH
        elif dist_to_corridor < 0.12 and in_vertical_range:
            relationship = PathRelationshipEnum.NEAR_PATH
        else:
            relationship = PathRelationshipEnum.OUTSIDE_PATH

        is_intersecting = (
            relationship in [
                PathRelationshipEnum.INSIDE_PATH,
                PathRelationshipEnum.BLOCKING_PATH,
                PathRelationshipEnum.ENTERING_PATH,
            ]
        )

        return PathAnalysisResult(
            relationship=relationship,
            distance_to_corridor=round(dist_to_corridor, 3),
            is_intersecting=is_intersecting,
            time_to_corridor_sec=round(time_to_corridor, 2) if time_to_corridor else None,
        )

    def analyze_passages(self, objects: List[Tuple[BoundingBox, str]]) -> PassageAnalysis:
        """
        Estimates clearance when multiple obstacles are detected around the corridor,
        especially useful for Wheelchair mode navigation.
        """
        if len(objects) < 2:
            return PassageAnalysis(is_passage_constrained=False)

        # Find closest objects on left and right side of corridor center
        center_x = (self.corridor_left + self.corridor_right) / 2.0
        left_obstacles = [b for b, _ in objects if b.center_x < center_x and b.y2 > 0.4]
        right_obstacles = [b for b, _ in objects if b.center_x >= center_x and b.y2 > 0.4]

        if not left_obstacles or not right_obstacles:
            return PassageAnalysis(is_passage_constrained=False)

        # Find closest edges between left obstacles and right obstacles
        max_left_edge = max(b.x2 for b in left_obstacles)
        min_right_edge = min(b.x1 for b in right_obstacles)

        gap_normalized = min_right_edge - max_left_edge
        
        # Approximate metric gap (assuming typical 2.5m total scene width at 3m depth)
        approx_gap_m = max(gap_normalized * 3.0, 0.2)

        if gap_normalized < 0.35:
            return PassageAnalysis(
                is_passage_constrained=True,
                passage_width_estimate_m=round(approx_gap_m, 1),
                message=f"Narrow passage ahead (~{round(approx_gap_m, 1)}m clearance)"
            )

        return PassageAnalysis(
            is_passage_constrained=False,
            passage_width_estimate_m=round(approx_gap_m, 1),
        )
