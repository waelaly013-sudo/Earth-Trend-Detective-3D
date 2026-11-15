/**
 * NASA Earth Trend Detective - Guided Tour Modal
 * Interactive walkthrough of high-priority climate anomalies
 */

import React from 'react';
import { Compass, ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
import { ClimateRegion } from '../types/climate';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the tour step index, current region details, and step navigation callbacks.
// On the website: Passes the active tour stop information and button actions into the floating tour card.
// Used as: The props blueprint for the TourModal component.
interface TourModalProps {
  currentStepIndex: number;
  totalSteps: number;
  region: ClimateRegion;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isAutoAdvancing: boolean;
  onToggleAutoAdvance: () => void;
}

// What this does: Renders a floating guided tour card that walks users through key climate hotspots one by one.
// On the website: Displays the current stop's headline, rate of change, statistical trend, and Prev/Auto/Next controls.
// Used as: The guided exploration card shown when the user starts the NASA Tour.
export const TourModal: React.FC<TourModalProps> = ({
  currentStepIndex,
  totalSteps,
  region,
  onNext,
  onPrev,
  onClose,
  isAutoAdvancing,
  onToggleAutoAdvance,
}) => {
  return (
    <div className="fixed top-20 left-2 md:left-4 z-30 w-64 md:w-80 max-w-[calc(100vw-1rem)] bg-slate-900/95 border border-amber-500/40 rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-2xl text-slate-100 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 md:pb-2 mb-1.5 md:mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Compass className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
          <span className="text-[10px] md:text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            NASA Tour ({currentStepIndex + 1}/{totalSteps})
          </span>
        </div>
        <button
          onClick={() => {
            soundFx.playTick();
            onClose();
          }}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Exit Tour"
        >
          <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>

      {/* Tour Step Body */}
      <div className="space-y-1.5 md:space-y-2 text-[11px] md:text-xs">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span
            className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full"
            style={{ backgroundColor: region.color }}
          ></span>
          <h3 className="font-bold text-white text-xs md:text-sm font-heading">{region.name}</h3>
        </div>

        <p className="font-mono text-cyan-300 text-[10px] md:text-[11px]">{region.variableName}</p>

        <p className="text-slate-300 text-[10px] md:text-[11px] leading-snug md:leading-relaxed">
          {region.headlineSummary}
        </p>

        <div className="p-1.5 md:p-2 bg-slate-950/80 rounded-lg md:rounded-xl border border-slate-800 text-[9.5px] md:text-[10px] font-mono">
          <div className="text-slate-400">Rate of Change:</div>
          <div className="text-rose-300 font-bold">{region.rateOfChangeDecade}</div>
          <div className="text-emerald-400 mt-0.5 md:mt-1">
            Mann-Kendall p = {region.mannKendall.pValue < 0.0001 ? '< 0.0001' : region.mannKendall.pValue.toFixed(4)} (Significant)
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-1.5 md:gap-2 mt-2 md:mt-3 pt-1.5 md:pt-2 border-t border-slate-800">
        <button
          onClick={() => {
            soundFx.playTick();
            onPrev();
          }}
          disabled={currentStepIndex === 0}
          className="p-1 md:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-[10px] md:text-xs font-mono flex items-center gap-1"
        >
          <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
          <span>Prev</span>
        </button>

        <button
          onClick={() => {
            soundFx.playTick();
            onToggleAutoAdvance();
          }}
          className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[9.5px] md:text-[10px] font-mono border flex items-center gap-1 ${
            isAutoAdvancing
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}
          title="Auto-advance tour every 8 seconds"
        >
          {isAutoAdvancing ? <Pause className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <Play className="w-2.5 h-2.5 md:w-3 md:h-3" />}
          <span>{isAutoAdvancing ? 'Auto' : 'Manual'}</span>
        </button>

        <button
          onClick={() => {
            soundFx.playTick();
            onNext();
          }}
          className="p-1 md:p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] md:text-xs font-mono flex items-center gap-1 font-semibold"
        >
          <span>Next</span>
          <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
        </button>
      </div>
    </div>
  );
};
