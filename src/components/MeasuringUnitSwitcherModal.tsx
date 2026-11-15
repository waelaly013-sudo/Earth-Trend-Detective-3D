/**
 * NASA Earth Trend Detective - Measuring Units Switcher Modal
 * Provides interactive selection between different measuring units for:
 * 1. Temperature (Celsius, Fahrenheit, Kelvin, Dual °C & °F)
 * 2. Atmospheric Humidity (Relative Humidity %, Dew Point, Specific Humidity g/kg, Absolute Humidity g/m³, Vapor Pressure kPa, Dual)
 * 3. Surface Wind Speed (km/h, m/s, mph, knots, Beaufort Scale 0-12, Dual km/h & mph)
 */

import React, { useState } from 'react';
import {
  X,
  Scale,
  Thermometer,
  Droplets,
  Wind,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Globe,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import {
  TemperatureUnit,
  HumidityUnit,
  WindSpeedUnit,
  TEMPERATURE_UNIT_OPTIONS,
  HUMIDITY_UNIT_OPTIONS,
  WIND_SPEED_UNIT_OPTIONS,
  formatTemperature,
  formatHumidity,
  formatWindSpeed,
  formatTemperatureAnomaly,
} from '../utils/measuringUnits';
import { useMeasuringUnits } from '../context/UnitPreferencesContext';
import { soundFx } from '../utils/audioSynth';

// What this does: Defines the inputs needed to open and close the measuring units settings window.
// On the website: Controls whether the units configuration dialog is visible on screen.
// Used as: The blueprint for props passed into the MeasuringUnitSwitcherModal component.
interface MeasuringUnitSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// What this does: Renders a settings dialog where users pick how temperature, humidity, and wind speed are displayed.
// On the website: Shows preset unit bundles, category tabs, option cards, and live test sliders for every climate unit.
// Used as: The main measuring units switcher modal accessible from the app navigation.
export const MeasuringUnitSwitcherModal: React.FC<MeasuringUnitSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    temperatureUnit,
    humidityUnit,
    windSpeedUnit,
    setTemperatureUnit,
    setHumidityUnit,
    setWindSpeedUnit,
    resetToDefaults,
  } = useMeasuringUnits();

  // Active Category Tab: 'all' | 'temperature' | 'humidity' | 'wind'
  const [activeTab, setActiveTab] = useState<'all' | 'temperature' | 'humidity' | 'wind'>('all');

  // Interactive Live Preview Playground Values
  const [previewTempC, setPreviewTempC] = useState<number>(24.5);
  const [previewHumidityPct, setPreviewHumidityPct] = useState<number>(68);
  const [previewWindMs, setPreviewWindMs] = useState<number>(10.0);

  if (!isOpen) return null;

  // What this does: Switches temperature, humidity, and wind units all at once using a preset style.
  // On the website: Updates all unit cards and live readouts immediately when the user clicks Metric, Imperial, Scientific, or Dual.
  // Used as: The quick preset button handler at the top of the measuring units modal.
  const applyPreset = (preset: 'metric' | 'imperial' | 'scientific' | 'dual') => {
    soundFx.playChime();
    if (preset === 'metric') {
      setTemperatureUnit('celsius');
      setHumidityUnit('rh_pct');
      setWindSpeedUnit('kmh');
    } else if (preset === 'imperial') {
      setTemperatureUnit('fahrenheit');
      setHumidityUnit('rh_pct');
      setWindSpeedUnit('mph');
    } else if (preset === 'scientific') {
      setTemperatureUnit('kelvin');
      setHumidityUnit('specific_humidity');
      setWindSpeedUnit('ms');
    } else if (preset === 'dual') {
      setTemperatureUnit('dual_c_f');
      setHumidityUnit('dual_rh_dew');
      setWindSpeedUnit('dual_kmh_mph');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.15)] text-slate-100 overflow-hidden"
        role="dialog"
        aria-labelledby="measuring-units-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="measuring-units-title" className="text-lg sm:text-xl font-bold font-heading text-white tracking-wide">
                  Measuring Units Configuration
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 hidden sm:inline-block">
                  Universal Selector
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose measuring units for Temperature, Humidity, and Wind Speed across telemetry, cards, and reports.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close dialog"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Quick Presets:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => applyPreset('metric')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
            >
              🌍 Metric (°C, % RH, km/h)
            </button>
            <button
              onClick={() => applyPreset('imperial')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
            >
              🇺🇸 Imperial (°F, % RH, mph)
            </button>
            <button
              onClick={() => applyPreset('scientific')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/40 text-slate-300 hover:text-white text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
            >
              🔬 Scientific (K, g/kg, m/s)
            </button>
            <button
              onClick={() => applyPreset('dual')}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-950/80 to-purple-950/80 hover:from-blue-900 hover:to-purple-900 border border-indigo-400/40 text-indigo-200 hover:text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
              title="View Celsius & Fahrenheit, % RH & Dew Point, km/h & mph side-by-side"
            >
              ✦ Dual Display (All)
            </button>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center px-4 sm:px-5 py-2 bg-slate-900/60 border-b border-slate-800 gap-1.5 text-xs font-mono shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <span>All Categories</span>
          </button>
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('temperature');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'temperature'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Temperature</span>
          </button>
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('humidity');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'humidity'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Humidity</span>
          </button>
          <button
            onClick={() => {
              soundFx.playTick();
              setActiveTab('wind');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wind'
                ? 'bg-teal-950/60 text-teal-300 border border-teal-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Wind Speed</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
          
          {/* ========================================================================= */}
          {/* 1. TEMPERATURE UNITS SECTION                                              */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'temperature') && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/40">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Temperature Measuring Units</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Currently Selected: <strong className="text-amber-300">{TEMPERATURE_UNIT_OPTIONS.find(o => o.id === temperatureUnit)?.label}</strong>
                    </p>
                  </div>
                </div>

                {/* Live Real-time Formatted Sample */}
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Live Sample Readout</span>
                  <div className="text-sm font-extrabold text-amber-200 font-mono">
                    {formatTemperature(previewTempC, temperatureUnit)}
                  </div>
                </div>
              </div>

              {/* Radio Option Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TEMPERATURE_UNIT_OPTIONS.map((opt) => {
                  const isSelected = temperatureUnit === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTemperatureUnit(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-bold text-xs text-white">{opt.label}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-700">
                          {opt.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>

                      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Sample: {formatTemperature(24.5, opt.id)}</span>
                        <span>Anomaly: {formatTemperatureAnomaly(1.38, opt.id)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Temperature Slider to test chosen unit */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">Test Slider:</span>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="0.5"
                  value={previewTempC}
                  onChange={(e) => setPreviewTempC(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono text-xs font-bold text-amber-300 shrink-0 min-w-[70px] text-right">
                  {formatTemperature(previewTempC, temperatureUnit)}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ATMOSPHERIC HUMIDITY UNITS SECTION                                      */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'humidity') && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Atmospheric Moisture &amp; Humidity Units</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Currently Selected: <strong className="text-cyan-300">{HUMIDITY_UNIT_OPTIONS.find(o => o.id === humidityUnit)?.label}</strong>
                    </p>
                  </div>
                </div>

                {/* Live Real-time Formatted Sample */}
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Live Sample Readout</span>
                  <div className="text-sm font-extrabold text-cyan-200 font-mono">
                    {formatHumidity(previewHumidityPct, previewTempC, humidityUnit, temperatureUnit)}
                  </div>
                </div>
              </div>

              {/* Radio Option Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {HUMIDITY_UNIT_OPTIONS.map((opt) => {
                  const isSelected = humidityUnit === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setHumidityUnit(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-bold text-xs text-white leading-tight">{opt.shortLabel}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-700 shrink-0">
                          {opt.badge}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-slate-400 leading-snug line-clamp-2">
                        {opt.description}
                      </p>

                      <div className="pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-cyan-300">
                        {formatHumidity(68, 24.5, opt.id, temperatureUnit)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Humidity Slider */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">Test Slider:</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={previewHumidityPct}
                  onChange={(e) => setPreviewHumidityPct(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono text-xs font-bold text-cyan-300 shrink-0 min-w-[85px] text-right">
                  {formatHumidity(previewHumidityPct, previewTempC, humidityUnit, temperatureUnit)}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SURFACE WIND SPEED UNITS SECTION                                       */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'wind') && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-teal-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-950/60 text-teal-300 border border-teal-500/40">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Surface Wind Speed Units</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Currently Selected: <strong className="text-teal-300">{WIND_SPEED_UNIT_OPTIONS.find(o => o.id === windSpeedUnit)?.label}</strong>
                    </p>
                  </div>
                </div>

                {/* Live Real-time Formatted Sample */}
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Live Sample Readout</span>
                  <div className="text-sm font-extrabold text-teal-200 font-mono">
                    {formatWindSpeed(previewWindMs, windSpeedUnit, { includeBeaufortDescription: true })}
                  </div>
                </div>
              </div>

              {/* Radio Option Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {WIND_SPEED_UNIT_OPTIONS.map((opt) => {
                  const isSelected = windSpeedUnit === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setWindSpeedUnit(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-teal-950/40 border-teal-400 text-white shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-teal-400 bg-teal-400 text-slate-950' : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-bold text-xs text-white leading-tight">{opt.shortLabel}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-950 text-teal-300 border border-slate-700 shrink-0">
                          {opt.badge}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-slate-400 leading-snug line-clamp-2">
                        {opt.description}
                      </p>

                      <div className="pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-teal-300">
                        {formatWindSpeed(10.0, opt.id, { includeBeaufortDescription: true })}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Wind Speed Slider */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">Test Slider:</span>
                <input
                  type="range"
                  min="0.5"
                  max="40"
                  step="0.5"
                  value={previewWindMs}
                  onChange={(e) => setPreviewWindMs(parseFloat(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="font-mono text-xs font-bold text-teal-300 shrink-0 min-w-[90px] text-right">
                  {formatWindSpeed(previewWindMs, windSpeedUnit, { includeBeaufortDescription: true })}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs cursor-pointer transition-colors"
            title="Reset measuring units to international SI defaults (°C, % RH, km/h)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to SI Defaults</span>
          </button>

          <button
            onClick={() => {
              soundFx.playChime();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs font-mono tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Apply &amp; Explore Earth</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
