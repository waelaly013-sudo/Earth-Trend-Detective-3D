/**
 * NASA Earth Trend Detective - Data Complexity Mode Selector Modal
 * Allows the user to select between Simple (Visual + B1 Language),
 * Normal (Balanced Mission Standard), and Complicated (Research Paper Depth).
 * Preserves the exact same buttons and actions across all modes.
 */

import React from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  PieChart,
  GraduationCap,
  Scale,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Eye,
} from 'lucide-react';
import { DataComplexityMode } from '../types/user';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the props needed by the Data Complexity Mode Selector modal.
// On the website: Tells the modal which reading level is active (Simple, Normal, or Complicated) and how to switch it.
// Used as: The TypeScript props interface for ComplexityModeModal.
interface ComplexityModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: DataComplexityMode;
  onSelectMode: (mode: DataComplexityMode) => void;
}

// What this does: Defines the display fields for each of the three data complexity cards.
// On the website: Holds the title, badge, target audience, feature bullets, and preview quote for each card.
// Used as: The TypeScript type for the modes array.
interface ModeOption {
  id: DataComplexityMode;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  borderActive: string;
  bgActive: string;
  description: string;
  targetAudience: string;
  features: string[];
  samplePreview: {
    heading: string;
    sampleText: string;
    visualStyle: string;
  };
}

