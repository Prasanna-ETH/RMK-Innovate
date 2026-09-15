import React, { useRef, useEffect } from 'react';
import { Camera, Crosshair } from 'lucide-react';
import type { FramePerceptionResult, TrackedObject } from '../types/perception';

interface LivePerceptionViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  perceptionResult: FramePerceptionResult | null;
  isStreaming: boolean;
  cameraError: string | null;
  sourceMode: string;
}

export const LivePerceptionView: React.FC<LivePerceptionViewProps> = ({
  videoRef,
  perceptionResult,
  isStreaming,
  cameraError,
  sourceMode,
}) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!isStreaming) return;

    // 1. Draw Spatial Sector Lines (Left / Center / Right)
    const leftBoundary = 0.33;
    const rightBoundary = 0.67;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    // Left divider
    ctx.beginPath();
    ctx.moveTo(width * leftBoundary, 0);
    ctx.lineTo(width * leftBoundary, height);
    ctx.stroke();

    // Right divider
    ctx.beginPath();
    ctx.moveTo(width * rightBoundary, 0);
    ctx.lineTo(width * rightBoundary, height);
    ctx.stroke();

    // Spatial Sector Labels
    ctx.setLineDash([]);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillText('LEFT ZONE', 10, 20);
    ctx.fillText('CENTER (AHEAD)', width * 0.42, 20);
    ctx.fillText('RIGHT ZONE', width - 75, 20);

    // 2. Draw User Path Corridor
    const corrLeft = perceptionResult?.corridor_bounds?.left ?? 0.30;
    const corrRight = perceptionResult?.corridor_bounds?.right ?? 0.70;
    const corrTop = perceptionResult?.corridor_bounds?.top ?? 0.25;

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    const grad = ctx.createLinearGradient(0, height * corrTop, 0, height);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.02)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.12)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(width * (corrLeft + 0.08), height * corrTop);
    ctx.lineTo(width * (corrRight - 0.08), height * corrTop);
    ctx.lineTo(width * corrRight, height);
    ctx.lineTo(width * corrLeft, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.fillText('▼ TRAVEL PATH CORRIDOR ▼', width * 0.38, height - 12);

    // 3. Draw Object Detections & Bounding Boxes
    if (perceptionResult && perceptionResult.objects) {
      perceptionResult.objects.forEach((obj: TrackedObject) => {
        const { bbox, class_name, risk, distance, motion } = obj;

        const x = bbox.x1 * width;
        const y = bbox.y1 * height;
        const bw = bbox.width * width;
        const bh = bbox.height * height;

        let strokeColor = '#10b981';
        let fillColor = 'rgba(16, 185, 129, 0.12)';
        let badgeBg = '#065f46';

        if (risk.level === 'CRITICAL') {
          strokeColor = '#ef4444';
          fillColor = 'rgba(239, 68, 68, 0.22)';
          badgeBg = '#991b1b';
        } else if (risk.level === 'HIGH') {
          strokeColor = '#f97316';
          fillColor = 'rgba(249, 115, 22, 0.18)';
          badgeBg = '#9a3412';
        } else if (risk.level === 'MEDIUM') {
          strokeColor = '#f59e0b';
          fillColor = 'rgba(245, 158, 11, 0.15)';
          badgeBg = '#92400e';
        }

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;
        ctx.lineWidth = risk.level === 'CRITICAL' || risk.level === 'HIGH' ? 2.5 : 1.5;

        ctx.fillRect(x, y, bw, bh);
        ctx.strokeRect(x, y, bw, bh);

        // Draw Motion trajectory trail
        if (obj.history_centers && obj.history_centers.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          obj.history_centers.forEach((pt, idx) => {
            const hx = pt.x * width;
            const hy = pt.y * height;
            if (idx === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const labelText = `${class_name.toUpperCase()} ~${distance.distance_m}m`;
        ctx.font = 'bold 11px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const tagWidth = textMetrics.width + 16;
        const tagHeight = 20;

        ctx.fillStyle = badgeBg;
        ctx.fillRect(x, Math.max(0, y - tagHeight), tagWidth, tagHeight);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x + 8, Math.max(tagHeight - 6, y - 6));

        if (motion.is_approaching) {
          ctx.fillStyle = strokeColor;
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`▲ APPROACHING (${risk.score})`, x + 4, y + bh - 6);
        }
      });
    }
  }, [perceptionResult, isStreaming]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl aspect-[4/3] flex items-center justify-center">
      
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isStreaming ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* Synthetic Scenario Simulation Overlay (semi-transparent so camera shows through) */}
      {sourceMode !== 'webcam' && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-950/40 to-slate-900/60 flex items-center justify-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>
      )}

      {/* Overlay HUD Canvas */}
      <canvas
        ref={overlayCanvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Camera Off Overlay */}
      {!isStreaming && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="p-4 rounded-full bg-slate-900 border border-white/10 mb-3 text-slate-400">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Camera Feed Inactive</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {cameraError || 'Start live camera or switch to a demo scenario to initiate real-time AI perception.'}
          </p>
        </div>
      )}

      {/* Top HUD Telemetry Banner */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-bold">PERCEPTION HUD</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">{perceptionResult?.fps || 0} FPS</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{perceptionResult?.latency_ms || 0}ms</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-slate-300">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>{perceptionResult?.objects?.length || 0} OBJECTS TRACKED</span>
        </div>
      </div>
    </div>
  );
};
