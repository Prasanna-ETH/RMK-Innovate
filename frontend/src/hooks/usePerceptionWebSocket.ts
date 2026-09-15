import { useState, useEffect, useRef, useCallback } from 'react';
import type { FramePerceptionResult, UserMode, CalibrationSettings } from '../types/perception';

interface UsePerceptionWebSocketOptions {
  url?: string;
  onResult?: (result: FramePerceptionResult) => void;
  onError?: (err: Error) => void;
}

export function usePerceptionWebSocket({
  url = 'ws://localhost:8000/ws/perception',
  onResult,
  onError,
}: UsePerceptionWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<FramePerceptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: FramePerceptionResult = JSON.parse(event.data);
          setLatestResult(data);
          if (onResultRef.current) {
            onResultRef.current(data);
          }
        } catch {
          // Ignored non-result JSON or heartbeat
        }
      };

      ws.onerror = () => {
        const errMsg = 'WebSocket perception connection failed';
        setError(errMsg);
        if (onError) onError(new Error(errMsg));
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 2500);
      };
    } catch (e: any) {
      setError(e.message || 'Failed to initialize WebSocket');
    }
  }, [url, onError]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendFrame = useCallback((base64Data: string, mode: UserMode) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'frame',
          data: base64Data,
          mode,
        })
      );
    }
  }, []);

  const sendMode = useCallback((mode: UserMode) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'set_mode',
          mode,
        })
      );
    }
  }, []);

  const sendCalibration = useCallback((calib: CalibrationSettings) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'calibration',
          data: calib,
        })
      );
    }
  }, []);

  return {
    isConnected,
    latestResult,
    error,
    sendFrame,
    sendMode,
    sendCalibration,
    reconnect: connect,
  };
}
