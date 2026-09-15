from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.models.schemas import (
    UserMode,
    CalibrationSettings,
    SystemStatus,
    FramePerceptionResult,
)
from app.services.session_service import session_service
from app.services.perception_service import perception_service
from app.config import settings

router = APIRouter(prefix="/api", tags=["API"])


class ModeUpdateRequest(BaseModel):
    mode: UserMode


class FramePayload(BaseModel):
    image: str
    mode: Optional[UserMode] = None


@router.get("/config")
async def get_config() -> Dict[str, Any]:
    return {
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "model_name": settings.MODEL_NAME,
        "target_fps": settings.TARGET_FPS,
        "confidence_threshold": settings.DETECTION_CONFIDENCE,
        "risk_weights": {
            "driver": settings.RISK_WEIGHTS_DRIVER,
            "wheelchair": settings.RISK_WEIGHTS_WHEELCHAIR,
            "visual_assistance": settings.RISK_WEIGHTS_VISUAL_ASSISTANCE,
        },
        "spatial_boundaries": {
            "left": settings.SPATIAL_LEFT_BOUNDARY,
            "right": settings.SPATIAL_RIGHT_BOUNDARY,
            "close_meters": settings.DEPTH_CLOSE_METERS,
        },
        "path_corridor": {
            "left": settings.PATH_CORRIDOR_LEFT,
            "right": settings.PATH_CORRIDOR_RIGHT,
            "top": settings.PATH_CORRIDOR_TOP,
            "bottom": settings.PATH_CORRIDOR_BOTTOM,
        },
    }


@router.post("/session/start")
async def start_session():
    session_service.is_active = True
    return {"status": "started", "mode": session_service.mode}


@router.post("/session/stop")
async def stop_session():
    session_service.is_active = False
    return {"status": "stopped"}


@router.post("/session/mode", response_model=Dict[str, Any])
async def update_mode(payload: ModeUpdateRequest):
    session_service.set_mode(payload.mode)
    return {"status": "success", "active_mode": session_service.mode}


@router.post("/session/calibration", response_model=CalibrationSettings)
async def update_calibration(calibration: CalibrationSettings):
    session_service.update_calibration(calibration)
    perception_service.pipeline.update_calibration(calibration)
    return session_service.calibration


@router.get("/session/status", response_model=SystemStatus)
async def get_session_status():
    fps = perception_service.pipeline.fps_smoothed
    return session_service.get_status(fps=fps)


@router.post("/perception/process", response_model=FramePerceptionResult)
async def process_single_frame(payload: FramePayload):
    result = perception_service.process_image_base64(
        payload.image,
        mode=payload.mode or session_service.mode,
        calibration=session_service.calibration,
    )
    return result
