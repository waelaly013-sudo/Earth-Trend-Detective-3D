/**
 * NASA Earth Trend Detective - First-Time Onboarding & App Presentation System
 * Teaches the user how to use the entire application and presents every feature
 * across 7 comprehensive interactive slides with quick-action demo triggers.
 */

import React, { useState } from 'react';
import {
  X,
  Compass,
  Globe,
  Clock,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  Sparkles,
  Bot,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  RotateCw,
  Search,
  Eye,
  Sliders,
  Layers,
  HelpCircle,
  Volume2,
  Users,
  Sprout,
  Snowflake,
  ExternalLink,
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

interface FirstTimeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveSpotlight?: () => void;
  onOpenGlobeSettings?: () => void;
  onOpenCountrySearch?: () => void;
  onOpenVisualFarm?: () => void;
  onOpenVisualPolar?: () => void;
  onOpenChatbot?: () => void;
  onOpenArchitectureModal?: () => void;
}

interface SlideContent {
  id: string;
  stepNumber: string;
  title: string;
  badge: string;
  category: string;
  headline: string;
  summary: string;
  keyInstructions: { icon: string; title: string; desc: string }[];
  highlightItems: { label: string; value: string; color: string }[];
  quickAction?: { label: string; action: () => void; icon: React.ComponentType<{ className?: string }> };
}