// What this does: Renders the three-card picker letting users switch between Simple (B1), Normal, and Complicated research depth.
// On the website: Changes how explanations, charts, and scientific terms are written across the entire website.
// Used as: The complexity-level selector modal opened from the Science/Mission controls.
export const ComplexityModeModal: React.FC<ComplexityModeModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  // What this does: Defines the content and sample previews for Simple, Normal, and Complicated modes.
  // On the website: Renders the three selectable cards side-by-side in the modal body.
  // Used as: A local card configuration list inside ComplexityModeModal.
  const modes: ModeOption[] = [
    {
      id: 'simple',
      title: 'Simple Mode',
      badge: 'B1 English + High Visuals',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <PieChart className="w-5 h-5 text-emerald-400" />,
      borderActive: 'border-emerald-500 shadow-emerald-500/20',
      bgActive: 'bg-emerald-950/30',
      description: 'More visuals than writing, with words written in friendly CEFR B1 level plain English. Avoids difficult academic jargon.',
      targetAudience: 'Students, non-specialists, visual learners, and quick field reviews',
      features: [
        'High visual-to-text ratio with gauge meters and icon charts',
        'B1 vocabulary: simple, direct, everyday sentences',
        'Clear action bullets for daily human impact',
        'All buttons & controls remain identical and fully active'
      ],
      samplePreview: {
        heading: 'Preview: Arctic Sea Ice',
        sampleText: '"The ocean water is much warmer than usual. The ice melted away 3 weeks early, so polar bears cannot easily rest or hunt."',
        visualStyle: 'Visual Progress Bars & Danger Dials'
      }
    },
    {
      id: 'normal',
      title: 'Normal Mode',
      badge: 'Balanced Mission Baseline',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: <Scale className="w-5 h-5 text-cyan-400" />,
      borderActive: 'border-cyan-500 shadow-cyan-500/20',
      bgActive: 'bg-cyan-950/30',
      description: 'Original balanced NASA mission telemetry. Standard scientific journalism, verified environmental indicators, and narrative field summaries.',
      targetAudience: 'Educators, science enthusiasts, and policy analysts',
      features: [
        'Balanced charts, quantitative readouts, and narrative context',
        'Standard environmental and geographical terminology',
        'Detailed first-person field notes and observer quotes',
        'Full default mission telemetry layout'
      ],
      samplePreview: {
        heading: 'Preview: Arctic Sea Ice',
        sampleText: '"Biologists recorded record-breaking July surface temperatures of 8.4°C in Kongsfjorden, driving loss of summer fast-ice."',
        visualStyle: 'Standard Graphs & Telemetry Cards'
      }
    },
    {
      id: 'complicated',
      title: 'Complicated Mode',
      badge: 'Academic Research Paper',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: <GraduationCap className="w-5 h-5 text-purple-400" />,
      borderActive: 'border-purple-500 shadow-purple-500/20',
      bgActive: 'bg-purple-950/30',
      description: 'Full academic research paper depth. Dense quantitative analysis, confidence intervals (95% CI), p-values, and the 9 authentic NASA Earth System Coupled Effects.',
      targetAudience: 'Climatologists, university researchers, scientific reviewers, and advanced students',
      features: [
        'NASA Coupled Effects: Skin temp, precip, snow/ice, ozone, ET, soil moisture, vegetation, AOD, NO₂',
        'Real-world data calculated for each place on Earth with 95% CI bounds & high-accuracy 2040 predictions',
        'Full statistical tests: Mann-Kendall Z, p-value, Sen’s slope, ± σ',
        'Sensor calibrations: AIRS, MODIS, GPM IMERG, GLDAS, NSIDC, OMI, MERRA-2'
      ],
      samplePreview: {
        heading: 'Preview: NASA Coupled Effects (Temperature & Cryosphere)',
        sampleText: '"Skin Temp +2.4°C (AIRS/MODIS) • Cryosphere -12.4%/dec (NSIDC/MODIS) • Ozone 248 DU (OMI). 2040 Projections with 95% Confidence Intervals."',
        visualStyle: 'Coupled Environmental Matrices & Satellite Calibration'
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-700/80 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col max-h-[88dvh] md:max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 py-2.5 md:px-5 md:py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 md:w-5 md:h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  NASA Data Engine
                </span>
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Adaptive Intelligence
                </span>
              </div>
              <h2 className="text-xs sm:text-base md:text-lg font-bold text-white font-heading truncate">
                Choose Data Presentation &amp; Complexity
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1 md:p-1.5 rounded-lg md:rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-2.5 sm:p-5 md:p-6 overflow-y-auto space-y-3 md:space-y-5 text-[11px] md:text-xs text-slate-300">
          {/* Informational Banner */}
          <div className="p-2 md:p-3 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900 rounded-lg md:rounded-xl border border-cyan-500/30 flex items-start gap-2 md:gap-3">
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 md:space-y-1">
              <p className="text-slate-200 font-semibold text-[11px] md:text-xs">
                Feature Parity Notice: All buttons and functions remain identical in all modes.
              </p>
              <p className="text-slate-400 text-[10px] md:text-[11px] font-sans leading-snug">
                Selecting Simple or Complicated transforms text depth, vocabulary complexity, and visual-to-writing ratio.
              </p>
            </div>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-4">
            {modes.map((mode) => {
              const isSelected = currentMode === mode.id;

              return (
                <div
                  key={mode.id}
                  onClick={() => {
                    soundFx.playTick();
                    onSelectMode(mode.id);
                  }}
                  className={`p-2.5 md:p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? `${mode.borderActive} ${mode.bgActive} shadow-lg`
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] md:text-[10px]">
                      <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      <span>Active</span>
                    </div>
                  )}

                  <div className="space-y-2 md:space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 md:p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                        {mode.icon}
                      </div>
                      <div>
                        <h3 className="text-xs md:text-sm font-bold text-white">{mode.title}</h3>
                        <span className={`text-[8.5px] md:text-[9px] px-1.5 py-0.2 rounded border font-semibold ${mode.badgeColor}`}>
                          {mode.badge}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10.5px] md:text-[11px] text-slate-300 font-sans leading-relaxed">
                      {mode.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-1 pt-1.5 md:pt-2 border-t border-slate-800/80">
                      <span className="text-[8.5px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        Core Characteristics:
                      </span>
                      {mode.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[9.5px] md:text-[10px] text-slate-300">
                          <span className="text-cyan-400 mt-0.5">•</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Live Preview Box */}
                    <div className="mt-2 md:mt-3 p-2 md:p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[8.5px] md:text-[9px] text-slate-400">
                        <span className="font-bold text-cyan-300">{mode.samplePreview.heading}</span>
                        <span className="hidden sm:inline text-slate-500">{mode.samplePreview.visualStyle}</span>
                      </div>
                      <p className="text-[9.5px] md:text-[10px] font-sans italic text-slate-300 leading-snug">
                        {mode.samplePreview.sampleText}
                      </p>
                    </div>
                  </div>

                  {/* Select button */}
                  <div className="mt-2.5 md:mt-4 pt-2 md:pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      className={`w-full py-1.5 md:py-2 px-2.5 md:px-3 rounded-lg text-[11px] md:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-200'
                      }`}
                    >
                      <span>{isSelected ? 'Currently Selected' : `Switch to ${mode.title}`}</span>
                      {!isSelected && <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 md:px-5 md:py-3.5 border-t border-slate-800 bg-slate-900/80 text-[11px] md:text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] md:text-[11px] min-w-0">
            <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Dynamically updates all cards &amp; panels.</span>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors cursor-pointer shrink-0"
          >
            Apply &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
};
