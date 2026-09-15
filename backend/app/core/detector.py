from typing import List, Optional, Tuple, Any
import numpy as np
import cv2
from app.models.schemas import BoundingBox, Point2D
from app.config import settings
from app.utils.logging import logger

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    logger.warning("Ultralytics YOLO not installed. Fallback detector enabled.")


class RawDetection:
    def __init__(
        self,
        class_name: str,
        confidence: float,
        bbox: BoundingBox,
        track_id: Optional[int] = None,
    ):
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox
        self.track_id = track_id


class ObjectDetector:
    """Real-time object detector wrapping YOLOv8 with graceful fallback handling."""

    def __init__(
        self,
        model_name: str = settings.MODEL_NAME,
        confidence_threshold: float = settings.DETECTION_CONFIDENCE,
        iou_threshold: float = settings.IOU_THRESHOLD,
    ):
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.model = None
        self._init_model()

    def _init_model(self):
        if not ULTRALYTICS_AVAILABLE:
            logger.warning("Using mock detection fallback because ultralytics is unavailable.")
            return

        try:
            logger.info(f"Loading YOLO model: {self.model_name}...")
            self.model = YOLO(self.model_name)
            logger.info(f"YOLO model {self.model_name} loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}. Fallback enabled.")
            self.model = None

    def update_confidence(self, conf: float):
        self.confidence_threshold = min(max(conf, 0.1), 0.95)

    def detect(self, frame: np.ndarray, persist_track: bool = True) -> List[RawDetection]:
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        if h == 0 or w == 0:
            return []

        detections: List[RawDetection] = []

        if self.model is None:
            # Fallback for testing environments without model weights
            return detections

        try:
            # Run YOLO track with ByteTrack/BoT-SORT if persist_track=True
            if persist_track:
                results = self.model.track(
                    frame,
                    conf=self.confidence_threshold,
                    iou=self.iou_threshold,
                    persist=True,
                    verbose=False,
                    tracker="bytetrack.yaml",
                )
            else:
                results = self.model.predict(
                    frame,
                    conf=self.confidence_threshold,
                    iou=self.iou_threshold,
                    verbose=False,
                )

            if not results or len(results) == 0:
                return detections

            result = results[0]
            boxes = result.boxes

            if boxes is None or len(boxes) == 0:
                return detections

            for i in range(len(boxes)):
                box = boxes[i]
                conf = float(box.conf[0].item()) if box.conf is not None else 0.0
                cls_id = int(box.cls[0].item()) if box.cls is not None else -1
                cls_name = result.names.get(cls_id, "unknown")

                # Filter target classes
                if settings.TARGET_CLASSES and cls_name not in settings.TARGET_CLASSES:
                    continue

                track_id = int(box.id[0].item()) if (box.id is not None and len(box.id) > 0) else None

                # Extract pixel coordinates
                xyxy = box.xyxy[0].cpu().numpy()
                px_x1, px_y1, px_x2, px_y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])

                # Normalize to 0.0 - 1.0 range
                norm_x1 = max(0.0, min(px_x1 / w, 1.0))
                norm_y1 = max(0.0, min(px_y1 / h, 1.0))
                norm_x2 = max(0.0, min(px_x2 / w, 1.0))
                norm_y2 = max(0.0, min(px_y2 / h, 1.0))

                bw = max(0.001, norm_x2 - norm_x1)
                bh = max(0.001, norm_y2 - norm_y1)
                cx = norm_x1 + bw / 2.0
                cy = norm_y1 + bh / 2.0
                area = bw * bh

                bbox_obj = BoundingBox(
                    x1=round(norm_x1, 4),
                    y1=round(norm_y1, 4),
                    x2=round(norm_x2, 4),
                    y2=round(norm_y2, 4),
                    width=round(bw, 4),
                    height=round(bh, 4),
                    center_x=round(cx, 4),
                    center_y=round(cy, 4),
                    area=round(area, 4),
                    px_x1=px_x1,
                    px_y1=px_y1,
                    px_x2=px_x2,
                    px_y2=px_y2,
                )

                detections.append(
                    RawDetection(
                        class_name=cls_name,
                        confidence=round(conf, 3),
                        bbox=bbox_obj,
                        track_id=track_id,
                    )
                )

        except Exception as e:
            logger.error(f"Inference error: {e}")

        return detections
