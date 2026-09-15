import React from 'react';
import { Radar, Compass, Navigation } from 'lucide-react';
import type { FramePerceptionResult, TrackedObject } from '../types/perception';

interface SpatialRadarProps {
  perceptionResult: FramePerceptionResult | null;
}

export const SpatialRadar: React.FC<SpatialRadarProps> = ({ perceptionResult }) => {
  const objects = perceptionResult?.objects || [];

  const getObjectIcon = (className: string) => {
    switch (className.toLowerCase()) {
      case 'person':
        return '🧍';
      case 'bicycle':
        return '🚲';
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'bus':
        return '🚌';
      case 'truck':
        return '🚛';
      case 'dog':
      case 'cat':
        return '🐕';
      case 'chair':
      case 'couch':
        return '🪑';
      case 'dining table':
        return '🪵';
      case 'backpack':
      case 'handbag':
      case 'suitcase':
        return '🎒';
      default:
        return '📦';
    }
  };

  const getRiskRingColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-rose-500 bg-rose-500/30 text-rose-300 shadow-rose-500/50';
      case 'HIGH':
        return 'border-orange-500 bg-orange-500/30 text-orange-300 shadow-orange-500/40';
      case 'MEDIUM':
        return 'border-amber-500 bg-amber-500/30 text-amber-300 shadow-amber-500/30';
      default:
        return 'border-emerald-500 bg-emerald-500/30 text-emerald-300 shadow-emerald-500/20';
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 flex flex-col justify-between border border-white/10 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Spatial Awareness Radar</h3>
            <p className="text-[10px] text-slate-400 font-mono">Top-Down Bird's-Eye Spatial Model</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/80">
          <Compass className="w-3 h-3" />
          <span>FORWARD 0°</span>
        </div>
      </div>

      {/* 2D Radar Canvas */}
      <div className="relative w-full aspect-[16/10] bg-slate-950/80 rounded-xl border border-white/5 overflow-hidden flex items-end justify-center p-3">
        
        {/* Concentric Distance Rings (8m, 4m, 2m, 1m) */}
        <div className="absolute inset-x-4 bottom-0 h-[92%] border-t-2 border-dashed border-white/10 rounded-t-full pointer-events-none flex items-start justify-center">
          <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 -mt-2.5">8m</span>
        </div>
        <div className="absolute inset-x-12 bottom-0 h-[68%] border-t border-dashed border-white/10 rounded-t-full pointer-events-none flex items-start justify-center">
          <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 -mt-2">4m</span>
        </div>
        <div className="absolute inset-x-20 bottom-0 h-[44%] border-t border-cyan-500/20 rounded-t-full pointer-events-none flex items-start justify-center">
          <span className="text-[9px] font-mono text-cyan-400/70 bg-slate-950 px-1 -mt-2">2m</span>
        </div>
        <div className="absolute inset-x-28 bottom-0 h-[22%] border-t border-rose-500/30 rounded-t-full pointer-events-none flex items-start justify-center">
          <span className="text-[9px] font-mono text-rose-400/70 bg-slate-950 px-1 -mt-2">1m</span>
        </div>

        {/* Angular Sector Dividers */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute bottom-0 left-1/2 w-0.5 h-full bg-gradient-to-t from-white/15 to-transparent origin-bottom -rotate-25" />
          <div className="absolute bottom-0 left-1/2 w-0.5 h-full bg-gradient-to-t from-white/15 to-transparent origin-bottom rotate-25" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-full bg-cyan-500/5 pointer-events-none" />
        </div>

        {/* Sector Labels */}
        <div className="absolute top-2 inset-x-4 flex justify-between text-[10px] font-bold font-mono text-slate-500 pointer-events-none">
          <span>◄ LEFT</span>
          <span className="text-cyan-400/70">AHEAD (PATH)</span>
          <span>RIGHT ►</span>
        </div>

        {/* Dynamic Object Markers on Radar */}
        {objects.map((obj: TrackedObject) => {
          const leftPercent = 10 + obj.center.x * 80;
          const distClamped = Math.max(0.5, Math.min(obj.distance.distance_m, 8.0));
          const bottomPercent = 10 + ((8.0 - distClamped) / 7.5) * 78;
          const isApproaching = obj.motion.is_approaching;

          return (
            <div
              key={obj.track_id}
              style={{
                left: `${leftPercent}%`,
                bottom: `${bottomPercent}%`,
                transform: 'translate(-50%, 50%)',
              }}
              className="absolute z-20 flex flex-col items-center group transition-all duration-300"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap pointer-events-none shadow-lg z-30">
                {obj.class_name} ({obj.distance.distance_m}m) - {obj.risk.level}
              </div>

              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm shadow-md transition-transform duration-200 ${
                  getRiskRingColor(obj.risk.level)
                } ${isApproaching ? 'animate-bounce' : ''}`}
              >
                <span>{getObjectIcon(obj.class_name)}</span>
              </div>

              <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5 bg-slate-950/80 px-1 rounded">
                {obj.distance.distance_m}m
              </span>
            </div>
          );
        })}

        {/* User Location Origin Marker */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Navigation className="w-3 h-3 text-cyan-400" />
          </div>
          <span className="text-[9px] font-mono font-bold text-cyan-300 mt-1">USER</span>
        </div>
      </div>
    </div>
  );
};
