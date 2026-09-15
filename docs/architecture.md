# BlindSpot — System Architecture & Algorithmic Blueprint

BlindSpot transforms monocular camera streams into actionable spatial risk intelligence for mobility safety.

---

## 1. Perception Pipeline Flowchart

```
┌──────────────┐
│ Camera Input │ (Webcam / Video / Offscreen Frame Buffer)
└──────┬───────┘
       │  RGB Matrix
       ▼
┌──────────────────┐
│ YOLOv8 Detector  │ (Lightweight object classification + normalized bbox: x1, y1, x2, y2)
└──────┬───────────┘
       │  Raw Detections
       ▼
┌──────────────────┐
│ Object Tracker   │ (ByteTrack / IoU + Centroid temporal association)
└──────┬───────────┘
       │  Tracked Entities (track_id, trajectory history)
       ▼
┌──────────────────────────────────────────────────────────┐
│ Spatial & Physical Geometry Reasoning Layer              │
│                                                          │
│  ├─ Spatial Analyzer     (LEFT, CENTER, RIGHT x CLOSE, FAR)
│  ├─ Distance Estimator   (Physical height prior + ground plane heuristics)
│  ├─ Motion Dynamics      (Velocity vectors vx, vy + bbox area growth rate)
│  └─ User Path Corridor   (Forward virtual corridor intersection)
└──────┬───────────────────────────────────────────────────┘
       │  Structured Spatial & Motion State
       ▼
┌──────────────────┐
│ Risk Fusion      │ (Transparent multi-factor score: 0–100, mode-dependent weights)
└──────┬───────────┘
       │  Risk Assessment (Score, Level: LOW/MEDIUM/HIGH/CRITICAL)
       ▼
┌──────────────────┐
│ Context Alerts   │ (Debounce cooldown, deduplication, deterministic mode phrasing)
└──────┬───────────┘
       │  WebSocket JSON Stream
       ▼
┌──────────────────────────────────────────────────────────┐
│ User Interaction & Multi-Modal Feedback                  │
│                                                          │
│  ├─ Visual Canvas HUD    (Risk bounding boxes, path corridor, trajectory trails)
│  ├─ Spatial 2.5D Radar   (Top-down bird's-eye object map)
│  ├─ Web Speech Audio TTS (Debounced directional voice warnings)
│  └─ Haptic Simulator     (3-motor Left/Center/Right directional pulses)
└──────────────────────────────────────────────────────────┘
```

---

## 2. Mathematical & Algorithmic Formulations

### A. Approximate Monocular Distance Estimation
For a camera with normalized focal length $f_{\text{norm}}$ and an object of known physical class prior height $H_{\text{real}}$ appearing with normalized bounding box height $h_{\text{norm}}$:
$$d_{\text{height}} = \frac{f_{\text{norm}} \cdot H_{\text{real}}}{\max(h_{\text{norm}}, 0.02)}$$

Combined with ground-plane contact estimation where $y_2$ is the bottom edge coordinate:
$$d_{\text{ground}} = \frac{h_{\text{cam}} \cdot 1.5}{\max(1.0 - y_2, 0.05)}$$

Final blended distance:
$$d = 0.70 \cdot d_{\text{height}} + 0.30 \cdot d_{\text{ground}}$$

---

### B. Temporal Motion & Approach State
Given consecutive observations $(x_t, y_t, A_t)$ and $(x_{t-\Delta t}, y_{t-\Delta t}, A_{t-\Delta t})$:
$$\mathbf{v} = \left(\frac{x_t - x_{t-\Delta t}}{\Delta t}, \frac{y_t - y_{t-\Delta t}}{\Delta t}\right)$$

Bounding box area expansion rate $\gamma$:
$$\gamma = \frac{A_t - A_{t-\Delta t}}{A_{t-\Delta t} \cdot \Delta t}$$

* If $\gamma > 0.10 \text{ s}^{-1}$ or ($v_y > 0.08$ and $y_2 > 0.5$): $\text{State} \leftarrow \text{APPROACHING}$
* If $\gamma < -0.10 \text{ s}^{-1}$: $\text{State} \leftarrow \text{MOVING\_AWAY}$
* If $|v_x| > 0.06$: $\text{State} \leftarrow \text{CROSSING\_RIGHT (if } v_x > 0) \text{ or CROSSING\_LEFT}$

---

### C. Multi-Factor Risk Scoring
The composite risk score $R \in [0, 100]$ is computed as:
$$R = \min\left(100, S \cdot \left( w_d R_d + w_a R_a + w_p R_p + w_o R_o + w_m R_m \right)\right)$$

Where:
* $R_d$: Distance proximity risk (exponential decay with distance)
* $R_a$: Approach velocity risk
* $R_p$: Path encroachment risk ($\text{BLOCKING}=100, \text{INSIDE}=85, \text{ENTERING}=80, \text{NEAR}=45, \text{OUTSIDE}=10$)
* $R_o$: Object class vulnerability/hazard score
* $R_m$: Motion vector magnitude risk
* $S$: User calibration sensitivity multiplier (default $1.0\times$)
* $\mathbf{w}$: Mode-specific weighting vector (Driver vs Wheelchair vs Visual Assistance).
