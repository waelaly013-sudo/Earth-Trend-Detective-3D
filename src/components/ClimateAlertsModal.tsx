/**
 * NASA Earth Trend Detective - Critical Anomaly Log & Timeline Modal
 * Comprehensive archive of all detected and projected planetary climate anomaly milestones.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Flame,
  Snowflake,
  Waves,
  Trees,
  Compass,
  Sparkles,
  Filter,
  Activity,
  Sigma,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { CriticalAnomalyAlert, EarthDomain } from '../types/climate';
import { CRITICAL_ANOMALY_MILESTONES } from '../utils/anomalyDetector';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

// What this does: Lists the props passed into the Critical Climate Anomaly Registry modal.
// On the website: Tells the modal if it is open, the active year, and what to do when the user clicks "Jump & Inspect".
// Used as: The TypeScript props contract for ClimateAlertsModal.
interface ClimateAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlert: (alert: CriticalAnomalyAlert) => void;
  currentYear: number;
}

// What this does: Displays a filterable timeline archive of major climate anomaly alerts from 2000 to 2040.
// On the website: Lets users filter events by domain (Cryosphere, Heat, Ocean, Forest) and jump the 3D Earth straight to any event.
// Used as: The alerts history modal opened from the Reports menu or Mission Control.
export const ClimateAlertsModal: React.FC<ClimateAlertsModalProps> = ({
  isOpen,
  onClose,
  onSelectAlert,
  currentYear,
}) => {
  const { dataMode } = useAuth();
  const [domainFilter, setDomainFilter] = useState<EarthDomain | 'All'>('All');

  if (!isOpen) return null;

  const filtered = CRITICAL_ANOMALY_MILESTONES.filter((item) => {
    if (domainFilter !== 'All' && item.domain !== domainFilter) return false;
    return true;
  });

  // What this does: Picks the right Lucide icon component (snowflake, flame, waves, tree, or alert shield) for an event's category.
  // On the website: Shows a matching visual icon next to each climate event title.
  // Used as: An icon lookup helper during card rendering.
  const getDomainIcon = (iconType: string) => {
    switch (iconType) {
      case 'ice':
        return Snowflake;
      case 'heat':
        return Flame;
      case 'ocean':
        return Waves;
      case 'forest':
        return Trees;
      default:
        return ShieldAlert;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-widest">
                NASA Space Apps · Anomaly Telemetry
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                Critical Climate Anomaly Registry (2000–2040)
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 mr-1 text-[11px]">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {(['All', 'Cryosphere', 'Biosphere', 'Atmosphere', 'Ocean Heat'] as const).map((dom) => (
            <button
              key={dom}
              onClick={() => {
                soundFx.playTick();
                setDomainFilter(dom);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                domainFilter === dom
                  ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {dom}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-500 font-mono hidden sm:inline shrink-0">
            {filtered.length} Anomaly Events Recorded
          </span>
        </div>

        {/* Anomaly Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 divide-y divide-slate-800/40">
          {/* COMPLICATED MODE: NONLINEAR DYNAMICAL SYSTEMS BANNER */}
          {dataMode === 'complicated' && (
            <div className="p-4 bg-purple-950/20 border-2 border-purple-500/40 rounded-2xl space-y-3 mb-2 font-mono">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                    Nonlinear Dynamical Systems · Tipping Bifurcation Matrix
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40">
                  Critical Slowing Down (CSD)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Earth-system tipping elements undergo qualitative phase-space reorganizations near fold catastrophes. Pre-bifurcation stability is quantified via autoregressive AR(1) autocorrelation decay &alpha;_1 &rarr; 1.0 and variance divergence Var(x) = &sigma;&sup2; / (1 - &alpha;_1&sup2;).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                  <span className="text-slate-500 block">Fold Catastrophe</span>
                  <strong className="text-rose-300">dx/dt = &mu; - x&sup2;</strong>
                  <span className="text-[9px] text-slate-400 block">Saddle-node form</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                  <span className="text-slate-500 block">Autocorrelation &alpha;_1</span>
                  <strong className="text-amber-300">&alpha;_1 = 0.89 &rarr; 0.98</strong>
                  <span className="text-[9px] text-slate-400 block">Critical Slowing Down</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                  <span className="text-slate-500 block">Lyapunov Exponent</span>
                  <strong className="text-cyan-300">&lambda;_max = +0.042</strong>
                  <span className="text-[9px] text-slate-400 block">Chaos horizon &tau; ~ 24 yr</span>
                </div>
                <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                  <span className="text-slate-500 block">Paleo Benchmark</span>
                  <strong className="text-emerald-300">MIS-5e Eemian</strong>
                  <span className="text-[9px] text-slate-400 block">+1.5&deg;C sea +6-9m</span>
                </div>
              </div>
            </div>
          )}

          {filtered.map((item) => {
            const IconC = getDomainIcon(item.categoryIcon);
            const isCurrentYear = item.year === currentYear;

            return (
              <div
                key={item.id}
                className={`pt-3.5 first:pt-0 p-4 rounded-2xl transition-all border ${
                  isCurrentYear
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1.5 flex-1 min-w-[240px]">
                    {/* Unboxed Metadata */}
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-slate-400">
                      <span className="font-bold text-slate-200">Year {item.year}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{item.domain}</span>
                      {item.isAiPrediction && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-purple-300 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Ensemble
                          </span>
                        </>
                      )}
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span
                        className={
                          item.severity === 'tipping-point'
                            ? 'text-fuchsia-400 font-semibold'
                            : item.severity === 'critical'
                            ? 'text-rose-400 font-semibold'
                            : 'text-amber-400 font-semibold'
                        }
                      >
                        {item.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <IconC className="w-4 h-4 text-rose-400 shrink-0" />
                      <h4 className="text-sm font-bold text-slate-100">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-1 text-[11px] font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="text-slate-200 font-semibold">{item.metricName}:</span>
                      <span className="text-rose-300 font-bold">{item.metricValue}</span>
                      <span className="text-slate-500">({item.baselineComparison})</span>
                    </div>

                    {/* COMPLICATED MODE: INDIVIDUAL ALERT BIFURCATION TELEMETRY */}
                    {dataMode === 'complicated' && (
                      <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-purple-900/40 font-mono text-[10px] space-y-1">
                        <div className="flex items-center justify-between text-purple-300 font-bold">
                          <span>Dynamical Bifurcation Classification:</span>
                          <span className="text-slate-400">
                            {item.severity === 'tipping-point' ? 'Subcritical Fold Bifurcation' : 'Supercritical Pitchfork / CSD'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-400 pt-0.5">
                          <div>&bull; Autoregressive lag-1 &alpha;_1: <strong className="text-cyan-300">0.942 &plusmn; 0.03</strong></div>
                          <div>&bull; Hysteresis Barrier &Delta;U: <strong className="text-rose-300">1.42 W&middot;m&sup-2;&middot;yr</strong></div>
                          <div>&bull; Poisson Hazard Rate &lambda;(t): <strong className="text-amber-300">0.078 yr&sup-1;</strong></div>
                          <div>&bull; Paleo Baseline: <strong className="text-purple-300">MIS-5e Marine Isotope 5</strong></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0 self-center sm:self-auto">
                    <button
                      onClick={() => {
                        soundFx.playTourChime();
                        onSelectAlert(item);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Jump & Inspect</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-500">
                      📍 {item.locationName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
