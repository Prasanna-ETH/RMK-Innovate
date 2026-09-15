import React from 'react';
import { Eye, Wifi, WifiOff, Activity } from 'lucide-react';
import type { UserMode } from '../types/perception';

interface HeaderProps {
  activeMode: UserMode;
  isConnected: boolean;
  onOpenCalibration: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  isConnected,
  onOpenCalibration,
}) => {
  const modeLabels: Record<UserMode, { title: string; color: string }> = {
    driver: { title: 'Driver Blind-Spot Mode', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    wheelchair: { title: 'Wheelchair Mobility Mode', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    visual_assistance: { title: 'Visual Guidance Mode', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  };

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                BlindSpot
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  RMK Hackathon MVP
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 font-medium">
              <span>Intelligent Spatial Awareness for Safer Mobility</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400/90 font-mono tracking-wider text-[11px]">SEE → UNDERSTAND → PREDICT → WARN</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Mode Badge */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          
          {/* Active Mode Pill */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${modeLabels[activeMode].color} flex items-center gap-1.5 shadow-sm`}>
            <Activity className="w-3.5 h-3.5" />
            <span>{modeLabels[activeMode].title}</span>
          </div>

          {/* Backend WS Status */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-900 border border-white/10">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">AI ENGINE ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 font-semibold">BACKEND CONNECTING</span>
              </>
            )}
          </div>

          {/* Settings / Disclaimer Tooltip */}
          <button
            onClick={onOpenCalibration}
            className="px-3 py-1 text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="System Settings & Calibration"
          >
            <span>Calibration</span>
          </button>
        </div>
      </div>
    </header>
  );
};
