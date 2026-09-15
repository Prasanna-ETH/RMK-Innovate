import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';
import type { FramePerceptionResult, TrackedObject, AlertEvent } from '../types/perception';

interface SituationCardProps {
  perceptionResult: FramePerceptionResult | null;
}

export const SituationCard: React.FC<SituationCardProps> = ({ perceptionResult }) => {
  const primaryThreat: TrackedObject | undefined = perceptionResult?.primary_threat || undefined;
  const activeAlerts: AlertEvent[] = perceptionResult?.active_alerts || [];
  const latestAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;
  const passage = perceptionResult?.passage_analysis;

  const isHighRisk =
    perceptionResult?.overall_risk_level === 'HIGH' || perceptionResult?.overall_risk_level === 'CRITICAL';

  return (
    <div
      className={`w-full rounded-2xl p-4 transition-all duration-300 border ${
        isHighRisk
          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900/90 border-rose-500/50 shadow-xl shadow-rose-950/30'
          : 'glass-panel border-white/10 shadow-lg'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Primary Situation Phrase */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl mt-0.5 ${
              isHighRisk ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'
            }`}
          >
            {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                CURRENT SITUATION INTELLIGENCE
              </span>
              {passage?.is_passage_constrained && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {passage.message}
                </span>
              )}
            </div>
            
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight mt-0.5">
              {latestAlert?.message || (primaryThreat ? `Tracking ${primaryThreat.class_name} ahead` : 'Surroundings clear. Path unobstructed.')}
            </h2>
          </div>
        </div>

        {/* Right: Key Spatial Metrics Badges */}
        {primaryThreat && (
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-500">DISTANCE</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                ~{primaryThreat.distance.distance_m}m
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-500">DIRECTION</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {primaryThreat.direction}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-500">MOTION</span>
              <span
                className={`text-xs font-mono font-bold ${
                  primaryThreat.motion.is_approaching ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {primaryThreat.motion.state}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-500">PATH RISK</span>
              <span
                className={`text-xs font-mono font-bold ${
                  primaryThreat.path.is_intersecting ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {primaryThreat.path.relationship}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
