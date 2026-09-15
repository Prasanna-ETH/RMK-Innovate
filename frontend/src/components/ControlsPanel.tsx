import React from 'react';
import { Camera, CameraOff, Volume2, VolumeX, Sliders, Play, Film, Sparkles } from 'lucide-react';
import type { VideoSourceMode } from '../hooks/useCameraStream';

interface ControlsPanelProps {
  sourceMode: VideoSourceMode;
  onSelectSource: (mode: VideoSourceMode) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onTestAudio: () => void;
  onOpenCalibration: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  sourceMode,
  onSelectSource,
  isStreaming,
  onToggleStreaming,
  isAudioEnabled,
  onToggleAudio,
  onTestAudio,
  onOpenCalibration,
}) => {
  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Left: Input Source Selector */}
      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">
          Source:
        </span>
        
        {/* Webcam */}
        <button
          onClick={() => onSelectSource('webcam')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
            sourceMode === 'webcam'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Live Webcam</span>
        </button>

        {/* Demo Scenario 1 */}
        <button
          onClick={() => onSelectSource('scenario1')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
            sourceMode === 'scenario1'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-500/20'
              : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Demo 1: Cyclist Left</span>
        </button>

        {/* Demo Scenario 2 */}
        <button
          onClick={() => onSelectSource('scenario2')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
            sourceMode === 'scenario2'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Demo 2: Obstacle Ahead</span>
        </button>

        {/* Demo Scenario 3 */}
        <button
          onClick={() => onSelectSource('scenario3')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
            sourceMode === 'scenario3'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-sm shadow-purple-500/20'
              : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Demo 3: Narrow Passage</span>
        </button>
      </div>

      {/* Right: Audio & Settings Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        
        {/* Toggle Stream Button */}
        <button
          onClick={onToggleStreaming}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
            isStreaming
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
        >
          {isStreaming ? <CameraOff className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isStreaming ? 'Stop Feed' : 'Start Feed'}</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-colors cursor-pointer ${
            isAudioEnabled
              ? 'bg-slate-800 text-cyan-400 border-cyan-500/30 hover:bg-slate-700'
              : 'bg-slate-900 text-slate-500 border-white/5 hover:bg-slate-800'
          }`}
          title={isAudioEnabled ? 'Mute Voice Alerts' : 'Unmute Voice Alerts'}
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Test Speech Voice */}
        <button
          onClick={onTestAudio}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Test Voice</span>
        </button>

        {/* Calibration Settings */}
        <button
          onClick={onOpenCalibration}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs transition-colors cursor-pointer"
          title="Open Calibration & Threshold Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
