/**
 * NASA Earth Trend Detective - Spoken Voice Announcement HUD
 * Gives the user full control over whether to listen to the spoken temperature change.
 * Audio NEVER plays automatically: the user explicitly clicks "Listen" to hear it.
 */

import React from 'react';
import { Volume2, VolumeX, X, Play, Square as StopIcon, Thermometer } from 'lucide-react';
import { MONTH_NAMES } from '../data/countriesData';

// What this does: Describes all temperature numbers, location labels, and playback status for a voice announcement.
// On the website: Holds the spoken script and past/present/2040 temperatures displayed inside the floating voice bar.
// Used as: The data structure passed from the globe app into VoiceAnnouncementHUD.
export interface SpokenAnnouncement {
  text: string;
  locationName: string;
  flagEmoji?: string;
  month: number;
  prevMonth: number;
  tempC: number;
  diffC: number;
  pastTempC: number;
  presentTempC: number;
  predTempC: number;
  isSpeaking: boolean;
}

// What this does: Defines the current announcement data and the play/stop and dismiss button handlers.
// On the website: Controls whether the voice narration bar is displayed and how its buttons respond.
// Used as: The props interface for VoiceAnnouncementHUD.
interface VoiceAnnouncementHUDProps {
  announcement: SpokenAnnouncement | null;
  onTogglePlay: () => void;
  onDismiss: () => void;
}

// What this does: Renders a floating top banner where the user can choose to listen to or stop spoken climate updates.
// On the website: Shows the selected place's temperature shift, past/present/2040 comparison, and a Listen/Stop button.
// Used as: The user-controlled voice narration heads-up display at the top of the screen.
export const VoiceAnnouncementHUD: React.FC<VoiceAnnouncementHUDProps> = ({
  announcement,
  onTogglePlay,
  onDismiss,
}) => {
  if (!announcement) return null;

  const monthName = MONTH_NAMES[announcement.month - 1];
  const prevMonthName = MONTH_NAMES[announcement.prevMonth - 1];
  const diffSign = announcement.diffC > 0 ? '+' : '';
  const diffColor =
    announcement.diffC > 0
      ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
      : announcement.diffC < 0
      ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30'
      : 'text-slate-300 bg-slate-900 border-slate-700';

  return (
    <div className="fixed top-20 md:top-16 left-1/2 -translate-x-1/2 z-30 max-w-sm md:max-w-xl w-[92vw] sm:w-auto animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
      <div className="px-2.5 py-1.5 md:px-4 md:py-2.5 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-xl md:rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.3)] text-[10px] md:text-xs font-mono">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          {/* Header & Location Info */}
          <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
            <div
              className={`p-1 md:p-1.5 rounded-lg md:rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                announcement.isSpeaking
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 md:w-4 md:h-4 ${announcement.isSpeaking ? 'animate-pulse text-cyan-400' : 'text-slate-400'}`} />
            </div>

            {/* Audio Wave Visualizer Bars - only visible when audio is actively playing */}
            {announcement.isSpeaking && (
              <div className="hidden sm:flex items-center gap-0.5 h-4 px-1" title="Voice audio playing">
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2"></span>
                <span className="w-1 bg-cyan-300 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.1s] h-4"></span>
                <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s] h-3"></span>
                <span className="w-1 bg-cyan-300 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.15s] h-3.5"></span>
              </div>
            )}

            <div className="truncate">
              <div className="flex items-center gap-1 md:gap-1.5 truncate">
                {announcement.flagEmoji && <span className="text-xs md:text-sm">{announcement.flagEmoji}</span>}
                <span className="font-bold text-white tracking-wide truncate">
                  {announcement.locationName}
                </span>
                <span className="text-slate-400 text-[9px] md:text-[11px]">&bull;</span>
                <span className="text-cyan-300 font-semibold">{monthName}</span>
              </div>
              <div className="text-[9px] md:text-[10px] text-slate-400 truncate">
                {announcement.isSpeaking ? 'Playing voice narration...' : 'Click "Listen" to hear aloud'}
              </div>
            </div>
          </div>

          {/* User Choice Controls: Click to Listen or Stop */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onTogglePlay}
              className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs flex items-center gap-1 transition-all cursor-pointer border ${
                announcement.isSpeaking
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/60 text-rose-300'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              }`}
              title={announcement.isSpeaking ? 'Stop voice audio' : 'Listen to spoken temperature narration'}
            >
              {announcement.isSpeaking ? (
                <>
                  <StopIcon className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                  <span>Listen</span>
                </>
              )}
            </button>

            <button
              onClick={onDismiss}
              className="p-1 md:p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close HUD"
            >
              <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>

        {/* Detailed Temperature Shift Telemetry Breakdown */}
        <div className="mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 md:gap-2 text-[9.5px] md:text-[11px]">
          {/* Month vs Previous Month Delta */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Thermometer className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
              <span>{monthName} Temp:</span>
              <strong className="text-white font-bold">{announcement.tempC}&deg;C</strong>
            </span>

            <span className={`px-1.5 py-0.5 rounded-md border text-[9px] md:text-[10px] font-bold ${diffColor}`}>
              {diffSign}{announcement.diffC}&deg;C vs {prevMonthName}
            </span>
          </div>

          {/* Past, Present, Prediction Tri-Epoch Mini Stats */}
          <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] text-slate-400">
            <span>Past (2000): <strong className="text-slate-300">{announcement.pastTempC}&deg;C</strong></span>
            <span>&bull;</span>
            <span>Present: <strong className="text-cyan-300">{announcement.presentTempC}&deg;C</strong></span>
            <span>&bull;</span>
            <span>2040 AI: <strong className="text-rose-300">{announcement.predTempC}&deg;C</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
