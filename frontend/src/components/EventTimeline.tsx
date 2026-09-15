import React from 'react';
import { History, Clock } from 'lucide-react';

interface TimelineEntry {
  id: string;
  time: string;
  title: string;
  detail: string;
  type: 'alert' | 'detection' | 'motion' | 'path';
  severity?: string;
}

interface EventTimelineProps {
  events: TimelineEntry[];
  onClear: () => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events, onClear }) => {
  return (
    <div className="w-full glass-panel rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col h-full max-h-96">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Temporal Event Log</h3>
            <p className="text-[10px] text-slate-400 font-mono">Sequential Spatial & Risk Timeline</p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 border border-white/5 transition-colors cursor-pointer"
        >
          Clear Log
        </button>
      </div>

      {/* Scrollable Events List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono">
        {events.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Clock className="w-5 h-5 mb-1 opacity-50" />
            <span>Awaiting spatial events...</span>
          </div>
        ) : (
          events.slice(0, 30).map((ev) => {
            const isAlert = ev.type === 'alert';
            const isCrit = ev.severity === 'CRITICAL';
            const isHigh = ev.severity === 'HIGH';

            return (
              <div
                key={ev.id}
                className={`p-2 rounded-xl border text-xs flex items-start justify-between gap-2 transition-all ${
                  isCrit
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    : isHigh
                    ? 'bg-orange-950/30 border-orange-500/30 text-orange-300'
                    : isAlert
                    ? 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                    : 'bg-slate-900/40 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-slate-500 font-bold shrink-0 mt-0.5">
                    {ev.time}
                  </span>
                  <div>
                    <span className="font-bold block text-[11px] leading-tight text-white">
                      {ev.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {ev.detail}
                    </span>
                  </div>
                </div>

                {ev.severity && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                      isCrit
                        ? 'bg-rose-500 text-slate-950 font-black'
                        : isHigh
                        ? 'bg-orange-500 text-slate-950 font-black'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {ev.severity}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
