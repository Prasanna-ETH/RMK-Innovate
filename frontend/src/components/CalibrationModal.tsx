import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import type { CalibrationSettings } from '../types/perception';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: CalibrationSettings;
  onChangeCalibration: (newCalib: CalibrationSettings) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  calibration,
  onChangeCalibration,
}) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof CalibrationSettings, value: any) => {
    onChangeCalibration({
      ...calibration,
      [field]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">System Calibration & Settings</h2>
              <p className="text-xs text-slate-400 font-mono">Fine-tune Perception & Alert Engine Thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders and Controls */}
        <div className="py-4 space-y-4">
          
          {/* Detection Confidence Threshold */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>YOLO Detection Confidence</span>
              <span className="text-cyan-400 font-bold">{calibration.detection_confidence.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.85"
              step="0.05"
              value={calibration.detection_confidence}
              onChange={(e) => handleChange('detection_confidence', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Camera Mount Height */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Camera Mount Height (Meters)</span>
              <span className="text-cyan-400 font-bold">{calibration.camera_height_m.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="2.2"
              step="0.1"
              value={calibration.camera_height_m}
              onChange={(e) => handleChange('camera_height_m', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Alert Sensitivity Multiplier */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Risk & Alert Sensitivity Multiplier</span>
              <span className="text-amber-400 font-bold">{calibration.alert_sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={calibration.alert_sensitivity}
              onChange={(e) => handleChange('alert_sensitivity', parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Corridor Width */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Travel Corridor Width</span>
              <span className="text-cyan-400 font-bold">{Math.round(calibration.corridor_width * 100)}% of FOV</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.60"
              step="0.05"
              value={calibration.corridor_width}
              onChange={(e) => handleChange('corridor_width', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Alert Debounce Cooldown */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Alert Debounce Cooldown</span>
              <span className="text-cyan-400 font-bold">{calibration.alert_cooldown_sec.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.5"
              value={calibration.alert_cooldown_sec}
              onChange={(e) => handleChange('alert_cooldown_sec', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply & Save Calibration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
