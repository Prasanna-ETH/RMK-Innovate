from app.models.schemas import UserMode, CalibrationSettings, SystemStatus
from app.config import settings


class SessionService:
    """Manages active session configuration, mode, and calibration."""

    def __init__(self):
        self.mode = UserMode.DRIVER
        self.calibration = CalibrationSettings()
        self.is_active = True

    def set_mode(self, mode: UserMode) -> UserMode:
        self.mode = mode
        return self.mode

    def update_calibration(self, calibration: CalibrationSettings) -> CalibrationSettings:
        self.calibration = calibration
        return self.calibration

    def get_status(self, fps: float = 0.0, latency_ms: float = 0.0) -> SystemStatus:
        return SystemStatus(
            camera_connected=self.is_active,
            detector_status="RUNNING",
            tracker_status="RUNNING",
            spatial_engine_status="RUNNING",
            risk_engine_status="RUNNING",
            audio_status="READY",
            haptic_status="SIMULATION",
            fps=fps,
            latency_ms=latency_ms,
            active_mode=self.mode,
        )


session_service = SessionService()
