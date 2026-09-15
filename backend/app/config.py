from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Dict, Any, List


class Settings(BaseSettings):
    APP_NAME: str = "BlindSpot — Intelligent Spatial Awareness"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]
    
    # Model & Detector settings
    MODEL_NAME: str = "yolov8n.pt"  # lightweight fast model
    DETECTION_CONFIDENCE: float = 0.35
    IOU_THRESHOLD: float = 0.45
    TARGET_CLASSES: List[str] = [
        "person",
        "bicycle",
        "car",
        "motorcycle",
        "bus",
        "truck",
        "dog",
        "cat",
        "horse",
        "chair",
        "couch",
        "potted plant",
        "bed",
        "dining table",
        "backpack",
        "umbrella",
        "handbag",
        "suitcase",
        "bottle",
    ]
    
    # Tracking & Processing
    TARGET_FPS: int = 15
    TRACK_HISTORY_LENGTH: int = 30
    SMOOTHING_ALPHA: float = 0.35
    
    # Spatial Boundaries (normalized 0.0 to 1.0)
    SPATIAL_LEFT_BOUNDARY: float = 0.33
    SPATIAL_RIGHT_BOUNDARY: float = 0.67
    DEPTH_CLOSE_METERS: float = 3.0
    
    # User Path Corridor (normalized 0.0 to 1.0)
    PATH_CORRIDOR_LEFT: float = 0.30
    PATH_CORRIDOR_RIGHT: float = 0.70
    PATH_CORRIDOR_TOP: float = 0.25
    PATH_CORRIDOR_BOTTOM: float = 1.0
    
    # Alerting & Debounce
    ALERT_COOLDOWN_SECONDS: float = 2.5
    ALERT_REPEAT_DELTA_RISK: float = 18.0
    RISK_THRESHOLD_MEDIUM: float = 25.0
    RISK_THRESHOLD_HIGH: float = 50.0
    RISK_THRESHOLD_CRITICAL: float = 75.0
    
    # Mode-specific Risk Weights
    # Weights sum to ~1.0: (distance, approach, path, object_type, motion)
    RISK_WEIGHTS_DRIVER: Dict[str, float] = {
        "distance": 0.25,
        "approach": 0.30,
        "path": 0.20,
        "object_type": 0.15,
        "motion": 0.10,
    }
    
    RISK_WEIGHTS_WHEELCHAIR: Dict[str, float] = {
        "distance": 0.30,
        "approach": 0.15,
        "path": 0.35,
        "object_type": 0.10,
        "motion": 0.10,
    }
    
    RISK_WEIGHTS_VISUAL_ASSISTANCE: Dict[str, float] = {
        "distance": 0.30,
        "approach": 0.25,
        "path": 0.25,
        "object_type": 0.10,
        "motion": 0.10,
    }

    # Calibration defaults
    CAMERA_HEIGHT_METERS: float = 1.3
    CAMERA_TILT_DEGREES: float = 0.0

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "allow",
    }


settings = Settings()
