/**
 * NASA Earth Trend Detective - Full Architecture, Full User Story & Full User Flow Modal
 * 
 * Comprehensive interactive reference containing:
 * 1. Full System Architecture (WebGL 3D Core, NASA Data Ingestion, State & Shaders, Audio Synthesis, Auth/Storage)
 * 2. Full User Stories (Agile Epics, Personas, Acceptance Criteria, Real Value Delivered)
 * 3. Full End-to-End User Flow (Step-by-step state machine from first launch to report export)
 */

import React, { useState } from 'react';
import {
  X,
  Workflow,
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  Activity,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Globe2,
  Clock,
  Sparkles,
  FileText,
  Bot,
  Users,
  Compass,
  Laptop,
  Flame,
  Droplets,
  Wind,
  Share2,
  ExternalLink,
  ChevronRight,
  Code2,
  BookOpen
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

// What this does: Defines the open state, close action, and optional shortcut callback to jump into any workflow step.
// On the website: Allows clicking "Try This Step" inside the flowchart to open that feature directly.
// Used as: The props interface for ArchitectureUserFlowModal.
interface ArchitectureUserFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFlowStep?: (stepId: string) => void;
}

// What this does: Displays a three-tab overview covering system architecture, user personas/stories, and the 8-step user journey.
// On the website: Lets visitors inspect technical layers, agile user stories, and an interactive step-by-step user flowchart.
// Used as: The system blueprint and user-flow documentation modal.
export const ArchitectureUserFlowModal: React.FC<ArchitectureUserFlowModalProps> = ({
  isOpen,
  onClose,
  onSelectFlowStep,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'user_story' | 'user_flow'>('architecture');
  const [selectedArchLayer, setSelectedArchLayer] = useState<string>('webgl_core');
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden font-mono flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Workflow className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  NASA Systems Blueprint
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-700/60 font-mono">
                  v2026.4
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-heading">
                Full Architecture • User Stories • End-to-End User Flow
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Architecture Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-slate-800 bg-slate-900/50 gap-2 overflow-x-auto">
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('architecture');
            }}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Full System Architecture</span>
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('user_story');
            }}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'user_story'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Full Agile User Stories</span>
          </button>

          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('user_flow');
            }}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'user_flow'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Full End-to-End User Flow</span>
          </button>
        </div>

        {/* Tab 1: FULL ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="p-5 overflow-y-auto space-y-6">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Rendering Engine</span>
                <span className="text-sm font-bold text-white mt-1">Three.js WebGL + Custom GLSL</span>
                <span className="text-[10px] text-slate-400 mt-2">Zero-lag uniforms & 60fps GPU pipeline</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-400">Data Ingestion</span>
                <span className="text-sm font-bold text-white mt-1">NASA MERRA-2 & MODIS</span>
                <span className="text-[10px] text-slate-400 mt-2">Combined with CMIP6 SSP2-4.5 AI projections</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400">State & Reactivity</span>
                <span className="text-sm font-bold text-white mt-1">React 19 + Context Machine</span>
                <span className="text-[10px] text-slate-400 mt-2">Decoupled spatial animation loops</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-purple-400">Accessibility</span>
                <span className="text-sm font-bold text-white mt-1">Web Speech & Web Audio</span>
                <span className="text-[10px] text-slate-400 mt-2">Real-time localized speech telemetry</span>
              </div>
            </div>

            {/* Architectural Layer Diagram */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Layered Architectural Architecture (Click a Layer to Inspect Details)</span>
                </h3>
                <span className="text-[10px] text-slate-400">Frontend-Driven Offline-First Resilient</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {[
                  {
                    id: 'webgl_core',
                    title: '1. WebGL Presentation Core',
                    badge: 'Three.js / Shaders',
                    desc: 'Spherical Geometry, Fresnel glow, dynamic thermal ripple displacement, procedural scanlines & raycasted coordinate picking.',
                    color: 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300',
                  },
                  {
                    id: 'data_pipeline',
                    title: '2. Climate Telemetry Layer',
                    badge: '40-Year Time Series',
                    desc: 'Historical 2000-2026 satellite anomalies and 2027-2040 forward projections across Temperature, Humidity, and Wind.',
                    color: 'border-blue-500/60 bg-blue-950/30 text-blue-300',
                  },
                  {
                    id: 'ground_truth',
                    title: '3. Ground-Truth & Human Layer',
                    badge: 'Field Reports 2022-2026',
                    desc: 'Empirical observer validation stations, personal field research notebook, and citizen science telemetry submissions.',
                    color: 'border-purple-500/60 bg-purple-950/30 text-purple-300',
                  },
                  {
                    id: 'ai_copilot',
                    title: '4. AI Copilot & Grounding',
                    badge: 'Gemini / Google Maps',
                    desc: 'Natural language climate research assistant with Google Maps geospatial landmark grounding and physical driver explanations.',
                    color: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
                  },
                  {
                    id: 'auth_persistence',
                    title: '5. Identity & Security Layer',
                    badge: 'Encrypted Profiles',
                    desc: 'Mandatory auth gate, session persistence, saved reports, bookmarked research points, and adaptive complexity levels.',
                    color: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
                  },
                ].map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      soundFx.playTick();
                      setSelectedArchLayer(layer.id);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      selectedArchLayer === layer.id
                        ? `${layer.color} shadow-lg ring-1 ring-cyan-400`
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold block w-fit mb-1.5">
                        {layer.badge}
                      </span>
                      <h4 className="text-xs font-bold leading-tight mb-1">{layer.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-3">{layer.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Deep-Dive Inspection of Selected Layer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Technical Specification: {selectedArchLayer.replace('_', ' ').toUpperCase()}</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700">
                  LATENCY &lt; 16ms • 60 FPS GUARANTEED
                </span>
              </div>

              {selectedArchLayer === 'webgl_core' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">GPU Shader Architecture:</h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      <li><strong className="text-cyan-300">HologramShellShader:</strong> GLSL vertex/fragment program calculating cosine scanlines and Fresnel rim emission (u_scanlineIntensity uniform).</li>
                      <li><strong className="text-cyan-300">Dynamic Thermal Ripples:</strong> Localized vertex normal displacement around inspected coordinates when temperature anomalies exceed +1.5°C.</li>
                      <li><strong className="text-cyan-300">Procedural Texturing:</strong> Canvas-generated 2048x1024 high-albedo planetary bump and cloud opacity maps loaded into WebGL textures.</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Interaction & Orbit Controls:</h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      <li><strong className="text-cyan-300">Raycasting:</strong> Inverse spherical coordinates mapping mouse screen (x, y) to latitude and longitude with ±0.1° accuracy.</li>
                      <li><strong className="text-cyan-300">OrbitControls:</strong> Damped inertial rotation, restricted zoom radii (120 to 500 units), smooth slerp camera transitions on location focus.</li>
                      <li><strong className="text-cyan-300">Zero-Lag Scrubbing:</strong> Timeline slider modifies GLSL uniform floats directly without triggering full geometry rebuilds.</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedArchLayer === 'data_pipeline' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Observational Datasets (2000–2026):</h5>
                    <p className="text-[11px] text-slate-400">
                      Standardized on NASA GISTEMP v4, MERRA-2 reanalysis, and MODIS surface temperature. All coordinates compute anomalies relative to the 1951-1980 baseline.
                    </p>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
                      Anomaly_Region(y, m) = Baseline_Offset + (y - 2000) * Decadal_Rate + Seasonal_Sin(m)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Predictive ML Modeling (2027–2040):</h5>
                    <p className="text-[11px] text-slate-400">
                      Ensemble SSP2-4.5 (Middle of the Road) forward-modeling incorporating positive cryosphere albedo feedback loops, soil drying non-linearities, and ocean thermal inertia.
                    </p>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300">
                      Nonlinear_Feedback = 1.0 + Max(0, (Year - 2026) * 0.038)
                    </div>
                  </div>
                </div>
              )}

              {selectedArchLayer === 'ground_truth' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Empirical Observer Ground Verification:</h5>
                    <p className="text-[11px] text-slate-400">
                      Includes 15+ verified human field observer records from 2022 to 2026 spanning Svalbard, the Sahel, Andalusia, the Amazon, and the Great Barrier Reef.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Personal Field Research Notebook:</h5>
                    <p className="text-[11px] text-slate-400">
                      Allows scientists and students to document local observations, log personal field reports, and attach verified coordinates for peer review.
                    </p>
                  </div>
                </div>
              )}

              {selectedArchLayer === 'ai_copilot' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Google Maps & Search Grounding:</h5>
                    <p className="text-[11px] text-slate-400">
                      The AI Climate Copilot leverages Google Maps grounding to automatically identify landmark coordinates and fly the 3D globe camera to any searched location.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Scientific Drivers & Forensic Explanations:</h5>
                    <p className="text-[11px] text-slate-400">
                      Deconstructs complex atmospheric phenomena: Polar amplification, atmospheric blocking patterns, HadISST sea surface anomalies, and El Niño Southern Oscillation (ENSO).
                    </p>
                  </div>
                </div>
              )}

              {selectedArchLayer === 'auth_persistence' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Client Session & Storage Security:</h5>
                    <p className="text-[11px] text-slate-400">
                      Stores user credentials, bookmarked hotspots, saved reports, personal notes, and preferred complexity mode in isolated LocalStorage partitions with zero telemetry leakage.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs">Data Complexity Engine:</h5>
                    <p className="text-[11px] text-slate-400">
                      Dynamically morphs all charts, statistics, and terminology into:
                      <br />• <strong>Simple:</strong> Plain English B1 comprehension + icon cues
                      <br />• <strong>Normal:</strong> Standard climate anomalies and trends
                      <br />• <strong>Complicated:</strong> Full p-values, standard deviations, and radiative forcing (W/m²).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: FULL USER STORY */}
        {activeTab === 'user_story' && (
          <div className="p-5 overflow-y-auto space-y-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                Agile Product Stories & Personas
              </span>
              <h3 className="text-sm font-bold text-white mt-1">
                End-to-End User Value Proposition Across Target Personas
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                NASA Earth Trend Detective was designed with rigorous user stories ensuring seamless value for research scientists, academic students, and real-world agricultural stakeholders.
              </p>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  persona: 'Dr. Elena Rostova',
                  role: 'Senior Cryosphere Research Scientist',
                  epic: 'Epic 1 • Temporal Cryosphere Investigation',
                  story: 'As a climate scientist, I want to scrub the timeline between 2000 and 2040 in the Arctic Sea Ice hotspot and view radiative forcing calculations, so that I can quantify polar amplification thresholds for academic publications.',
                  acceptance: [
                    'Able to select the Arctic Sea Ice hotspot and view baseline vs current sea ice extent.',
                    'Can switch to Complicated mode to reveal W/m² radiative forcing and confidence intervals.',
                    'Export a Space Apps Certified Briefing Report with complete mathematical citations.',
                  ],
                  badgeColor: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40',
                },
                {
                  persona: 'Samuel Green',
                  role: 'High School & University Student',
                  epic: 'Epic 2 • Accessible Planetary Learning',
                  story: 'As an environmental science student, I want to be guided by an interactive onboarding walkthrough and toggle Simple Mode, so that I can understand complex global warming trends through visual metaphors without being overwhelmed by dense jargon.',
                  acceptance: [
                    'App welcomes me with an automatic Onboarding Walkthrough explaining 3D navigation and timeline controls.',
                    'Simple Mode translates anomalies into easy analogies (e.g., "Like adding 5 blankets to Earth").',
                    'Listen button narrates monthly climate trends aloud with clear vocal synthesis.',
                  ],
                  badgeColor: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40',
                },
                {
                  persona: 'Maria Santos',
                  role: 'Agro-Ecologist & Field Observer',
                  epic: 'Epic 3 • Ground-Truth Correlation & Action',
                  story: 'As an agro-forestry specialist, I want to cross-reference satellite humidity and wind telemetry with 2022-2026 human field reports, so that I can advise local farmers on drought resilience and wet-bulb heat thresholds.',
                  acceptance: [
                    'Can switch between Temperature, Atmospheric Humidity, and Wind Circulation data branches.',
                    'Inspect verified human field reports from 2022–2026 and contribute new field notes.',
                    'Access Daily Eco-Advice and the Visual Farm Simulator to model crop yield impacts.',
                  ],
                  badgeColor: 'border-purple-500/50 text-purple-300 bg-purple-950/40',
                },
              ].map((story, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${story.badgeColor}`}>
                        {story.role}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{story.persona}</h4>
                    <span className="text-[10px] font-bold text-amber-400 block mb-2">{story.epic}</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 italic">
                      "{story.story}"
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Acceptance Criteria:</span>
                    <ul className="space-y-1 text-[11px] text-slate-400">
                      {story.acceptance.map((crit, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: FULL USER FLOW */}
        {activeTab === 'user_flow' && (
          <div className="p-5 overflow-y-auto space-y-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                  End-to-End System Journey
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Full User Flow Architecture from First Launch to Final Export
                </h3>
                <p className="text-xs text-slate-400">
                  Step through each state transition. Click "Try This Step" to navigate directly to the interface feature!
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0">
                8 Core Stages
              </span>
            </div>

            {/* Step-by-Step Flowchart */}
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-emerald-500 hidden sm:block" />

            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: 'Mandatory Authentication & Identity Setup',
                  subtitle: 'Security Gateway & Personal Profile Initialization',
                  icon: <UserCheck className="w-5 h-5 text-cyan-400" />,
                  description: 'The app prompts user to sign in or create an account with email & password, or use quick one-click demo credentials. Preferred complexity mode (Simple, Normal, Complicated) is selected.',
                  output: 'Authenticated UserProfile initialized in LocalStorage with saved bookmarks & field notes.',
                  jumpAction: 'auth',
                  jumpLabel: 'Open Auth Modal',
                },
                {
                  step: 2,
                  title: 'First-Time Onboarding Walkthrough',
                  subtitle: 'Interactive Interface & Operational Mastery',
                  icon: <Globe2 className="w-5 h-5 text-blue-400" />,
                  description: 'Upon login, the Onboarding Walkthrough component triggers automatically. It teaches 3D globe manipulation, timeline scrubbing, layer toggles, and anomaly interpretation.',
                  output: 'User gains operational confidence; hasCompletedOnboarding flag persists.',
                  jumpAction: 'walkthrough',
                  jumpLabel: 'Replay Walkthrough',
                },
                {
                  step: 3,
                  title: 'Planetary Exploration & 3D Spatial Navigation',
                  subtitle: 'Orbit, Zoom, Pan & Coordinate Inspection',
                  icon: <Compass className="w-5 h-5 text-emerald-400" />,
                  description: 'User freely rotates the Three.js globe. User clicks on any region, country, or custom latitude/longitude coordinate to trigger inverse spherical raycasting.',
                  output: 'Focused 3D camera orientation with localized thermal wave ripple shaders.',
                  jumpAction: 'search',
                  jumpLabel: 'Find Country on Globe',
                },
                {
                  step: 4,
                  title: '4D Temporal Scrubbing & AI Simulation Playback',
                  subtitle: 'Traveling from 2000 Historical Data to 2040 AI Predictions',
                  icon: <Clock className="w-5 h-5 text-amber-400" />,
                  description: 'User scrubs between years 2000–2040 and months 1–12, or hits Play to run continuous 4D animation. Shaders dynamically blend thermal and moisture gradient textures in real-time.',
                  output: 'Time-series temperature departure telemetry and monthly cryosphere freeze/thaw simulation.',
                  jumpAction: 'timeline',
                  jumpLabel: 'Open Timeline Dock',
                },
                {
                  step: 5,
                  title: 'Forensic Hotspot Deep-Dive & Physical Drivers',
                  subtitle: 'Deconstructing Causes Behind Climate Anomalies',
                  icon: <Flame className="w-5 h-5 text-rose-400" />,
                  description: 'User opens the Sidebar Data Panel to inspect anomaly trends, rate of warming per decade, famous landmarks, and scientific physical drivers.',
                  output: 'Detailed understanding of albedo loss, atmospheric rivers, and SST shifts.',
                  jumpAction: 'drivers',
                  jumpLabel: 'Explore Drivers',
                },
                {
                  step: 6,
                  title: 'Ground-Truth Field Correlation & User Reporting',
                  subtitle: 'Correlating Orbiting Satellites with Human Observations',
                  icon: <Users className="w-5 h-5 text-purple-400" />,
                  description: 'User checks the Human Reports registry (2022–2026) to see real field reports. User logs custom field notes or submits citizen science observation reports.',
                  output: 'New field reports and research notes linked to user profile.',
                  jumpAction: 'human_reports',
                  jumpLabel: 'View Field Reports',
                },
                {
                  step: 7,
                  title: 'AI Climate Copilot & Geospatial Grounding',
                  subtitle: 'Interactive Inquiry with Google Maps Integration',
                  icon: <Bot className="w-5 h-5 text-cyan-400" />,
                  description: 'User asks complex climate science questions to the NASA AI Copilot. Copilot references real satellite data and uses Google Maps to pinpoint exact geographical coordinates.',
                  output: 'Grounded scientific answers and automated camera fly-to actions.',
                  jumpAction: 'copilot',
                  jumpLabel: 'Launch AI Copilot',
                },
                {
                  step: 8,
                  title: 'Synthesis, Field Notebook & Report Export',
                  subtitle: 'Space Apps Certified Research Summary',
                  icon: <FileText className="w-5 h-5 text-teal-400" />,
                  description: 'User reviews consolidated field notes in the Research Notebook and generates a NASA Space Apps Certified Briefing Report with complete graphs and citations for download.',
                  output: 'Exported research dossier and persistent session sync.',
                  jumpAction: 'report',
                  jumpLabel: 'Open Report Generator',
                },
              ].map((flow) => (
                <div
                  key={flow.step}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      {flow.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                          Step {flow.step}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white font-heading">
                          {flow.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
                        {flow.subtitle}
                      </p>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {flow.description}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                        <span className="text-emerald-400 font-bold">Output:</span>
                        <span>{flow.output}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundFx.playChime();
                      onClose();
                      onSelectFlowStep?.(flow.jumpAction);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 self-end sm:self-center cursor-pointer shadow-sm"
                  >
                    <span>{flow.jumpLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NASA Space Apps Certified Open Science Framework</span>
          </div>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
