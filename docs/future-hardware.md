# BlindSpot — Future Hardware Roadmap & Embedded Deployment

This document outlines the modular upgrade path for transitioning BlindSpot from a laptop hackathon prototype to a self-contained, ultra-low-latency wearable and vehicle-mounted hardware product.

---

## 1. Embedded Compute Platforms

| Platform | Target Form Factor | Inference Performance | Power Budget | Target Mobility Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **NVIDIA Jetson Orin Nano** (8GB) | Vehicle / Wheelchair Mount | 40–60 FPS (TensorRT FP16) | 7W–15W | Driver Blind-Spot & Powered Wheelchairs |
| **Raspberry Pi 5 + AI Hat+** (Hailo-8L) | Belt-worn / Backpack | 25–35 FPS (NPU INT8) | 5W–8W | Visual Assistance & Pedestrian Mobility |
| **Android Smartphone** (Snapdragon 8 Gen 3) | Chest Harness / Pocket | 30+ FPS (ONNX / NNAPI) | Battery | Standalone Consumer App |

---

## 2. Advanced Spatial Sensors

```
  ┌─────────────────────────────────────────────────────────────┐
  │                 MODULAR SENSOR ABSTRACTION                   │
  │                                                             │
  │   [ Monocular RGB ]  [ Stereo OAK-D ]  [ Solid-State LiDAR] │
  │          │                  │                    │          │
  │          ▼                  ▼                    ▼          │
  │   ┌──────────────────────────────────────────────────────┐  │
  │   │          Unified DistanceEstimator Interface         │  │
  │   └─────────────────────────┬────────────────────────────┘  │
  │                             ▼                               │
  │   ┌──────────────────────────────────────────────────────┐  │
  │   │       BlindSpot Spatial & Risk Prediction Core       │  │
  │   └──────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────┘
```

1. **Luxonis OAK-D / Intel RealSense D435**:
   * Hardware stereo depth disparity map computed on-device.
   * Direct metric depth coordinates $(X, Y, Z)$ per tracked bounding box without heuristic approximations.
2. **Solid-State Time-of-Flight (ToF) / Micro-LiDAR**:
   * High-accuracy range finding in direct sunlight and pitch-black darkness.
3. **9-DoF IMU (Inertial Measurement Unit)**:
   * Real-time ego-motion compensation to subtract user head turns/body motion from object velocity vectors.

---

## 3. Wearable Feedback Form Factors

* **Haptic Directional Belt**: 4–8 LRA (Linear Resonant Actuator) motors providing circumferential 360° tactile cues.
* **Smart Glasses Audio HUD**: Directional bone-conduction transducers whispering spatial cues into the user's left/right ear without blocking ambient environmental hearing.
