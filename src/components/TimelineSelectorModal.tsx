/**
 * NASA Earth Trend Detective - 4D Climate Timeline Selector Modal
 * Enables users to:
 * 1. Choose any year in the past to return to (2000–2026 satellite observation era)
 * 2Choose any month in the past to return to (january-decamber satellite observation era)
 * 3. Choose any future year to predict (2027–2040 AI SSP2-4.5 multi-model ensemble)
 * 4 Choose any future month to predict ( january-decamber AI SSP2-4.5 multi-model ensemble)
 * 5. Run forward timeline simulation playback
 * 6. Inspect real-time multi-branch planetary telemetry previews
 */

import React, { useState } from 'react';
import {
  X,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Globe2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Thermometer,
  Droplets,
  Wind,
  CheckCircle2,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { DataBranch } from '../types/climate';
import { getGlobalMeanAnomaly, MONTH_NAMES, MONTH_SHORT } from '../data/countriesData';
import { getGlobalMeanHumidityAnomaly } from '../data/nasaHumidityData';
import { getGlobalMeanWindAnomaly } from '../data/nasaWindData';
import { soundFx } from '../utils/audioSynth';

interface TimelineSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  onSelectYear: (year: number) => void;
  currentMonth?: number;
  onSelectMonth?: (month: number) => void;
  isPlaying: boolean;
  onTogglePlay: (playing: boolean) => void;
  dataBranch: DataBranch;
  onOpenBottomDock?: () => void;
}

interface HistoricalMilestone {
  year: number;
  title: string;
  badge: string;
  tagline: string;
  icon: string;
  activeSatellites: string[];
}

interface PredictiveMilestone {
  year: number;
  title: string;
  badge: string;
  tagline: string;
  icon: string;
  projectionFocus: string;
}

// What this does: Lists 8 famous historical climate years (2000 to 2026) and the NASA satellites that were watching Earth then.
// On the website: Displays clickable cards in the "Return to Past Satellite Era" tab so users can jump straight to key moments.
// Used as: Preset milestone buttons for past years.
const HISTORICAL_MILESTONES: HistoricalMilestone[] = [
  {
    year: 2000,
    title: 'Earth System Baseline (Jan 2000)',
    badge: 'Baseline Start',
    tagline: 'Launch of MODIS Terra and initiation of high-resolution global climate telemetry.',
    icon: '🛰️',
    activeSatellites: ['Terra (MODIS)', 'TRMM', 'Landsat-7', 'QuikSCAT'],
  },
  {
    year: 2003,
    title: 'European Mega-Heatwave',
    badge: 'Record Heat Event',
    tagline: 'Unprecedented summer thermal anomaly across Europe, catalyzing modern climate attribution.',
    icon: '🌡️',
    activeSatellites: ['Aqua (AIRS/MODIS)', 'GRACE', 'Envisat'],
  },
  {
    year: 2007,
    title: 'Arctic Sea-Ice Minimum Shock',
    badge: 'Cryosphere Shift',
    tagline: 'Record summer Arctic sea-ice collapse, exposing dark polar ocean waters.',
    icon: '❄️',
    activeSatellites: ['Aqua', 'CloudSat', 'CALIPSO', 'ICESat'],
  },
  {
    year: 2012,
    title: 'Greenland Ice Sheet Melt Peak',
    badge: 'Melt Anomaly',
    tagline: 'Extreme melt event observed across 98% of Greenland ice sheet surface area.',
    icon: '🧊',
    activeSatellites: ['Suomi-NPP (VIIRS)', 'Aqua', 'Terra', 'GRACE'],
  },
  {
    year: 2015,
    title: 'Paris Agreement & Super El Niño',
    badge: 'Global Policy Horizon',
    tagline: 'Global surface temperature breaks records during intense tropical Pacific El Niño.',
    icon: '🌍',
    activeSatellites: ['OCO-2 (Carbon)', 'SMAP (Soil Moisture)', 'RapidScat on ISS'],
  },
  {
    year: 2020,
    title: 'Global Pandemic Emission Dip',
    badge: 'Aerosol Perturbation',
    tagline: 'Sharp temporary reduction in anthropogenic aerosols followed by rapid thermal rebound.',
    icon: '📉',
    activeSatellites: ['Sentinel-6 Michael Freilich', 'CYGNSS (Wind)', 'OCO-3'],
  },
  {
    year: 2023,
    title: 'Hottest Global Year on Record',
    badge: 'Climate Milestone',
    tagline: 'Global mean temperature approaches +1.45°C; marine heatwaves span Atlantic and Pacific.',
    icon: '🔥',
    activeSatellites: ['Landsat-9', 'ICESat-2', 'SWOT (Surface Water)'],
  },
  {
    year: 2026,
    title: 'Present Observational Epoch (Nov 2026)',
    badge: 'Present Day Today',
    tagline: 'Current baseline year. High-resolution multi-satellite Earth observing constellation active.',
    icon: '📡',
    activeSatellites: ['NASA EOS Grid', 'NISAR (Radar)', 'PACE (Ocean/Aerosol)', 'CYGNSS'],
  },
];

