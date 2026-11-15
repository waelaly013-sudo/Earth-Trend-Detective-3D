/**
 * NASA Earth Trend Detective - 4D Time Machine Dock
 * 
 * Redesigned for:
 * - Simpler and smaller footprint (compact height, clean 2-row layout).
 * - Space colors: Deep cosmic navy, nebula purple (#8b5cf6 / #a855f7), royal space blue (#3b82f6 / #1e3a8a), and electric starlight cyan.
 * - Classical fancy Times New Roman typography ("Times New Roman", Times, Georgia, serif).
 * - Ornamental diamond needle pointer with sapphire & amethyst jewel pointing directly to the timeline track.
 * - Continuous 2000–2040 range (492 monthly steps) with detailed monthly reports & explanations.
 * - Automatic open on launch with easy toggle.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Clock,
  ChevronDown,
  ChevronUp,
  Volume2,
  FileText,
  Sparkles,
  RotateCw,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ClimateRegion, GlobeLayers, ActiveInspectorItem, DataBranch } from '../types/climate';
import { soundFx } from '../utils/audioSynth';
import { useUnitsAndLanguage } from '../context/UnitAndLanguageContext';
import {
  START_YEAR,
  END_YEAR,
  TODAY_YEAR,
  TODAY_MONTH,
  TOTAL_STEPS,
  TODAY_STEP_INDEX,
  TODAY_PERCENT,
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  yearMonthToStep,
  stepToYearMonth,
  isProjectedDate,
  formatMonthYear,
  generateTimelineTicks,
} from '../config/timelineConfig';
import {
  getDetailedMonthlyClimateReport,
  MonthlyClimateReport,
} from '../data/climateCharacteristicsReports';

// What this does: Divides the 2000–2040 timeline into 5 named climate eras with colors and summaries.
// On the website: Helps explain how past satellite observations transition into future climate predictions (#8b5cf6).
// Used as: Reference metadata for timeline eras.
export const CLIMATE_CHARACTERISTIC_ERAS = [
  {
    id: 'era1',
    startYear: 2000,
    endYear: 2010,
    startStep: yearMonthToStep(2000, 1),
    endStep: yearMonthToStep(2010, 12),
    romanNumber: 'I',
    title: '2000–2010: Baseline Era',
    shortLabel: '2000–2010 Baseline',
    tempRange: '+0.65°C to +0.85°C',
    color: '#3b82f6',
    description: 'Empirical satellite baseline and early cryospheric stability.',
  },
  {
    id: 'era2',
    startYear: 2011,
    endYear: 2020,
    startStep: yearMonthToStep(2011, 1),
    endStep: yearMonthToStep(2020, 12),
    romanNumber: 'II',
    title: '2011–2020: Rapid Cryosphere Loss',
    shortLabel: '2011–2020 Cryosphere',
    tempRange: '+0.85°C to +1.28°C',
    color: '#6366f1',
    description: 'Arctic sea ice minimum records and 400 ppm CO2 threshold crossing.',
  },
  {
    id: 'era3',
    startYear: 2021,
    endYear: 2026,
    startStep: yearMonthToStep(2021, 1),
    endStep: yearMonthToStep(2026, 11),
    romanNumber: 'III',
    title: '2021–2026: Record Peaks',
    shortLabel: '2021–2026 Peaks',
    tempRange: '+1.15°C to +1.48°C',
    color: '#8b5cf6',
    description: 'Historic summer heat records and extreme marine heatwaves.',
  },
  {
    id: 'era4',
    startYear: 2026,
    endYear: 2035,
    startStep: yearMonthToStep(2026, 12),
    endStep: yearMonthToStep(2035, 12),
    romanNumber: 'IV',
    title: '2027–2035: Paris 1.5°C Crossing',
    shortLabel: '2027–2035 1.5°C Crossing',
    tempRange: '+1.45°C to +1.68°C',
    color: '#8b5cf6',
    description: 'CMIP6 SSP2-4.5 projected multi-year 1.5°C anomaly threshold.',
  },
  {
    id: 'era5',
    startYear: 2036,
    endYear: 2040,
    startStep: yearMonthToStep(2036, 1),
    endStep: yearMonthToStep(2040, 12),
    romanNumber: 'V',
    title: '2036–2040: Decadal Horizon',
    shortLabel: '2036–2040 Horizon',
    tempRange: '+1.68°C to +1.85°C',
    color: '#8b5cf6',
    description: 'Decadal boundary modeling with late-summer ice-free Arctic vulnerability.',
  },
];

interface TimelineControlDockProps {
  year: number;
  onYearChange: (year: number) => void;
  month?: number;
  onMonthChange?: (month: number) => void;
  onListenToVoice?: () => void;
  isSpeakingVoice?: boolean;
  isAiPrediction: boolean;
  layers?: GlobeLayers;
  onToggleLayer?: (layerKey: keyof GlobeLayers) => void;
  visibleHotspotIds?: Record<string, boolean>;
  onToggleHotspot?: (hotspotId: string) => void;
  onSelectAllHotspots?: (enabled: boolean) => void;
  regions?: ClimateRegion[];
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
  rotationSpeed?: number;
  onChangeRotationSpeed?: (speed: number) => void;
  onResetCamera?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: (playing: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  activeLocation?: ActiveInspectorItem | null;
  dataBranch?: DataBranch;
  dataComplexity?: 'simple' | 'normal' | 'complicated';
  isAlienActive?: boolean;
  onToggleAlien?: () => void;
  onOpenClimateReport?: () => void;
}

// What this does: Renders the floating bottom timeline dock that lets the user scrub, play, pause, or jump across every month from 2000 to 2040.
// On the website: Appears as the bottom time-machine bar with the blue observed track, purple (#8b5cf6) prediction track, and "Show/Hide Timeline" tab.
// Used as: The primary time controller for the 3D globe and climate data.
export const TimelineControlDock: React.FC<TimelineControlDockProps> = ({
  year,
  onYearChange,
  month = 11,
  onMonthChange,
  isPlaying: controlledIsPlaying,
  onTogglePlay,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
  onOpenClimateReport,
}) => {
  // Local playback state if uncontrolled
  const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(false);
  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalIsPlaying;

  // Local collapsed state if uncontrolled (defaults to FALSE so it opens automatically)
  const [internalIsCollapsed, setInternalIsCollapsed] = useState<boolean>(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;

  // Playback speed: 1x, 2x, 4x
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [loopPlayback, setLoopPlayback] = useState<boolean>(true);

  // Dragging & Scrubber Tooltip state
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  // Speech synthesis for manual "Read this date aloud"
  const [isSpeakingLocally, setIsSpeakingLocally] = useState<boolean>(false);

  // What this does: Opens or collapses the bottom timeline dock when the user taps the top tab.
  // On the website: Slides the timeline controls up or down to save screen space while keeping the track visible.
  // Used as: The collapse/expand button handler.
  const handleToggleCollapse = (nextVal: boolean) => {
    if (onToggleCollapse) {
      onToggleCollapse(nextVal);
    } else {
      setInternalIsCollapsed(nextVal);
    }
  };

  // Units and Language
  const { language, isRTL, t, formatTempDelta } = useUnitsAndLanguage();

  // Convert current year and month (1-12) to overall step index (0..491)
  const safeMonth = Math.max(1, Math.min(12, month));
  const currentStep = yearMonthToStep(year, safeMonth);
  const progressPercent = Math.max(0, Math.min(100, (currentStep / TOTAL_STEPS) * 100));

  const isProjected = isProjectedDate(year, safeMonth);
  const localizedMonths = t('months') as unknown as string[];
  const currentMonthFull = (Array.isArray(localizedMonths) && localizedMonths[safeMonth - 1]) || MONTH_NAMES_FULL[safeMonth - 1] || 'November';

  // Retrieve comprehensive monthly report for current year and month
  const currentMonthlyReport: MonthlyClimateReport = useMemo(
    () => getDetailedMonthlyClimateReport(year, safeMonth),
    [year, safeMonth]
  );

  // What this does: Converts a timeline step number (0 to 491) back into a year and month and updates the app.
  // On the website: Moves the date readout and updates the globe whenever the user drags, clicks, or plays the timeline.
  // Used as: The central date-jumping helper inside the timeline dock.
  const seekToStep = useCallback(
    (targetStep: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_STEPS, Math.round(targetStep)));
      const { year: nextY, month: nextM } = stepToYearMonth(clamped);
      if (nextY !== year) onYearChange(nextY);
      if (onMonthChange && nextM !== month) onMonthChange(nextM);
    },
    [year, month, onYearChange, onMonthChange]
  );

  // What this does: Steps the timeline forward or backward by exactly one month.
  // On the website: Runs when the user clicks the left (<) or right (>) arrow next to the Play button.
  // Used as: The single-month step button handler.
  const handleStepMonth = useCallback(
    (direction: -1 | 1) => {
      soundFx.playTick();
      seekToStep(currentStep + direction);
    },
    [currentStep, seekToStep]
  );

  // Smooth playback interval
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  // What this does: Automatically advances the timeline month by month at 1x, 2x, or 4x speed while Play is active.
  // On the website: Animates the Earth's heat and timeline pointer smoothly through the years.
  // Used as: The automatic playback timer loop.
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(480 / playbackSpeed);
    const interval = setInterval(() => {
      const nextStep = currentStepRef.current + 1;
      if (nextStep > TOTAL_STEPS) {
        if (loopPlayback) {
          seekToStep(0);
        } else {
          if (onTogglePlay) onTogglePlay(false);
          else setInternalIsPlaying(false);
        }
      } else {
        seekToStep(nextStep);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, loopPlayback, seekToStep, onTogglePlay]);

  // What this does: Starts or pauses timeline playback and plays a gentle click sound.
  // On the website: Controls the blue/purple Play/Pause button on the left of the dock.
  // Used as: The playback toggle handler.
  const togglePlay = () => {
    const nextState = !isPlaying;
    if (onTogglePlay) {
      onTogglePlay(nextState);
    } else {
      setInternalIsPlaying(nextState);
    }
    soundFx.playTick();
  };

  // What this does: Converts the user's mouse or finger X position on the timeline bar into a month/year step.
  // On the website: Moves the white circle pointer to wherever the user clicks or drags along the colored track.
  // Used as: The scrubbing math helper for mouse and touch dragging.
  const handlePointerInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const fraction = offsetX / rect.width;
      seekToStep(fraction * TOTAL_STEPS);
    },
    [seekToStep]
  );

  // What this does: Starts dragging the timeline circle pointer and tracks movement anywhere on the screen until released.
  // On the website: Lets the user smoothly slide back and forth through years 2000–2040.
  // Used as: The pointer-down event handler on the timeline bar.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPlaying && onTogglePlay) onTogglePlay(false);
    setIsDragging(true);
    handlePointerInteraction(e.clientX);

    const onPointerMove = (ev: PointerEvent) => {
      handlePointerInteraction(ev.clientX);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // What this does: Figures out which month/year the mouse is hovering over on the timeline bar.
  // On the website: Shows a floating date preview tooltip above the bar before you even click.
  // Used as: The hover tooltip handler.
  const handlePointerMoveTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const frac = offsetX / rect.width;
    setHoverStep(Math.round(frac * TOTAL_STEPS));
  };

  // What this does: Hides the floating date preview tooltip when the mouse leaves the timeline bar.
  // On the website: Keeps the screen clean when not hovering over the timeline.
  // Used as: The mouse-leave handler.
  const handlePointerLeaveTrack = () => {
    setHoverStep(null);
  };

  // What this does: Lets keyboard users move by month (Arrow keys), by year (Shift+Arrow), jump to start/end, or press Space to play/pause.
  // On the website: Makes the timeline slider controllable with a keyboard.
  // Used as: The accessibility keyboard handler for the slider pointer.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      seekToStep(currentStep + (e.shiftKey ? 12 : 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      seekToStep(currentStep - (e.shiftKey ? 12 : 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      seekToStep(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      seekToStep(TOTAL_STEPS);
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    }
  };

  // 5-year tick marks
  const ticks = useMemo(() => generateTimelineTicks(), []);

  // What this does: Uses the browser's built-in voice synthesizer to speak the selected month's temperature, CO2, and headline aloud in English or Arabic.
  // On the website: Runs when the user taps the purple speaker icon in the timeline bar.
  // Used as: The audio read-aloud button handler.
  const handleReadDateAloud = () => {
    soundFx.playTick();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeakingLocally) {
        window.speechSynthesis.cancel();
        setIsSpeakingLocally(false);
        return;
      }
      window.speechSynthesis.cancel();
      const narrative = language === 'ar'
        ? `${currentMonthFull} ${year}. شذوذ درجة الحرارة العالمية هو ${formatTempDelta(currentMonthlyReport.globalTempAnomalyC)}. ثاني أكسيد الكربون ${currentMonthlyReport.co2Ppm.toFixed(0)} جزء بالمليون. ${currentMonthlyReport.headline}.`
        : `${currentMonthFull} ${year}. Global temperature anomaly is ${formatTempDelta(currentMonthlyReport.globalTempAnomalyC)}. Atmospheric carbon dioxide is ${currentMonthlyReport.co2Ppm.toFixed(0)} parts per million. ${currentMonthlyReport.headline}. ${currentMonthlyReport.summaryReport}`;
      
      const utterance = new SpeechSynthesisUtterance(narrative);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeakingLocally(true);
      utterance.onend = () => setIsSpeakingLocally(false);
      utterance.onerror = () => setIsSpeakingLocally(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      data-tutorial="timeline-dock"
      className={`fixed bottom-1 md:bottom-2 left-1 right-1 sm:left-4 sm:right-4 z-40 max-w-[780px] mx-auto select-none transition-transform duration-300 ease-out ${
        isCollapsed ? 'translate-y-0 md:translate-y-[calc(100%-24px)]' : 'translate-y-0'
      }`}
      style={{
        fontFamily: '"Times New Roman", Times, Georgia, serif',
      }}
    >
      {/* ATTACHED SLENDER TOP TAB: "Hide Timeline" / "Show Timeline" (Space Blue & Purple) */}
      <div className="flex justify-center -mb-px relative z-10">
        <button
          onClick={() => {
            soundFx.playTick();
            handleToggleCollapse(!isCollapsed);
          }}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Show Climate Timeline' : 'Hide Climate Timeline'}
          className="px-2.5 md:px-4 h-5 md:h-6 bg-gradient-to-r from-[#1e1b4b] via-[#0f172a] to-[#1e1b4b] border-t border-x border-[#818cf8]/50 rounded-t-lg text-[9.5px] md:text-[12px] text-[#c7d2fe] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[0_-3px_12px_rgba(30,27,75,0.6)] whitespace-nowrap"
          title={isCollapsed ? 'Show Climate Timeline (2000–2040)' : 'Hide Climate Timeline'}
        >
          {isCollapsed ? (
            <ChevronUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#a855f7] transition-transform duration-300" />
          ) : (
            <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#a855f7] transition-transform duration-300" />
          )}
          <span className="tracking-wide uppercase font-semibold text-[9px] md:text-[11px]">
            {isCollapsed ? (isRTL ? 'إظهار الخط الزمني (2000–2040)' : 'Show Timeline (2000–2040)') : (isRTL ? 'إخفاء الخط الزمني' : 'Hide Timeline')}
          </span>
        </button>
      </div>

      {/* COMPACT MAIN DOCK CONTAINER (Smaller on mobile so completely shown on screen) */}
      <div className={`relative bg-gradient-to-b from-[#090d1a]/95 via-[#0e1428]/95 to-[#150e2e]/95 border border-[#6366f1]/40 rounded-lg md:rounded-xl px-1.5 sm:px-3 md:px-4 shadow-[0_10px_30px_rgba(10,5,30,0.85),0_0_20px_rgba(99,102,241,0.2)] text-slate-100 flex flex-col backdrop-blur-md ${
        isCollapsed ? 'py-1 gap-0.5 md:py-2.5 md:gap-1.5' : 'py-1 md:py-2.5 gap-0.5 md:gap-1.5'
      }`}>
        
        {/* ROW 1: HEADER WITH DATE, CONTROLS, TODAY & DETAILED REPORT */}
        <div className={`${isCollapsed ? 'hidden md:flex' : 'flex'} items-center justify-between gap-1 sm:gap-2 flex-wrap`}>
          
          {/* Left: Playback Controls & Date */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Play/Pause Button */}
            <button
              data-tutorial="timeline-play-btn"
              onClick={togglePlay}
              className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7.5 md:h-7.5 rounded-md md:rounded-lg bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-[#7c3aed] hover:from-[#3b82f6] hover:to-[#9333ea] text-white border border-[#818cf8]/50 shadow-[0_0_10px_rgba(99,102,241,0.4)] cursor-pointer transition-all active:scale-95"
              title={isPlaying ? 'Pause Timeline (Spacebar)' : 'Play Timeline (Spacebar)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 fill-white text-white" />
              ) : (
                <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 fill-white text-white ml-0.5" />
              )}
            </button>

            {/* Step Month Buttons: -1M / +1M */}
            <div className="flex items-center rounded-md bg-[#111827]/80 border border-[#4338ca]/40 overflow-hidden">
              <button
                onClick={() => handleStepMonth(-1)}
                disabled={currentStep <= 0}
                className="p-0.5 sm:p-1 hover:bg-[#312e81] text-[#c7d2fe] hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                title="Previous Month (Left Arrow)"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              </button>
              <button
                onClick={() => handleStepMonth(1)}
                disabled={currentStep >= TOTAL_STEPS}
                className="p-0.5 sm:p-1 hover:bg-[#312e81] text-[#c7d2fe] hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                title="Next Month (Right Arrow)"
                aria-label="Next Month"
              >
                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>

            {/* Display Date */}
            <div className="flex items-baseline gap-1 ml-0.5">
              <span className="text-white font-bold text-[11px] sm:text-[15px] md:text-[20px] tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] leading-none text-[#e0e7ff]">
                {currentMonthFull} {year}
              </span>
            </div>

            {/* Status Pill: Observed (Blue) vs Projected (#8b5cf6) */}
            {isProjected ? (
              <span
                className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border border-[#8b5cf6]/70 bg-[#8b5cf6]/20 text-[#ede9fe] shadow-[0_0_8px_rgba(139,92,246,0.4)] flex items-center gap-1 hidden xs:inline-flex"
                title="Future prediction based on past data (CMIP6 / SSP2-4.5) - #8b5cf6 Horizon"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                <span>{isRTL ? 'توقعات الذكاء' : 'Projected'}</span>
              </span>
            ) : (
              <span
                className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border border-blue-400/50 bg-blue-950/60 text-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.3)] flex items-center gap-1 hidden xs:inline-flex"
                title="Observed historical satellite data from NASA MERRA-2 and GISTEMP"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>{isRTL ? 'بيانات مرصودة' : 'Observed'}</span>
              </span>
            )}
          </div>

          {/* Right: Tools & Detailed Report */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Speed Toggle (1x, 2x, 4x) */}
            <button
              onClick={() => {
                soundFx.playTick();
                setPlaybackSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
              }}
              className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#131b33] hover:bg-[#1c2748] border border-[#4338ca]/50 text-[#c7d2fe] text-[10px] sm:text-[11px] font-semibold cursor-pointer transition-colors"
              title="Change playback speed"
            >
              {playbackSpeed}x
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => {
                soundFx.playTick();
                setLoopPlayback(!loopPlayback);
              }}
              className={`p-1 rounded-md border text-[11px] cursor-pointer transition-colors ${
                loopPlayback
                  ? 'bg-purple-950/70 border-purple-500/60 text-purple-300'
                  : 'bg-[#131b33] border-slate-700/50 text-slate-400 hover:text-white'
              }`}
              title={loopPlayback ? 'Looping enabled' : 'Looping disabled'}
              aria-label="Toggle Loop"
            >
              <Repeat className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </button>

            {/* Today Button: Jump to Nov 2026 */}
            <button
              onClick={() => {
                soundFx.playTick();
                seekToStep(TODAY_STEP_INDEX);
              }}
              className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold cursor-pointer transition-all border ${
                year === TODAY_YEAR && safeMonth === TODAY_MONTH
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                  : 'bg-[#131b33] hover:bg-[#1c2748] border-blue-500/30 text-blue-300'
              }`}
              title="Snap to Today (Nov 2026)"
            >
              {isRTL ? 'اليوم' : 'Today'}
            </button>

            {/* Read Aloud Button */}
            <button
              onClick={handleReadDateAloud}
              className={`p-1 rounded-md border transition-colors cursor-pointer ${
                isSpeakingLocally
                  ? 'bg-purple-950 border-purple-400 text-purple-200 animate-pulse'
                  : 'bg-[#131b33] border-slate-700/50 text-slate-300 hover:text-white hover:border-purple-400/50'
              }`}
              title="Read month report summary aloud"
              aria-label="Read Date Aloud"
            >
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#a855f7]" />
            </button>

            {/* Detailed Climate Report Button */}
            <button
              onClick={() => {
                soundFx.playTourChime();
                if (onOpenClimateReport) {
                  onOpenClimateReport();
                }
              }}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-[#818cf8]/60 bg-gradient-to-r from-[#312e81] via-[#4338ca] to-[#581c87] hover:from-[#3730a3] hover:to-[#6b21a8] text-white text-[10px] sm:text-[12px] font-semibold tracking-wide flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(129,140,248,0.35)] transition-all active:scale-95"
              title="Open full detailed scientific report and monthly explanation for this exact date"
            >
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#a5b4fc]" />
              <span className="hidden xs:inline">{isRTL ? 'تقرير مفصل' : 'Detailed Report'}</span>
              <span className="xs:hidden">{isRTL ? 'تقرير' : 'Report'}</span>
              <Sparkles className="w-2.5 h-2.5 text-[#c084fc] animate-pulse" />
            </button>
          </div>
        </div>

        {/* COMPACT 1-LINE MONTHLY CLIMATE EXPLANATION STRIP */}
        <div
          onClick={() => {
            if (onOpenClimateReport) {
              soundFx.playTourChime();
              onOpenClimateReport();
            }
          }}
          className={`${isCollapsed ? 'hidden md:flex' : 'flex'} w-full px-2 py-0.5 rounded-md bg-[#141b36]/40 hover:bg-[#1a2246] border border-[#6366f1]/20 hover:border-[#818cf8]/40 transition-colors cursor-pointer items-center justify-between gap-2 text-[9.5px] sm:text-[10.5px]`}
          title="Click to open full monthly climate dossier and physical drivers"
        >
          <div className="truncate">
            <span className="text-[#a5b4fc] font-semibold mr-1.5">
              {currentMonthlyReport.headline}:
            </span>
            <span className="text-slate-300 italic truncate">
              "{currentMonthlyReport.summaryReport}"
            </span>
          </div>
          <span className="shrink-0 text-[9.5px] sm:text-[10px] text-[#c084fc] font-bold underline">
            Dossier →
          </span>
        </div>

        {/* ROW 2: CONTINUOUS SPACE-COLORED TIMELINE TRACK WITH CIRCLE POINTER */}
        <div className="relative pt-0.5 md:pt-1 pb-0.5">
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMoveTrack}
            onPointerLeave={handlePointerLeaveTrack}
            className="relative w-full h-[8px] md:h-[14px] cursor-pointer select-none touch-none rounded-full"
            title="Drag or click circular pointer to navigate climate timeline (2000-2040)"
          >
            {/* Base Continuous Space Track (Observed Royal Blue + Solid #8b5cf6 Prediction) */}
            <div className="absolute inset-0 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_0_6px_rgba(99,102,241,0.2)] flex border border-[#4338ca]/60">
              {/* Left Track: Solid Deep Space Blue Observed (Jan 2000 to Nov 2026) */}
              <div
                className="h-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]"
                style={{ width: `${TODAY_PERCENT}%` }}
              />

              {/* Right Track: Solid #8b5cf6 Projected (Dec 2026 to Dec 2040) - NOT STRIPED */}
              <div
                className="h-full flex-1"
                style={{ backgroundColor: '#8b5cf6' }}
              />
            </div>

            {/* 5-Year Major Tick Marks & 1-Year Minor Ticks */}
            <div className="absolute inset-0 pointer-events-none">
              {ticks.map((t) => {
                if (t.isMajor) {
                  return (
                    <div
                      key={t.year}
                      className="absolute top-0 bottom-0 w-[1px] bg-white/60 -translate-x-1/2"
                      style={{ left: `${t.percent}%` }}
                    />
                  );
                }
                return (
                  <div
                    key={t.year}
                    className="absolute top-[3px] bottom-[3px] w-[1px] bg-white/20 -translate-x-1/2"
                    style={{ left: `${t.percent}%` }}
                  />
                );
              })}
            </div>

            {/* Today Marker: Pulsar Line in Electric Starlight Cyan */}
            <div
              className="absolute -top-[5px] -bottom-[5px] w-[2px] bg-[#38bdf8] shadow-[0_0_6px_#38bdf8,0_0_12px_rgba(56,189,248,0.8)] z-10 pointer-events-none -translate-x-1/2"
              style={{ left: `${TODAY_PERCENT}%` }}
            />

            {/* Floating Tooltip while Hovering or Dragging */}
            {(isDragging || hoverStep !== null) && (
              <div
                className="absolute bottom-full mb-3 -translate-x-1/2 pointer-events-none z-40 transition-transform duration-75"
                style={{
                  left: isDragging ? `${progressPercent}%` : `${((hoverStep || 0) / TOTAL_STEPS) * 100}%`,
                }}
              >
                <div className="bg-[#0b0f20]/95 backdrop-blur-md border border-[#818cf8]/70 px-2.5 py-1 rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.9),0_0_8px_rgba(99,102,241,0.3)] text-center whitespace-nowrap">
                  <div className="text-[12px] font-bold text-white">
                    {formatMonthYear(
                      stepToYearMonth(isDragging ? currentStep : (hoverStep || 0)).year,
                      stepToYearMonth(isDragging ? currentStep : (hoverStep || 0)).month
                    )}
                  </div>
                  <div className="text-[9px] text-[#ddd6fe]">
                    {isProjectedDate(
                      stepToYearMonth(isDragging ? currentStep : (hoverStep || 0)).year,
                      stepToYearMonth(isDragging ? currentStep : (hoverStep || 0)).month
                    )
                      ? 'CMIP6 Projection (#8b5cf6 Horizon)'
                      : 'Observed NASA Data'}
                  </div>
                </div>
              </div>
            )}

            {/* DRAGGABLE CIRCLE POINTER */}
            <div
              role="slider"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-valuemin={0}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={currentStep}
              aria-label="Climate Timeline Scrubber Circle Pointer"
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center z-30 outline-none cursor-grab active:cursor-grabbing transition-transform duration-75 ${
                isDragging ? 'scale-125' : 'hover:scale-115'
              }`}
              style={{ left: `${progressPercent}%` }}
            >
              {/* Just a circle pointer */}
              <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 rounded-full bg-white border-2 md:border-[2.5px] border-[#3b82f6] shadow-[0_0_8px_rgba(255,255,255,0.95),0_0_12px_rgba(59,130,246,0.8),0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center">
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#1e3a8a]" />
              </div>
            </div>
          </div>

          {/* 5-YEAR TICK LABELS BENEATH TRACK (Visible & completely shown on mobile and desktop) */}
          <div className={`${isCollapsed ? 'hidden md:block' : 'block'} relative w-full h-3 md:h-3.5 mt-0.5`}>
            {ticks
              .filter((t) => t.isMajor)
              .map((t) => {
                const isSelectedYear = year === t.year;
                let alignClass = '-translate-x-1/2';
                if (t.year === START_YEAR) alignClass = 'translate-x-0';
                if (t.year === END_YEAR) alignClass = '-translate-x-full';

                return (
                  <button
                    key={t.year}
                    onClick={() => seekToStep(t.step)}
                    className={`absolute top-0 ${alignClass} text-[7.5px] sm:text-[9px] md:text-[10px] whitespace-nowrap cursor-pointer transition-colors ${
                      isSelectedYear
                        ? 'text-white font-bold drop-shadow-[0_0_6px_rgba(168,85,247,0.9)] text-[#c7d2fe]'
                        : 'text-[#64748b] hover:text-[#c7d2fe]'
                    }`}
                    style={{ left: `${t.percent}%` }}
                    title={`Jump to year ${t.year}`}
                  >
                    {t.year}
                  </button>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
};
