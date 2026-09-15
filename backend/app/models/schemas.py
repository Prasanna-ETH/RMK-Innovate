from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time


class UserMode(str, Enum):
    DRIVER = "driver"
    WHEELCHAIR = "wheelchair"
    VISUAL_ASSISTANCE = "visual_assistance"


class SpatialDirection(str, Enum):
    LEFT = "LEFT"
    CENTER = "CENTER"
    RIGHT = "RIGHT"


class SpatialDepth(str, Enum):
    CLOSE = "CLOSE"
    MID = "MID"
    FAR = "FAR"


class SpatialZone(str, Enum):
    LEFT_CLOSE = "LEFT_CLOSE"
    LEFT_FAR = "LEFT_FAR"
    CENTER_CLOSE = "CENTER_CLOSE"
    CENTER_FAR = "CENTER_FAR"
    RIGHT_CLOSE = "RIGHT_CLOSE"
    RIGHT_FAR = "RIGHT_FAR"


class MotionStateEnum(str, Enum):
    STATIONARY = "STATIONARY"
    MOVING = "MOVING"
    APPROACHING = "APPROACHING"
    MOVING_AWAY = "MOVING_AWAY"
    CROSSING_LEFT = "CROSSING_LEFT"
    CROSSING_RIGHT = "CROSSING_RIGHT"
    ENTERING_PATH = "ENTERING_PATH"
    LEAVING_PATH = "LEAVING_PATH"


class PathRelationshipEnum(str, Enum):
    OUTSIDE_PATH = "OUTSIDE_PATH"
    NEAR_PATH = "NEAR_PATH"
    ENTERING_PATH = "ENTERING_PATH"
    INSIDE_PATH = "INSIDE_PATH"
    BLOCKING_PATH = "BLOCKING_PATH"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class HapticPattern(str, Enum):
    NONE = "NONE"
    LEFT_PULSE = "LEFT_PULSE"
    CENTER_PULSE = "CENTER_PULSE"
    RIGHT_PULSE = "RIGHT_PULSE"
    DOUBLE_PULSE = "DOUBLE_PULSE"
    RAPID_ALERT = "RAPID_ALERT"


class Point2D(BaseModel):
    x: float
    y: float


class BoundingBox(BaseModel):
    # Normalized coordinates (0.0 - 1.0)
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float
    # Center point normalized
    center_x: float
    center_y: float
    # Bounding box area normalized
    area: float
    # Optional pixel coords
    px_x1: Optional[int] = None
    px_y1: Optional[int] = None
    px_x2: Optional[int] = None
    px_y2: Optional[int] = None


class DistanceEstimate(BaseModel):
    distance_m: float
    confidence: float
    source: str = "monocular_heuristic"
    is_approximate: bool = True


class MotionAnalysisResult(BaseModel):
    state: MotionStateEnum
    velocity_x: float = 0.0  # normalized delta x per second
    velocity_y: float = 0.0  # normalized delta y per second
    area_growth_rate: float = 0.0  # rate of bbox area expansion
    is_approaching: bool = False
    is_moving: bool = False
    movement_direction: Optional[SpatialDirection] = None


class PathAnalysisResult(BaseModel):
    relationship: PathRelationshipEnum
    distance_to_corridor: float = 0.0  # distance from center path
    is_intersecting: bool = False
    time_to_corridor_sec: Optional[float] = None


class RiskAssessment(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0)
    level: RiskLevel
    distance_risk: float = Field(0.0, ge=0.0, le=100.0)
    approach_risk: float = Field(0.0, ge=0.0, le=100.0)
    path_risk: float = Field(0.0, ge=0.0, le=100.0)
    object_risk: float = Field(0.0, ge=0.0, le=100.0)
    motion_risk: float = Field(0.0, ge=0.0, le=100.0)
    explanation: str = ""


class TrackedObject(BaseModel):
    track_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    center: Point2D
    direction: SpatialDirection
    spatial_zone: SpatialZone
    distance: DistanceEstimate
    motion: MotionAnalysisResult
    path: PathAnalysisResult
    risk: RiskAssessment
    history_centers: List[Point2D] = []
    frames_tracked: int = 1
    first_seen_timestamp: float = Field(default_factory=time.time)
    last_seen_timestamp: float = Field(default_factory=time.time)


class AlertEvent(BaseModel):
    alert_id: str
    timestamp: float = Field(default_factory=time.time)
    severity: RiskLevel
    message: str
    direction: SpatialDirection
    haptic_pattern: HapticPattern
    priority: int = Field(1, ge=1, le=10)
    track_id: Optional[int] = None
    object_class: Optional[str] = None
    risk_score: float = 0.0


class PassageAnalysis(BaseModel):
    is_passage_constrained: bool = False
    passage_width_estimate_m: Optional[float] = None
    message: Optional[str] = None


class FramePerceptionResult(BaseModel):
    frame_id: int
    timestamp: float = Field(default_factory=time.time)
    mode: UserMode
    objects: List[TrackedObject] = []
    active_alerts: List[AlertEvent] = []
    primary_threat: Optional[TrackedObject] = None
    passage_analysis: Optional[PassageAnalysis] = None
    overall_risk_score: float = 0.0
    overall_risk_level: RiskLevel = RiskLevel.LOW
    fps: float = 0.0
    latency_ms: float = 0.0
    corridor_bounds: Dict[str, float] = {}


class SystemStatus(BaseModel):
    camera_connected: bool = True
    detector_status: str = "RUNNING"
    tracker_status: str = "RUNNING"
    spatial_engine_status: str = "RUNNING"
    risk_engine_status: str = "RUNNING"
    audio_status: str = "READY"
    haptic_status: str = "SIMULATION"
    fps: float = 0.0
    latency_ms: float = 0.0
    active_mode: UserMode = UserMode.DRIVER


class CalibrationSettings(BaseModel):
    detection_confidence: float = 0.35
    camera_height_m: float = 1.3
    alert_sensitivity: float = 1.0  # multiplier
    corridor_width: float = 0.40
    alert_cooldown_sec: float = 2.5
    audio_enabled: bool = True
    haptic_simulation_enabled: bool = True


class SessionConfig(BaseModel):
    mode: UserMode = UserMode.DRIVER
    calibration: CalibrationSettings = CalibrationSettings()
