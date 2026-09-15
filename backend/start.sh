#!/usr/bin/env bash
# Render start script for BlindSpot backend
# This script is used by Render to start the FastAPI server

set -e

# Download YOLO model if not present
if [ ! -f "yolov8n.pt" ]; then
  echo "Downloading YOLOv8n model..."
  python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
  echo "Model downloaded successfully."
fi

# Start the FastAPI server
PORT=${PORT:-8000}
echo "Starting BlindSpot backend on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
