/**
 * NASA Earth Trend Detective - Detailed Climate Characteristics Dossier Modal
 * 
 * Styled in classic fancy Times New Roman typography with gold & celestial teal accents.
 * Provides in-depth scientific reports and explanations for every year and month from 2000 to 2040.
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Volume2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer,
  Compass,
  Thermometer,
  Droplets,
  Wind,
  ShieldAlert,
  Globe2,
  Award,
  Layers,
} from 'lucide-react';
import { getDetailedMonthlyClimateReport, MonthlyClimateReport } from '../data/climateCharacteristicsReports';
import { soundFx } from '../utils/audioSynth';
import { MONTH_NAMES_SHORT, START_YEAR, END_YEAR } from '../config/timelineConfig';

// What this does: Lists the props passed into the Monthly Climate Characteristics Dossier popup.
// On the website: Supplies the selected year and month and callbacks to step forward or backward through dates.
// Used as: The TypeScript props contract for ClimateReportDossierModal.
interface ClimateReportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  onSelectYear: (year: number) => void;
  onSelectMonth: (month: number) => void;
}

// What this does: Displays an archival newspaper-style scientific dossier for any month from 2000 to 2040.
// On the website: Shows CO2 levels, global anomaly, polar sea ice, milestones, and drivers for the picked month and year.
// Used as: The Climate Dossier modal opened from the Reports menu or Timeline dock.
export const ClimateReportDossierModal: React.FC<ClimateReportDossierModalProps> = ({
  isOpen,
  onClose,
  year,
  month,
  onSelectYear,
  onSelectMonth,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  if (!isOpen) return null;

  const report: MonthlyClimateReport = getDetailedMonthlyClimateReport(year, month);

  // What this does: Moves the dossier forward or backward by a number of years while staying within 2000–2040.
  // On the website: Runs when the user clicks the left or right arrow buttons next to the Year dropdown.
  // Used as: The year-stepping click handler.
  const handleStepYear = (delta: number) => {
    soundFx.playTick();
    const nextY = Math.max(START_YEAR, Math.min(END_YEAR, year + delta));
    onSelectYear(nextY);
  };

  // What this does: Moves the dossier forward or backward by one month and rolls over the year at Jan/Dec.
  // On the website: Lets the user step smoothly from month to month across years.
  // Used as: A month-navigation helper inside the dossier component.
  const handleStepMonth = (delta: number) => {
    soundFx.playTick();
    let nextM = month + delta;
    let nextY = year;
    if (nextM > 12) {
      nextM = 1;
      nextY = Math.min(END_YEAR, year + 1);
    } else if (nextM < 1) {
      nextM = 12;
      nextY = Math.max(START_YEAR, year - 1);
    }
    onSelectMonth(nextM);
    if (nextY !== year) onSelectYear(nextY);
  };

  // What this does: Reads the monthly climate headline, summary, and milestone aloud or stops speech if already playing.
  // On the website: Powers the speaker icon button in the dossier's top-right header.
  // Used as: The audio readout toggle handler.
  const handleSpeakReport = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    soundFx.playTick();

    const textToSpeak = `${report.headline}. ${report.summaryReport} Key landmark event: ${report.notableMilestoneOrEvent}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // What this does: Opens the browser's print dialog so the user can print or save the dossier as a PDF.
  // On the website: Runs when clicking the printer icon button in the dossier header.
  // Used as: The print action handler.
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
    >
      {/* Fancy Classical Archival Dossier Container */}
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0b1524] via-[#0d1b2f] to-[#08101d] border-2 border-[#d4af37]/60 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)] text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Ornate Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#d4af37]/30 bg-[#070e1a]/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c6d1f] p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0b1524] rounded-[10px] flex items-center justify-center text-[#d4af37]">
                <Globe2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] uppercase tracking-[0.15em] text-[#d4af37] font-bold">
                  NASA Earth Observing System Climatological Archive
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border ${
                    report.isHistorical
                      ? 'bg-teal-950/60 border-teal-500/50 text-teal-300'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {report.isHistorical ? 'Historical Observational Record' : 'CMIP6 Projection (95% CI)'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                Monthly Climate Characteristics Dossier: {report.monthName} {year}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakReport}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-[#d4af37] text-slate-950 border-[#d4af37] animate-pulse font-bold'
                  : 'bg-[#132238] border-[#d4af37]/30 text-[#d4af37] hover:bg-[#1b2f4d]'
              }`}
              title={isSpeaking ? 'Stop voice reading' : 'Read report aloud'}
              aria-label="Read report aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#132238] border border-[#d4af37]/30 text-slate-300 hover:text-white hover:bg-[#1b2f4d] transition-colors cursor-pointer hidden sm:flex"
              title="Print climate report dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundFx.playTick();
                onClose();
              }}
              className="p-2 rounded-xl bg-[#132238] border border-[#d4af37]/30 text-slate-400 hover:text-white hover:bg-[#1b2f4d] transition-colors cursor-pointer"
              title="Close dossier"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Year and Month Quick Navigator Ribbon */}
        <div className="px-4 sm:px-5 py-3 bg-[#0a1322] border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-3 shrink-0">
          {/* Year Stepper & Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Year:</span>
            <button
              onClick={() => handleStepYear(-1)}
              disabled={year <= START_YEAR}
              className="p-1 rounded bg-[#132238] hover:bg-[#1b2f4d] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={year}
              onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
              className="bg-[#132238] border border-[#d4af37]/40 text-white font-bold text-sm px-3 py-1 rounded-lg outline-none cursor-pointer"
            >
              {Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).map((y) => (
                <option key={y} value={y} className="bg-[#0b1524]">
                  {y} {y <= 2026 ? '(Observed)' : '(Projected)'}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleStepYear(1)}
              disabled={year >= END_YEAR}
              className="p-1 rounded bg-[#132238] hover:bg-[#1b2f4d] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Selector Chips */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {MONTH_NAMES_SHORT.map((mName, idx) => {
              const mNum = idx + 1;
              const isSelected = month === mNum;
              return (
                <button
                  key={mName}
                  onClick={() => onSelectMonth(mNum)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#d4af37] text-slate-950 font-bold shadow-md'
                      : 'bg-[#132238] hover:bg-[#1b2f4d] text-slate-300 hover:text-white'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          
          {/* Executive Headline & Seasonality Summary */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#10223b] via-[#0c192c] to-[#07111f] border border-[#d4af37]/40 shadow-inner space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-[#d4af37]">
              <span className="uppercase tracking-wider font-bold">Season: {report.seasonName}</span>
              <span>ENSO Pacific Mode: <strong>{report.ensoPhase}</strong></span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {report.headline}
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300 italic border-l-2 border-[#d4af37] pl-3 py-0.5">
              "{report.summaryReport}"
            </p>
          </div>

          {/* 4 Quantitative Planetary Characteristic Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Global Temp Anomaly */}
            <div className="p-3.5 rounded-xl bg-[#0b1626] border border-rose-500/30 flex flex-col justify-between">
              <span className="text-xs uppercase tracking-wider text-rose-300/80 font-bold">
                Surface Anomaly
              </span>
              <div className="my-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  +{report.globalTempAnomalyC}°C
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  vs 1951–1980 baseline
                </span>
              </div>
              <div className="text-[11px] text-rose-300">
                95% CI: {report.confidenceInterval95C.low}°C – {report.confidenceInterval95C.high}°C
              </div>
            </div>

            {/* 2. Atmospheric CO2 */}
            <div className="p-3.5 rounded-xl bg-[#0b1626] border border-amber-500/30 flex flex-col justify-between">
              <span className="text-xs uppercase tracking-wider text-amber-300/80 font-bold">
                Atmospheric CO₂
              </span>
              <div className="my-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {report.co2Ppm}
                </span>
                <span className="text-xs font-serif text-slate-400 ml-1">ppm</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Mauna Loa curve
                </span>
              </div>
              <div className="text-[11px] text-amber-300">
                Forcing: +{report.radiativeForcingWm2} W/m²
              </div>
            </div>

            {/* 3. Arctic Sea Ice Extent */}
            <div className="p-3.5 rounded-xl bg-[#0b1626] border border-cyan-500/30 flex flex-col justify-between">
              <span className="text-xs uppercase tracking-wider text-cyan-300/80 font-bold">
                Arctic Sea Ice
              </span>
              <div className="my-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {report.arcticSeaIceMkm2}
                </span>
                <span className="text-xs font-serif text-slate-400 ml-1">M km²</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  NSIDC polar telemetry
                </span>
              </div>
              <div className="text-[11px] text-cyan-300 truncate">
                {month >= 7 && month <= 9 ? 'Summer Minimum Melt' : 'Winter Ice Pack'}
              </div>
            </div>

            {/* 4. Antarctic Sea Ice Extent */}
            <div className="p-3.5 rounded-xl bg-[#0b1626] border border-teal-500/30 flex flex-col justify-between">
              <span className="text-xs uppercase tracking-wider text-teal-300/80 font-bold">
                Antarctic Sea Ice
              </span>
              <div className="my-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {report.antarcticSeaIceMkm2}
                </span>
                <span className="text-xs font-serif text-slate-400 ml-1">M km²</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Southern Ocean extent
                </span>
              </div>
              <div className="text-[11px] text-teal-300 truncate">
                {month >= 1 && month <= 3 ? 'Summer Coastal Thaw' : 'Winter Ocean Barrier'}
              </div>
            </div>
          </div>

          {/* Notable Yearly Milestone or Historical Event */}
          <div className="p-4 rounded-xl bg-[#0c182a] border border-[#d4af37]/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#d4af37] font-bold">
              <Award className="w-4 h-4 text-[#d4af37]" />
              <span>Year {year} Planetary Milestone &amp; Historical Event</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-serif">
              {report.notableMilestoneOrEvent}
            </p>
          </div>

          {/* Detailed Monthly Characteristics Breakdown */}
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-white tracking-wide border-b border-white/[0.08] pb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d4af37]" />
              <span>Monthly Environmental &amp; Physical Characteristics</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.monthlyCharacteristics.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#0a1424] border border-white/[0.08] space-y-1">
                  <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider block">
                    {item.title}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Energy Drivers & Radiative Balance */}
          <div className="space-y-2.5">
            <h4 className="text-lg font-bold text-white tracking-wide border-b border-white/[0.08] pb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <span>Physical Energy Drivers &amp; Planetary Imbalances</span>
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-300">
              {report.physicalDrivers.map((driver, idx) => (
                <li key={idx} className="p-2.5 rounded-lg bg-[#0a1424] border border-white/[0.06] flex items-start gap-2">
                  <span className="text-[#d4af37] font-bold mt-0.5">•</span>
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Human & Ecosystem Impact (Plain English) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c182a] to-[#07101c] border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400 font-bold">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Socioeconomic &amp; Ecological Impact (Plain Language)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {report.ecosystemImpact}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#d4af37]/30 bg-[#070e1a]/95 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Source: NASA GISTEMP v4, MERRA-2 Atmospheric Reanalysis, and CMIP6 SSP2-4.5 Multi-Model Ensemble.
          </div>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c148] text-slate-950 font-bold text-sm transition-all cursor-pointer active:scale-95 shadow-md"
          >
            Done Reading
          </button>
        </div>

      </div>
    </div>
  );
};
