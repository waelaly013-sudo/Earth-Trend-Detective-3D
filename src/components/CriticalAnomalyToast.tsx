/**
 * Critical Anomaly Alert Toast Notification System
 * Non-intrusive, real-time alert card displayed when timeline playback hits
 * significant climate anomaly spikes, ice collapses, or ecological tipping points.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CriticalAnomalyAlert } from '../types/climate';
import {
  AlertTriangle,
  Flame,
  Snowflake,
  Waves,
  Trees,
  X,
  Compass,
  Bell,
  BellOff,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// What this does: Lists the inputs needed by the floating anomaly alert toast popup.
// On the website: Passes in the triggered climate alert, mute toggle, inspect action, and dismiss callback.
// Used as: The TypeScript props interface for CriticalAnomalyToast.
interface CriticalAnomalyToastProps {
  alert: CriticalAnomalyAlert | null;
  onDismiss: () => void;
  onInspect: (alert: CriticalAnomalyAlert) => void;
  alertsMuted: boolean;
  onToggleMuteAlerts: () => void;
  soundEnabled: boolean;
}

// What this does: Displays a sleek auto-closing notification card in the top-right corner when the timeline crosses a major climate milestone.
// On the website: Shows a quick alert with an "Inspect" button to fly the 3D Earth to the anomaly and a timer bar that pauses on hover.
// Used as: The non-intrusive toast alert banner during timeline playback.
export const CriticalAnomalyToast: React.FC<CriticalAnomalyToastProps> = ({
  alert,
  onDismiss,
  onInspect,
  alertsMuted,
  onToggleMuteAlerts,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);
  const durationMs = 5000;
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);

  // What this does: Runs a 5-second countdown bar that automatically closes the toast unless the user hovers over it.
  // On the website: Animates the thin colored timer bar at the bottom of the alert card.
  // Used as: An auto-dismiss animation loop effect.
  useEffect(() => {
    if (!alert) return;

    setProgress(100);
    startTimeRef.current = Date.now();
    elapsedBeforePauseRef.current = 0;

    let animFrame: number;

    const tick = () => {
      if (isPaused) {
        animFrame = requestAnimationFrame(tick);
        return;
      }

      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);

      if (elapsed >= durationMs) {
        onDismiss();
      } else {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrame);
  }, [alert, isPaused, onDismiss]);

  // What this does: Pauses the 5-second close timer and records elapsed time when the mouse pointer moves onto the alert card.
  // On the website: Gives the user extra time to read the alert without it disappearing under their cursor.
  // Used as: The onMouseEnter handler on the toast container.
  const handleMouseEnter = () => {
    setIsPaused(true);
    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
  };

  // What this does: Resumes the countdown timer from where it left off when the mouse leaves the alert card.
  // On the website: Lets the notification finish closing smoothly once the user moves away.
  // Used as: The onMouseLeave handler on the toast container.
  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  if (!alert) return null;

  // What this does: Chooses the icon, border color, glow, and progress bar color matching the alert's category (ice, heat, ocean, forest).
  // On the website: Styles ice alerts cyan, heat alerts red/rose, ocean alerts blue, and forest alerts green.
  // Used as: A styling configuration lookup helper.
  const getCategoryConfig = () => {
    switch (alert.categoryIcon) {
      case 'ice':
        return {
          icon: Snowflake,
          colorText: 'text-cyan-300',
          borderColor: 'border-cyan-500/50',
          glowShadow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
          barColor: 'bg-cyan-400',
          accentBg: 'bg-cyan-950/60',
          tagText: 'text-cyan-400',
        };
      case 'heat':
        return {
          icon: Flame,
          colorText: 'text-rose-300',
          borderColor: 'border-rose-500/50',
          glowShadow: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
          barColor: 'bg-rose-500',
          accentBg: 'bg-rose-950/60',
          tagText: 'text-rose-400',
        };
      case 'ocean':
        return {
          icon: Waves,
          colorText: 'text-blue-300',
          borderColor: 'border-blue-500/50',
          glowShadow: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
          barColor: 'bg-blue-400',
          accentBg: 'bg-blue-950/60',
          tagText: 'text-blue-400',
        };
      case 'forest':
        return {
          icon: Trees,
          colorText: 'text-emerald-300',
          borderColor: 'border-emerald-500/50',
          glowShadow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
          barColor: 'bg-emerald-400',
          accentBg: 'bg-emerald-950/60',
          tagText: 'text-emerald-400',
        };
      default:
        return {
          icon: AlertTriangle,
          colorText: 'text-amber-300',
          borderColor: 'border-amber-500/50',
          glowShadow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
          barColor: 'bg-amber-400',
          accentBg: 'bg-amber-950/60',
          tagText: 'text-amber-400',
        };
    }
  };

  const config = getCategoryConfig();
  const IconComp = config.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-20 right-2 md:right-4 z-40 max-w-[270px] sm:max-w-sm md:max-w-md w-[calc(100vw-1rem)] md:w-[410px] bg-slate-950/95 backdrop-blur-xl border ${config.borderColor} rounded-xl md:rounded-2xl ${config.glowShadow} overflow-hidden font-sans transition-all duration-300 animate-in fade-in slide-in-from-top-3`}
    >
      {/* Top Banner & Telemetry Header */}
      <div className="p-2 md:p-4 space-y-1.5 md:space-y-2.5">
        <div className="flex items-start justify-between gap-1.5 md:gap-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className={`p-1 md:p-1.5 rounded-lg ${config.accentBg} border ${config.borderColor} shrink-0`}>
              <IconComp className={`w-3.5 h-3.5 md:w-4 md:h-4 ${config.colorText} animate-pulse`} />
            </div>
            <div>
              {/* Unboxed Metadata text following zero-pill design */}
              <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-mono tracking-wider uppercase text-slate-400">
                <span className="font-bold text-slate-300">YEAR {alert.year}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{alert.domain}</span>
                {alert.isAiPrediction && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-purple-300 flex items-center gap-0.5">
                      <Sparkles className="w-2 h-2 md:w-2.5 md:h-2.5" />
                      AI SIM
                    </span>
                  </>
                )}
              </div>
              <h4 className="text-[11px] md:text-sm font-bold text-slate-100 leading-snug tracking-tight">
                {alert.title}
              </h4>
            </div>
          </div>

          {/* Controls: Mute & Dismiss */}
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0 -mt-0.5 -mr-1">
            <button
              onClick={onToggleMuteAlerts}
              title={alertsMuted ? 'Unmute anomaly alerts' : 'Mute anomaly alerts'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {alertsMuted ? (
                <BellOff className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-500" />
              ) : (
                <Bell className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-300" />
              )}
            </button>
            <button
              onClick={onDismiss}
              title="Dismiss notification"
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>

        {/* Metric Highlight Box */}
        <div className="px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 md:gap-3">
          <div className="truncate">
            <div className="text-[8.5px] md:text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {alert.metricName}
            </div>
            <div className={`text-[11px] md:text-sm font-mono font-bold ${config.colorText} truncate`}>
              {alert.metricValue}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[8px] md:text-[9px] font-mono text-slate-400">
              {alert.severity === 'tipping-point'
                ? 'TIPPING POINT'
                : alert.severity === 'critical'
                ? 'CRITICAL ALERT'
                : 'EXTREME ANOMALY'}
            </div>
            <div className="text-[9px] md:text-[10px] font-mono text-slate-300 max-w-[110px] md:max-w-[130px] truncate">
              {alert.baselineComparison}
            </div>
          </div>
        </div>

        {/* Scientific Explanation */}
        <p className="text-[10px] md:text-[11px] leading-snug md:leading-relaxed text-slate-300 line-clamp-2">
          {alert.summary}
        </p>

        {/* Action Button: Fly to & Inspect Anomaly */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="text-[9px] md:text-[10px] font-mono text-slate-400 truncate max-w-[120px] md:max-w-[170px]">
            📍 {alert.locationName}
          </div>
          <button
            onClick={() => onInspect(alert)}
            className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-[10px] md:text-xs font-mono font-semibold transition-all hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95"
          >
            <Compass className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400" />
            <span>Inspect</span>
            <ChevronRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Animated Auto-dismiss Progress Bar */}
      <div className="w-full h-1 bg-slate-900">
        <div
          className={`h-full ${config.barColor} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
