import React, { useState, useEffect } from 'react';
import { Vibrate, Cpu, Zap } from 'lucide-react';
import type { HapticPattern } from '../types/perception';
import { hapticService } from '../services/hapticService';

export const HapticSimulator: React.FC = () => {
  const [activeMotors, setActiveMotors] = useState({ left: false, center: false, right: false });

  useEffect(() => {
    const unsubscribe = hapticService.subscribe((_pattern, motors) => {
      setActiveMotors(motors);
    });
    return () => unsubscribe();
  }, []);

  const triggerManualTest = (pattern: HapticPattern) => {
    hapticService.triggerPattern(pattern);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Vibrate className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Haptic Output System</h3>
            <p className="text-[10px] text-slate-400 font-mono">3-Channel Wearable Vibration Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono">
          <Cpu className="w-3 h-3" />
          <span>ESP32 / BLE READY</span>
        </div>
      </div>

      {/* 3 Vibration Motors Visual Indicators */}
      <div className="grid grid-cols-3 gap-3 my-2">
        
        {/* Left Motor */}
        <div
          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
            activeMotors.left
              ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/30 scale-105'
              : 'bg-slate-950/60 border-white/5'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeMotors.left
                ? 'bg-rose-500 text-white animate-haptic-active'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">LEFT MOTOR</span>
          <span className={`text-[9px] font-mono ${activeMotors.left ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>
            {activeMotors.left ? 'PULSING' : 'IDLE'}
          </span>
        </div>

        {/* Center Motor */}
        <div
          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
            activeMotors.center
              ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/30 scale-105'
              : 'bg-slate-950/60 border-white/5'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeMotors.center
                ? 'bg-amber-500 text-white animate-haptic-active'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">CENTER MOTOR</span>
          <span className={`text-[9px] font-mono ${activeMotors.center ? 'text-amber-400 font-bold' : 'text-slate-600'}`}>
            {activeMotors.center ? 'PULSING' : 'IDLE'}
          </span>
        </div>

        {/* Right Motor */}
        <div
          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
            activeMotors.right
              ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/30 scale-105'
              : 'bg-slate-950/60 border-white/5'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 ${
              activeMotors.right
                ? 'bg-rose-500 text-white animate-haptic-active'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300 mt-2">RIGHT MOTOR</span>
          <span className={`text-[9px] font-mono ${activeMotors.right ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>
            {activeMotors.right ? 'PULSING' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Manual Haptic Test Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
        <span className="text-slate-500">Manual Test:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerManualTest('LEFT_PULSE')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors cursor-pointer"
          >
            Left
          </button>
          <button
            onClick={() => triggerManualTest('CENTER_PULSE')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors cursor-pointer"
          >
            Center
          </button>
          <button
            onClick={() => triggerManualTest('RIGHT_PULSE')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-colors cursor-pointer"
          >
            Right
          </button>
          <button
            onClick={() => triggerManualTest('RAPID_ALERT')}
            className="px-2 py-1 rounded bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 transition-colors font-bold cursor-pointer"
          >
            Rapid
          </button>
        </div>
      </div>
    </div>
  );
};