// What this does: Lists 4 key future climate years (2027 to 2040) predicted by climate models.
// On the website: Displays clickable cards in the "Choose Year to Predict" tab for exploring future warming scenarios.
// Used as: Preset milestone buttons for future predictions.
const PREDICTIVE_MILESTONES: PredictiveMilestone[] = [
  {
    year: 2027,
    title: 'Near-Term Horizon',
    badge: 'AI Ensemble Initiation',
    tagline: 'First year of CMIP6 SSP2-4.5 AI neural projection; regional warming divergence begins.',
    icon: '🔮',
    projectionFocus: 'Near-term jet stream waviness and continental moisture decline',
  },
  {
    year: 2030,
    title: 'IPCC 1.5°C Global Threshold Window',
    badge: 'Crucial Milestone',
    tagline: 'Projected multi-year mean crossing of the +1.5°C threshold above pre-industrial levels.',
    icon: '⚠️',
    projectionFocus: 'Arctic summer ice-free probability and Mediterranean agricultural aridity',
  },
  {
    year: 2035,
    title: 'Mid-Decadal Climate Acceleration',
    badge: 'Dynamic Shift',
    tagline: 'Amplified polar jet stream stalling, shifting mid-latitude storm and wind tracks.',
    icon: '🌪️',
    projectionFocus: 'Tropical wet-bulb 33°C labor limits and offshore wind power droughts',
  },
  {
    year: 2040,
    title: 'Decadal Climate Horizon (End Range)',
    badge: 'Horizon Limit (Dec 2040)',
    tagline: 'Long-term SSP2-4.5 equilibrium state: +1.85°C global surface temperature departure (95% CI).',
    icon: '🪐',
    projectionFocus: 'High-latitude polar amplification (+3.2°C) and global circulation restructuring',
  },
];

