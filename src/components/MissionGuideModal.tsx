/**
 * NASA Earth Trend Detective - Mission Guide & Button Importance Directory
 * Complete guide on how to operate the application and an exhaustive directory
 * detailing the function and scientific importance of every single button.
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  HelpCircle,
  Thermometer,
  Droplets,
  Globe,
  Users,
  Bot,
  Layers,
  Play,
  RotateCw,
  Compass,
  FileText,
  Volume2,
  ShieldAlert,
  Search,
  Sparkles,
  PieChart,
  Scale,
  GraduationCap,
  Calendar,
  Minimize2,
  Bookmark,
  Camera,
  Download,
  Info,
  CheckCircle2,
  ArrowRight,
  Wind,
  Sliders,
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

interface MissionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCountrySearch?: () => void;
  onOpenChatbot?: () => void;
  onOpenNotebook?: () => void;
  onOpenDailyAdvice?: () => void;
  onOpenHumanReports?: () => void;
  onOpenGlossary?: () => void;
  onOpenOnboardingWalkthrough?: () => void;
  onOpenArchitectureModal?: () => void;
  onOpenAlienTutorial?: () => void;
  onReplayIntro?: () => void;
}

interface ButtonGuideItem {
  id: string;
  name: string;
  icon: string;
  category: 'Explore' | 'Science' | 'Reports' | 'Mission' | 'Branch Switchers' | 'Sidebar Panel';
  location: string;
  whatItDoes: string;
  scientificImportance: string;
}

// What this does: Stores the reference directory listing every main button in the app, where it lives, what it does, and why it matters scientifically.
// On the website: Populates the searchable Button Directory tab inside the App Guide modal.
// Used as: The master help catalog for the website's controls.
const BUTTON_DIRECTORY: ButtonGuideItem[] = [
  // 4 Main Header Categories
  {
    id: 'explore-category-btn',
    name: '1. Explore Category Button (3 Tools)',
    icon: 'Globe',
    category: 'Explore',
    location: 'Top Taskbar → Explore',
    whatItDoes: 'Opens the Explore drawer containing Country Search, Planetary Tour, and Earth Domain filters.',
    scientificImportance: 'Central planetary navigation hub for zooming into 195+ world countries and inspecting key climate tipping zones.',
  },
  {
    id: 'select-country',
    name: 'Select Country / Region',
    icon: 'Globe',
    category: 'Explore',
    location: 'Top Taskbar → Explore',
    whatItDoes: 'Opens an interactive search directory of all world nations and territories, showing real-time warming or moisture anomalies.',
    scientificImportance: 'Allows granular, national-scale assessment of climate risks, local baseline shifts, and socioeconomic vulnerability.',
  },

  {
    id: 'tour-btn',
    name: 'Planetary Guided Tour',
    icon: 'Compass',
    category: 'Explore',
    location: 'Top Taskbar → Explore',
    whatItDoes: 'Launches an automated step-by-step walkthrough visiting the most critical Earth tipping hotspots around the globe.',
    scientificImportance: 'Guides users through key Earth system vulnerabilities: Arctic sea ice retreat, Amazon deforestation, and Atlantic overturning circulation.',
  },

  // Science Category
  {
    id: 'science-category-btn',
    name: '2. Science Category Button (6 Tools)',
    icon: 'Sliders',
    category: 'Science',
    location: 'Top Taskbar → Science',
    whatItDoes: 'Opens the Science drawer containing Visual Places Simulators (Farm, Polar & Ocean), What If? scenarios, climate alerts, scientific glossary, data mode, and voice telemetry.',
    scientificImportance: 'Gives direct access to theoretical and physical climate dynamics, interactive agricultural, polar, and oceanographic impact simulations, peer-reviewed terminology, and threshold danger zones.',
  },
  {
    id: 'visual-places-simulator',
    name: 'Visual Places Simulators (🌾 Farm, ❄️ Polar & 🌊 Ocean)',
    icon: 'Sparkles',
    category: 'Science',
    location: 'Top Taskbar → Visual Places (🌾 Farm | ❄️ Polar | 🌊 Ocean)',
    whatItDoes: 'A unified interactive laboratory offering three physical microclimate and biome simulations: 1) Visual Farm (Biosphere): tests temperature, humidity, and wind on stomatal conductance, dynamic crop plant growth scaling, drought, and wildfires; 2) Visual Polar (Cryosphere): tests sub-zero temperatures, katabatic winds, and snow moisture on glacial calving, aurora borealis, permafrost thaw slumps, bubbling methane seep vents, and polar wildlife; 3) Visual Ocean (Hydrosphere): photorealistic Three.js 3D ocean scene with dynamic Gerstner wave displacement, whitecap foam, NOAA oceanographic vessel with buoyancy kinematics, coral bleaching thermodynamics (SST ≥ 28.5°C), marine advection fog, and dissolved oxygen solubility.',
    scientificImportance: 'Demonstrates biophysical cause-and-effect across Earth biomes: connects agricultural vapor pressure deficits (VPD) and crop yield with high-latitude ice-albedo feedback loops (α = 0.85 → 0.08) and marine heatwave coral bleaching (NOAA Degree Heating Weeks).',
  },
  {
    id: 'impact-inquiry',
    name: 'What If? Scenario Simulation',
    icon: 'Sparkles',
    category: 'Science',
    location: 'Top Taskbar → Science',
    whatItDoes: 'Simulates what happens under extreme scenarios like 1.5°C vs 2.0°C global warming, polar jet stream stalls, and 35°C fatal wet-bulb temperatures.',
    scientificImportance: 'Allows testing nonlinear climate tipping elements and severe biophysical thresholds defined by IPCC and WMO.',
  },
  {
    id: 'climate-alerts',
    name: 'Climate Threshold Alerts',
    icon: 'ShieldAlert',
    category: 'Science',
    location: 'Top Taskbar → Science',
    whatItDoes: 'Displays alerts triggered when data crosses dangerous milestones (e.g., +1.5°C Paris threshold, 35°C wet-bulb survivability limit, 1.8 kPa VPD desiccation).',
    scientificImportance: 'Highlights irreversible Earth tipping points and epidemiological danger zones defined by ISO 7243 and IPCC Working Group II.',
  },
  {
    id: 'glossary',
    name: 'Scientific Terms Glossary',
    icon: 'BookOpen',
    category: 'Science',
    location: 'Top Taskbar → Science',
    whatItDoes: 'Provides clear explanations and mathematical definitions for scientific terms like Mann-Kendall test, p-value, Sen’s slope, VPD, and SSP2-4.5.',
    scientificImportance: 'Eliminates scientific jargon barriers, equipping citizens and journalists with proper statistical literacy.',
  },
  {
    id: 'data-mode',
    name: 'Choose Data Mode (Simple / Normal / Complicated)',
    icon: 'GraduationCap',
    category: 'Science',
    location: 'Top Taskbar → Science',
    whatItDoes: 'Toggles between three complexity tiers: Simple (B1 plain English + rich visual meters), Normal (standard mission telemetry), and Complicated (peer-reviewed research papers with equations and p-values).',
    scientificImportance: 'Ensures equitable scientific communication: makes complex thermodynamic findings accessible to young students while preserving full mathematical rigor for academic researchers.',
  },
  {
    id: 'voice-readout',
    name: 'Spoken Voice Telemetry',
    icon: 'Volume2',
    category: 'Science',
    location: 'Top Taskbar → Science',
    whatItDoes: 'Synthesizes clean, spoken voice audio narrating the exact temperature or humidity readings and comparisons across past, present, and prediction.',
    scientificImportance: 'Ensures universal accessibility for visually impaired users and enables audio-assisted learning during presentations.',
  },

  // Reports Category
  {
    id: 'reports-category-btn',
    name: '3. Reports Category Button (5 Tools)',
    icon: 'FileText',
    category: 'Reports',
    location: 'Top Taskbar → Reports',
    whatItDoes: 'Opens the Reports drawer containing authentic human observer reports, daily eco advice, field notebook, export briefing, and feedback.',
    scientificImportance: 'Connects macro-scale remote sensing with ground-truth human experiences, field documentation, and daily environmental guidance.',
  },
  {
    id: 'human-reports',
    name: 'Real Human Reports (2000–2026)',
    icon: 'Users',
    category: 'Reports',
    location: 'Top Taskbar → Reports',
    whatItDoes: 'Opens the field registry containing real human accounts, station measurements, and Google Scholar peer-reviewed papers spanning 2000–2026.',
    scientificImportance: 'Bridges satellite remote-sensing data with empirical ground-truth observations from indigenous communities, polar scientists, agronomists, and marine biologists.',
  },
  {
    id: 'daily-advice',
    name: 'Daily Eco-Advice (Per-Country)',
    icon: 'Leaf',
    category: 'Reports',
    location: 'Top Taskbar → Reports',
    whatItDoes: 'Fetches today’s localized eco-advice grounded in real-world weather.com forecasts and meteorological advisories for the chosen country.',
    scientificImportance: 'Connects macro-scale planetary trends to daily individual and municipal actions: AC energy conservation, optimal irrigation timing, and UV/wet-bulb safety windows.',
  },
  {
    id: 'field-notebook',
    name: 'Scientific Field Notebook',
    icon: 'BookOpen',
    category: 'Reports',
    location: 'Top Taskbar → Reports',
    whatItDoes: 'Enables users to write down research notes, capture active 3D globe telemetry snapshots with one click, tag observations, and export to Markdown.',
    scientificImportance: 'Provides a personal research workflow for students and investigators to log climate hypotheses, document anomalies, and export reproducible study notes.',
  },

  // Mission Category
  {
    id: 'mission-category-btn',
    name: '4. Mission Category Button (6 Tools)',
    icon: 'HelpCircle',
    category: 'Mission',
    location: 'Top Taskbar → Mission',
    whatItDoes: 'Opens the Mission drawer containing the App Guide, AI Copilot, User Account login, Laptop app installer, and audio controls.',
    scientificImportance: 'Hosts the primary operational guide, AI query engine, user profile persistence, and desktop software installation.',
  },
  {
    id: 'app-guide-btn',
    name: 'Mission App Guide (Start Here!)',
    icon: 'HelpCircle',
    category: 'Mission',
    location: 'Top Taskbar → Mission (Recommended)',
    whatItDoes: 'Opens this exhaustive guide explaining how to navigate the app and what every single button on the screen does.',
    scientificImportance: 'Empowers users of all skill levels to master 3D Earth trend investigation and interpret multi-sensor NASA telemetry.',
  },
  {
    id: 'ai-copilot',
    name: 'NASA AI Copilot (Search & Maps)',
    icon: 'Bot',
    category: 'Mission',
    location: 'Top Taskbar → Mission',
    whatItDoes: 'Opens the grounded AI assistant with live Google Search and Google Maps grounding capabilities.',
    scientificImportance: 'Translates abstract satellite temperature anomalies into real-world biophysical impacts: labor safety, crop anthesis failure, energy grid load, and disease vector expansion.',
  },
  {
    id: 'taskbar-toggle',
    name: 'Open / Close Taskbar Toggle Button',
    icon: 'Minimize2',
    category: 'Mission',
    location: 'Top Taskbar → Mission',
    whatItDoes: 'Slides away the top taskbar for 100% unobstructed full-screen 3D globe inspection.',
    scientificImportance: 'Facilitates cinematic visualization, classroom projection, and immersive spatial analysis of planetary atmospheric circulations.',
  },

  // Branch Switchers
  {
    id: 'branch-temp',
    name: 'Air Temperature Branch Button',
    icon: 'Thermometer',
    category: 'Branch Switchers',
    location: 'Top Taskbar (Left Center)',
    whatItDoes: 'Switches the entire globe, hotspot telemetry, charts, and AI copilot into the thermal climate domain.',
    scientificImportance: 'Tracks global surface temperature anomalies (in °C) derived from NASA GISTEMP v4 and MODIS. Essential for monitoring heat extremes, cryospheric melting, and thermal expansion.',
  },
  {
    id: 'branch-humidity',
    name: 'Atmospheric Humidity Branch Button',
    icon: 'Droplets',
    category: 'Branch Switchers',
    location: 'Top Taskbar (Left Center)',
    whatItDoes: 'Transforms every metric, globe color gradient, and report to focus on atmospheric moisture: Relative Humidity (RH%), Specific Humidity (q in g/kg), and Vapor Pressure Deficit (VPD).',
    scientificImportance: 'Crucial for understanding Clausius-Clapeyron scaling (+7%/°C moisture holding) and Byrne & O’Gorman (2018) continental drying. Demonstrates how ocean-land moisture transport governs human heat tolerance and agricultural megadrought.',
  },
  {
    id: 'wind-branch-btn',
    name: 'Surface Wind Speed & Dynamics Branch Button',
    icon: 'Wind',
    category: 'Branch Switchers',
    location: 'Top Taskbar (Branch Selector)',
    whatItDoes: 'Switches the entire 3D planetary Earth model into 10-meter surface wind speed, Beaufort scale classification, and kinetic power density mode.',
    scientificImportance: 'Enables analysis of planetary circulation shifts, polar jet stream waviness, mid-latitude storm tracks, terrestrial wind stilling, and renewable wind power potential.',
  },



  // Sidebar Panel
  {
    id: 'month-selector',
    name: 'Month Selector (Jan - Dec)',
    icon: 'Calendar',
    category: 'Sidebar Panel',
    location: 'Sidebar Data Panel',
    whatItDoes: 'Steps through all 12 calendar months to inspect seasonal temperature and moisture shifts.',
    scientificImportance: 'Reveals seasonal phenological timing shifts, summer peak heatwave windows, and dry-season vapor pressure deficit peaks.',
  },
  {
    id: 'why-changing',
    name: 'Why is it Changing? (Climate Drivers Button)',
    icon: 'Sparkles',
    category: 'Sidebar Panel',
    location: 'Sidebar Data Panel (Top)',
    whatItDoes: 'Opens an in-depth breakdown of the exact thermodynamic and physical causes driving temperature, humidity, or wind anomalies at this specific location.',
    scientificImportance: 'Explains underlying geophysical mechanisms: Clausius-Clapeyron relation, Byrne-O’Gorman oceanic moisture flux, radiative forcing, and greenhouse gas warming.',
  },
];

// What this does: Shows the complete App Guide & Button Manual modal with three tabs: How to Use, Button Directory, and Climate Branches.
// On the website: Helps new and advanced users learn every tool in the app and launch features directly from the guide.
// Used as: The official in-app user manual modal.
export const MissionGuideModal: React.FC<MissionGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenCountrySearch,
  onOpenChatbot,
  onOpenNotebook,
  onOpenDailyAdvice,
  onOpenHumanReports,
  onOpenGlossary,
  onOpenOnboardingWalkthrough,
  onOpenArchitectureModal,
  onOpenAlienTutorial,
  onReplayIntro,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'buttons' | 'branches'>('guide');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Explore', 'Science', 'Reports', 'Mission', 'Branch Switchers', 'Sidebar Panel'];

  // What this does: Filters the Button Directory cards by both the selected category tab and whatever words the user typed in the search box.
  // On the website: Updates the list of buttons in real time as the user searches or filters.
  // Used as: The search and category filter helper in Tab 2 of the guide.
  const filteredButtons = BUTTON_DIRECTORY.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.whatItDoes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificImportance.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[88dvh] md:h-[86vh] bg-slate-900 border border-cyan-500/40 rounded-xl md:rounded-2xl shadow-2xl shadow-cyan-950/60 flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-2.5 md:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2 md:gap-3 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50 shrink-0">
              <HelpCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-cyan-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] md:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold uppercase tracking-wider">
                  Official Mission Guide
                </span>
                <span className="hidden sm:inline text-[10px] font-mono text-slate-400">
                  Comprehensive Manual
                </span>
              </div>
              <h2 className="text-xs sm:text-base md:text-lg font-bold font-heading text-white truncate">
                How to Use This App &amp; Button Directory
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Close Guide"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 bg-slate-950/60 border-b border-slate-800 text-[10px] md:text-xs font-mono overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('guide');
            }}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'guide'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            1. How to Use
          </button>
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('buttons');
            }}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeTab === 'buttons'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>2. Button Directory</span>
            <span className="text-[9px] md:text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {BUTTON_DIRECTORY.length}
            </span>
          </button>
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('branches');
            }}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'branches'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            3. Climate Branches
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6 space-y-3.5 md:space-y-6">
          {/* TAB 1: HOW TO USE THE APP */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 md:space-y-6 max-w-3xl font-sans text-slate-200">
              <div className="p-2.5 md:p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-1.5 md:space-y-2">
                <h3 className="text-sm font-bold font-heading text-cyan-300 uppercase tracking-wider font-mono">
                  Welcome to NASA Earth Trend Detective 3D
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  This platform visualizes satellite telemetry from NASA EOS &amp; Scatterometry missions (AIRS on Aqua, GISTEMP v4, MODIS, GRACE-FO, MERRA-2, CYGNSS 8-microsatellite constellation, RapidScat on ISS) across 2000–2040. You can investigate thermal anomalies, atmospheric moisture drops, and global surface wind circulation dynamics across any country or hotspot.
                </p>

                {/* Quick Launchers */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  {onOpenOnboardingWalkthrough && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playChime();
                        onClose();
                        onOpenOnboardingWalkthrough();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span>🚀 Launch Interactive Walkthrough</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onOpenAlienTutorial && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playAlienRespawn();
                        onClose();
                        onOpenAlienTutorial();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span>🛸 Alien Guided Tour (Step-by-Step)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onReplayIntro && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playTourChime();
                        onClose();
                        onReplayIntro();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span>🎬 Phoenix Intro Video Animation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onOpenArchitectureModal && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playChime();
                        onClose();
                        onOpenArchitectureModal();
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>📐 Full Architecture &amp; User Flow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-cyan-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[10px]">1</span>
                    <span>Navigate the 3D Globe</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Click and drag anywhere on the Earth globe to rotate. Scroll to zoom in and out. Click any hotspot pin or country continent to open its real-time telemetry panel.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-cyan-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[10px]">2</span>
                    <span>Switch Data Branch</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Toggle between <strong>Air Temperature</strong> (thermal °C, heatwaves), <strong>Atmospheric Humidity</strong> (moisture RH%, wet-bulb), and <strong>Surface Wind Dynamics</strong> (10m velocity in m/s, Beaufort force, and kinetic power density) in the top taskbar.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-cyan-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[10px]">3</span>
                    <span>Travel Through Time</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Use the bottom timeline dock to scrub between Year 2000 and 2040. Hit <strong>Play Timeline</strong> to witness continuous climate change and AI predictions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-cyan-400 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-600 flex items-center justify-center text-[10px]">4</span>
                    <span>Investigate &amp; Log Field Notes</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Ask the <strong>NASA AI Copilot</strong> about biological hazards, check <strong>Human Reports</strong> from real observers, or open your <strong>Field Notebook</strong> to capture telemetry.
                  </p>
                </div>
              </div>

              {/* Quick Launch Buttons */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 font-mono">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Quick Feature Launchers:
                </span>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {onOpenCountrySearch && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCountrySearch();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Select Country</span>
                    </button>
                  )}
                  {onOpenChatbot && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenChatbot();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI Copilot</span>
                    </button>
                  )}
                  {onOpenNotebook && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenNotebook();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Field Notebook</span>
                    </button>
                  )}
                  {onOpenDailyAdvice && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDailyAdvice();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Daily Eco-Advice</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUTTON DIRECTORY & IMPORTANCE */}
          {activeTab === 'buttons' && (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs pb-2 border-b border-slate-800">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search button name or purpose..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded-lg shrink-0 transition-colors ${
                        selectedCategory === cat
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Cards List */}
              <div className="space-y-3 font-mono">
                {filteredButtons.map((btn) => (
                  <div
                    key={btn.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 text-xs font-bold shrink-0">
                          ▶
                        </span>
                        <h4 className="text-sm font-bold text-white font-heading">{btn.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {btn.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                          {btn.location}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-sans space-y-1.5 text-slate-300">
                      <div>
                        <strong className="text-cyan-400 font-mono text-[11px] block">
                          What It Does:
                        </strong>
                        <p>{btn.whatItDoes}</p>
                      </div>

                      <div>
                        <strong className="text-emerald-400 font-mono text-[11px] block">
                          Scientific Importance:
                        </strong>
                        <p className="text-slate-300">{btn.scientificImportance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: THREE SCIENTIFIC BRANCHES: TEMPERATURE VS HUMIDITY VS WIND */}
          {activeTab === 'branches' && (
            <div className="space-y-5 max-w-4xl font-sans text-slate-200">
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 font-mono">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  Fundamental Atmospheric Triad: Heat, Moisture &amp; Kinetic Circulation
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Earth system climate change is not merely a scalar rise in temperature. Temperature governs thermodynamic energy; humidity dictates water cycling and evaporative capacity; and surface wind governs boundary-layer kinetic energy, pressure gradients, and global atmospheric circulation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Air Temperature Branch */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 to-slate-950 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase">
                    <Thermometer className="w-4 h-4" />
                    <span>Air Temperature Branch</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                    <li><strong>Key Metric:</strong> Surface Air Temperature anomaly (ΔT in °C).</li>
                    <li><strong>Primary Satellite Data:</strong> NASA GISTEMP v4 &amp; MODIS Terra/Aqua Land Surface Temperature.</li>
                    <li><strong>Physical Focus:</strong> Radiative forcing, polar ice albedo loss, extreme heatwaves, and seasonal warming.</li>
                  </ul>
                </div>

                {/* Atmospheric Humidity Branch */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/30 to-slate-950 border border-cyan-500/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase">
                    <Droplets className="w-4 h-4" />
                    <span>Humidity Branch</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                    <li><strong>Key Metric:</strong> Relative Humidity (RH%), Vapor Pressure Deficit (VPD in kPa), Specific Humidity (q in g/kg).</li>
                    <li><strong>Primary Satellite Data:</strong> NASA AIRS on Aqua, MERRA-2, and SMAP soil moisture.</li>
                    <li><strong>Physical Focus:</strong> Byrne &amp; O'Gorman continental drying, Clausius-Clapeyron moisture holding, and human wet-bulb safety limits (ISO 7243).</li>
                  </ul>
                </div>

                {/* Surface Wind Speed Branch */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-teal-950/30 to-slate-950 border border-teal-500/40 space-y-2.5">
                  <div className="flex items-center gap-2 text-teal-400 font-mono font-bold text-xs uppercase">
                    <Wind className="w-4 h-4" />
                    <span>Wind Dynamics Branch</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                    <li><strong>Key Metric:</strong> 10m Surface Wind Velocity (m/s &amp; km/h), Beaufort Scale (0–12), Wind Power Density (W/m²).</li>
                    <li><strong>Primary Satellite Data:</strong> NASA CYGNSS constellation, RapidScat on ISS, and ESA ASCAT ocean scatterometry.</li>
                    <li><strong>Physical Focus:</strong> Polar jet stream waviness, Hadley/Ferrel circulation cells, terrestrial wind stilling, and offshore renewable wind energy potential.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between shrink-0">
          <span>NASA Earth Trend Detective • Documentation &amp; Scientific Protocol</span>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
