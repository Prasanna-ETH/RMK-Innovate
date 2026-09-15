from fastapi import APIRouter
from app.models.schemas import SystemStatus
from app.services.session_service import session_service
from app.services.perception_service import perception_service

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=SystemStatus)
async def get_health():
    fps = perception_service.pipeline.fps_smoothed
    return session_service.get_status(fps=fps, latency_ms=15.0)