// What this does: Opens a full-screen popup where users can pick any past or future year/month, run playback, and preview temperature/humidity/wind changes.
// On the website: Appears as the "4D Climate Timeline: Past & Predictive Horizons" modal when opened from the menu.
// Used as: The detailed time-travel picker modal for the app.
export const TimelineSelectorModal: React.FC<TimelineSelectorModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  onSelectYear,
  currentMonth = 7,
  onSelectMonth,
  isPlaying,
  onTogglePlay,
  dataBranch,
  onOpenBottomDock,
}) => {
  const [selectedTab, setSelectedTab] = useState<'past' | 'predict'>(() => {
    return currentYear > 2026 ? 'predict' : 'past';
  });

  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  if (!isOpen) return null;

  const isPredictive = currentYear > 2026;
  const tempAnomaly = getGlobalMeanAnomaly(currentYear);
  const humidityAnomaly = getGlobalMeanHumidityAnomaly(currentYear);
  const windAnomaly = getGlobalMeanWindAnomaly(currentYear);

  // What this does: Applies the clicked milestone year, plays a chime, and makes sure the bottom timeline dock is visible.
  // On the website: Updates the whole 3D Earth and telemetry immediately when a milestone card or quick-jump button is clicked.
  // Used as: The year-selection callback inside the modal.
  const handleApplyYear = (targetYear: number) => {
    soundFx.playChime();
    onSelectYear(targetYear);
    if (onOpenBottomDock) {
      onOpenBottomDock();
    }
  };

  // What this does: Moves the selected year forward or backward by 1 or 5 years while keeping it between 2000 and 2040.
  // On the website: Powers the -5y, <, >, and +5y stepper buttons next to the year badge.
  // Used as: The year-stepping helper.
  const handleStepYear = (delta: number) => {
    soundFx.playTick();
    const nextYear = Math.max(2000, Math.min(2040, currentYear + delta));
    onSelectYear(nextYear);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg border border-cyan-400/40 shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                  4D Climate Timeline: Past &amp; Predictive Horizons
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    isPredictive
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {isPredictive ? '🔮 AI PREDICTION' : '🛰️ SATELLITE RECORD'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Choose any year to inspect past satellite telemetry (2000–2026) or simulate future AI predictions (2027–2040).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Selected Year Banner & Quick Actions */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold">Selected Year:</span>
            <span
              className={`text-2xl font-mono font-black tracking-widest px-3 py-0.5 rounded-xl border ${
                isPredictive
                  ? 'bg-gradient-to-r from-rose-950 to-purple-950 text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
            >
              {currentYear}
            </span>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => handleStepYear(-5)}
                disabled={currentYear <= 2000}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-[11px]"
                title="Rewind 5 years"
              >
                -5y
              </button>
              <button
                onClick={() => handleStepYear(-1)}
                disabled={currentYear <= 2000}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                title="Rewind 1 year"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleStepYear(1)}
                disabled={currentYear >= 2040}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                title="Forward 1 year"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleStepYear(5)}
                disabled={currentYear >= 2040}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-[11px]"
                title="Forward 5 years"
              >
                +5y
              </button>
            </div>
          </div>

          {/* Simulation Playback & Jump Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playChime();
                onTogglePlay(!isPlaying);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer border ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play 4D Simulation</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleApplyYear(2000)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer border border-slate-700"
              title="Rewind to baseline 2000"
            >
              2000 Baseline
            </button>
            <button
              onClick={() => handleApplyYear(2026)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs cursor-pointer border border-slate-700"
              title="Jump to current year 2026"
            >
              2026 Present
            </button>
            <button
              onClick={() => handleApplyYear(2040)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-mono text-xs cursor-pointer border border-rose-700/60"
              title="Jump to 2040 AI Prediction"
            >
              2040 Horizon
            </button>
          </div>
        </div>

        {/* Global Year Scrubber Range Slider (Continuous 2000 - 2040) */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5" />
              <span>NASA Satellite Era (2000–2026)</span>
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Projections (2027–2040)</span>
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              min={2000}
              max={2040}
              step={1}
              value={currentYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                onSelectYear(yr);
              }}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            {/* Split marker indicator between 2026 and 2027 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none"
              style={{ left: `${((2026 - 2000) / 40) * 100}%` }}
              title="Present Year boundary (2026)"
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
            <span>2000</span>
            <span>2005</span>
            <span>2010</span>
            <span>2015</span>
            <span>2020</span>
            <span className="text-cyan-300 font-bold">2026 (Now)</span>
            <span className="text-rose-300">2030</span>
            <span className="text-rose-300">2035</span>
            <span className="text-rose-300 font-bold">2040</span>
          </div>

          {/* Month Selector for Chosen Year */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                Target Month ({MONTH_NAMES[currentMonth - 1]}):
              </span>
              <span className="text-slate-400 text-[10px]">
                {currentMonth === 7 ? 'Peak Boreal Summer / Austral Winter' : currentMonth === 1 ? 'Peak Austral Summer / Boreal Winter' : 'Equinoctial Seasonal Transition'}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
              {MONTH_SHORT.map((mShort, idx) => {
                const mNum = idx + 1;
                const isSelected = currentMonth === mNum;
                return (
                  <button
                    key={mShort}
                    onClick={() => {
                      soundFx.playTick();
                      if (onSelectMonth) onSelectMonth(mNum);
                    }}
                    className={`py-1 text-[11px] font-mono font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold scale-[1.02]'
                        : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
                    }`}
                    title={`Select month ${MONTH_NAMES[idx]}`}
                  >
                    {mShort}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Multi-Branch Telemetry Bar for Current Year */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/20 border border-amber-500/30">
            <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Thermal Anomaly:</span>
              <span className="font-bold text-amber-300 text-xs">
                +{tempAnomaly >= 0 ? tempAnomaly : 0}°C vs Baseline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Atmospheric Moisture:</span>
              <span className="font-bold text-cyan-300 text-xs">
                {humidityAnomaly.landRelativeHumidityAnomalyPct}% RH ({humidityAnomaly.globalMeanVPDAnomalyKPa} kPa VPD)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-teal-950/20 border border-teal-500/30">
            <Wind className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block">Surface Wind Velocity:</span>
              <span className="font-bold text-teal-300 text-xs">
                {windAnomaly.meanWindSpeedMs} m/s ({windAnomaly.meanWindSpeedKmh} km/h)
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs: Return to Past vs Predict Future */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/90 text-xs font-mono">
          <button
            onClick={() => {
              soundFx.playTick();
              setSelectedTab('past');
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-bold transition-all cursor-pointer border-b-2 ${
              selectedTab === 'past'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Return to Past Satellite Era (2000–2026)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              8 Milestones
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              setSelectedTab('predict');
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-bold transition-all cursor-pointer border-b-2 ${
              selectedTab === 'predict'
                ? 'border-rose-400 text-rose-300 bg-rose-950/30'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Choose Year to Predict (2027–2040 AI Horizon)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700/60">
              SSP2-4.5
            </span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {selectedTab === 'past' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-white text-sm">
                    Select a Past Year to Return To
                  </h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Click any key year to instantly load historical MODIS, AIRS, CYGNSS, and GRACE-FO observations onto the 3D globe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {HISTORICAL_MILESTONES.map((m) => {
                  const isCurrent = currentYear === m.year;
                  return (
                    <button
                      key={m.year}
                      onClick={() => handleApplyYear(m.year)}
                      className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                        isCurrent
                          ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                          : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-xl">{m.icon}</span>
                        <span className="text-lg font-mono font-black text-cyan-300">
                          {m.year}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-200 border border-slate-700 block w-fit font-bold">
                          {m.badge}
                        </span>
                        <h5 className="font-heading font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                          {m.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                          {m.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Satellites: {m.activeSatellites.length}</span>
                        <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Return <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-white text-sm">
                    Select a Future Year to Predict
                  </h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Simulate future Earth system states driven by NASA neural network models under the IPCC SSP2-4.5 intermediate pathway.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PREDICTIVE_MILESTONES.map((m) => {
                  const isCurrent = currentYear === m.year;
                  return (
                    <button
                      key={m.year}
                      onClick={() => handleApplyYear(m.year)}
                      className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                        isCurrent
                          ? 'bg-gradient-to-br from-rose-950/80 to-purple-950/80 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                          : 'bg-slate-950/70 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-xl">{m.icon}</span>
                        <span className="text-lg font-mono font-black text-rose-300">
                          {m.year}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-rose-200 border border-slate-700 block w-fit font-bold">
                          {m.badge}
                        </span>
                        <h5 className="font-heading font-bold text-xs text-white group-hover:text-rose-300 transition-colors">
                          {m.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                          {m.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-rose-400/80">AI Model</span>
                        <span className="text-rose-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Predict <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Prediction Model Calibration Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-sans text-slate-300">
                <span className="font-mono text-rose-400 font-bold block uppercase tracking-wider text-[11px]">
                  🔬 About NASA Earth AI Neural Projection Engine:
                </span>
                <p>
                  Predictions from 2027 through 2040 are generated by a multi-model ensemble constrained by the Coupled Model Intercomparison Project Phase 6 (CMIP6) SSP2-4.5 (Middle of the Road) scenario, assimilated with 26 years of continuous NASA Terra, Aqua, CYGNSS, and GISTEMP v4 empirical observations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>NASA Mission Controls</span>
            <span>•</span>
            <span className="text-cyan-300">Timeline Range: 2000–2040</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playTick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                soundFx.playChime();
                if (onOpenBottomDock) {
                  onOpenBottomDock();
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-950/60 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply {currentYear} &amp; View Globe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
