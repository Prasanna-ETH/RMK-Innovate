import time
from typing import List, Optional, Dict, Any, Tuple
import numpy as np

from app.models.schemas import (
    FramePerceptionResult,
    TrackedObject,
    AlertEvent,
    UserMode,
    CalibrationSettings,
    PassageAnalysis,
    RiskLevel,
    Point2D,
)
from app.core.detector import ObjectDetector, RawDetection
from app.core.tracker import ObjectTracker
from app.core.spatial import SpatialAnalyzer
from app.core.distance import MonocularHeuristicEstimator
from app.core.motion import MotionAnalyzer
from app.core.path_analysis import PathAnalyzer
from app.core.risk import RiskEngine
from app.core.alert_engine import AlertEngine
from app.config import settings
from app.utils.logging import logger


class PerceptionFusionPipeline:
    """Master perception pipeline orchestrating detection, tracking, spatial, distance, motion, path, risk, and alerts."""

    def __init__(self):
        self.detector = ObjectDetector()
        self.tracker = ObjectTracker()
        self.spatial = SpatialAnalyzer()
        self.distance = MonocularHeuristicEstimator()
        self.motion = MotionAnalyzer()
        self.path = PathAnalyzer()
        self.risk = RiskEngine()
        self.alert_engine = AlertEngine()

        self.frame_counter = 0
        self.last_frame_time = time.time()
        self.fps_smoothed = 0.0

    def update_calibration(self, calibration: CalibrationSettings):
        self.detector.update_confidence(calibration.detection_confidence)
        self.distance.camera_height_m = calibration.camera_height_m
        self.alert_engine.update_cooldown(calibration.alert_cooldown_sec)
        
        # Update corridor width based on calibration
        cw = calibration.corridor_width
        half_w = cw / 2.0
        self.path.update_corridor(0.50 - half_w, 0.50 + half_w)

    def process_frame(
        self,
        frame: Optional[np.ndarray],
        mode: UserMode = UserMode.DRIVER,
        calibration: Optional[CalibrationSettings] = None,
        injected_detections: Optional[List[RawDetection]] = None,
    ) -> FramePerceptionResult:
        start_time = time.time()
        self.frame_counter += 1

        if calibration:
            self.update_calibration(calibration)

        # 1. Object Detection
        if injected_detections is not None:
            raw_detections = injected_detections
        elif frame is not None:
            raw_detections = self.detector.detect(frame, persist_track=True)
        else:
            raw_detections = []

        # 2. Object Tracking
        active_tracks = self.tracker.update(raw_detections)
        active_ids = [t.track_id for t in active_tracks]

        # 3. Layered Spatial, Distance, Motion, Path & Risk Analysis per Object
        tracked_objects: List[TrackedObject] = []
        objects_for_passage: List[Tuple[Any, str]] = []

        for track in active_tracks:
            bbox = track.bbox
            center = track.center
            cls_name = track.class_name

            # Distance Estimation
            dist_est = self.distance.estimate_distance(bbox, cls_name)

            # Spatial Classification
            direction = self.spatial.classify_direction(center.x)
            spatial_zone = self.spatial.get_spatial_zone(center.x, dist_est.distance_m)

            # Temporal Motion Analysis
            motion_res = self.motion.update(track.track_id, center, bbox, start_time)

            # User Path Corridor Relationship
            path_res = self.path.analyze_object_path(bbox, motion_res)

            # Risk Assessment
            sensitivity = calibration.alert_sensitivity if calibration else 1.0
            risk_res = self.risk.assess_risk(
                class_name=cls_name,
                distance=dist_est,
                motion=motion_res,
                path=path_res,
                mode=mode,
                sensitivity_multiplier=sensitivity,
            )

            tracked_obj = TrackedObject(
                track_id=track.track_id,
                class_name=cls_name,
                confidence=track.confidence,
                bbox=bbox,
                center=center,
                direction=direction,
                spatial_zone=spatial_zone,
                distance=dist_est,
                motion=motion_res,
                path=path_res,
                risk=risk_res,
                history_centers=track.history_centers,
                frames_tracked=track.frames_tracked,
                first_seen_timestamp=track.first_seen,
                last_seen_timestamp=track.last_seen,
            )
            tracked_objects.append(tracked_obj)
            objects_for_passage.append((bbox, cls_name))

        # Prune dead track memories from motion and alert engines
        self.motion.prune(active_ids)
        self.alert_engine.prune(active_ids)

        # 4. Context-Aware Alert Evaluation
        active_alerts, primary_threat = self.alert_engine.evaluate_alerts(tracked_objects, mode=mode)

        # 5. Narrow Passage Analysis
        passage_analysis = self.path.analyze_passages(objects_for_passage)

        # 6. Overall Scene Risk Calculation
        if tracked_objects:
            overall_risk = max(obj.risk.score for obj in tracked_objects)
        else:
            overall_risk = 0.0

        if overall_risk >= settings.RISK_THRESHOLD_CRITICAL:
            overall_level = RiskLevel.CRITICAL
        elif overall_risk >= settings.RISK_THRESHOLD_HIGH:
            overall_level = RiskLevel.HIGH
        elif overall_risk >= settings.RISK_THRESHOLD_MEDIUM:
            overall_level = RiskLevel.MEDIUM
        else:
            overall_level = RiskLevel.LOW

        # FPS and Latency metrics
        now = time.time()
        latency_ms = (now - start_time) * 1000.0
        dt = now - self.last_frame_time
        self.last_frame_time = now
        instant_fps = 1.0 / max(dt, 0.001)
        self.fps_smoothed = 0.85 * self.fps_smoothed + 0.15 * instant_fps

        return FramePerceptionResult(
            frame_id=self.frame_counter,
            timestamp=now,
            mode=mode,
            objects=tracked_objects,
            active_alerts=active_alerts,
            primary_threat=primary_threat,
            passage_analysis=passage_analysis,
            overall_risk_score=round(overall_risk, 1),
            overall_risk_level=overall_level,
            fps=round(self.fps_smoothed, 1),
            latency_ms=round(latency_ms, 1),
            corridor_bounds={
                "left": self.path.corridor_left,
                "right": self.path.corridor_right,
                "top": self.path.corridor_top,
                "bottom": self.path.corridor_bottom,
            },
        )
