import React from 'react';
import { Car, Accessibility, Glasses, Check } from 'lucide-react';
import type { UserMode } from '../types/perception';

interface ModeSelectorProps {
  currentMode: UserMode;
  onSelectMode: (mode: UserMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const modes: Array<{
    id: UserMode;
    label: string;
    tagline: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderActive: string;
    bgActive: string;
  }> = [
    {
      id: 'driver',
      label: 'DRIVER MODE',
      tagline: 'Blind-spot monitoring, fast vehicles & pedestrian path encroachment',
      icon: Car,
      accentColor: 'text-blue-400',
      borderActive: 'border-blue-500 shadow-blue-500/20',
      bgActive: 'bg-blue-950/40',
    },
    {
      id: 'wheelchair',
      label: 'WHEELCHAIR MODE',
      tagline: 'Path obstacle blockage, narrow passage clearance & accessibility hazards',
      icon: Accessibility,
      accentColor: 'text-emerald-400',
      borderActive: 'border-emerald-500 shadow-emerald-500/20',
      bgActive: 'bg-emerald-950/40',
    },
    {
      id: 'visual_assistance',
      label: 'VISUAL ASSISTANCE',
      tagline: 'High-clarity audio guidance for obstacles, approaching actors & hazards',
      icon: Glasses,
      accentColor: 'text-purple-400',
      borderActive: 'border-purple-500 shadow-purple-500/20',
      bgActive: 'bg-purple-950/40',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isSelected = currentMode === m.id;

          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? `${m.borderActive} ${m.bgActive} shadow-lg ring-1 ring-white/10`
                  : 'border-white/5 bg-slate-900/50 hover:bg-slate-850 hover:border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-slate-800'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? m.accentColor : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-xs font-bold tracking-wider ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {m.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {m.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
