from app.models.schemas import SpatialDirection, SpatialDepth, SpatialZone, Point2D
from app.config import settings


class SpatialAnalyzer:
    """Analyzes spatial positioning of objects in the normalized camera frame."""

    def __init__(
        self,
        left_boundary: float = settings.SPATIAL_LEFT_BOUNDARY,
        right_boundary: float = settings.SPATIAL_RIGHT_BOUNDARY,
        close_threshold_m: float = settings.DEPTH_CLOSE_METERS,
    ):
        self.left_boundary = left_boundary
        self.right_boundary = right_boundary
        self.close_threshold_m = close_threshold_m

    def classify_direction(self, center_x: float) -> SpatialDirection:
        """Determines whether an object is to the LEFT, CENTER, or RIGHT."""
        if center_x < self.left_boundary:
            return SpatialDirection.LEFT
        elif center_x > self.right_boundary:
            return SpatialDirection.RIGHT
        else:
            return SpatialDirection.CENTER

    def classify_depth(self, distance_m: float) -> SpatialDepth:
        """Determines if an object is CLOSE or FAR based on estimated metric distance."""
        if distance_m <= self.close_threshold_m:
            return SpatialDepth.CLOSE
        elif distance_m <= self.close_threshold_m * 2.0:
            return SpatialDepth.MID
        else:
            return SpatialDepth.FAR

    def get_spatial_zone(self, center_x: float, distance_m: float) -> SpatialZone:
        """Maps an object to a 6-zone spatial region (LEFT/CENTER/RIGHT x CLOSE/FAR)."""
        direction = self.classify_direction(center_x)
        is_close = distance_m <= self.close_threshold_m

        if direction == SpatialDirection.LEFT:
            return SpatialZone.LEFT_CLOSE if is_close else SpatialZone.LEFT_FAR
        elif direction == SpatialDirection.RIGHT:
            return SpatialZone.RIGHT_CLOSE if is_close else SpatialZone.RIGHT_FAR
        else:
            return SpatialZone.CENTER_CLOSE if is_close else SpatialZone.CENTER_FAR

    def get_relative_position_label(self, direction: SpatialDirection, depth: SpatialDepth) -> str:
        """Returns human-friendly relative positioning string."""
        depth_str = "near" if depth == SpatialDepth.CLOSE else "far"
        dir_str = direction.value.lower()
        if direction == SpatialDirection.CENTER:
            return f"{depth_str} ahead" if depth == SpatialDepth.CLOSE else "ahead"
        return f"{depth_str} {dir_str}"
