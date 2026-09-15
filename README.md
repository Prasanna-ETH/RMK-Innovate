# BlindSpot — Intelligent Spatial Awareness for Safer Mobility

> **Hackathon Prototype for RMK Innovate**  
> *"Your surroundings, understood."*  
> **Concept**: `SEE → UNDERSTAND → PREDICT → WARN`

---

## 1. The Problem

Standard computer-vision implementations stop at basic bounding boxes and label output: *"Person detected"*, *"Car detected"*.

In real-world mobility safety (for drivers in blind spots, wheelchair users navigating obstacles, or visually impaired pedestrians), **knowing what an object is without knowing where it is, how it is moving, and whether it creates a collision threat is insufficient.**

---

## 2. The Solution

**BlindSpot** is an AI-powered spatial-awareness and risk prediction engine that converts real-time camera perception into actionable mobility warnings:

$$\text{OBJECT} \rightarrow \text{POSITION} \rightarrow \text{DISTANCE} \rightarrow \text{MOVEMENT} \rightarrow \text{PATH RELATIONSHIP} \rightarrow \text{RISK} \rightarrow \text{ACTIONABLE WARNING}$$

It acts as an intelligent **"second pair of eyes"**, combining:
* **Object Detection & Tracking**: Lightweight real-time YOLOv8 + temporal tracking.
* **Spatial & Depth Geometry**: 3 horizontal sectors (Left / Center / Right) + calibrated metric distance estimation.
* **Temporal Motion Dynamics**: Approach velocity, area expansion rate, and lateral trajectory vectors.
* **Forward Travel Corridor**: Virtual path corridor encroachment and narrow clearance passage detection.
* **Multi-Factor Risk Fusion**: 0–100 composite risk scoring with mode-tailored weights.
* **Context-Aware Debounced Alerts**: Directional Web Speech voice guidance + 3-motor wearable haptic simulation.

---

## 3. System Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Camera Input │ ──> │ YOLOv8 Detection │ ──> │ Object Tracking  │
└──────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                     ┌─────────────────────────────────┴─────────────────────────────────┐
                     ▼                                 ▼                                 ▼
             ┌───────────────┐                 ┌───────────────┐                 ┌───────────────┐
             │ Spatial Zone  │                 │ Distance Est. │                 │ Motion & Path │
             └───────┬───────┘                 └───────┬───────┘                 └───────┬───────┘
                     └─────────────────────────────────┼─────────────────────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Risk Fusion Engine  │ (0–100 Normalized Score)
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Alert Engine & Mem  │ (Debounced & Mode Phrased)
                                            └──────────┬──────────┘
                                                       │  WebSocket Stream
                                                       ▼
                                            ┌─────────────────────┐
                                            │ React 19 Dashboard  │ (HUD + Radar + TTS + Haptics)
                                            └─────────────────────┘
```

---

## 4. Three Mobility Modes

| User Mode | Target Mobility Context | Prioritized Threat Classes | Contextual Warning Example |
| :--- | :--- | :--- | :--- |
| **DRIVER** | Vehicle blind spots & pedestrian crosswalk safety | Fast vehicles, motorcycles, cyclists, pedestrians | *"Caution! Pedestrian approaching rapidly from your left."* |
| **WHEELCHAIR** | Accessibility navigation & path clearance | Ground obstacles, narrow passages, crossing pedestrians | *"Obstacle ahead. Path blocked."* / *"Narrow passage ahead (~0.9m clearance)"* |
| **VISUAL ASSISTANCE** | High-clarity pedestrian guidance | Approaching actors, head-on obstacles, trip hazards | *"Person approaching from your left, 1.8 meters."* |

---

## 5. Technology Stack

### Backend
* **Python 3.12** managed exclusively via **`uv`**
* **FastAPI** + **Uvicorn** (High-performance async server & WebSocket stream)
* **Ultralytics YOLOv8** (Fast real-time object detection)
* **OpenCV & NumPy** (Frame decoding, coordinate normalization, vector math)
* **Pydantic v2** (Strict schema validation)
* **Pytest** (Automated pipeline test suite)

### Frontend
* **React 19** + **TypeScript** + **Vite**
* **Tailwind CSS v4** (Ultra-modern glassmorphic dark UI)
* **Lucide React** (Crisp vector icons)
* **Web Speech API** (Directional voice synthesis)
* **3-Channel Haptic Simulator** (Interactive wearable vibration motor visualizer)

---

## 6. Installation & Quick Start

### Step 1: Clone Repository
```bash
git clone https://github.com/Prasanna-ETH/RMK-Innovate.git
cd RMK-Innovate
```

### Step 2: Backend Setup with `uv`
> **Important**: This project uses `uv` exclusively for Python package management.

```bash
cd backend

# Sync environment and dependencies
uv sync

# Run backend unit tests to verify algorithms
uv run pytest

# Launch the FastAPI backend server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API available at: `http://localhost:8000`
* Interactive Swagger Docs: `http://localhost:8000/docs`
* WebSocket: `ws://localhost:8000/ws/perception`

---

### Step 3: Frontend Setup
Open a separate terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
* Open `http://localhost:5173` in your browser.

---

## 7. Presentation Demo Guide

BlindSpot features a built-in **Demo Engine** for rock-solid presentation reliability alongside live webcam inference:

1. **Demo 1 — Approaching Cyclist from Left**: Shows a cyclist encroaching the travel corridor, escalating the risk gauge to `CRITICAL`, triggering left-motor haptic pulse and voice warning.
2. **Demo 2 — Centered Path Obstacle**: Demonstrates stationary path blockage detection with center-motor haptic activation.
3. **Demo 3 — Narrow Clearance Passage**: Flanking obstacles trigger corridor constraint analysis and double-pulse haptic warning.
4. **Live Laptop Webcam**: Real YOLOv8 monocular inference running live on your camera feed.

---

## 8. Hardware Roadmap

See [`hardware/README.md`](hardware/README.md) for full ESP32 microcontroller schematics, BLE wireless protocol, and Arduino C++ source code.  
See [`docs/future-hardware.md`](docs/future-hardware.md) for embedded Jetson/Raspberry Pi deployment and stereo depth camera roadmap.

---

## 9. Limitations & Disclaimer

> *Disclaimer: BlindSpot is a research and hackathon prototype developed for RMK Innovate. It is not an automotive or medical certified safety device. Camera data is processed entirely locally on the host machine for complete user privacy.*
