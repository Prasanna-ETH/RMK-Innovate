import React from 'react';
import { ShieldAlert, AlertCircle, ShieldCheck, Gauge } from 'lucide-react';
import type { FramePerceptionResult, RiskAssessment, RiskLevel } from '../types/perception';

interface RiskPanelProps {
  perceptionResult: FramePerceptionResult | null;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ perceptionResult }) => {
  const overallScore = perceptionResult?.overall_risk_score || 0;
  const overallLevel = perceptionResult?.overall_risk_level || 'LOW';
  const primaryThreat = perceptionResult?.primary_threat;
  const risk: RiskAssessment | undefined = primaryThreat?.risk;

  const getLevelConfig = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL HAZARD',
          textColor: 'text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/40',
          gaugeColor: '#ef4444',
          icon: AlertCircle,
        };
      case 'HIGH':
        return {
          label: 'HIGH RISK',
          textColor: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/40',
          gaugeColor: '#f97316',
          icon: ShieldAlert,
        };
      case 'MEDIUM':
        return {
          label: 'MODERATE RISK',
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/40',
          gaugeColor: '#f59e0b',
          icon: ShieldAlert,
        };
      default:
        return {
          label: 'NOMINAL / SAFE',
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/40',
          gaugeColor: '#10b981',
          icon: ShieldCheck,
        };
    }
  };

  const config = getLevelConfig(overallLevel);
  const StatusIcon = config.icon;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 text-slate-300">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Factor Risk Engine</h3>
            <p className="text-[10px] text-slate-400 font-mono">Weighted Risk Fusion & Threat Assessment</p>
          </div>
        </div>
        
        {/* Severity Badge */}
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Main Score & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Score Radial Box */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/80 border border-white/5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-0.5">Composite Score</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black font-mono tracking-tight ${config.textColor}`}>
              {overallScore}
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 text-center truncate max-w-full">
            {risk?.explanation || 'Environment clear'}
          </span>
        </div>

        {/* Sub-factor Progress Bars */}
        <div className="md:col-span-8 space-y-2">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
              <span>PROXIMITY FACTOR</span>
              <span className="text-white font-bold">{risk?.distance_risk || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${risk?.distance_risk || 0}%` }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
              <span>APPROACH DYNAMICS</span>
              <span className="text-white font-bold">{risk?.approach_risk || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${risk?.approach_risk || 0}%` }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
              <span>PATH ENCROACHMENT</span>
              <span className="text-white font-bold">{risk?.path_risk || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${risk?.path_risk || 0}%` }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-rose-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
