export type UserMode = 'driver' | 'wheelchair' | 'visual_assistance';

export type SpatialDirection = 'LEFT' | 'CENTER' | 'RIGHT';

export type SpatialDepth = 'CLOSE' | 'MID' | 'FAR';

export type SpatialZone =
  | 'LEFT_CLOSE'
  | 'LEFT_FAR'
  | 'CENTER_CLOSE'
  | 'CENTER_FAR'
  | 'RIGHT_CLOSE'
  | 'RIGHT_FAR';

export type MotionStateEnum =
  | 'STATIONARY'
  | 'MOVING'
  | 'APPROACHING'
  | 'MOVING_AWAY'
  | 'CROSSING_LEFT'
  | 'CROSSING_RIGHT'
  | 'ENTERING_PATH'
  | 'LEAVING_PATH';

export type PathRelationshipEnum =
  | 'OUTSIDE_PATH'
  | 'NEAR_PATH'
  | 'ENTERING_PATH'
  | 'INSIDE_PATH'
  | 'BLOCKING_PATH';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HapticPattern =
  | 'NONE'
  | 'LEFT_PULSE'
  | 'CENTER_PULSE'
  | 'RIGHT_PULSE'
  | 'DOUBLE_PULSE'
  | 'RAPID_ALERT';

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  center_x: number;
  center_y: number;
  area: number;
  px_x1?: number;
  px_y1?: number;
  px_x2?: number;
  px_y2?: number;
}

export interface DistanceEstimate {
  distance_m: number;
  confidence: number;
  source: string;
  is_approximate: boolean;
}

export interface MotionAnalysisResult {
  state: MotionStateEnum;
  velocity_x: number;
  velocity_y: number;
  area_growth_rate: number;
  is_approaching: boolean;
  is_moving: boolean;
  movement_direction?: SpatialDirection | null;
}

export interface PathAnalysisResult {
  relationship: PathRelationshipEnum;
  distance_to_corridor: number;
  is_intersecting: boolean;
  time_to_corridor_sec?: number | null;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  distance_risk: number;
  approach_risk: number;
  path_risk: number;
  object_risk: number;
  motion_risk: number;
  explanation: string;
}

export interface TrackedObject {
  track_id: number;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
  center: Point2D;
  direction: SpatialDirection;
  spatial_zone: SpatialZone;
  distance: DistanceEstimate;
  motion: MotionAnalysisResult;
  path: PathAnalysisResult;
  risk: RiskAssessment;
  history_centers: Point2D[];
  frames_tracked: number;
  first_seen_timestamp: number;
  last_seen_timestamp: number;
}

export interface AlertEvent {
  alert_id: string;
  timestamp: number;
  severity: RiskLevel;
  message: string;
  direction: SpatialDirection;
  haptic_pattern: HapticPattern;
  priority: number;
  track_id?: number | null;
  object_class?: string | null;
  risk_score: number;
}

export interface PassageAnalysis {
  is_passage_constrained: boolean;
  passage_width_estimate_m?: number | null;
  message?: string | null;
}

export interface FramePerceptionResult {
  frame_id: number;
  timestamp: number;
  mode: UserMode;
  objects: TrackedObject[];
  active_alerts: AlertEvent[];
  primary_threat?: TrackedObject | null;
  passage_analysis?: PassageAnalysis | null;
  overall_risk_score: number;
  overall_risk_level: RiskLevel;
  fps: number;
  latency_ms: number;
  corridor_bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface SystemStatus {
  camera_connected: boolean;
  detector_status: string;
  tracker_status: string;
  spatial_engine_status: string;
  risk_engine_status: string;
  audio_status: string;
  haptic_status: string;
  fps: number;
  latency_ms: number;
  active_mode: UserMode;
}

export interface CalibrationSettings {
  detection_confidence: number;
  camera_height_m: number;
  alert_sensitivity: number;
  corridor_width: number;
  alert_cooldown_sec: number;
  audio_enabled: boolean;
  haptic_simulation_enabled: boolean;
}
