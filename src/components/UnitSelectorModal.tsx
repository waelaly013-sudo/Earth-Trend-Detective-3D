/**
 * NASA Earth Trend Detective - Measuring Units Selector Modal
 * Allows users to choose measuring units across all 3 categories (Temperature, Wind Speed, Humidity)
 * and toggle dual unit display (e.g. Celsius & Fahrenheit simultaneously).
 */

import React from 'react';
import {
  X,
  Thermometer,
  Wind,
  Droplets,
  Layers,
  Check,
  Sparkles,
  Info,
  Scale,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { useUnitsAndLanguage } from '../context/UnitAndLanguageContext';
import {
  TEMPERATURE_UNITS,
  WIND_SPEED_UNITS,
  HUMIDITY_UNITS,
} from '../utils/unitConversions';
import type {
  TemperatureUnit,
  WindSpeedUnit,
  HumidityUnit,
} from '../types/units';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the props passed into the Measuring Units Selector popup.
// On the website: Controls whether the unit picker window is visible and how to close it.
// Used as: The TypeScript props contract for UnitSelectorModal.
interface UnitSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// What this does: Renders the unit settings window where users pick Temperature, Wind Speed, and Humidity units and dual-unit display.
// On the website: Lets users switch between °C/°F/K, m/s/km/h/mph, and RH%/Dew Point/VPD with live preview badges.
// Used as: The units & dual-unit preferences modal.
export const UnitSelectorModal: React.FC<UnitSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    language,
    isRTL,
    t,
    tempUnit,
    setTempUnit,
    windUnit,
    setWindUnit,
    humidityUnit,
    setHumidityUnit,
    showDualUnits,
    setShowDualUnits,
    formatTemp,
    formatWind,
    formatHum,
  } = useUnitsAndLanguage();

  if (!isOpen) return null;

  const isAr = language === 'ar';

  // Sample values for live interactive conversion preview
  const sampleTempC = 24.5;
  const sampleWindMs = 12.0;
  const sampleHumidity = {
    relativeHumidityPct: 68.0,
    tempC: sampleTempC,
    specificHumidityGKg: 13.8,
    vaporPressureDeficitKPa: 1.05,
    dewPointC: 18.2,
  };

  // What this does: Resets all unit preferences back to standard scientific SI units (°C, m/s, RH%) with dual display turned on.
  // On the website: Powers the "Reset to SI Standards" button in the bottom-left footer.
  // Used as: The reset-defaults click handler.
  const handleResetToSI = () => {
    soundFx.playTick();
    setTempUnit('celsius');
    setWindUnit('ms');
    setHumidityUnit('relative_humidity');
    setShowDualUnits(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 flex items-center justify-center shadow-lg border border-cyan-400/40">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                {t('unitsModalTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('unitsModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Dual Units Display Toggle Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-teal-950/40 border border-cyan-500/40 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">
                  {t('dualUnitsToggle')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  {isAr ? 'موصى به' : 'Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {t('dualUnitsDesc')}
              </p>
            </div>
            <button
              onClick={() => {
                soundFx.playTick();
                setShowDualUnits(!showDualUnits);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showDualUnits ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  showDualUnits
                    ? isRTL
                      ? '-translate-x-5'
                      : 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 1. TEMPERATURE CATEGORY */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('tempUnitsTitle')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('tempUnitsSubtitle')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {isAr ? 'معاينة مباشرة:' : 'Live Preview:'}
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
                  {formatTemp(sampleTempC)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPERATURE_UNITS.map((unit) => {
                const isSelected = tempUnit === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      soundFx.playTick();
                      setTempUnit(unit.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isRTL ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/80 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg font-bold font-mono text-amber-400">
                        {unit.symbol}
                      </span>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : unit.isSI ? (
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                          SI
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {isAr ? unit.nameAr : unit.nameEn}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                        {isAr ? unit.descriptionAr : unit.descriptionEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. WIND SPEED CATEGORY */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('windUnitsTitle')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('windUnitsSubtitle')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {isAr ? 'معاينة مباشرة:' : 'Live Preview:'}
                </span>
                <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-600/40">
                  {formatWind(sampleWindMs)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WIND_SPEED_UNITS.map((unit) => {
                const isSelected = windUnit === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      soundFx.playTick();
                      setWindUnit(unit.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isRTL ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-400/80 text-white shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base font-bold font-mono text-teal-400">
                        {unit.symbol}
                      </span>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : unit.isSI ? (
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                          SI
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {isAr ? unit.nameAr : unit.nameEn}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                        {isAr ? unit.descriptionAr : unit.descriptionEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. HUMIDITY CATEGORY */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('humidityUnitsTitle')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t('humidityUnitsSubtitle')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {isAr ? 'معاينة مباشرة:' : 'Live Preview:'}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-600/40">
                  {formatHum(sampleHumidity).formatted}
                  {formatHum(sampleHumidity).secondaryFormatted}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {HUMIDITY_UNITS.map((unit) => {
                const isSelected = humidityUnit === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      soundFx.playTick();
                      setHumidityUnit(unit.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isRTL ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold font-mono text-cyan-400">
                        {unit.symbol}
                      </span>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : unit.isSI ? (
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                          SI
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {isAr ? unit.nameAr : unit.nameEn}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                        {isAr ? unit.descriptionAr : unit.descriptionEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={handleResetToSI}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white py-1.5 px-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'استعادة الافتراضي (SI)' : 'Reset to SI Standards'}</span>
          </button>
          <button
            onClick={() => {
              soundFx.playChime();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            {isAr ? 'حفظ وإغلاق' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
