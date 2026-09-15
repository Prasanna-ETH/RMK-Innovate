import { useState, useEffect, useRef, useCallback } from 'react';

export type VideoSourceMode = 'webcam' | 'scenario1' | 'scenario2' | 'scenario3';

interface UseCameraStreamOptions {
  onFrameCaptured?: (base64Image: string) => void;
  targetFps?: number;
}

export function useCameraStream({ onFrameCaptured, targetFps = 12 }: UseCameraStreamOptions = {}) {
  const [sourceMode, setSourceMode] = useState<VideoSourceMode>('webcam');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const demoProgressRef = useRef<number>(0);

  const onFrameCapturedRef = useRef(onFrameCaptured);
  onFrameCapturedRef.current = onFrameCaptured;

  // Start real webcam
  const startWebcam = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access webcam');
      setIsStreaming(false);
    }
  }, []);

  // Stop video stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (captureIntervalRef.current) {
      window.clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Frame capture loop for real webcam
  useEffect(() => {
    if (!isStreaming || sourceMode !== 'webcam') {
      if (captureIntervalRef.current) {
        window.clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 480;
      canvasRef.current.height = 360;
    }

    const intervalMs = Math.round(1000 / targetFps);
    captureIntervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.65);
      if (onFrameCapturedRef.current) {
        onFrameCapturedRef.current(base64Data);
      }
    }, intervalMs);

    return () => {
      if (captureIntervalRef.current) {
        window.clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [isStreaming, sourceMode, targetFps]);

  // Handle source switching
  useEffect(() => {
    if (sourceMode === 'webcam') {
      startWebcam();
    } else {
      // In scenario mode, synthetic frames are generated without requiring raw camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(true);
      setCameraError(null);
    }
  }, [sourceMode, startWebcam]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    videoRef,
    sourceMode,
    setSourceMode,
    isStreaming,
    cameraError,
    startWebcam,
    stopStream,
    demoProgressRef,
  };
}