// What this does: Renders a 7-slide presentation modal introducing the 3D globe, visual styles, 4D timeline, climate branches, Farm & Polar simulators, alerts, and AI Copilot.
// On the website: Gives newcomers a slideshow overview of every major capability with shortcut buttons to try features right away.
// Used as: The 7-slide feature showcase and onboarding modal.
export const FirstTimeOnboardingModal: React.FC<FirstTimeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveSpotlight,
  onOpenGlobeSettings,
  onOpenCountrySearch,
  onOpenVisualFarm,
  onOpenVisualPolar,
  onOpenChatbot,
  onOpenArchitectureModal,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  if (!isOpen) return null;

  const slides: SlideContent[] = [
    // Slide 1: Welcome & Mission Overview
    {
      id: 'welcome',
      stepNumber: '01 / 07',
      title: 'Welcome to NASA Earth Trend Detective 3D',
      badge: 'NASA Space Apps',
      category: 'Mission Briefing',
      headline: 'A 4D Planetary Climate Observatory & Tipping Point Sentinel',
      summary:
        'Built for the NASA Space Apps Challenge, this platform allows you to investigate global climate anomalies, multi-decadal trends (2000–2040), and critical Earth tipping points across land, ocean, and atmosphere.',
      keyInstructions: [
        {
          icon: 'Globe',
          title: 'Full 3D Planetary Geodetic Model',
          desc: 'Touch or click-drag to spin the planet in 360°. Pinch or scroll to zoom smoothly from orbit to regional biomes.',
        },
        {
          icon: 'Clock',
          title: '40-Year Continuous Timeline',
          desc: 'Travel between 2000–2026 historical satellite observations (MODIS, AIRS, CYGNSS) and 2027–2040 SSP2-4.5 AI projections.',
        },
        {
          icon: 'Sliders',
          title: 'Multi-Branch Climate Telemetry',
          desc: 'Switch between Air Temperature (°C), Atmospheric Moisture/Humidity (RH%/VPD), and Global Wind Speed (m/s).',
        },
      ],
      highlightItems: [
        { label: 'Time Horizon', value: '2000 – 2040', color: 'text-cyan-400' },
        { label: 'Global Coverage', value: '195+ Countries', color: 'text-emerald-400' },
        { label: 'Latency', value: '0ms GPU Shaders', color: 'text-amber-400' },
        { label: 'Telemetry', value: 'NASA Satellite Constellation', color: 'text-purple-400' },
      ],
    },

    // Slide 2: 3D Globe & Visual Styles
    {
      id: 'globe-styles',
      stepNumber: '02 / 07',
      title: 'Interactive 3D Globe & Earth Visual Styles',
      badge: 'Visual Customization',
      category: '3D Spherical Visualization',
      headline: 'Toggle between Blue Marble, Night Lights, and Topographic Maps',
      summary:
        'Tailor your planetary view with multiple authentic cartographic shaders, all rendered cleanly on the circular 3D sphere with zero distortion and full spherical coordinate raycasting.',
      keyInstructions: [
        {
          icon: 'Globe',
          title: 'Blue Marble (Daytime)',
          desc: 'Photorealistic NASA daytime surface textures with dynamic polar ice sheet shrinkage, lush biomes, and cloud cover.',
        },
        {
          icon: 'Moon',
          title: 'Night Lights (Black Marble)',
          desc: 'Nocturnal observational telemetry showcasing global electrical grid radiance and urban population corridors.',
        },
        {
          icon: 'Mountain',
          title: 'Topographic Map (USGS / GEBCO)',
          desc: 'Hypsometric elevation tinting, shaded relief mountain chains, and geodetic graticule latitude/longitude lines.',
        },
      ],
      highlightItems: [
        { label: 'Spherical Geometry', value: 'Three.js 64-segment PBR', color: 'text-cyan-400' },
        { label: 'Interaction', value: 'Touch & Mouse Orbit', color: 'text-emerald-400' },
        { label: 'Raycasting', value: 'Click Any Coordinate', color: 'text-blue-400' },
      ],
      quickAction: onOpenGlobeSettings
        ? {
            label: 'Open Globe Background Settings',
            action: () => {
              onOpenGlobeSettings();
              soundFx.playChime();
            },
            icon: Sliders,
          }
        : undefined,
    },

    // Slide 3: 4D Climate Timeline & AI Prediction
    {
      id: 'timeline-ai',
      stepNumber: '03 / 07',
      title: '4D Climate Timeline & AI Neural Projection',
      badge: 'Zero-Lag GLSL',
      category: 'Spatiotemporal Engine',
      headline: 'Travel from 2000 historical baselines to 2040 AI projections',
      summary:
        'The bottom timeline dock lets you scrub across 40 continuous years and 12 calendar months with 0ms delay thanks to custom WebGL GPU shader uniforms.',
      keyInstructions: [
        {
          icon: 'Play',
          title: 'Play / Stop Simulation',
          desc: 'Click Play on the bottom dock to watch the planet warm, ice sheets melt, and humidity regimes shift across years.',
        },
        {
          icon: 'Sliders',
          title: 'AI Prediction Mode (2027–2040)',
          desc: 'Years beyond 2026 engage neural ensemble projections under IPCC SSP2-4.5 medium emissions scenarios.',
        },
        {
          icon: 'Layers',
          title: 'Global Thermal Anomaly Gradient',
          desc: 'Translucent GPU overlay displays multi-stop heat mapping from -1.5°C cooling to +5.0°C extreme Arctic amplification.',
        },
      ],
      highlightItems: [
        { label: 'Historical Record', value: '2000 – 2026', color: 'text-cyan-400' },
        { label: 'Neural Projection', value: '2027 – 2040', color: 'text-rose-400' },
        { label: 'Statistics', value: 'Mann-Kendall & Sen Slope', color: 'text-amber-400' },
      ],
    },

    // Slide 4: Three Planetary Branches
    {
      id: 'branches',
      stepNumber: '04 / 07',
      title: 'Three Planetary Telemetry Branches',
      badge: 'Data Architecture',
      category: 'Physical Climate Variables',
      headline: 'Inspect Temperature (°C), Humidity (RH%), and Wind (m/s)',
      summary:
        'Climate is multi-faceted. The top header allows you to switch between three synchronized planetary datasets with dedicated color ramps and physics drivers.',
      keyInstructions: [
        {
          icon: 'Thermometer',
          title: 'Air Temperature Branch (°C)',
          desc: 'Global mean anomalies, high-latitude polar amplification, and decadal warming rates based on NASA GISTEMP v4.',
        },
        {
          icon: 'Droplets',
          title: 'Atmospheric Humidity Branch (RH% / VPD)',
          desc: 'Relative humidity shifts, vapor pressure deficits (VPD), and dangerous 35°C wet-bulb survivability thresholds.',
        },
        {
          icon: 'Wind',
          title: 'Global Wind Circulation (m/s)',
          desc: 'Surface 10m wind speeds, jet stream storm tracks, and Beaufort scale gale analysis derived from CYGNSS & ASCAT.',
        },
      ],
      highlightItems: [
        { label: 'Temperature Scale', value: 'Celsius (°C)', color: 'text-rose-400' },
        { label: 'Humidity Metrics', value: 'RH%, VPD, Wet-Bulb', color: 'text-cyan-400' },
        { label: 'Wind Telemetry', value: 'm/s & Beaufort Scale', color: 'text-emerald-400' },
      ],
    },

    // Slide 5: Visual Simulators (Farm & Polar)
    {
      id: 'simulators',
      stepNumber: '05 / 07',
      title: 'Visual Environmental Simulators (🌾 Farm & ❄️ Polar)',
      badge: 'Biophysical Labs',
      category: 'Microclimate Labs',
      headline: 'Interactive 3D laboratories connecting planetary telemetry to local life',
      summary:
        'Step directly into biophysical environments to test how climate shifts impact living ecosystems, agricultural crop yields, and glaciated polar shelves.',
      keyInstructions: [
        {
          icon: 'Sprout',
          title: 'Visual Farm (Biosphere)',
          desc: 'Adjust temperature, drought, and winds to observe dynamic crop growth scaling, leaf stomatal conductance, and wildfire risks.',
        },
        {
          icon: 'Snowflake',
          title: 'Visual Polar (Cryosphere)',
          desc: 'Simulate sub-zero glacial calving, ice-albedo feedback decay (α = 0.85 → 0.08), permafrost methane seeps, and polar wildlife.',
        },
      ],
      highlightItems: [
        { label: 'Farm Metrics', value: 'Stomatal Conductance & VPD', color: 'text-emerald-400' },
        { label: 'Polar Dynamics', value: 'Albedo Feedback & Calving', color: 'text-cyan-400' },
        { label: 'Soundscapes', value: 'Dynamic Wind & Ice Audio', color: 'text-amber-400' },
      ],
      quickAction: onOpenVisualFarm
        ? {
            label: 'Test Visual Farm Simulator Now',
            action: () => {
              onOpenVisualFarm();
              soundFx.playChime();
            },
            icon: Sprout,
          }
        : undefined,
    },

    // Slide 6: Critical Climate Anomalies & Field Reports
    {
      id: 'alerts-reports',
      stepNumber: '06 / 07',
      title: 'Critical Anomaly Radar & Human Field Reports',
      badge: 'Ground Truth',
      category: 'Early Warning System',
      headline: 'Real-time alert radar and citizen science observation registry',
      summary:
        'When the simulation timeline crosses critical planetary thresholds, the system flags alerts. Explore human field reports from 2022–2026 across 12 calendar months.',
      keyInstructions: [
        {
          icon: 'ShieldAlert',
          title: 'Automated Threshold Radar',
          desc: 'Instant toasts alert you to Paris Agreement +1.5°C breaches, 35°C fatal wet-bulb zones, and AMOC ocean overturning slowdowns.',
        },
        {
          icon: 'Users',
          title: 'Real Human Field Reports (2022–2026)',
          desc: 'Access verified eyewitness testimonies, farmer logs, and glaciological expedition reports with one-click camera fly-to coordinates.',
        },
      ],
      highlightItems: [
        { label: 'Alert Registry', value: '15+ Tipping Points', color: 'text-rose-400' },
        { label: 'Field Archive', value: 'Monthly 2022–2026', color: 'text-cyan-400' },
        { label: 'Camera Fly-To', value: 'Direct Orbit Zoom', color: 'text-amber-400' },
      ],
    },

    // Slide 7: AI Copilot & Full Architecture
    {
      id: 'copilot-architecture',
      stepNumber: '07 / 07',
      title: 'NASA AI Copilot, Spoken Voice & Architecture Guide',
      badge: 'Intelligence & Specs',
      category: 'Copilot & Architecture',
      headline: 'Google Search & Maps grounded assistant, voice narration, and full specs',
      summary:
        'Chat with the NASA Climate Copilot to answer any Earth science inquiry, fly to any world landmark, listen to on-demand voice telemetry, or inspect the full system architecture!',
      keyInstructions: [
        {
          icon: 'Bot',
          title: 'Grounded AI Copilot',
          desc: 'Ask complex climate questions. The copilot uses Google Search and Google Maps grounding to pin landmarks directly onto the 3D globe.',
        },
        {
          icon: 'Volume2',
          title: 'On-Demand Spoken Voice Telemetry',
          desc: 'Click the Listen to Voice button to hear clear spoken summaries of temperature and humidity shifts (never plays automatically).',
        },
        {
          icon: 'FileText',
          title: 'Full Architecture & User Story Blueprint',
          desc: 'Inspect the complete system architecture, user stories with acceptance criteria, and end-to-end user flows in the guide modal.',
        },
      ],
      highlightItems: [
        { label: 'Grounding', value: 'Google Search & Maps', color: 'text-cyan-400' },
        { label: 'Voice Audio', value: 'Web Speech Synthesis', color: 'text-emerald-400' },
        { label: 'Architecture', value: 'Full Specifications Inside', color: 'text-purple-400' },
      ],
      quickAction: onOpenArchitectureModal
        ? {
            label: 'View Full Architecture & User Stories',
            action: () => {
              onOpenArchitectureModal();
              soundFx.playChime();
            },
            icon: FileText,
          }
        : undefined,
    },
  ];

  const slide = slides[currentSlide];

  // What this does: Moves forward to the next presentation slide, or finishes onboarding if on the last slide.
  // On the website: Runs when clicking Next Step or Start Exploring Earth.
  // Used as: The forward slide button handler.
  const handleNext = () => {
    soundFx.playTick();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  // What this does: Steps back to the previous slide in the presentation.
  // On the website: Runs when clicking the Previous button.
  // Used as: The backward slide button handler.
  const handlePrev = () => {
    soundFx.playTick();
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // What this does: Saves completion in local storage (when remembered) and closes the onboarding presentation.
  // On the website: Closes the slideshow and lets the user start using the main globe.
  // Used as: The exit/completion handler for the slideshow modal.
  const handleComplete = () => {
    soundFx.playChime();
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('nasa_climate_first_time_v2', 'completed');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900/95 border border-cyan-500/50 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] text-slate-100 overflow-hidden font-sans">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-wide">
                  Welcome to NASA Earth Trend Detective
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono font-semibold">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore how to navigate, simulate, and investigate planetary climate systems.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              {slide.stepNumber}
            </span>
            <button
              onClick={handleComplete}
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close and enter application"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Slide Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Slide Title & Category Banner */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-800/80 uppercase font-semibold">
                {slide.category}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{slide.badge}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
              {slide.title}
            </h3>
            <p className="text-xs sm:text-sm text-cyan-200/90 font-medium leading-relaxed">
              {slide.headline}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {slide.summary}
            </p>
          </div>

          {/* Key Instructions Cards */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              How to Use & Key Capabilities:
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {slide.keyInstructions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all"
                >
                  <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 shrink-0 mt-0.5 border border-cyan-800/40">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white font-heading">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Pill Grid */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {slide.highlightItems.map((hl, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{hl.label}</span>
                <span className={`font-bold text-xs ${hl.color}`}>{hl.value}</span>
              </div>
            ))}
          </div>

          {/* Quick Action Button (if present) */}
          {slide.quickAction && (
            <div className="pt-1">
              <button
                onClick={slide.quickAction.action}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <slide.quickAction.icon className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>{slide.quickAction.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>
          )}

        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 shrink-0">
          
          {/* Checkbox: Don't show again on startup */}
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-cyan-500 bg-slate-800 border-slate-700"
            />
            <span>Remember completion (don't show automatically on next visit)</span>
          </label>

          {/* Prev / Next / Complete Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <span>{currentSlide === slides.length - 1 ? 'Start Exploring Earth' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
