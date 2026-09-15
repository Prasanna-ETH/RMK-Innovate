from typing import List, Dict, Optional, Tuple
import time
from app.models.schemas import BoundingBox, Point2D
from app.core.detector import RawDetection


class ActiveTrack:
    def __init__(self, track_id: int, class_name: str, bbox: BoundingBox, confidence: float):
        self.track_id = track_id
        self.class_name = class_name
        self.bbox = bbox
        self.confidence = confidence
        self.center = Point2D(x=bbox.center_x, y=bbox.center_y)
        self.history_centers: List[Point2D] = [self.center]
        self.frames_tracked = 1
        self.time_since_update = 0
        self.first_seen = time.time()
        self.last_seen = time.time()

    def update(self, bbox: BoundingBox, confidence: float):
        self.bbox = bbox
        self.confidence = confidence
        self.center = Point2D(x=bbox.center_x, y=bbox.center_y)
        self.history_centers.append(self.center)
        if len(self.history_centers) > 30:
            self.history_centers.pop(0)
        self.frames_tracked += 1
        self.time_since_update = 0
        self.last_seen = time.time()


class ObjectTracker:
    """Manages persistent track states across frames with centroid and IoU association."""

    def __init__(self, max_disappeared_frames: int = 15, iou_match_threshold: float = 0.25):
        self.max_disappeared_frames = max_disappeared_frames
        self.iou_match_threshold = iou_match_threshold
        self.next_track_id = 1
        self.tracks: Dict[int, ActiveTrack] = {}

    def _compute_iou(self, boxA: BoundingBox, boxB: BoundingBox) -> float:
        xA = max(boxA.x1, boxB.x1)
        yA = max(boxA.y1, boxB.y1)
        xB = min(boxA.x2, boxB.x2)
        yB = min(boxA.y2, boxB.y2)

        interArea = max(0.0, xB - xA) * max(0.0, yB - yA)
        if interArea <= 0:
            return 0.0

        boxAArea = boxA.area
        boxBArea = boxB.area
        iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
        return iou

    def update(self, raw_detections: List[RawDetection]) -> List[ActiveTrack]:
        # Increment time_since_update for existing tracks
        for track in self.tracks.values():
            track.time_since_update += 1

        unmatched_detections = list(raw_detections)
        
        # 1. If YOLO provided track_ids, use them directly
        direct_matched_ids = set()
        remaining_detections = []
        for det in unmatched_detections:
            if det.track_id is not None:
                tid = det.track_id
                if tid in self.tracks:
                    self.tracks[tid].update(det.bbox, det.confidence)
                else:
                    self.tracks[tid] = ActiveTrack(tid, det.class_name, det.bbox, det.confidence)
                direct_matched_ids.add(tid)
            else:
                remaining_detections.append(det)

        # 2. Match remaining detections using IoU / Center distance with unmatched existing tracks
        available_track_ids = [
            tid for tid, track in self.tracks.items()
            if tid not in direct_matched_ids and track.time_since_update <= self.max_disappeared_frames
        ]

        for det in remaining_detections:
            best_match_id = None
            best_iou = 0.0

            for tid in available_track_ids:
                track = self.tracks[tid]
                if track.class_name == det.class_name:
                    iou = self._compute_iou(track.bbox, det.bbox)
                    if iou > best_iou and iou >= self.iou_match_threshold:
                        best_iou = iou
                        best_match_id = tid

            if best_match_id is not None:
                self.tracks[best_match_id].update(det.bbox, det.confidence)
                available_track_ids.remove(best_match_id)
            else:
                # Create a new track
                new_id = self.next_track_id
                self.next_track_id += 1
                self.tracks[new_id] = ActiveTrack(new_id, det.class_name, det.bbox, det.confidence)

        # Prune old tracks
        dead_ids = [
            tid for tid, track in self.tracks.items()
            if track.time_since_update > self.max_disappeared_frames
        ]
        for tid in dead_ids:
            del self.tracks[tid]

        # Return currently active tracks that were updated this frame or recently
        active_list = [track for track in self.tracks.values() if track.time_since_update == 0]
        return active_list
