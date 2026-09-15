import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.perception_service import perception_service
from app.services.session_service import session_service
from app.models.schemas import UserMode, CalibrationSettings
from app.utils.logging import logger

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/perception")
async def perception_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected to /ws/perception")

    try:
        while True:
            # WebSocket can receive text (JSON with base64 image or config) or binary (JPEG)
            message = await websocket.receive()
            
            if "text" in message:
                try:
                    payload = json.loads(message["text"])
                    msg_type = payload.get("type", "frame")

                    if msg_type == "frame":
                        image_data = payload.get("data", "")
                        mode_str = payload.get("mode")
                        mode = UserMode(mode_str) if mode_str else session_service.mode
                        
                        result = perception_service.process_image_base64(
                            image_data=image_data,
                            mode=mode,
                            calibration=session_service.calibration,
                        )
                        await websocket.send_text(result.model_dump_json())

                    elif msg_type == "set_mode":
                        new_mode = UserMode(payload.get("mode", "driver"))
                        session_service.set_mode(new_mode)
                        await websocket.send_json({
                            "type": "mode_updated",
                            "active_mode": session_service.mode.value
                        })

                    elif msg_type == "calibration":
                        calib_data = payload.get("data", {})
                        calib = CalibrationSettings(**calib_data)
                        session_service.update_calibration(calib)
                        perception_service.pipeline.update_calibration(calib)
                        await websocket.send_json({
                            "type": "calibration_updated",
                            "calibration": calib.model_dump()
                        })

                    elif msg_type == "ping":
                        await websocket.send_json({"type": "pong", "timestamp": time.time()})

                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON on perception websocket")
                except Exception as e:
                    logger.error(f"Error processing perception message: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})

            elif "bytes" in message:
                # Raw binary JPEG frame
                raw_bytes = message["bytes"]
                try:
                    import cv2
                    import numpy as np
                    nparr = np.frombuffer(raw_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    result = perception_service.pipeline.process_frame(
                        frame=frame,
                        mode=session_service.mode,
                        calibration=session_service.calibration,
                    )
                    await websocket.send_text(result.model_dump_json())
                except Exception as e:
                    logger.error(f"Error processing binary frame: {e}")

    except WebSocketDisconnect:
        logger.info("Client disconnected from /ws/perception")
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {e}")
