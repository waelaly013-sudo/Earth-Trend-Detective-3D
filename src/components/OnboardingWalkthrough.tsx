/**
 * NASA Earth Trend Detective - Interactive Onboarding Walkthrough
 * 
 * Triggers after successful login (and on demand).
 * Guides the user through:
 * 1. Mission Directive & Earth Trend Detective identity
 * 2. Operating the 3D Globe (orbit, pan, zoom, click raycasting, auto-rotation)
 * 3. Navigating the 4D Climate Timeline (2000-2040, monthly cycles, 4D playback engine)
 * 4. Toggling & Understanding Data Layers (Temperature, Humidity, Wind, Anomaly Heatmaps)
 * 5. Ground-Truth Field Reports, Personal Research Notebook & AI Copilot
 * 6. Full System Architecture & Complete User Flow Overview
 */

import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Sliders,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Clock,
  Play,
  RotateCcw,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  BookOpen,
  Bot,
  Users,
  CheckCircle2,
  Workflow,
  MousePointer,
  HelpCircle,
  Eye,
  FileText,
  Flame,
  ArrowRight
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenArchitectureModal?: () => void;
  onOpenTimelineControls?: () => void;
  onTestToggleGlobeRotate?: () => void;
  isAutoRotating?: boolean;
}

interface WalkthroughStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: string;
  keyInstructions: {
    label: string;
    description: string;
    keyCombo?: string;
  }[];
  spotlightTarget: 'globe' | 'timeline' | 'layers' | 'header' | 'sidebar' | 'architecture';
  interactiveActionLabel?: string;
  onInteractiveAction?: () => void;
}

