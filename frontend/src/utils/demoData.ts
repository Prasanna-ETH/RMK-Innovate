import type { FramePerceptionResult, TrackedObject, AlertEvent, UserMode } from '../types/perception';

export function createScenario1Frame(progress: number, mode: UserMode): FramePerceptionResult {
  const normX = 0.05 + progress * 0.45;
  const normY = 0.45 + progress * 0.25;
  const width = 0.12 + progress * 0.16;
  const height = 0.22 + progress * 0.32;
  const dist = Math.max(1.2, Number((4.5 - progress * 3.1).toFixed(1)));
  const area = width * height;
  const isEntering = normX + width > 0.30;
  const riskScore = Math.min(92, Math.round(35 + progress * 55));
  const isCritical = riskScore >= 75;

  const cyclist: TrackedObject = {
    track_id: 101,
    class_name: 'bicycle',
    confidence: 0.94,
    bbox: {
      x1: normX,
      y1: normY,
      x2: normX + width,
      y2: normY + height,
      width,
      height,
      center_x: normX + width / 2,
      center_y: normY + height / 2,
      area,
    },
    center: { x: normX + width / 2, y: normY + height / 2 },
    direction: normX + width / 2 < 0.33 ? 'LEFT' : 'CENTER',
    spatial_zone: dist <= 3.0 ? 'LEFT_CLOSE' : 'LEFT_FAR',
    distance: {
      distance_m: dist,
      confidence: 0.88,
      source: 'monocular_heuristic',
      is_approximate: true,
    },
    motion: {
      state: 'APPROACHING',
      velocity_x: 0.18,
      velocity_y: 0.12,
      area_growth_rate: 0.42,
      is_approaching: true,
      is_moving: true,
      movement_direction: 'RIGHT',
    },
    path: {
      relationship: isEntering ? 'ENTERING_PATH' : 'NEAR_PATH',
      distance_to_corridor: isEntering ? 0.0 : Math.max(0, 0.30 - (normX + width)),
      is_intersecting: true,
      time_to_corridor_sec: isEntering ? 0.0 : 0.8,
    },
    risk: {
      score: riskScore,
      level: isCritical ? 'CRITICAL' : 'HIGH',
      distance_risk: Math.round(85 - dist * 10),
      approach_risk: 88,
      path_risk: isEntering ? 85 : 55,
      object_risk: 90,
      motion_risk: 75,
      explanation: `rapid approach from left (${dist}m), corridor encroachment`,
    },
    history_centers: [
      { x: 0.08, y: 0.46 },
      { x: 0.14, y: 0.50 },
      { x: 0.22, y: 0.56 },
      { x: normX + width / 2, y: normY + height / 2 },
    ],
    frames_tracked: Math.round(10 + progress * 30),
    first_seen_timestamp: Date.now() - 2500,
    last_seen_timestamp: Date.now(),
  };

  const message =
    mode === 'driver'
      ? `Caution! Cyclist entering your path from the left.`
      : mode === 'wheelchair'
      ? `Cyclist approaching and entering your path.`
      : `Cyclist approaching from your left, ${dist} meters.`;

  const alert: AlertEvent = {
    alert_id: 'alt-demo-1',
    timestamp: Date.now(),
    severity: isCritical ? 'CRITICAL' : 'HIGH',
    message,
    direction: 'LEFT',
    haptic_pattern: isCritical ? 'RAPID_ALERT' : 'LEFT_PULSE',
    priority: isCritical ? 9 : 8,
    track_id: 101,
    object_class: 'bicycle',
    risk_score: riskScore,
  };

  return {
    frame_id: Math.round(progress * 100),
    timestamp: Date.now(),
    mode,
    objects: [cyclist],
    active_alerts: [alert],
    primary_threat: cyclist,
    overall_risk_score: riskScore,
    overall_risk_level: isCritical ? 'CRITICAL' : 'HIGH',
    fps: 15.2,
    latency_ms: 18.5,
    corridor_bounds: { left: 0.30, right: 0.70, top: 0.25, bottom: 1.0 },
  };
}

