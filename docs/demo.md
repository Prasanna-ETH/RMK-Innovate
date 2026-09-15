# BlindSpot — Hackathon Presentation & Demonstration Playbook

This guide contains the step-by-step presentation script and live demonstration scenarios for presenting **BlindSpot** to hackathon judges at RMK Innovate.

---

## 1. 30-Second Elevator Pitch

> *"Most computer vision projects stop at simply detecting objects: 'Person detected', 'Car detected'. But in the real world, knowing WHAT is there without knowing WHERE it is, HOW it is moving, and WHETHER it creates a hazard is useless.*
>
> *BlindSpot is an intelligent spatial awareness engine that converts raw camera perception into: **OBJECT → POSITION → DISTANCE → MOVEMENT → PATH RELATIONSHIP → RISK → ACTIONABLE WARNING**.*
>
> *It acts as an intelligent second pair of eyes with multi-modal voice guidance and 3-channel wearable haptic cues tailored for Drivers, Wheelchair users, and Visual Assistance."*

---

## 2. Core Demo Scenarios

### Demo Scenario 1 — Cyclist Approaching from Left
1. Click **"Demo 1: Cyclist Left"** in the controls panel.
2. **Observe**:
   * **Live Perception HUD**: A cyclist bounding box enters from the left ($x=0.05 \rightarrow 0.45$), growing in size with a trajectory trail.
   * **Spatial Radar**: The 🚲 icon moves from the `LEFT` sector into the `CENTER` path corridor.
   * **Risk Gauge**: Escalates smoothly from $35 \rightarrow 88$ (`HIGH` $\rightarrow$ `CRITICAL`).
   * **Voice Guidance**: Announces *"Caution! Cyclist entering your path from the left."*
   * **Haptic Simulator**: The **LEFT MOTOR** pulses vividly.
   * **Timeline**: Shows chronological progression: `Detection` $\rightarrow$ `Approach Dynamics` $\rightarrow$ `Path Encroachment` $\rightarrow$ `CRITICAL ALERT`.

---

### Demo Scenario 2 — Obstacle Centered Ahead (Blocking Path)
1. Click **"Demo 2: Obstacle Ahead"** in the controls panel.
2. **Observe**:
   * **Live Perception HUD**: Centered bounding box labeled `CHAIR ~1.6m` inside the cyan travel corridor.
   * **Spatial Radar**: 🪑 icon centered at 1.6m distance ring.
   * **Risk Gauge**: Shows High Risk (Score ~76) with 100% Path Encroachment factor.
   * **Voice Guidance**: Announces *"Obstacle ahead. Path blocked."*
   * **Haptic Simulator**: The **CENTER MOTOR** pulses steadily.

---

### Demo Scenario 3 — Narrow Clearance Passage
1. Click **"Demo 3: Narrow Passage"** in the controls panel.
2. **Observe**:
   * **Situation Intelligence**: Displays banner badge `Narrow passage ahead (~0.9m clearance)`.
   * **Spatial Radar**: Displays two flanking obstacle markers on the left and right borders of the travel corridor.
   * **Voice Guidance**: Announces *"Narrow passage ahead. Estimated clearance ~0.9 meters."*
   * **Haptic Simulator**: Triggers **DOUBLE PULSE** on both Left and Right motors.

---

### Demo Scenario 4 — Mode Differentiation
1. With an active scenario running, toggle between:
   * **[ DRIVER ]**: Generates *"Caution! Pedestrian approaching from your left."*
   * **[ WHEELCHAIR ]**: Generates *"Person crossing your path."*
   * **[ VISUAL ASSISTANCE ]**: Generates *"Person approaching from your left, 1.8 meters."*
2. **Key Takeaway**: The underlying perception pipeline is unified, while the spatial risk policy and warning phrasing adapt contextually to the user's mobility profile.

---

### Demo Scenario 5 — Live Laptop Webcam
1. Click **"Live Webcam"** and click **"Start Feed"**.
2. Hold up an object (e.g. phone, water bottle, backpack) or move your hand/body in front of the camera.
3. Show that real YOLOv8 inference runs locally at 12–15 FPS, tracks the item, measures distance, and updates the spatial radar in real time!