// What this does: Displays the 6-step modal walkthrough that explains how to spin the 3D globe, use the 2000–2040 timeline, switch layers, read field reports, and view system specs.
// On the website: Opens from the Mission menu or Help banner to give users a structured tour card by card.
// Used as: The interactive 6-step onboarding modal.
export const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({
  isOpen,
  onClose,
  onOpenArchitectureModal,
  onOpenTimelineControls,
  onTestToggleGlobeRotate,
  isAutoRotating = true,
}) => {
  const { currentUser, completeOnboarding } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  const steps: WalkthroughStep[] = [
    {
      id: 'welcome',
      badge: 'Step 1 of 6 • Detective Orientation',
      title: 'Welcome to NASA Earth Trend Detective',
      subtitle: 'Your 3D Planetary Forensic Science Platform',
      icon: <Globe2 className="w-6 h-6 text-cyan-400" />,
      content: `Welcome aboard, Detective ${currentUser?.name || 'Investigator'}! You now have access to 40 years of synchronized NASA Earth system telemetry, spanning real satellite observations (2000–2026) and predictive CMIP6/SSP2-4.5 forward models (2027–2040).`,
      keyInstructions: [
        {
          label: 'Primary Objective',
          description: 'Detect, cross-reference, and explain planetary climate trends across temperature, moisture, and atmospheric circulation.',
        },
        {
          label: 'Data Integrity',
          description: 'Ground-truth verified against empirical human field observer reports from 2022 to 2026.',
        },
        {
          label: 'Data Complexity Modes',
          description: 'Switch between Simple (visuals + plain language), Normal (standard metrics), and Complicated (peer-reviewed scientific paper depth).',
        },
      ],
      spotlightTarget: 'globe',
    },
    {
      id: 'globe_controls',
      badge: 'Step 2 of 6 • 3D Spatial Navigation',
      title: 'Operating the 3D Interactive Globe',
      subtitle: 'Zero-Lag Three.js WebGL Navigation',
      icon: <Compass className="w-6 h-6 text-blue-400" />,
      content: 'The 3D Globe renders high-resolution Earth textures, dynamic thermal ripple shaders, real-time day/night terminators, cloud layers, and raycasted geospatial data pins.',
      keyInstructions: [
        {
          label: 'Orbit & Rotate',
          description: 'Click and drag with your Primary (Left) Mouse Button or swipe on mobile to freely rotate Earth.',
          keyCombo: 'Left Drag / Swipe',
        },
        {
          label: 'Zoom In / Out',
          description: 'Scroll your mouse wheel or pinch-to-zoom on touchscreens to inspect microclimate detail down to regional coordinates.',
          keyCombo: 'Mouse Wheel / Pinch',
        },
        {
          label: 'Inspect Hotspots & Countries',
          description: 'Click any pulsing hotspot marker, country boundary, or any latitude/longitude coordinate on Earth to launch the forensic Telemetry Sidebar.',
          keyCombo: 'Left Click',
        },
        {
          label: 'Auto-Rotation & Reset',
          description: 'Toggle planetary auto-spin or reset the camera view to prime orientation anytime using the dock controls.',
          keyCombo: 'Dock / R',
        },
      ],
      spotlightTarget: 'globe',
      interactiveActionLabel: isAutoRotating ? 'Pause Globe Spin' : 'Resume Globe Spin',
      onInteractiveAction: onTestToggleGlobeRotate,
    },
    {
      id: 'timeline_usage',
      badge: 'Step 3 of 6 • 4D Temporal Scrubbing',
      title: 'Mastering the 4D Climate Timeline',
      subtitle: 'Travel Through Time from 2000 to 2040 (Jan 2000 – Dec 2040)',
      icon: <Clock className="w-6 h-6 text-amber-400" />,
      content: 'The bottom Timeline dock is your 4D Time Machine. It integrates monthly data from 2000 to the present, about 26 years of empirical NASA MERRA-2 & POWER observations, and ~14 years of CMIP6 projections through Dec 2040.',
      keyInstructions: [
        {
          label: 'Tutorial Practice Task: Drag Timeline to 2035',
          description: 'Drag the timeline to 2035 to witness the AI model projection for late-summer Arctic cryosphere transitions and inspect the 95% confidence interval band.',
          keyCombo: 'Drag to 2035',
        },
        {
          label: 'Month Selector (Jan–Dec)',
          description: 'Select any month to observe seasonal freezing/melting cycles, monsoon moisture shifts, and summer peak anomalies.',
          keyCombo: 'Month Dropdown',
        },
        {
          label: '4D Simulation Playback (1x, 2x, 4x)',
          description: 'Click Play Timeline to run continuous temporal evolution month by month across the globe.',
          keyCombo: 'Play / Pause (Space)',
        },
        {
          label: 'Quick Jump Milestones',
          description: 'Click Start (2000), -10y, -1y, Today (Nov 2026), +1y, +5y, or End (2040) for instant navigation.',
          keyCombo: 'Pill Buttons',
        },
        {
          label: 'Read This Date Aloud',
          description: 'Click the Read Aloud button in the dock to hear synthesized voice telemetry of climate data for the selected month.',
          keyCombo: 'Voice Button',
        },
      ],
      spotlightTarget: 'timeline',
      interactiveActionLabel: 'Expand Mission Timeline',
      onInteractiveAction: onOpenTimelineControls,
    },
    {
      id: 'data_layers',
      badge: 'Step 4 of 6 • Forensic Data Layers',
      title: 'Toggling Data Layers & Domains',
      subtitle: 'Multi-Spectral Earth Science Perspectives',
      icon: <Layers className="w-6 h-6 text-emerald-400" />,
      content: 'NASA Earth Trend Detective offers 3 independent physical data branches and multiple high-fidelity visual rendering layers you can toggle independently.',
      keyInstructions: [
        {
          label: '3 Data Branches',
          description: 'Switch between Surface Temperature (°C), Atmospheric Humidity (RH%), and Kinetic Wind Speed (m/s) in the top header or dock.',
        },
        {
          label: 'Thermal Anomaly Heatmap',
          description: 'Visualizes positive (warm red/magenta) and negative (cool blue) departures from the 1951-1980 planetary baseline.',
        },
        {
          label: 'Individual Hotspot Layers',
          description: 'Filter specific Earth systems: Arctic Sea Ice, Amazon Deforestation Basin, North Atlantic SST, Sahara-Sahel Soil Moisture, and more.',
        },
        {
          label: 'Physical Shaders',
          description: 'Toggle realistic clouds, night-time city lights, atmospheric edge glow, and AI flow vector streamlines.',
        },
      ],
      spotlightTarget: 'layers',
    },
    {
      id: 'field_reports_and_ai',
      badge: 'Step 5 of 6 • Ground-Truth & AI Tools',
      title: 'Human Field Reports & AI Copilot',
      subtitle: 'Bridging Orbiting Satellites with Lived Human Experience',
      icon: <Users className="w-6 h-6 text-purple-400" />,
      content: 'Climate change is not just satellite pixels; it impacts real communities. Cross-reference thermal telemetry with empirical ground observations and consult the AI copilot.',
      keyInstructions: [
        {
          label: 'Real Human Field Reports (2022–2026)',
          description: 'Explore verified testimonials from Arctic glaciologists, Mediterranean olive farmers, and Sahelian pastoralists documenting microclimate shifts.',
        },
        {
          label: 'Personal Research Notebook',
          description: 'Take timestamped personal notes on any coordinate or hotspot. Your observations are saved directly to your account.',
        },
        {
          label: 'NASA AI Climate Copilot',
          description: 'Chat with an AI research assistant grounded in real NASA Earth Science and Google Maps geospatial landmarks.',
        },
        {
          label: 'Critical Anomaly Radar',
          description: 'Automatic toast alerts fire when your timeline lands on historical milestones like the 2023 Atlantic Ocean heatwave or 2024 global temperature records.',
        },
      ],
      spotlightTarget: 'header',
    },
    {
      id: 'architecture_and_user_flow',
      badge: 'Step 6 of 6 • System Architecture & Flow',
      title: 'Full Architecture & End-to-End User Flow',
      subtitle: 'Transparent Engineering & Scientific Methodology',
      icon: <Workflow className="w-6 h-6 text-cyan-400" />,
      content: 'Inspect the complete full-stack architecture diagram, agile user stories with acceptance criteria, and the complete end-to-end user journey flow from authentication to certified report generation.',
      keyInstructions: [
        {
          label: 'WebGL Three.js Rendering Core',
          description: 'GPU fragment/vertex shader pipelines with custom procedural noise and 60fps render loop.',
        },
        {
          label: 'Data Pipeline & Modeling',
          description: 'NASA MERRA-2, MODIS, and ERA5 reanalysis merged with CMIP6 SSP2-4.5 AI projections.',
        },
        {
          label: 'Full User Story & Acceptance Criteria',
          description: 'Detailed user stories for researchers, students, and agricultural practitioners.',
        },
        {
          label: 'End-to-End User Flow Map',
          description: 'Interactive state machine covering First Launch → Onboarding → Exploration → Hotspot Deep Dive → Field Verification → Export.',
        },
      ],
      spotlightTarget: 'architecture',
      interactiveActionLabel: 'Open Architecture & Flow Diagram',
      onInteractiveAction: onOpenArchitectureModal,
    },
  ];

  const currentStep = steps[currentStepIndex];

  // What this does: Listens for Left/Right/Enter/Escape keys so users can move through the walkthrough slides with the keyboard.
  // On the website: Allows quick keyboard navigation while the walkthrough modal is open.
  // Used as: The keyboard shortcut listener for the walkthrough.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  // What this does: Moves to the next walkthrough step, or completes the walkthrough on the final step.
  // On the website: Powers the Next Step button inside the walkthrough footer.
  // Used as: The forward step handler.
  const handleNext = () => {
    soundFx.playTick();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  // What this does: Goes back to the previous walkthrough step.
  // On the website: Powers the Prev button inside the walkthrough footer.
  // Used as: The backward step handler.
  const handlePrev = () => {
    soundFx.playTick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // What this does: Saves that onboarding is finished (if the checkbox is ticked) and closes the walkthrough modal.
  // On the website: Runs when the user clicks Start Exploring on the last slide.
  // Used as: The completion handler for the walkthrough.
  const handleComplete = () => {
    soundFx.playChime();
    if (dontShowAgain) {
      completeOnboarding();
    }
    onClose();
  };

  // What this does: Closes the walkthrough early and remembers not to auto-show it next time if checked.
  // On the website: Runs when clicking the top-right X button.
  // Used as: The skip/close handler for the walkthrough.
  const handleSkip = () => {
    soundFx.playTick();
    if (dontShowAgain) {
      completeOnboarding();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background Interactive Pointer Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {currentStep.spotlightTarget === 'timeline' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-28 border-2 border-dashed border-amber-400/60 rounded-2xl animate-pulse bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.2)]" />
        )}
        {currentStep.spotlightTarget === 'layers' && (
          <div className="absolute bottom-24 left-6 w-52 h-44 border-2 border-dashed border-emerald-400/60 rounded-2xl animate-pulse bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.2)]" />
        )}
        {currentStep.spotlightTarget === 'header' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-11/12 max-w-5xl h-16 border-2 border-dashed border-cyan-400/60 rounded-2xl animate-pulse bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.2)]" />
        )}
        {currentStep.spotlightTarget === 'globe' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[460px] h-[260px] sm:h-[460px] rounded-full border border-cyan-400/30 animate-spin [animation-duration:30s] pointer-events-none" />
        )}
      </div>

      {/* Main Walkthrough Card */}
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/50 rounded-xl md:rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden font-mono flex flex-col max-h-[88dvh] md:max-h-[92vh] z-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 py-2.5 md:px-5 md:py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-inner shrink-0">
              {currentStep.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400 tracking-wider truncate">
                  {currentStep.badge}
                </span>
                <span className="hidden sm:inline text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-700/60">
                  Interactive Guide
                </span>
              </div>
              <h2 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="p-1 md:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Skip Walkthrough"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Step Content Body */}
        <div className="p-3 md:p-5 overflow-y-auto space-y-2.5 md:space-y-4">
          <div className="text-[11px] md:text-xs text-cyan-300 font-semibold tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 shrink-0" />
            <span>{currentStep.subtitle}</span>
          </div>

          <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 md:p-3.5 rounded-xl border border-slate-800">
            {currentStep.content}
          </p>

          {/* Interactive Action Button */}
          {currentStep.interactiveActionLabel && currentStep.onInteractiveAction && (
            <div className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/40">
              <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-cyan-200">
                <MousePointer className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 animate-bounce shrink-0" />
                <span>Try right now:</span>
              </div>
              <button
                onClick={() => {
                  soundFx.playChime();
                  currentStep.onInteractiveAction?.();
                }}
                className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10.5px] md:text-xs flex items-center gap-1 transition-all shadow-md cursor-pointer shrink-0"
              >
                <span>{currentStep.interactiveActionLabel}</span>
                <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          )}

          {/* Key Instructions / Shortcut Reference Table */}
          <div className="space-y-1.5 md:space-y-2">
            <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Operational Controls & Key Behaviors</span>
              <span className="text-[9px] text-cyan-400 font-normal">Step {currentStepIndex + 1}/{steps.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2">
              {currentStep.keyInstructions.map((inst, idx) => (
                <div
                  key={idx}
                  className="p-2 md:p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-0.5 md:mb-1">
                    <span className="text-[11px] md:text-xs font-bold text-cyan-300 flex items-center gap-1 min-w-0">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{inst.label}</span>
                    </span>
                    {inst.keyCombo && (
                      <span className="text-[8.5px] md:text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-mono shrink-0">
                        {inst.keyCombo}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] md:text-[11px] text-slate-400 leading-normal">
                    {inst.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-3 py-2.5 md:px-5 md:py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-3 shrink-0">
          <label className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span>Do not open automatically on next login</span>
          </label>

          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundFx.playTick();
                    setCurrentStepIndex(idx);
                  }}
                  className={`h-1.5 md:h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-5 md:w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'w-1.5 md:w-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] md:text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>Prev</span>
                </button>
              )}

              {currentStepIndex < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-[11px] md:text-xs flex items-center gap-1 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-[11px] md:text-xs flex items-center gap-1 transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
                >
                  <span>Start Exploring</span>
                  <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
