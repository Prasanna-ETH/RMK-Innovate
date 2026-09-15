import React from 'react';
import { Terminal } from 'lucide-react';
import type { FramePerceptionResult } from '../types/perception';

interface SystemStatusPanelProps {
  perceptionResult: FramePerceptionResult | null;
  isAudioEnabled: boolean;
  isConnected: boolean;
  isStreaming: boolean;
}

export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({
  perceptionResult,
  isAudioEnabled,
  isConnected,
  isStreaming,
}) => {
  const statusItems = [
    { name: 'Camera Stream', status: isStreaming ? 'CONNECTED' : 'STANDBY', ok: isStreaming },
    { name: 'YOLO Detector', status: isConnected ? 'RUNNING' : 'OFFLINE', ok: isConnected },
    { name: 'Object Tracker', status: isConnected ? 'ACTIVE' : 'OFFLINE', ok: isConnected },
    { name: 'Spatial Engine', status: isConnected ? 'RUNNING' : 'OFFLINE', ok: isConnected },
    { name: 'Risk Fusion', status: isConnected ? 'EVALUATING' : 'OFFLINE', ok: isConnected },
    { name: 'Voice Guidance', status: isAudioEnabled ? 'ACTIVE' : 'MUTED', ok: isAudioEnabled },
    { name: 'Haptic Feedback', status: 'SIMULATED', ok: true },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Telemetry</h3>
            <p className="text-[10px] text-slate-400 font-mono">Real-Time Pipeline Health Diagnostics</p>
          </div>
        </div>

        {/* FPS / Latency Badge */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
            {perceptionResult?.fps || 0} FPS
          </span>
          <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/5">
            {perceptionResult?.latency_ms || 0} ms
          </span>
        </div>
      </div>

      {/* Grid of status components */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {statusItems.map((item, idx) => (
          <div
            key={idx}
            className="p-2 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col justify-between"
          >
            <span className="text-[9px] font-mono text-slate-400 uppercase truncate">
              {item.name}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span
                className={`text-[10px] font-mono font-bold ${
                  item.ok ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
