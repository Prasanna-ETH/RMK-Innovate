# BlindSpot Backend — Perception & Spatial Risk Engine

The backend for BlindSpot is a real-time computer vision and spatial risk reasoning service built with FastAPI, OpenCV, Ultralytics YOLOv8, and Pydantic.

Package management is handled exclusively via [`uv`](https://docs.astral.sh/uv/).

---

## 1. Prerequisites

* Python 3.11 or 3.12
* `uv` installed (`curl -LsSf https://astral.sh/uv/install.sh` or `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`)

---

## 2. Setup with uv

Navigate to the `backend` directory and sync all dependencies:

```bash
cd backend
uv sync
```

---

## 3. Running the Backend Server

Start the FastAPI application with Uvicorn:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at:
* REST API: `http://localhost:8000`
* Swagger Docs: `http://localhost:8000/docs`
* WebSocket Endpoint: `ws://localhost:8000/ws/perception`

---

## 4. Running Unit Tests

Run the test suite covering spatial classification, distance estimation, temporal motion, path analysis, risk fusion, and alert engine:

```bash
uv run pytest
```

---

## 5. API Endpoints Overview

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check and pipeline status |
| `GET` | `/api/config` | Global settings, spatial boundaries, and risk weights |
| `POST` | `/api/session/mode` | Update active user mode (`driver`, `wheelchair`, `visual_assistance`) |
| `POST` | `/api/session/calibration` | Update detection threshold, sensitivity, and corridor width |
| `WS` | `/ws/perception` | Real-time bi-directional frame streaming and perception updates |