export function createScenario2Frame(mode: UserMode): FramePerceptionResult {
  const obstacle: TrackedObject = {
    track_id: 202,
    class_name: 'chair',
    confidence: 0.91,
    bbox: {
      x1: 0.38,
      y1: 0.52,
      x2: 0.62,
      y2: 0.88,
      width: 0.24,
      height: 0.36,
      center_x: 0.50,
      center_y: 0.70,
      area: 0.0864,
    },
    center: { x: 0.50, y: 0.70 },
    direction: 'CENTER',
    spatial_zone: 'CENTER_CLOSE',
    distance: {
      distance_m: 1.6,
      confidence: 0.92,
      source: 'monocular_heuristic',
      is_approximate: true,
    },
    motion: {
      state: 'STATIONARY',
      velocity_x: 0.0,
      velocity_y: 0.0,
      area_growth_rate: 0.0,
      is_approaching: false,
      is_moving: false,
      movement_direction: null,
    },
    path: {
      relationship: 'BLOCKING_PATH',
      distance_to_corridor: 0.0,
      is_intersecting: true,
    },
    risk: {
      score: 76.0,
      level: 'HIGH',
      distance_risk: 86.0,
      approach_risk: 15.0,
      path_risk: 100.0,
      object_risk: 85.0,
      motion_risk: 10.0,
      explanation: 'obstacle centered directly in user travel corridor (1.6m)',
    },
    history_centers: [{ x: 0.50, y: 0.70 }],
    frames_tracked: 45,
    first_seen_timestamp: Date.now() - 4000,
    last_seen_timestamp: Date.now(),
  };

  const message =
    mode === 'driver'
      ? 'Obstacle ahead in your lane.'
      : mode === 'wheelchair'
      ? 'Obstacle ahead. Path blocked.'
      : 'Obstacle directly ahead, 1.6 meters.';

  const alert: AlertEvent = {
    alert_id: 'alt-demo-2',
    timestamp: Date.now(),
    severity: 'HIGH',
    message,
    direction: 'CENTER',
    haptic_pattern: 'CENTER_PULSE',
    priority: 8,
    track_id: 202,
    object_class: 'chair',
    risk_score: 76.0,
  };

  return {
    frame_id: 120,
    timestamp: Date.now(),
    mode,
    objects: [obstacle],
    active_alerts: [alert],
    primary_threat: obstacle,
    overall_risk_score: 76.0,
    overall_risk_level: 'HIGH',
    fps: 15.0,
    latency_ms: 16.0,
    corridor_bounds: { left: 0.30, right: 0.70, top: 0.25, bottom: 1.0 },
  };
}

export function createScenario3Frame(mode: UserMode): FramePerceptionResult {
  const leftBox: TrackedObject = {
    track_id: 301,
    class_name: 'suitcase',
    confidence: 0.89,
    bbox: {
      x1: 0.18,
      y1: 0.50,
      x2: 0.38,
      y2: 0.84,
      width: 0.20,
      height: 0.34,
      center_x: 0.28,
      center_y: 0.67,
      area: 0.068,
    },
    center: { x: 0.28, y: 0.67 },
    direction: 'LEFT',
    spatial_zone: 'LEFT_CLOSE',
    distance: { distance_m: 2.1, confidence: 0.85, source: 'monocular_heuristic', is_approximate: true },
    motion: { state: 'STATIONARY', velocity_x: 0, velocity_y: 0, area_growth_rate: 0, is_approaching: false, is_moving: false },
    path: { relationship: 'NEAR_PATH', distance_to_corridor: 0.08, is_intersecting: false },
    risk: { score: 48.0, level: 'MEDIUM', distance_risk: 70, approach_risk: 15, path_risk: 45, object_risk: 75, motion_risk: 10, explanation: 'flanking obstacle left' },
    history_centers: [{ x: 0.28, y: 0.67 }],
    frames_tracked: 35,
    first_seen_timestamp: Date.now() - 3000,
    last_seen_timestamp: Date.now(),
  };

  const rightBox: TrackedObject = {
    track_id: 302,
    class_name: 'dining table',
    confidence: 0.87,
    bbox: {
      x1: 0.62,
      y1: 0.48,
      x2: 0.84,
      y2: 0.85,
      width: 0.22,
      height: 0.37,
      center_x: 0.73,
      center_y: 0.66,
      area: 0.0814,
    },
    center: { x: 0.73, y: 0.66 },
    direction: 'RIGHT',
    spatial_zone: 'RIGHT_CLOSE',
    distance: { distance_m: 2.3, confidence: 0.84, source: 'monocular_heuristic', is_approximate: true },
    motion: { state: 'STATIONARY', velocity_x: 0, velocity_y: 0, area_growth_rate: 0, is_approaching: false, is_moving: false },
    path: { relationship: 'NEAR_PATH', distance_to_corridor: 0.08, is_intersecting: false },
    risk: { score: 52.0, level: 'HIGH', distance_risk: 68, approach_risk: 15, path_risk: 45, object_risk: 80, motion_risk: 10, explanation: 'flanking obstacle right' },
    history_centers: [{ x: 0.73, y: 0.66 }],
    frames_tracked: 35,
    first_seen_timestamp: Date.now() - 3000,
    last_seen_timestamp: Date.now(),
  };

  const message =
    mode === 'wheelchair'
      ? 'Narrow passage ahead. Estimated clearance ~0.9 meters.'
      : 'Caution: Narrow clearance between obstacles ahead.';

  const alert: AlertEvent = {
    alert_id: 'alt-demo-3',
    timestamp: Date.now(),
    severity: 'MEDIUM',
    message,
    direction: 'CENTER',
    haptic_pattern: 'DOUBLE_PULSE',
    priority: 6,
    track_id: 301,
    object_class: 'passage',
    risk_score: 52.0,
  };

  return {
    frame_id: 150,
    timestamp: Date.now(),
    mode,
    objects: [leftBox, rightBox],
    active_alerts: [alert],
    primary_threat: rightBox,
    passage_analysis: {
      is_passage_constrained: true,
      passage_width_estimate_m: 0.9,
      message: 'Narrow passage ahead (~0.9m clearance)',
    },
    overall_risk_score: 52.0,
    overall_risk_level: 'HIGH',
    fps: 15.0,
    latency_ms: 17.2,
    corridor_bounds: { left: 0.30, right: 0.70, top: 0.25, bottom: 1.0 },
  };
}
