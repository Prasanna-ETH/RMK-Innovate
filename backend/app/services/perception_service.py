import base64
import numpy as np
import cv2
from typing import Optional, Tuple
from app.core.fusion import PerceptionFusionPipeline
from app.models.schemas import FramePerceptionResult, UserMode, CalibrationSettings
from app.services.session_service import session_service
from app.utils.logging import logger


class PerceptionService:
    """Service handling frame decoding and perception pipeline execution."""

    def __init__(self):
        self.pipeline = PerceptionFusionPipeline()

    def decode_frame(self, image_data: str) -> Optional[np.ndarray]:
        """Decodes base64-encoded image string into an OpenCV numpy BGR image."""
        try:
            if "," in image_data:
                # Strip data URL prefix (e.g. "data:image/jpeg;base64,")
                image_data = image_data.split(",", 1)[1]
            
            raw_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(raw_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return frame
        except Exception as e:
            logger.error(f"Error decoding image frame: {e}")
            return None

    def process_image_base64(
        self,
        image_data: str,
        mode: Optional[UserMode] = None,
        calibration: Optional[CalibrationSettings] = None,
    ) -> FramePerceptionResult:
        active_mode = mode or session_service.mode
        active_calib = calibration or session_service.calibration
        
        frame = self.decode_frame(image_data)
        if frame is None:
            # Return empty nominal result on frame decode failure
            return self.pipeline.process_frame(
                frame=None,
                mode=active_mode,
                calibration=active_calib,
            )

        return self.pipeline.process_frame(
            frame=frame,
            mode=active_mode,
            calibration=active_calib,
        )


perception_service = PerceptionService()
