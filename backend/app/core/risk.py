from typing import Dict
from app.models.schemas import (
    UserMode,
    RiskLevel,
    RiskAssessment,
    DistanceEstimate,
    MotionAnalysisResult,
    PathAnalysisResult,
    PathRelationshipEnum,
    MotionStateEnum,
)
from app.config import settings


class RiskEngine:
    """Calculates transparent, multi-factor normalized risk scores (0-100) tailored to user mobility mode."""

    # Base intrinsic object hazard scores per class
    OBJECT_HAZARD_SCORES: Dict[str, Dict[str, float]] = {
        "driver": {
            "person": 95.0,
            "bicycle": 90.0,
            "motorcycle": 90.0,
            "car": 80.0,
            "truck": 85.0,
            "bus": 85.0,
            "dog": 65.0,
            "cat": 50.0,
            "chair": 30.0,
            "couch": 30.0,
            "dining table": 30.0,
            "backpack": 25.0,
            "suitcase": 35.0,
            "default": 40.0,
        },
        "wheelchair": {
            "chair": 85.0,
            "couch": 80.0,
            "dining table": 85.0,
            "bed": 80.0,
            "suitcase": 75.0,
            "backpack": 70.0,
            "box": 80.0,
            "person": 80.0,
            "bicycle": 90.0,
            "motorcycle": 90.0,
            "car": 95.0,
            "dog": 70.0,
            "potted plant": 70.0,
            "default": 65.0,
        },
        "visual_assistance": {
            "person": 85.0,
            "bicycle": 90.0,
            "motorcycle": 95.0,
            "car": 95.0,
            "truck": 95.0,
            "bus": 95.0,
            "chair": 80.0,
            "couch": 75.0,
            "dining table": 80.0,
            "dog": 70.0,
            "backpack": 65.0,
            "suitcase": 75.0,
            "potted plant": 70.0,
            "default": 60.0,
        },
    }

    def __init__(self):
        self.weights_by_mode = {
            UserMode.DRIVER: settings.RISK_WEIGHTS_DRIVER,
            UserMode.WHEELCHAIR: settings.RISK_WEIGHTS_WHEELCHAIR,
            UserMode.VISUAL_ASSISTANCE: settings.RISK_WEIGHTS_VISUAL_ASSISTANCE,
        }

    def calculate_distance_risk(self, distance_m: float) -> float:
        """Closer objects have sharply exponentially higher risk."""
        if distance_m <= 1.0:
            return 98.0
        elif distance_m <= 2.0:
            return 85.0 - (distance_m - 1.0) * 15.0  # 85 to 70
        elif distance_m <= 4.0:
            return 70.0 - (distance_m - 2.0) * 17.5  # 70 to 35
        elif distance_m <= 8.0:
            return 35.0 - (distance_m - 4.0) * 5.0   # 35 to 15
        else:
            return max(5.0, 15.0 - (distance_m - 8.0) * 1.5)

    def calculate_approach_risk(self, motion: MotionAnalysisResult) -> float:
        """Approaching objects represent imminent collision threat."""
        if motion.is_approaching:
            growth_factor = min(motion.area_growth_rate * 80.0, 45.0)
            return min(55.0 + max(0.0, growth_factor), 100.0)
        elif motion.state in [MotionStateEnum.CROSSING_LEFT, MotionStateEnum.CROSSING_RIGHT]:
            return 45.0
        elif motion.state == MotionStateEnum.MOVING_AWAY:
            return 10.0
        else:
            return 20.0 if motion.is_moving else 15.0

    def calculate_path_risk(self, path: PathAnalysisResult) -> float:
        """Objects intersecting or entering user's corridor have the highest path risk."""
        mapping = {
            PathRelationshipEnum.BLOCKING_PATH: 100.0,
            PathRelationshipEnum.INSIDE_PATH: 85.0,
            PathRelationshipEnum.ENTERING_PATH: 80.0,
            PathRelationshipEnum.NEAR_PATH: 45.0,
            PathRelationshipEnum.OUTSIDE_PATH: 10.0,
        }
        return mapping.get(path.relationship, 15.0)

    def calculate_object_risk(self, class_name: str, mode: UserMode) -> float:
        mode_str = mode.value
        table = self.OBJECT_HAZARD_SCORES.get(mode_str, self.OBJECT_HAZARD_SCORES["driver"])
        return table.get(class_name.lower(), table.get("default", 50.0))

    def calculate_motion_risk(self, motion: MotionAnalysisResult) -> float:
        speed = (motion.velocity_x**2 + motion.velocity_y**2) ** 0.5
        return min(speed * 120.0 + (30.0 if motion.is_moving else 0.0), 100.0)

    def assess_risk(
        self,
        class_name: str,
        distance: DistanceEstimate,
        motion: MotionAnalysisResult,
        path: PathAnalysisResult,
        mode: UserMode = UserMode.DRIVER,
        sensitivity_multiplier: float = 1.0,
    ) -> RiskAssessment:
        d_risk = self.calculate_distance_risk(distance.distance_m)
        a_risk = self.calculate_approach_risk(motion)
        p_risk = self.calculate_path_risk(path)
        o_risk = self.calculate_object_risk(class_name, mode)
        m_risk = self.calculate_motion_risk(motion)

        weights = self.weights_by_mode.get(mode, settings.RISK_WEIGHTS_DRIVER)

        raw_score = (
            weights["distance"] * d_risk
            + weights["approach"] * a_risk
            + weights["path"] * p_risk
            + weights["object_type"] * o_risk
            + weights["motion"] * m_risk
        )

        # Scale by user calibration sensitivity
        final_score = min(max(raw_score * sensitivity_multiplier, 0.0), 100.0)
        final_score = round(final_score, 1)

        # Classify severity level
        if final_score >= settings.RISK_THRESHOLD_CRITICAL:
            level = RiskLevel.CRITICAL
        elif final_score >= settings.RISK_THRESHOLD_HIGH:
            level = RiskLevel.HIGH
        elif final_score >= settings.RISK_THRESHOLD_MEDIUM:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        # Generate contextual rationale explanation
        reasons = []
        if path.is_intersecting:
            reasons.append("path intersection")
        if motion.is_approaching:
            reasons.append("rapid approach")
        if distance.distance_m <= 2.5:
            reasons.append(f"close proximity ({distance.distance_m}m)")
        explanation = ", ".join(reasons) if reasons else "nominal tracking"

        return RiskAssessment(
            score=final_score,
            level=level,
            distance_risk=round(d_risk, 1),
            approach_risk=round(a_risk, 1),
            path_risk=round(p_risk, 1),
            object_risk=round(o_risk, 1),
            motion_risk=round(m_risk, 1),
            explanation=explanation,
        )
