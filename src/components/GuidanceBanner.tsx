/**
 * NASA Earth Trend Detective - Mission Guidance Banner
 * Floating guidance banner that suggests which button to press and acts as an onboarding guide.
 */

import React from 'react';
import { HelpCircle, Globe, X, Sparkles, ArrowRight, Compass } from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

interface GuidanceBannerProps {
  onOpenGuide: () => void;
  onOpenExplore: () => void;
  onOpenWalkthrough?: () => void;
  onDismiss: () => void;
  isOpen: boolean;
}

// What this does: Shows the floating Mission Advisory quick-guide banner when opened by clicking the help (?) button, offering shortcuts to the Tutorial, App Guide, and Country Search.
// On the website: Pops up as a clean bar near the top of the screen when the user asks for help, and stays closed by default until clicked.
// Used as: An on-demand quick-start help banner.
export const GuidanceBanner: React.FC<GuidanceBannerProps> = ({
  onOpenGuide,
  onOpenExplore,
  onOpenWalkthrough,
  onDismiss,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Mission Advisory Guidance"
      className="fixed top-20 md:top-16 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-sm md:max-w-xl animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="relative p-2 md:p-4 rounded-xl md:rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3.5">
        {/* Glow accent bar on left */}
        <div className="absolute left-0 top-2.5 md:top-3 bottom-2.5 md:bottom-3 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 via-teal-400 to-emerald-400" />

        {/* Content */}
        <div className="flex items-start gap-2 md:gap-3 pl-2 md:pl-2.5">
          <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
            <HelpCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-cyan-300 animate-pulse" />
          </div>

          <div className="space-y-0.5 md:space-y-1">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Mission Advisory · Quick Guide
              </span>
              <span className="text-[8px] md:text-[9px] font-mono px-1 md:px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-600/50 font-semibold">
                4 Categories
              </span>
            </div>

            <p className="text-[10.5px] md:text-xs text-slate-200 leading-snug font-sans">
              Buttons are grouped into <strong className="text-white">4 Categories</strong> (Explore, Science, Reports, Mission). Press <strong className="text-cyan-300">App Guide</strong> to see what every button does, or pick a country to begin.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 md:gap-2 pl-2 sm:pl-0 w-full sm:w-auto shrink-0 justify-end">
          {onOpenWalkthrough && (
            <button
              onClick={() => {
                soundFx.playChime();
                onOpenWalkthrough();
              }}
              className="flex items-center justify-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl font-mono text-[10px] md:text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md transition-all cursor-pointer"
              title="Start Full Interactive Tutorial Walkthrough"
            >
              <Compass className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>Tutorial</span>
            </button>
          )}

          <button
            onClick={() => {
              soundFx.playChime();
              onOpenGuide();
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl font-mono text-[10px] md:text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-md hover:shadow-cyan-500/25 transition-all cursor-pointer"
            title="Press to open App Guide with full button descriptions and scientific roles"
          >
            <HelpCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>App Guide</span>
            <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              onOpenExplore();
            }}
            className="flex items-center justify-center gap-1 md:gap-1.5 px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg md:rounded-xl font-mono text-[10px] md:text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Search and select any country"
          >
            <Globe className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Country</span>
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              onDismiss();
            }}
            className="p-1 md:p-1.5 rounded-lg md:rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss guide advisory"
            aria-label="Dismiss guide advisory"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
