/**
 * NASA Earth Trend Detective - Mission Header Bar
 * Clean, organized 4-Category Controls (Explore, Science, Reports, Mission),
 * Planetary Telemetry Readout, Data Branch Switchers, and App Guidance.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  Volume2,
  VolumeX,
  Compass,
  FileText,
  MessageSquare,
  Globe,
  Thermometer,
  Sparkles,
  BookOpen,
  Mic,
  ShieldAlert,
  Bot,
  Users,
  User,
  Layers,
  PieChart,
  Scale,
  GraduationCap,
  Laptop,
  Droplets,
  HelpCircle,
  Leaf,
  ChevronDown,
  ChevronUp,
  Wind,
  Clock,
  Sliders,
  Check,
  ArrowRight,
  Sparkle,
  Sprout,
  Snowflake,
  Languages,
  Sun,
  CloudRain,
  CloudFog,
  Eye,
  Flame,
  Shield,
} from 'lucide-react';
import { EarthDomain, DataBranch } from '../types/climate';
import { getGlobalMeanAnomaly } from '../data/countriesData';
import { getGlobalMeanHumidityAnomaly } from '../data/nasaHumidityData';
import { getGlobalMeanWindAnomaly } from '../data/nasaWindData';
import { NASA_INSTRUMENT_REGISTRY, getGlobalVariableAnomaly } from '../data/nasaInstrumentVariables';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';
import { useUnitsAndLanguage } from '../context/UnitAndLanguageContext';

export type HeaderCategory = 'explore' | 'science' | 'reports' | 'mission' | 'more';

interface HeaderBarProps {
  selectedDomain: EarthDomain | 'All';
  onSelectDomain: (domain: EarthDomain | 'All') => void;
  onStartTour: () => void;
  isTouring: boolean;
  onOpenReport: () => void;
  onOpenFeedback: () => void;
  onOpenCountrySearch: () => void;
  onOpenImpactInquiry: () => void;
  onOpenGlossary: () => void;
  onOpenClimateAlerts?: () => void;
  onOpenChatbot?: () => void;
  isChatbotOpen?: boolean;
  onOpenHumanReports?: () => void;
  onOpenAuth?: () => void;
  onOpenComplexityMode?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenNotebook?: () => void;
  onOpenMissionGuide?: () => void;
  onOpenOnboardingWalkthrough?: () => void;
  onOpenDailyAdvice?: () => void;
  onOpenVisualFarm?: () => void;
  onOpenVisualPolar?: () => void;
  onOpenVisualPlaces?: (place?: 'farm' | 'polar') => void;
  onOpenClimateReport?: () => void;
  onToggleTimeline?: () => void;
  isTaskbarOpen?: boolean;
  onToggleTaskbar?: () => void;
  dataBranch?: DataBranch;
  onSelectBranch?: (branch: DataBranch) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onListenToVoice?: () => void;
  isSpeakingVoice?: boolean;
  hotspotCount: number;
  currentYear: number;
  isAiPrediction: boolean;
  isGuideSuggested?: boolean;
  onShowGuideBanner?: () => void;
  onOpenUnits?: () => void;
  onOpenAlienTutorial?: () => void;
}

// What this does: This list holds the five Earth science categories the user can filter hotspots by.
// On the website: These names show up as small filter buttons inside the Explore dropdown menu.
// Used as: Quick category buttons so users only see climate hotspots from the topic they care about.
const DOMAINS: (EarthDomain | 'All')[] = [
  'All',
  'Cryosphere',
  'Biosphere',
  'Hydrosphere',
  'Ocean Heat',
];

// What this does: This component builds the whole top bar at the top of the screen, picking which buttons show on phone vs computer and updating live global numbers.
// On the website: It displays the NASA Earth Apps title, Temperature/Humidity/Wind switches, Visual Places, unit & language buttons, and dropdown menus.
// Used as: The main top navigation bar of the app.
export const HeaderBar: React.FC<HeaderBarProps> = ({
  selectedDomain,
  onSelectDomain,
  onStartTour,
  isTouring,
  onOpenReport,
  onOpenFeedback,
  onOpenCountrySearch,
  onOpenImpactInquiry,
  onOpenGlossary,
  onOpenClimateAlerts,
  onOpenChatbot,
  isChatbotOpen = false,
  onOpenHumanReports,
  onOpenAuth,
  onOpenComplexityMode,
  onOpenDownloadApp,
  onOpenNotebook,
  onOpenMissionGuide,
  onOpenOnboardingWalkthrough,
  onOpenDailyAdvice,
  onOpenVisualFarm,
  onOpenVisualPolar,
  onOpenVisualPlaces,
  onOpenClimateReport,
  onToggleTimeline,
  isTaskbarOpen = true,
  onToggleTaskbar,
  dataBranch = 'temperature',
  onSelectBranch,
  soundEnabled,
  onToggleSound,
  onListenToVoice,
  isSpeakingVoice = false,
  hotspotCount,
  currentYear,
  isAiPrediction,
  isGuideSuggested = false,
  onShowGuideBanner,
  onOpenUnits,
  onOpenAlienTutorial,
}) => {
  const { currentUser, dataMode, dataBranch: contextBranch, setDataBranch } = useAuth();
  const {
    language,
    toggleLanguage,
    isRTL,
    t,
    tempUnit,
    windUnit,
    humidityUnit,
    showDualUnits,
    formatTemp,
    formatTempDelta,
    formatWind,
    formatHum,
    tempSymbol,
    windSymbol,
    humiditySymbol,
  } = useUnitsAndLanguage();

  const activeBranch = dataBranch || contextBranch || 'temperature';
  const handleSelectBranch = onSelectBranch || setDataBranch;

  // Active NASA Instrument Metadata & Anomaly
  const activeInstrument = NASA_INSTRUMENT_REGISTRY[activeBranch] || NASA_INSTRUMENT_REGISTRY.temperature;
  const variableAnomaly = getGlobalVariableAnomaly(activeBranch, currentYear);

  // Active Category & Instrument Dropdown State
  const [activeCategory, setActiveCategory] = useState<HeaderCategory | null>(null);
  const [moreTab, setMoreTab] = useState<'explore' | 'science' | 'reports' | 'mission'>('explore');
  const [isInstrumentMenuOpen, setIsInstrumentMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const instrumentRef = useRef<HTMLDivElement>(null);

  const displayedCategory = activeCategory === 'more' ? moreTab : activeCategory;

  // What this does: Watches for clicks outside any open dropdown menu or presses of the Escape key and closes the menu automatically.
  // On the website: Lets users smoothly close any open top-bar menu by tapping empty space on the globe or pressing Escape.
  // Used as: A clean auto-close listener for the header dropdowns.
  useEffect(() => {
    // What this does: Checks if a mouse click landed outside the open menu area and shuts the menu if it did.
    // On the website: Clicking anywhere else on the page closes the open dropdown right away.
    // Used as: The click-outside handler for dropdown menus.
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
      if (instrumentRef.current && !instrumentRef.current.contains(event.target as Node)) {
        setIsInstrumentMenuOpen(false);
      }
    };

    // What this does: Listens for the Escape key on the keyboard and shuts any open header menu.
    // On the website: Pressing Escape immediately hides open dropdown drawers.
    // Used as: A keyboard shortcut helper for closing menus.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveCategory(null);
        setIsInstrumentMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // What this does: Opens a header category menu when clicked, or closes it if that same category was already open.
  // On the website: Clicking Explore, Science, Reports, Mission, or More pops open its tool list with a small click sound.
  // Used as: The toggle button handler for all top-bar menu categories.
  const toggleCategory = (cat: HeaderCategory) => {
    soundFx.playTick();
    setIsInstrumentMenuOpen(false);
    setActiveCategory((prev) => (prev === cat ? null : cat));
  };

  // What this does: Closes all open dropdown menus in the header bar at once.
  // On the website: Hides any open menu list right after the user picks a tool.
  // Used as: A helper function called inside menu buttons before opening modals.
  const closeDropdown = () => {
    setActiveCategory(null);
    setIsInstrumentMenuOpen(false);
  };

  const globalAnomaly = getGlobalMeanAnomaly(currentYear);
  const globalMeanTemp = Number((14.0 + globalAnomaly).toFixed(2));
  const globalHumidity = getGlobalMeanHumidityAnomaly(currentYear);
  const globalWind = getGlobalMeanWindAnomaly(currentYear);

  // Primary 3 branches
  const primaryBranches: DataBranch[] = ['temperature', 'humidity', 'wind'];

  return (
    <header className="fixed top-0 left-0 right-0 z-20 px-1.5 sm:px-3 md:px-4 py-1 md:py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-1 md:gap-3 flex-wrap">
      {/* Row 1 Wrapper: Brand & Mission Title + (Mobile-Only Inline Temp/Humidity/Wind Switcher) */}
      <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-1 md:gap-2.5">
        <div className="flex items-center gap-1 md:gap-2.5 min-w-0">
          <div
            className="w-6 h-6 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg border shrink-0 transition-all bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 shadow-cyan-950/60 border-cyan-400/40"
            style={{ borderColor: activeInstrument.color }}
          >
            {activeBranch === 'humidity' ? (
              <Droplets className="w-3.5 h-3.5 md:w-5 md:h-5 text-cyan-200 animate-pulse" />
            ) : activeBranch === 'wind' ? (
              <Wind className="w-3.5 h-3.5 md:w-5 md:h-5 text-teal-200 animate-pulse" />
            ) : (
              <Thermometer className="w-3.5 h-3.5 md:w-5 md:h-5 text-amber-300 animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-[7.5px] sm:text-[9px] md:text-[10px] font-mono font-bold tracking-wider md:tracking-widest text-cyan-400 uppercase whitespace-nowrap">
                {t('nasaEarthApps')}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.2 rounded border hidden sm:inline bg-slate-900 font-bold"
                style={{ color: activeInstrument.color, borderColor: `${activeInstrument.color}66` }}
              >
                {activeInstrument.shortLabel.toUpperCase()} ({activeInstrument.unitSymbol})
              </span>
            </div>
            <h1 className="text-[10px] sm:text-sm md:text-base font-bold font-heading tracking-wide text-white leading-none mt-0.5 truncate">
              {t('appTitle')} <span className="text-cyan-400 font-mono text-[8.5px] md:text-xs">3D</span>
            </h1>
          </div>
        </div>

        {/* What this does: Shows the Temperature, Humidity, and Wind branch buttons right next to the app title on mobile screens.
            On the website: Gives phone users compact one-tap buttons in the top row to switch climate layers.
            Used as: The mobile-only branch switcher bar. */}
        <div
          data-tutorial="branch-switcher"
          className="flex md:hidden items-center gap-0.5 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono shrink-0"
        >
          <button
            onClick={() => {
              soundFx.playTick();
              handleSelectBranch('temperature');
            }}
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[7.5px] sm:text-[8.5px] transition-all cursor-pointer whitespace-nowrap ${
              activeBranch === 'temperature'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/60 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Air Temperature: MERRA-2"
          >
            <Thermometer className={`w-2 h-2 shrink-0 ${activeBranch === 'temperature' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              handleSelectBranch('humidity');
            }}
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[7.5px] sm:text-[8.5px] transition-all cursor-pointer whitespace-nowrap ${
              activeBranch === 'humidity'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Humidity: MERRA-2"
          >
            <Droplets className={`w-2 h-2 shrink-0 ${activeBranch === 'humidity' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Humidity</span>
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              handleSelectBranch('wind');
            }}
            className={`flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[7.5px] sm:text-[8.5px] transition-all cursor-pointer whitespace-nowrap ${
              activeBranch === 'wind'
                ? 'bg-teal-500/25 text-teal-200 border border-teal-400/60 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Wind Speed: MERRA-2"
          >
            <Wind className={`w-2 h-2 shrink-0 ${activeBranch === 'wind' ? 'text-teal-400' : 'text-slate-400'}`} />
            <span>Wind</span>
          </button>
        </div>
      </div>

      {/* What this does: Shows the full-size Temperature, Humidity, and Wind buttons on tablets and computers.
          On the website: Displays the three main NASA climate layer buttons in the middle of the desktop header.
          Used as: The desktop branch switcher bar. */}
      <div
        ref={instrumentRef}
        data-tutorial="branch-switcher"
        className="hidden md:flex relative items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs shadow-inner shrink-0"
      >
        {/* Core Branch 1: Air Temp (MERRA-2) */}
        <button
          onClick={() => {
            soundFx.playTick();
            handleSelectBranch('temperature');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeBranch === 'temperature'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/60 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Air Temperature: MERRA-2 (via NASA POWER and GES DISC)"
        >
          <Thermometer className={`w-3.5 h-3.5 ${activeBranch === 'temperature' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold">Temperature</span>
        </button>

        {/* Core Branch 2: Humidity (MERRA-2) */}
        <button
          onClick={() => {
            soundFx.playTick();
            handleSelectBranch('humidity');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeBranch === 'humidity'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Relative & Specific Humidity: MERRA-2 (via NASA POWER and GES DISC)"
        >
          <Droplets className={`w-3.5 h-3.5 ${activeBranch === 'humidity' ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold">Humidity</span>
        </button>

        {/* Core Branch 3: Wind Speed (MERRA-2) */}
        <button
          onClick={() => {
            soundFx.playTick();
            handleSelectBranch('wind');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeBranch === 'wind'
              ? 'bg-teal-500/25 text-teal-200 border border-teal-400/60 font-bold shadow-[0_0_12px_rgba(20,184,166,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Wind Speed: MERRA-2 (via NASA POWER and GES DISC)"
        >
          <Wind className={`w-3.5 h-3.5 ${activeBranch === 'wind' ? 'text-teal-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold">Wind</span>
        </button>

        {/* In Complicated Mode: Coupled Environmental Effects Indicator */}
        {dataMode === 'complicated' && (
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-300">
            <span className="font-bold text-purple-200">🔬 +3 Coupled Effects:</span>
            <span className="text-slate-300">
              {activeBranch === 'temperature'
                ? 'Skin Temp (AIRS/MODIS) • Snow/Ice (NSIDC) • Ozone (OMI)'
                : activeBranch === 'humidity'
                ? 'Precip (GPM) • Evaporation (GLDAS) • Soil Moisture (GLDAS)'
                : 'Vegetation (MODIS) • Aerosols (MODIS) • NO₂ (OMI)'}
            </span>
          </div>
        )}
      </div>

      {/* Planetary Telemetry Pill for Active NASA Variable */}
      <div className="hidden xl:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono shadow-md">
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: activeInstrument.color }}
        />
        <div className="text-[10px]">
          <span className="text-slate-400">{activeInstrument.shortLabel} ({currentYear}): </span>
          <strong className="text-white font-bold">{variableAnomaly.description}</strong>
          <span className="text-cyan-400 font-bold ml-1.5 px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40 text-[9px]">
            {activeInstrument.sourceAndInstrument}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION & UTILITIES CONTAINER (Responsive: Mobile Row 2 vs Desktop)   */}
      {/* ========================================================================= */}
      <div ref={dropdownRef} className="relative w-full md:w-auto flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* What this does: Arranges the second row of small buttons on mobile phones: Visual Places on the left, and units, language, help, and More on the right.
            On the website: Keeps all main mobile actions neatly packed in one slim row so the 3D globe has more room.
            Used as: The mobile navigation and quick-settings row. */}
        <div className="flex md:hidden items-center justify-between w-full gap-1">
          {/* 1. Compact Visual Places (Farm & Polar) */}
          {(onOpenVisualPlaces || onOpenVisualFarm || onOpenVisualPolar) && (
            <div data-tutorial="visual-places" className="flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-teal-500/50 shrink-0">
              <button
                onClick={() => {
                  closeDropdown();
                  soundFx.playChime();
                  if (onOpenVisualPlaces) onOpenVisualPlaces('farm');
                  else if (onOpenVisualFarm) onOpenVisualFarm();
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 text-teal-200 whitespace-nowrap cursor-pointer"
                title="Open Visual Places: Farm & Polar"
              >
                <Sprout className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <Snowflake className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <span className="max-[375px]:hidden">{t('visualPlaces')}</span>
              </button>
              <div className="h-3 w-px bg-slate-700/80 mx-0.5" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeDropdown();
                  soundFx.playChime();
                  if (onOpenVisualPlaces) onOpenVisualPlaces('farm');
                  else if (onOpenVisualFarm) onOpenVisualFarm();
                }}
                className="px-1 py-0.5 rounded text-[9px] font-mono font-bold text-emerald-300 cursor-pointer"
                title="Launch Visual Farm Place"
              >
                🌾
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeDropdown();
                  soundFx.playChime();
                  if (onOpenVisualPlaces) onOpenVisualPlaces('polar');
                  else if (onOpenVisualPolar) onOpenVisualPolar();
                }}
                className="px-1 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-300 cursor-pointer"
                title="Launch Visual Polar Place"
              >
                ❄️
              </button>
            </div>
          )}

          {/* Middle & Right Cluster: Smaller Celsius Logo + Smaller Language Logo + Question Mark + Bigger More */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {/* 2a. Celsius / Measuring Units: Small Logo Only (No Words) */}
            <button
              onClick={() => {
                closeDropdown();
                soundFx.playTick();
                if (onOpenUnits) onOpenUnits();
              }}
              className="flex items-center justify-center w-5 h-5 rounded-md font-mono text-[8px] font-bold transition-all cursor-pointer border bg-slate-900/90 border-teal-500/50 text-teal-300 shadow-sm shrink-0"
              title={language === 'ar' ? 'تغيير وحدات القياس' : 'Change measuring units'}
              aria-label="Measuring Units"
            >
              <span>{activeBranch === 'temperature' ? tempSymbol : activeBranch === 'wind' ? windSymbol : humiditySymbol}</span>
            </button>

            {/* 2b. Language: Small Logo Only (No Words) */}
            <button
              onClick={() => {
                closeDropdown();
                soundFx.playChime();
                toggleLanguage();
              }}
              className="flex items-center justify-center w-5 h-5 rounded-md transition-all cursor-pointer border bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/60 text-cyan-300 shadow-sm shrink-0"
              title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Languages className="w-2.5 h-2.5 text-cyan-300" />
            </button>

            {/* 3. Question Mark (?) Button (Exchanged position with More!) */}
            <button
              onClick={() => {
                closeDropdown();
                soundFx.playTick();
                if (onShowGuideBanner && !isGuideSuggested) {
                  onShowGuideBanner();
                } else if (onOpenMissionGuide) {
                  onOpenMissionGuide();
                }
              }}
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="App Guide & Help"
              aria-label="App Guide & Help"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* 4. More Button (Bigger prominent pill containing Explore, Science, Reports, Mission) */}
            <button
              data-tutorial="more-category"
              onClick={() => toggleCategory('more')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer border shadow-md whitespace-nowrap shrink-0 ${
                activeCategory === 'more'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/90 border-cyan-500/50 text-white'
              }`}
              title="More Tools: Explore, Science, Reports, and Mission"
              aria-expanded={activeCategory === 'more'}
            >
              <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{language === 'ar' ? 'المزيد' : 'More'}</span>
              <ChevronDown className={`w-3 h-3 text-cyan-300 transition-transform shrink-0 ${activeCategory === 'more' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* What this does: Shows the full row of category buttons (Visual Places, Explore, Science, Reports, Mission, Units, Language, Help) on larger screens.
            On the website: Gives laptop and desktop users direct buttons to open every section and setting.
            Used as: The desktop menu bar. */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* UNIFIED BUTTON CATEGORY: Visual Places (Farm & Polar in One Category) */}
        {(onOpenVisualPlaces || onOpenVisualFarm || onOpenVisualPolar) && (
          <div data-tutorial="visual-places" className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            <button
              onClick={() => {
                closeDropdown();
                soundFx.playChime();
                if (onOpenVisualPlaces) onOpenVisualPlaces('farm');
                else if (onOpenVisualFarm) onOpenVisualFarm();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-cyan-950/90 hover:from-emerald-900 hover:to-cyan-900 text-teal-200 hover:text-white active:scale-[0.98]"
              title="Open Visual Places: Interactive Biosphere Farm & Cryosphere Polar Simulator"
            >
              <div className="flex items-center -space-x-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <Snowflake className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </div>
              <span className="font-bold">{t('visualPlaces')}</span>
            </button>
            <div className="h-4 w-px bg-slate-700/80 mx-0.5" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeDropdown();
                soundFx.playChime();
                if (onOpenVisualPlaces) onOpenVisualPlaces('farm');
                else if (onOpenVisualFarm) onOpenVisualFarm();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold text-emerald-300 hover:text-white hover:bg-emerald-950/80 transition-colors cursor-pointer"
              title="Launch Visual Farm Place (Biosphere)"
            >
              <span>🌾 {t('farmPlace')}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeDropdown();
                soundFx.playChime();
                if (onOpenVisualPlaces) onOpenVisualPlaces('polar');
                else if (onOpenVisualPolar) onOpenVisualPolar();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold text-cyan-300 hover:text-white hover:bg-cyan-950/80 transition-colors cursor-pointer"
              title="Launch Visual Polar Cryosphere Place"
            >
              <span>❄️ {t('polarPlace')}</span>
            </button>
          </div>
        )}

        {/* Category 1: 🧭 Explore */}
        <button
          data-tutorial="explore-category"
          onClick={() => toggleCategory('explore')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
            activeCategory === 'explore'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.3)]'
              : isTouring
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-600'
          }`}
          title="Explore Category: Country Search, Guided Tour, and Earth Domains"
          aria-expanded={activeCategory === 'explore'}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('explore')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
            3
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeCategory === 'explore' ? 'rotate-180 text-cyan-400' : ''}`} />
        </button>

        {/* Category 2: 🔬 Science */}
        <button
          data-tutorial="science-category"
          onClick={() => toggleCategory('science')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
            activeCategory === 'science'
              ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.3)]'
              : isSpeakingVoice
              ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-600'
          }`}
          title="Science Category: Visual Places (Farm & Polar), What If? Simulations, Climate Alerts, Glossary, Data Mode, and Spoken Telemetry"
          aria-expanded={activeCategory === 'science'}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>{t('science')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/60 font-mono">
            6
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeCategory === 'science' ? 'rotate-180 text-purple-400' : ''}`} />
        </button>

        {/* Category 3: 📋 Reports */}
        <button
          onClick={() => toggleCategory('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
            activeCategory === 'reports'
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.3)]'
              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-600'
          }`}
          title="Reports Category: Real Human Reports, Daily Eco Advice, Field Notebook, Report Export, Feedback"
          aria-expanded={activeCategory === 'reports'}
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('reports')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono">
            5
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeCategory === 'reports' ? 'rotate-180 text-amber-400' : ''}`} />
        </button>

        {/* Category 4: ⚙️ Mission (Contains the App Guide!) */}
        <button
          data-tutorial="mission-category"
          onClick={() => toggleCategory('mission')}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
            activeCategory === 'mission'
              ? 'bg-teal-500/25 border-teal-400 text-teal-200 shadow-[0_0_14px_rgba(20,184,166,0.3)]'
              : isGuideSuggested
              ? 'bg-gradient-to-r from-cyan-950 to-teal-950 border-cyan-400 text-cyan-200 shadow-[0_0_16px_rgba(6,182,212,0.35)]'
              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-600'
          }`}
          title="Mission Category: App Guide (How-To), AI Copilot, Save Account, Install App, and Audio FX"
          aria-expanded={activeCategory === 'mission'}
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
          <span>{t('mission')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-700/60 font-mono">
            6
          </span>
          {isGuideSuggested && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-extrabold uppercase animate-pulse">
              Guide 💡
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeCategory === 'mission' ? 'rotate-180 text-teal-400' : ''}`} />
        </button>

        {/* MEASURING UNITS BUTTON (PROMINENT TOP-LEVEL CONTROL) */}
        <button
          onClick={() => {
            closeDropdown();
            soundFx.playTick();
            if (onOpenUnits) onOpenUnits();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border bg-slate-900/90 hover:bg-slate-850 border-teal-500/50 hover:border-teal-400 text-teal-200 hover:text-white shadow-[0_0_12px_rgba(20,184,166,0.2)]"
          title={language === 'ar' ? 'خيارات وتغيير وحدات القياس (سلسيوس، فهرنهايت، كلفن، م/ث، ميل/س، إلخ)' : 'Measuring units options (Celsius, Fahrenheit, Kelvin, m/s, mph, etc.)'}
        >
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">{t('unitsButton')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-700/60 font-mono">
            {activeBranch === 'temperature' ? tempSymbol : activeBranch === 'wind' ? windSymbol : humiditySymbol}
          </span>
        </button>

        {/* LANGUAGE SWITCHER BUTTON (English / العربية) */}
        <button
          onClick={() => {
            closeDropdown();
            soundFx.playChime();
            toggleLanguage();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border-cyan-500/60 hover:border-cyan-300 text-cyan-200 hover:text-white shadow-[0_0_14px_rgba(6,182,212,0.25)]"
          title={language === 'ar' ? 'التبديل إلى اللغة الإنجليزية (Switch to English)' : 'Switch language to Arabic (التبديل إلى العربية)'}
          aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* Re-open guide banner button if dismissed */}
        {onShowGuideBanner && !isGuideSuggested && (
          <button
            onClick={() => {
              soundFx.playTick();
              onShowGuideBanner();
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-white transition-colors cursor-pointer"
            title="Show mission guidance advisory"
            aria-label="Show mission guidance advisory"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
        </div>

        {/* What this does: Renders the floating dropdown box that holds the tools for whichever category tab the user picked.
            On the website: Pops up a clean scrollable list of tools right below the top bar when any menu is opened.
            Used as: The shared dropdown drawer for both desktop menus and the mobile More menu. */}
        {activeCategory && (
          <div className="absolute top-full right-0 mt-1.5 md:mt-2 w-[calc(100vw-12px)] max-w-[300px] sm:max-w-[360px] md:w-[380px] max-h-[60vh] md:max-h-[75vh] overflow-y-auto p-1.5 md:p-2.5 rounded-xl md:rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.7)] z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* What this does: Shows four mini-tabs inside the mobile More menu so phone users can switch between Explore, Science, Reports, and Mission.
                On the website: Displays a neat 4-button switcher at the top of the More menu on phones.
                Used as: The tab bar inside the mobile More dropdown. */}
            {activeCategory === 'more' && (
              <div className="grid grid-cols-4 gap-1 p-1 mb-2 rounded-xl bg-slate-900/90 border border-slate-800">
                {(
                  [
                    { id: 'explore', label: t('explore'), icon: Globe, activeClass: 'bg-cyan-500/25 border-cyan-400 text-cyan-200' },
                    { id: 'science', label: t('science'), icon: Sliders, activeClass: 'bg-purple-500/25 border-purple-400 text-purple-200' },
                    { id: 'reports', label: t('reports'), icon: FileText, activeClass: 'bg-amber-500/25 border-amber-400 text-amber-200' },
                    { id: 'mission', label: t('mission'), icon: HelpCircle, activeClass: 'bg-teal-500/25 border-teal-400 text-teal-200' },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = moreTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        soundFx.playTick();
                        setMoreTab(tab.id);
                      }}
                      className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? tab.activeClass
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate max-w-full">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* What this does: Shows tools for finding countries, taking the guided globe tour, opening the timeline, and filtering hotspots.
                On the website: Appears inside the Explore menu so users can jump around the 3D planet easily.
                Used as: The Explore menu content. */}
            {displayedCategory === 'explore' && (
              <div className="space-y-1.5">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      Explore &amp; Navigate
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">4 Tools</span>
                </div>

                {/* Country Search */}
                <button
                  onClick={() => {
                    closeDropdown();
                    soundFx.playTick();
                    onOpenCountrySearch();
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-cyan-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Select Country / Region
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        195+ Countries
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      Search and zoom to any country worldwide for real anomalies &amp; local trends.
                    </p>
                  </div>
                </button>


                {/* Planetary Guided Tour */}
                <button
                  onClick={() => {
                    closeDropdown();
                    soundFx.playTourChime();
                    onStartTour();
                  }}
                  className={`w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border transition-all flex items-start gap-2.5 cursor-pointer group ${
                    isTouring ? 'bg-amber-500/10 border-amber-500/40' : 'border-transparent hover:border-cyan-500/30'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Planetary Guided Tour
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        isTouring ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {isTouring ? 'Active' : 'Step-by-Step'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      Curated interactive walkthrough across critical Earth tipping hotspots.
                    </p>
                  </div>
                </button>

                {/* 4D Climate Timeline (2000–2040) */}
                {onToggleTimeline && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onToggleTimeline();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-amber-500/40 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300 group-hover:scale-105 transition-transform">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors font-serif">
                          4D Climate Timeline
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-bold">
                          2000–2040
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Expand bottom timeline dock with ornamental needle pointer &amp; monthly eras.
                      </p>
                    </div>
                  </button>
                )}

                {/* Earth Domain Filter Selector */}
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono mb-1.5">
                    <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                      <Layers className="w-3.5 h-3.5" />
                      Filter Earth Domains
                    </span>
                    <span className="text-[10px] text-slate-400">{hotspotCount} Hotspots</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {DOMAINS.map((dom) => (
                      <button
                        key={dom}
                        onClick={() => {
                          soundFx.playTick();
                          onSelectDomain(dom);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer truncate ${
                          selectedDomain === dom
                            ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                        }`}
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* What this does: Lists interactive science tools like Visual Places, What-If simulations, climate alerts, glossary, complexity mode, and voice reading.
                On the website: Appears inside the Science menu for testing climate scenarios and checking scientific terms.
                Used as: The Science menu content. */}
            {displayedCategory === 'science' && (
              <div className="space-y-1.5">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      Science &amp; Simulation
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">6 Tools</span>
                </div>

                {/* UNIFIED FEATURE: Visual Places Simulators (Farm & Polar in One Category) */}
                {(onOpenVisualPlaces || onOpenVisualFarm || onOpenVisualPolar) && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-teal-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-1">
                          <Sprout className="w-4 h-4 text-emerald-400" />
                          <Snowflake className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-xs font-bold text-white">
                          Visual Places Simulators
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
                        Unified Category
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Interactive microclimate laboratories. Test real-world temperature, humidity, and wind physics across agricultural and polar biomes.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        onClick={() => {
                          closeDropdown();
                          soundFx.playChime();
                          if (onOpenVisualPlaces) onOpenVisualPlaces('farm');
                          else if (onOpenVisualFarm) onOpenVisualFarm();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🌾 Farm Place</span>
                      </button>
                      <button
                        onClick={() => {
                          closeDropdown();
                          soundFx.playChime();
                          if (onOpenVisualPlaces) onOpenVisualPlaces('polar');
                          else if (onOpenVisualPolar) onOpenVisualPolar();
                        }}
                        className="py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                        <span>❄️ Polar Place</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* What If? Simulation */}
                <button
                  onClick={() => {
                    closeDropdown();
                    soundFx.playTick();
                    onOpenImpactInquiry();
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-purple-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        What If? Scenario Simulation
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        Physics
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      Simulate 1.5°C vs 2.0°C tipping points, jet stream stalls, or humidity deluges.
                    </p>
                  </div>
                </button>

                {/* Climate Alerts */}
                {onOpenClimateAlerts && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playPredictionAlert();
                      onOpenClimateAlerts();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-rose-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                          Threshold &amp; Critical Alerts
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          Milestones
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Scientific early warnings for Paris threshold breaches and cryosphere collapses.
                      </p>
                    </div>
                  </button>
                )}

                {/* Glossary */}
                <button
                  onClick={() => {
                    closeDropdown();
                    soundFx.playTick();
                    onOpenGlossary();
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-purple-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        Scientific Terms Glossary
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        Peer-Reviewed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      Definitions for Mann-Kendall, p-values, CMIP6, SSP scenarios, and WPD formulas.
                    </p>
                  </div>
                </button>

                {/* Data Complexity Mode */}
                {onOpenComplexityMode && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onOpenComplexityMode();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-purple-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-105 transition-transform">
                      {dataMode === 'simple' && <PieChart className="w-4 h-4 text-emerald-400" />}
                      {dataMode === 'normal' && <Scale className="w-4 h-4 text-cyan-400" />}
                      {dataMode === 'complicated' && <GraduationCap className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          Data Complexity Level
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold capitalize">
                          {dataMode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Switch between Simple (visual/B1), Normal (standard), or Complicated (academic research).
                      </p>
                    </div>
                  </button>
                )}

                {/* Spoken Voice Telemetry */}
                {onListenToVoice && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onListenToVoice();
                    }}
                    className={`w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border transition-all flex items-start gap-2.5 cursor-pointer group ${
                      isSpeakingVoice ? 'bg-rose-950/30 border-rose-500/50' : 'border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400 group-hover:scale-105 transition-transform">
                      <Mic className={`w-4 h-4 ${isSpeakingVoice ? 'text-rose-400 animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                          Spoken Voice Telemetry
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          isSpeakingVoice ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {isSpeakingVoice ? 'Speaking...' : 'Audio'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {isSpeakingVoice ? 'Click to stop spoken voice narration' : 'Listen to spoken climate narration on-demand.'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* What this does: Lists monthly reports, real human stories, daily eco advice, the field notebook, briefing exports, and user feedback.
                On the website: Appears inside the Reports menu so users can read climate stories or save their own notes.
                Used as: The Reports menu content. */}
            {displayedCategory === 'reports' && (
              <div className="space-y-1.5">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      Reports &amp; Community
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">5 Tools</span>
                </div>

                {/* Detailed Climate Reports Dossier (2000–2040) */}
                {onOpenClimateReport && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTourChime();
                      onOpenClimateReport();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-amber-500/30 bg-amber-950/20 hover:border-amber-400/60 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-400/60 flex items-center justify-center shrink-0 text-amber-300 group-hover:scale-105 transition-transform shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                      <FileText className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors font-serif">
                          Climate Characteristics Dossier
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-600 font-bold">
                          2000–2040
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Deep monthly reports &amp; physical explanations for all 492 months (2000–2040).
                      </p>
                    </div>
                  </button>
                )}

                {/* Real Human Reports */}
                {onOpenHumanReports && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playChime();
                      onOpenHumanReports();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-amber-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          Real Human Reports
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold">
                          2000–2026
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Authentic observational logs and station records documented by real people worldwide.
                      </p>
                    </div>
                  </button>
                )}

                {/* Daily Eco Advice */}
                {onOpenDailyAdvice && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onOpenDailyAdvice();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-emerald-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          Daily Eco Advice
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Per-Country
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Practical, country-grounded ecological guidance derived from meteorological data.
                      </p>
                    </div>
                  </button>
                )}

                {/* Field Notebook */}
                {onOpenNotebook && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playChime();
                      onOpenNotebook();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-amber-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          Scientific Field Notebook
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          Notes
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Log personal observations, capture globe telemetry snapshots, and export notes.
                      </p>
                    </div>
                  </button>
                )}

                {/* Export Briefing Report */}
                <button
                  onClick={() => {
                    closeDropdown();
                    soundFx.playTick();
                    onOpenReport();
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-amber-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Export Briefing Report
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        Export
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      Generate an executive scientific briefing formatted for NASA Space Apps.
                    </p>
                  </div>
                </button>

                {/* Community Feedback */}
                <button
                  onClick={() => {
                    closeDropdown();
                    soundFx.playTick();
                    onOpenFeedback();
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-amber-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Community Feedback
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        Input
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      Submit data corrections, regional observations, or platform feedback.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* What this does: Lists app help guides, the alien tutorial, the AI Copilot, user account sign-in, app install, sound toggle, and fullscreen toggle.
                On the website: Appears inside the Mission menu for getting help, logging in, and tweaking app settings.
                Used as: The Mission menu content. */}
            {displayedCategory === 'mission' && (
              <div className="space-y-1.5">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      Mission &amp; App Guide
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">6 Tools</span>
                </div>

                {/* MISSION APP GUIDE (HIGHLIGHTED RECOMMENDED FIRST STEP) */}
                {onOpenMissionGuide && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playChime();
                      onOpenMissionGuide();
                    }}
                    className="w-full p-2.5 rounded-xl text-left bg-gradient-to-r from-teal-950/80 via-cyan-950/80 to-blue-950/80 hover:from-teal-900/90 hover:to-cyan-900/90 border border-cyan-400/80 hover:border-cyan-300 transition-all flex items-start gap-2.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 font-bold group-hover:scale-105 transition-transform shadow-md">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                          <span>App Guide &amp; Button Manual</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 font-extrabold uppercase">
                            Start Here
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-100/90 leading-tight mt-0.5 font-sans">
                        Learn how to operate the app and the scientific importance of every button!
                      </p>
                    </div>
                  </button>
                )}

                {/* ALIEN GUIDED TOUR (LIVE STEP-BY-STEP FLYING ALIEN) */}
                {onOpenAlienTutorial && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playAlienRespawn();
                      onOpenAlienTutorial();
                    }}
                    className="w-full p-2.5 rounded-xl text-left bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 hover:from-emerald-900 hover:to-cyan-900 border border-teal-500/60 hover:border-teal-300 transition-all flex items-start gap-2.5 cursor-pointer shadow-md group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/60 text-teal-300 flex items-center justify-center shrink-0 font-bold group-hover:scale-110 transition-transform">
                      <span className="text-base">🛸</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-200 group-hover:text-white transition-colors">
                          Alien Guided Tour
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-700 font-bold">
                          Step-by-Step
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                        Watch our friendly cosmic alien fly across the screen and show you where to click!
                      </p>
                    </div>
                  </button>
                )}

                {/* ONBOARDING WALKTHROUGH */}
                {onOpenOnboardingWalkthrough && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playChime();
                      onOpenOnboardingWalkthrough();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-cyan-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-105 transition-transform">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          Onboarding Walkthrough
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Interactive Tour
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        6-step guided walkthrough of 3D globe operations, timeline, and data layers.
                      </p>
                    </div>
                  </button>
                )}

                {/* AI Copilot */}
                {onOpenChatbot && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onOpenChatbot();
                    }}
                    className={`w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border transition-all flex items-start gap-2.5 cursor-pointer group ${
                      isChatbotOpen ? 'bg-cyan-950/40 border-cyan-500/50' : 'border-transparent hover:border-teal-500/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400 group-hover:scale-105 transition-transform">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                          AI Climate Copilot
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
                          Search + Maps
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Ask questions with live Google Search &amp; Google Maps grounded intelligence.
                      </p>
                    </div>
                  </button>
                )}

                {/* Save Account / Profile */}
                {onOpenAuth && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onOpenAuth();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-teal-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400 group-hover:scale-105 transition-transform">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                          Save Data &amp; User Account
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          {currentUser ? currentUser.name || 'Logged In' : 'Sign In'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Log in with email &amp; password to persist your bookmarks, notebook, and research.
                      </p>
                    </div>
                  </button>
                )}

                {/* Install App on Laptop */}
                {onOpenDownloadApp && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onOpenDownloadApp();
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-900/90 border border-transparent hover:border-teal-500/30 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400 group-hover:scale-105 transition-transform">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                          Install App on Laptop
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          PWA
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        Download and install as a native desktop application (Windows, Mac, Linux).
                      </p>
                    </div>
                  </button>
                )}

                {/* Sound & Telemetry Audio Toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">Audio Effects</div>
                      <div className="text-[10px] text-slate-400">Telemetry chimes and click feedback</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onToggleSound();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                      soundEnabled
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'MUTED'}
                  </button>
                </div>

                {/* Close Taskbar Fullscreen Immersion */}
                {onToggleTaskbar && (
                  <button
                    onClick={() => {
                      closeDropdown();
                      soundFx.playTick();
                      onToggleTaskbar();
                    }}
                    className="w-full p-2 rounded-xl text-left bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                      <span>Hide Taskbar for Fullscreen Globe</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">Immersion</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
