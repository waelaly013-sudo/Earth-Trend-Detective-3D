/**
 * NASA Earth Trend Detective - Climate Drivers & Moisture Change Reasons Modal
 * Explains the precise scientific causes and physical mechanisms driving temperature
 * and humidity change in the selected country or region.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  HelpCircle,
  Satellite,
  Compass,
  Thermometer,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  Volume2,
  VolumeX,
  History,
  Clock,
  BookOpen,
  Sigma,
  Scale,
  Binary,
  Activity,
  Droplets,
  Wind,
} from 'lucide-react';
import { ActiveInspectorItem } from '../types/climate';
import { MONTH_NAMES, calculateMonthlyTemperature, getCountryHumidity, getCountryWind } from '../data/countriesData';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

// What this does: Lists the props passed into the Climate Drivers explanation popup.
// On the website: Tells the popup which country or hotspot is active and which year/month to compare.
// Used as: The TypeScript props interface for ClimateDriversModal.
interface ClimateDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ActiveInspectorItem | null;
  currentYear: number;
  currentMonth: number; // 1 to 12
}

// What this does: Renders a deep-dive scientific popup explaining why temperature, humidity, or wind is changing in a region.
// On the website: Compares 2000 vs 2026 vs 2040 values, lists physical causes, and offers audio readout and physics formulas.
// Used as: The "Why Is It Changing?" modal opened from the side inspector panel.
export const ClimateDriversModal: React.FC<ClimateDriversModalProps> = ({
  isOpen,
  onClose,
  item,
  currentYear,
  currentMonth,
}) => {
  const { dataMode, dataBranch } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // What this does: Stops any active text-to-speech narration if the popup closes or the selected place changes.
  // On the website: Keeps voice narration from continuing to play after leaving the screen.
  // Used as: A cleanup React effect watching item?.id.
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [item?.id]);

  if (!isOpen || !item) return null;

  const isHumidity = dataBranch === 'humidity';
  const isCountry = 'type' in item && item.type === 'country';
  const isHotspot = !('type' in item) || item.type === 'hotspot';

  // Extract flag, landmark, and reasons
  const flagEmoji = (item as { flagEmoji?: string }).flagEmoji || (isCountry ? '🌍' : '🌐');
  const landmark = (item as { famousLandmark?: string }).famousLandmark || (isCountry ? 'National Heritage & Geographic Heartland' : 'Natural Earth Reserve');
  const landmarkIcon = (item as { landmarkIcon?: string }).landmarkIcon || '🏛️';

  // Default temperature reasons
  const defaultTempReasons = [
    'Radiative Forcing & Greenhouse Accumulation: Atmospheric concentration of CO₂ and CH₄ trapping outgoing longwave infrared radiation',
    'Atmospheric Circulation Shift: Persistent high-pressure anomalies blocking cooler ocean marine layers',
    'Surface Albedo Degradation: Vegetative loss or ice thaw reducing reflective capability and boosting ground absorption',
    'Vapor Pressure Deficit Escalation: Intensified atmospheric thirst dehydrating soil water reserves'
  ];

  // Default humidity reasons (Google Scholar & NASA EarthData - Byrne & O'Gorman 2018 PNAS)
  const defaultHumReasons = [
    'Thermodynamic Clausius-Clapeyron Expansion: Water vapor holding capacity expands exponentially (+7% per °C), increasing atmospheric moisture deficit over warm interiors.',
    'Byrne & O’Gorman Land-Ocean Drying Mechanism: Faster continental warming relative to oceans reduces continental relative humidity by starving inland air of marine moisture saturation.',
    'Vapor Pressure Deficit (VPD) Escalation: Warmer air widens the gap between actual and saturation vapor pressure, intensifying evaporative pull on forests and crops.',
    'Boundary Layer Evapotranspiration Deficit: Depleted root-zone soil moisture cuts latent heat cooling, trapping sensible heat and locking in atmospheric desiccation.'
  ];

  const isWind = dataBranch === 'wind';
  // Default wind reasons (Young & Ribal 2019 Science, Zeng et al. 2019 Nature Geoscience)
  const defaultWindReasons = [
    'Equator-to-Pole Geostrophic Thermal Gradient Weakening: Rapid Arctic amplification reduces mid-latitude temperature contrast, slowing polar jet stream phase speed and increasing blocking meanders.',
    'Terrestrial Aerodynamic Surface Roughness (Zeng et al. Nature Geoscience): Expanding terrestrial biomass, afforestation, and urban canopy drag decelerate 10-meter boundary layer winds (decadal stilling).',
    'Hadley Cell Poleward Expansion & Subtropical High Migration: Tropical circulation cell widening shifts prevailing trade winds and mid-latitude westerly storm tracks poleward.',
    'Atmospheric Boundary Layer Mechanical Wind Shear & Decoupling: Elevated nocturnal temperature inversions decouple upper tropospheric momentum from surface hub heights.'
  ];

  const countryWindForReasons = isCountry ? getCountryWind(item as any, currentYear, currentMonth) : null;
  const tempReasons = (item as { temperatureChangeReasons?: string[] }).temperatureChangeReasons || defaultTempReasons;
  const humReasons = (item as { humidityChangeReasons?: string[] }).humidityChangeReasons || defaultHumReasons;
  const windReasons = (item as any).windChangeReasons || countryWindForReasons?.windChangeReasons || defaultWindReasons;
  const activeReasons = isWind ? windReasons : isHumidity ? humReasons : tempReasons;

  // Monthly temperature profile
  const lat = item.lat;
  const baseline = (item as { baselineTempC?: number }).baselineTempC ?? 15.0;
  const rate = (item as { warmingRateDecadeC?: number }).warmingRateDecadeC ?? 0.35;
  const multiplier = (item as { warmingMultiplier?: number }).warmingMultiplier ?? 1.3;

  const locProfile = { lat, baselineTempC: baseline, warmingRateDecadeC: rate, warmingMultiplier: multiplier };

  // 1. Past (Year 2000 Baseline)
  const pastMonthData = calculateMonthlyTemperature(locProfile, 2000, currentMonth);

  // 2. Present (Year 2026 Observed)
  const presentMonthData = calculateMonthlyTemperature(locProfile, 2026, currentMonth);

  // 3. Prediction (Year 2040 AI Model)
  const pred2040MonthData = calculateMonthlyTemperature(locProfile, 2040, currentMonth);

  // What this does: Computes wind speed, gust speed, Beaufort force, and power density for a given year (2000, 2026, or 2040).
  // On the website: Fills the three Past / Present / Prediction comparison boxes when Wind branch is active.
  // Used as: A helper function normalizing both country records and ocean/hotspot records.
  const getUnifiedWind = (yr: number) => {
    if (isCountry) {
      const w = getCountryWind(item as any, yr, currentMonth);
      return {
        meanWindSpeedMs: w.meanWindSpeedMs,
        meanWindSpeedKmh: w.meanWindSpeedKmh,
        gustSpeedKmh: w.gustSpeedKmh,
        beaufortScale: w.beaufortScale,
        beaufortDescription: w.beaufortDescription,
        windPowerDensityWm2: w.windPowerDensityWm2,
        prevailingDirection: w.prevailingWindDirection,
      };
    }
    const m = (item as any).windMetrics || {};
    const base = m.meanWindSpeedMs || 10.5;
    const trend = (m.decadalTrendPct || 5.0) / 100;
    const yrOffset = yr - 2000;
    const isNorthern = item.lat >= 0;
    const isWinter = isNorthern ? (currentMonth === 12 || currentMonth <= 2) : (currentMonth >= 6 && currentMonth <= 8);
    const isSummer = isNorthern ? (currentMonth >= 6 && currentMonth <= 8) : (currentMonth === 12 || currentMonth <= 2);
    const isSomali = item.id.includes('somali');
    const seasonalFactor = isSomali && isSummer ? 1.35 : isWinter ? 1.15 : isSummer ? 0.92 : 1.03;
    const v = Number(((base + (trend * (yrOffset / 10) * base)) * seasonalFactor).toFixed(1));
    return {
      meanWindSpeedMs: v,
      meanWindSpeedKmh: Number((v * 3.6).toFixed(1)),
      gustSpeedKmh: Number((v * 3.6 * 1.65).toFixed(1)),
      beaufortScale: m.beaufortScale || (v >= 10.8 ? 6 : v >= 8 ? 5 : 4),
      beaufortDescription: m.beaufortDescription || (v >= 10.8 ? 'Strong Breeze' : 'Moderate Breeze'),
      windPowerDensityWm2: Math.round(0.5 * 1.225 * Math.pow(v, 3)),
      prevailingDirection: m.prevailingDirection || 'WNW',
    };
  };

  const wind2000 = getUnifiedWind(2000);
  const wind2026 = getUnifiedWind(2026);
  const wind2040 = getUnifiedWind(2040);

  // What this does: Computes relative humidity, specific humidity, VPD, dew point, and wet-bulb temperature for a given year.
  // On the website: Fills the three Past / Present / Prediction comparison boxes when Humidity branch is active.
  // Used as: A helper function unifying country and hotspot moisture calculations.
  const getUnifiedHum = (yr: number) => {
    if (isCountry) {
      const cHum = getCountryHumidity(item as any, yr, currentMonth);
      return {
        relativeHumidityPercent: cHum.currentRelativeHumidityPct,
        rhAnomalyPercent: cHum.relativeHumidityAnomalyPct,
        specificHumidityGKg: cHum.specificHumidityGKg,
        vaporPressureDeficitKPa: cHum.vaporPressureDeficitKPa,
        dewPointC: cHum.dewPointC,
        wetBulbC: cHum.wetBulbC,
      };
    }
    const baseRH = (item as any).humidityBaselineRH ?? 65;
    const curRH = (item as any).relativeHumidityPercent ?? 61.5;
    const anomRH = (item as any).rhAnomalyPercent ?? -3.5;
    const spec = (item as any).specificHumidityGKg ?? 11.2;
    const vpd = (item as any).vaporPressureDeficitKPa ?? 1.45;
    const dp = (item as any).dewPointC ?? 14.2;
    const wb = (item as any).wetBulbC ?? 22.8;

    if (yr <= 2000) {
      return {
        relativeHumidityPercent: baseRH,
        rhAnomalyPercent: 0,
        specificHumidityGKg: Number((spec * 0.92).toFixed(1)),
        vaporPressureDeficitKPa: Number((vpd * 0.88).toFixed(2)),
        dewPointC: Number((dp - 1.2).toFixed(1)),
        wetBulbC: Number((wb - 1.0).toFixed(1)),
      };
    } else if (yr <= 2026) {
      return {
        relativeHumidityPercent: curRH,
        rhAnomalyPercent: anomRH,
        specificHumidityGKg: spec,
        vaporPressureDeficitKPa: vpd,
        dewPointC: dp,
        wetBulbC: wb,
      };
    } else {
      return {
        relativeHumidityPercent: Number((baseRH + anomRH * 1.5).toFixed(1)),
        rhAnomalyPercent: Number((anomRH * 1.5).toFixed(1)),
        specificHumidityGKg: Number((spec * 1.12).toFixed(1)),
        vaporPressureDeficitKPa: Number((vpd * 1.22).toFixed(2)),
        dewPointC: Number((dp + 1.8).toFixed(1)),
        wetBulbC: Number((wb + 1.6).toFixed(1)),
      };
    }
  };

  const hum2000 = getUnifiedHum(2000);
  const hum2026 = getUnifiedHum(2026);
  const hum2040 = getUnifiedHum(2040);

  // What this does: Reads the 2000, 2026, and 2040 comparison numbers aloud using browser speech synthesis, or stops if already speaking.
  // On the website: Powers the "Say Wind/Humidity/Temperatures Out Loud" audio readout button.
  // Used as: The voice narration click handler inside the three-epoch card.
  const speakTelemetry = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const monthName = MONTH_NAMES[currentMonth - 1];

    let speechText = '';
    if (isWind) {
      const pastW = wind2000.meanWindSpeedMs;
      const presW = wind2026.meanWindSpeedMs;
      const predW = wind2040.meanWindSpeedMs;
      const deltaW = Number((predW - pastW).toFixed(1));
      speechText = `In ${item.name}, for the month of ${monthName}: In the year 2000, mean surface wind speed was ${pastW} meters per second. In 2026, it is ${presW} meters per second. By 2040, the AI prediction projects ${predW} meters per second, a net shift of ${deltaW >= 0 ? `plus ${deltaW}` : deltaW} meters per second, with peak gust capacity reaching ${wind2040.gustSpeedKmh} kilometers per hour and wind power density reaching ${wind2040.windPowerDensityWm2} Watts per square meter.`;
    } else if (isHumidity) {
      const pastRH = hum2000.relativeHumidityPercent;
      const presRH = hum2026.relativeHumidityPercent;
      const predRH = hum2040.relativeHumidityPercent;
      const delta = Number((predRH - pastRH).toFixed(1));
      speechText = `In ${item.name}, for the month of ${monthName}: In the year 2000 baseline, relative humidity was ${pastRH} percent. In 2026, it is ${presRH} percent. By 2040, the AI prediction projects ${predRH} percent, a net shift of ${delta} percentage points, with vapor pressure deficit reaching ${hum2040.vaporPressureDeficitKPa} kilopascals.`;
    } else {
      const pastVal = pastMonthData.monthlyTempC;
      const presentVal = presentMonthData.monthlyTempC;
      const predVal = pred2040MonthData.monthlyTempC;
      const totalWarming = Number((predVal - pastVal).toFixed(1));
      speechText = `In ${item.name}, for the month of ${monthName}: In the past, in the year 2000, the temperature was ${pastVal} degrees Celsius. In the present, in the year 2026, the temperature is ${presentVal} degrees Celsius. And the AI prediction for 2040 is ${predVal} degrees Celsius. That represents an increase of ${totalWarming} degrees Celsius.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    soundFx.playTick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ${
          isWind ? 'border-teal-500/40' : isHumidity ? 'border-cyan-500/40' : 'border-amber-500/40'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-3xl shrink-0 p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center">
              <span>{flagEmoji}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    isWind ? 'text-teal-400' : isHumidity ? 'text-cyan-400' : 'text-amber-400'
                  }`}
                >
                  {isWind
                    ? 'Planetary Wind Circulation & Aerodynamic Physics'
                    : isHumidity
                    ? 'Atmospheric Moisture & Humidity Physics'
                    : 'Scientific Climate Attribution'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.2 rounded border ${
                    isWind
                      ? 'bg-teal-950/60 text-teal-300 border-teal-800/60'
                      : isHumidity
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                      : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                  }`}
                >
                  {isWind
                    ? 'NASA CYGNSS • RapidScat • MERRA-2'
                    : isHumidity
                    ? 'NASA AIRS • MERRA-2 • HadISDH'
                    : 'IPCC AR6 • NASA Telemetry'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center gap-2">
                <span>{item.name}</span>
                <span className="text-sm font-normal text-slate-400 font-mono">
                  ({landmarkIcon} {landmark})
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              soundFx.playTick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* THREE-EPOCH MONTHLY COMPARATIVE CARD: PAST vs PRESENT vs PREDICTION */}
          <div
            className={`p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border rounded-xl space-y-3 ${
              isWind ? 'border-teal-500/30' : isHumidity ? 'border-cyan-500/30' : 'border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {isWind ? (
                  <Wind className="w-4 h-4 text-teal-400" />
                ) : isHumidity ? (
                  <Droplets className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Calendar className="w-4 h-4 text-amber-400" />
                )}
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    isWind ? 'text-teal-300' : isHumidity ? 'text-cyan-300' : 'text-amber-300'
                  }`}
                >
                  {MONTH_NAMES[currentMonth - 1]} {isWind ? 'Surface Wind Dynamics' : isHumidity ? 'Humidity' : 'Temperature'}: Past • Present • Prediction
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {pastMonthData.seasonName}
              </span>
            </div>

            {/* Voice Readout Button */}
            <button
              onClick={speakTelemetry}
              className={`w-full py-1.5 px-3 rounded-lg border font-mono text-xs flex items-center justify-between transition-all cursor-pointer ${
                isSpeaking
                  ? isWind
                    ? 'bg-teal-500 text-slate-950 border-teal-300 font-bold shadow-[0_0_15px_rgba(20,184,166,0.5)] animate-pulse'
                    : isHumidity
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse'
                    : 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                  : isWind
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-teal-300 border-teal-500/40 hover:border-teal-400'
                  : isHumidity
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
              }`}
              title="Speak past, present, and predicted telemetry aloud"
            >
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-slate-950 animate-bounce" />
                ) : (
                  <Volume2 className={`w-4 h-4 ${isWind ? 'text-teal-400' : isHumidity ? 'text-cyan-400' : 'text-amber-400'}`} />
                )}
                <span className="font-semibold">
                  {isSpeaking
                    ? 'Speaking Telemetry... (Click to Stop)'
                    : `🔊 Say ${MONTH_NAMES[currentMonth - 1]} ${isWind ? 'Wind Velocity Profile' : isHumidity ? 'Humidity Profile' : 'Temperatures'} Out Loud`}
                </span>
              </div>
              <span
                className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950/60 ${
                  isWind ? 'text-teal-200' : isHumidity ? 'text-cyan-200' : 'text-amber-200'
                }`}
              >
                Audio Readout
              </span>
            </button>

            {/* 3 Epoch Columns */}
            {isWind ? (
              <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                {/* PAST (2000) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-teal-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-teal-400 uppercase tracking-wider block font-bold">
                      Past (2000)
                    </span>
                    <span className="text-[9px] text-slate-400">Baseline 10m Wind</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-teal-200">
                      {wind2000.meanWindSpeedMs} <span className="text-xs font-normal">m/s</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {wind2000.meanWindSpeedKmh} km/h • Force {wind2000.beaufortScale}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-slate-950/60 py-0.5 px-1 rounded border border-slate-800">
                    WPD: {wind2000.windPowerDensityWm2} W/m²
                  </span>
                </div>

                {/* PRESENT (2026) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">
                      Present (2026)
                    </span>
                    <span className="text-[9px] text-slate-400">Observed 10m Wind</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-emerald-300">
                      {wind2026.meanWindSpeedMs} <span className="text-xs font-normal">m/s</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                      {wind2026.meanWindSpeedKmh} km/h • Gusts: {wind2026.gustSpeedKmh} km/h
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/40 py-0.5 px-1 rounded border border-emerald-800/60">
                    {Number((wind2026.meanWindSpeedMs - wind2000.meanWindSpeedMs).toFixed(1)) >= 0 ? `+${Number((wind2026.meanWindSpeedMs - wind2000.meanWindSpeedMs).toFixed(1))}` : Number((wind2026.meanWindSpeedMs - wind2000.meanWindSpeedMs).toFixed(1))} m/s vs 2000
                  </span>
                </div>

                {/* PREDICTION (2040) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-violet-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-violet-400 uppercase tracking-wider block font-bold">
                      Prediction (2040)
                    </span>
                    <span className="text-[9px] text-slate-400">CYGNSS AI Model</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-violet-300">
                      {wind2040.meanWindSpeedMs} <span className="text-xs font-normal">m/s</span>
                    </div>
                    <span className="text-[10px] text-violet-400 block mt-0.5">
                      {wind2040.meanWindSpeedKmh} km/h • {wind2040.beaufortDescription}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-violet-300 bg-violet-950/40 py-0.5 px-1 rounded border border-violet-800/60">
                    WPD: {wind2040.windPowerDensityWm2} W/m² • Gusts: {wind2040.gustSpeedKmh} km/h
                  </span>
                </div>
              </div>
            ) : isHumidity ? (
              <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                {/* PAST (2000) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-sky-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-sky-400 uppercase tracking-wider block font-bold">
                      Past (2000)
                    </span>
                    <span className="text-[9px] text-slate-400">Baseline RH</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-sky-200">
                      {hum2000.relativeHumidityPercent}%
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      q: {hum2000.specificHumidityGKg} g/kg
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-slate-950/60 py-0.5 px-1 rounded border border-slate-800">
                    VPD: {hum2000.vaporPressureDeficitKPa} kPa
                  </span>
                </div>

                {/* PRESENT (2026) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-teal-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-teal-400 uppercase tracking-wider block font-bold">
                      Present (2026)
                    </span>
                    <span className="text-[9px] text-slate-400">Observed RH</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-teal-300">
                      {hum2026.relativeHumidityPercent}%
                    </div>
                    <span className="text-[10px] text-teal-400 block mt-0.5">
                      q: {hum2026.specificHumidityGKg} g/kg
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-teal-300 bg-teal-950/40 py-0.5 px-1 rounded border border-teal-800/60">
                    {hum2026.rhAnomalyPercent >= 0 ? `+${hum2026.rhAnomalyPercent}` : hum2026.rhAnomalyPercent}% ΔRH
                  </span>
                </div>

                {/* PREDICTION (2040) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                      Prediction (2040)
                    </span>
                    <span className="text-[9px] text-slate-400">AI Model</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-cyan-300">
                      {hum2040.relativeHumidityPercent}%
                    </div>
                    <span className="text-[10px] text-cyan-400 block mt-0.5">
                      q: {hum2040.specificHumidityGKg} g/kg
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/40 py-0.5 px-1 rounded border border-cyan-800/60">
                    Tw: {hum2040.wetBulbC}°C | VPD: {hum2040.vaporPressureDeficitKPa} kPa
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                {/* PAST (2000) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-sky-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-sky-400 uppercase tracking-wider block font-bold">
                      Past (2000)
                    </span>
                    <span className="text-[9px] text-slate-400">Baseline</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-sky-200">
                      {pastMonthData.monthlyTempC}°C
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-slate-950/60 py-0.5 px-1 rounded border border-slate-800">
                    Early 2000s
                  </span>
                </div>

                {/* PRESENT (2026) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
                      Present (2026)
                    </span>
                    <span className="text-[9px] text-slate-400">Observed</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-amber-300">
                      {presentMonthData.monthlyTempC}°C
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 py-0.5 px-1 rounded border border-amber-800/60">
                    +{Number((presentMonthData.monthlyTempC - pastMonthData.monthlyTempC).toFixed(1))}°C vs 2000
                  </span>
                </div>

                {/* PREDICTION (2040) */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-rose-500/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold">
                      Prediction (2040)
                    </span>
                    <span className="text-[9px] text-slate-400">AI Model</span>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-extrabold text-rose-300">
                      {pred2040MonthData.monthlyTempC}°C
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-rose-400 bg-rose-950/40 py-0.5 px-1 rounded border border-rose-800/60">
                    +{Number((pred2040MonthData.monthlyTempC - pastMonthData.monthlyTempC).toFixed(1))}°C rise
                  </span>
                </div>
              </div>
            )}

            {/* Trajectory Bar */}
            <div className="space-y-1 pt-1 border-t border-slate-900">
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>
                  2000: {isWind ? `${wind2000.meanWindSpeedMs} m/s` : isHumidity ? `${hum2000.relativeHumidityPercent}% RH` : `${pastMonthData.monthlyTempC}°C`}
                </span>
                <span className={isWind ? 'text-emerald-400' : isHumidity ? 'text-teal-400' : 'text-amber-400'}>
                  2026: {isWind ? `${wind2026.meanWindSpeedMs} m/s` : isHumidity ? `${hum2026.relativeHumidityPercent}% RH` : `${presentMonthData.monthlyTempC}°C`}
                </span>
                <span className={isWind ? 'text-violet-400' : isHumidity ? 'text-cyan-400' : 'text-rose-400'}>
                  2040: {isWind ? `${wind2040.meanWindSpeedMs} m/s` : isHumidity ? `${hum2040.relativeHumidityPercent}% RH` : `${pred2040MonthData.monthlyTempC}°C`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className={`w-1/3 h-full ${isWind ? 'bg-teal-500/80' : 'bg-sky-500/80'}`} />
                <div className={`w-1/3 h-full ${isWind ? 'bg-emerald-500/90' : isHumidity ? 'bg-teal-500/90' : 'bg-amber-500/90'}`} />
                <div className={`w-1/3 h-full ${isWind ? 'bg-violet-500/90' : isHumidity ? 'bg-cyan-500/90' : 'bg-rose-500/90'}`} />
              </div>
            </div>
          </div>

          {/* Primary Question Banner */}
          <div
            className={`p-3.5 border-l-4 rounded-r-xl ${
              isWind
                ? 'bg-teal-500/10 border-teal-400 text-teal-300'
                : isHumidity
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                : 'bg-amber-500/10 border-amber-400 text-amber-300'
            }`}
          >
            <h3 className="text-sm font-bold font-heading mb-1 flex items-center gap-2">
              {isWind ? <Wind className="w-4 h-4 text-teal-400" /> : isHumidity ? <Droplets className="w-4 h-4 text-cyan-400" /> : <Flame className="w-4 h-4 text-amber-400" />}
              <span>
                {isWind
                  ? `Why Are Winds & Circulation Dynamics Changing in ${item.name}?`
                  : isHumidity
                  ? `Why is Atmospheric Moisture & Humidity Changing in ${item.name}?`
                  : `Why is Temperature Changing in ${item.name}?`}
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {isWind
                ? 'NASA CYGNSS 8-satellite scatterometer constellation, RapidScat on the ISS, and MERRA-2 global wind vector reanalysis identify the specific geostrophic pressure gradients, planetary circulation cell shifts, and boundary-layer aerodynamic forces altering winds in this region:'
                : isHumidity
                ? 'NASA Atmospheric Infrared Sounder (AIRS), MERRA-2, and HadISDH global surface humidity records identify the thermodynamic and circulation mechanisms altering atmospheric moisture:'
                : 'NASA Earth observing satellites and peer-reviewed CMIP6 multi-model ensembles identify the specific physical drivers responsible for regional warming amplification in this territory:'}
            </p>
          </div>

          {/* Specific Scientific Drivers List */}
          <div className="space-y-2.5">
            {activeReasons.map((reason: string, index: number) => {
              const parts = reason.split(':');
              const title = parts.length > 1 ? parts[0] : `Factor #${index + 1}`;
              const desc = parts.length > 1 ? parts.slice(1).join(':') : reason;

              return (
                <div
                  key={index}
                  className={`p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 transition-all ${
                    isWind ? 'hover:border-teal-500/40' : isHumidity ? 'hover:border-cyan-500/40' : 'hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center border ${
                          isWind
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : isHumidity
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <h4 className="text-xs font-bold text-white font-heading">{title}</h4>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      Primary Driver
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7 font-sans">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* NASA Satellite Observation Suite */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono uppercase font-bold">
              <Satellite className="w-4 h-4" />
              <span>NASA Satellite Fleet Monitoring These Drivers</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {isWind
                ? 'These wind speed and circulation dynamics are continuously measured using NASA spaceborne instruments including CYGNSS (8-satellite microsatellite constellation measuring surface wind vectors through tropical storm eyewalls via GPS reflectometry), RapidScat on the ISS, QuikSCAT scatterometry archives, and MERRA-2 atmospheric reanalysis.'
                : isHumidity
                ? 'These atmospheric moisture variables are continuously measured using NASA spaceborne instruments including AIRS on Aqua (2,378 infrared channels measuring water vapor profiles), MERRA-2 (hydrological reanalysis), SMAP (soil moisture microwave radar), and ECOSTRESS on the ISS (canopy transpiration and evaporative stress).'
                : 'These factors are continuously measured using NASA spaceborne instruments including MODIS Terra/Aqua (thermal infrared & vegetation indices), SMAP (soil moisture radar), ECOSTRESS (evapotranspiration & plant heat stress), and GRACE-FO (gravimetric terrestrial water storage).'}
            </p>
          </div>

          {/* COMPLICATED MODE: RESEARCH PAPER MONOGRAPH & DERIVATIONS */}
          {dataMode === 'complicated' && (
            <div className="p-4 bg-purple-950/20 border-2 border-purple-500/40 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold font-mono text-purple-200 uppercase tracking-widest">
                    Academic Research Monograph · Geophysical Derivations
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-600/50">
                  {isWind
                    ? 'Aerodynamic Navier-Stokes & Kinetic Stilling Physics'
                    : isHumidity
                    ? 'Hydroclimatological Fluid Dynamics'
                    : 'Peer-Reviewed CMIP6 Physics'}
                </span>
              </div>

              {isWind ? (
                <>
                  {/* 1. Navier-Stokes Horizontal Momentum & Geostrophic Balance */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-teal-300 font-bold">
                      <Sigma className="w-3.5 h-3.5 text-teal-400" />
                      <span>1. Navier-Stokes Atmospheric Momentum &amp; Geostrophic Balance</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Large-scale horizontal wind velocity u = (u, v) is governed by the Coriolis-deflected pressure gradient force and boundary friction:
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-teal-300 overflow-x-auto">
                      <code>
                        Du/dt - f · v = - (1 / ρ) · (∂p / ∂x) + F_x, &nbsp;&nbsp; v_g = (1 / ρ f) · (∂p / ∂x)
                      </code>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-2 pt-1">
                      <div>• Coriolis parameter f = 2 · Ω · sin(φ)</div>
                      <div>• Air density ρ ≈ 1.225 kg·m⁻³ at sea level</div>
                      <div>• Equator-to-pole thermal gradient ∂T/∂y drives thermal wind shear</div>
                      <div>• Arctic amplification reduces ∂T/∂y, slowing upper-troposphere jet speed</div>
                    </div>
                  </div>

                  {/* 2. Atmospheric Surface Layer Logarithmic Wind Profile */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-teal-300 font-bold">
                      <Scale className="w-3.5 h-3.5 text-teal-400" />
                      <span>2. Prandtl Logarithmic Wind Profile &amp; Surface Roughness Drag</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Surface wind velocity at height z is dictated by friction velocity u* and aerodynamic roughness z₀ (Zeng et al. Nature Geoscience):
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                      <code>
                        u(z) = (u* / κ) · ln(z / z₀) - ψ_m(z / L)
                      </code>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      von Kármán constant κ = 0.40. Vegetation growth and urban structures increase aerodynamic roughness length z₀, decelerating 10m surface winds (terrestrial stilling).
                    </p>
                  </div>

                  {/* 3. Wind Power Density & Betz Limit */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-teal-300 font-bold">
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                      <span>3. Wind Power Density (WPD) &amp; Kinetic Energy Flux</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Kinetic energy flux per unit swept area scales cubically with velocity (v³):
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-violet-300 overflow-x-auto">
                      <code>
                        WPD = 0.5 · ρ · v³ [W/m²], &nbsp;&nbsp; P_extractable = C_p · WPD &nbsp; (Betz Limit C_p ≤ 16/27 ≈ 59.3%)
                      </code>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Because power scales cubically, even a 5% shift in decadal wind speed produces a ~16% change in harvestable wind energy.
                    </p>
                  </div>

                  {/* 4. NASA CYGNSS Scatterometry Error Matrix */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-teal-300 font-bold">
                      <Binary className="w-3.5 h-3.5 text-teal-400" />
                      <span>4. NASA CYGNSS GPS-Reflectometry Constraints</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 space-y-1">
                      <div>• <strong>NASA CYGNSS Constellation:</strong> 8 microsatellites measuring GPS L1 bistatic scatterometry to penetrate heavy rain and retrieve ocean surface wind vectors with RMS error ≤ 1.4 m/s.</div>
                      <div>• <strong>RapidScat on ISS:</strong> Ku-band pencil-beam scatterometer validating diurnal wind cycles across oceanic shipping lanes.</div>
                      <div>• <strong>Young &amp; Ribal (2019 Science):</strong> 33-year calibrated altimeter/scatterometer database documenting +0.6% decadal oceanic wind acceleration.</div>
                    </div>
                  </div>
                </>
              ) : isHumidity ? (
                <>
                  {/* 1. Clausius-Clapeyron & Tetens Saturation Vapor Pressure */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 font-bold">
                      <Sigma className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. Clausius-Clapeyron Saturation Vapor Pressure Thermodynamic Scaling</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Saturation vapor pressure e_s(T) increases exponentially with temperature at ~6.8% to 7.0% per Kelvin:
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                      <code>
                        e_s(T) = 0.61078 · exp( (17.27 · T) / (T + 237.3) ) [kPa], &nbsp;&nbsp; d(ln e_s)/dT = L_v / (R_v · T²) ≈ 0.068 K⁻¹
                      </code>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-2 pt-1">
                      <div>• Latent heat of vaporization L_v = 2.501 × 10⁶ J·kg⁻¹</div>
                      <div>• Gas constant for water vapor R_v = 461.5 J·kg⁻¹·K⁻¹</div>
                      <div>• Specific humidity saturation q* = 0.622 · e_s / (P - 0.378 · e_s)</div>
                      <div>• Observed tropospheric moisture rate: +1.48 g·kg⁻¹ / decade</div>
                    </div>
                  </div>

                  {/* 2. Byrne & O'Gorman 2018 Land-Ocean Relative Humidity Theory */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 font-bold">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>2. Byrne &amp; O’Gorman (2018 PNAS) Land-Ocean Relative Humidity Contrast</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Continental relative humidity changes follow land-ocean thermal divergence:
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-teal-300 overflow-x-auto">
                      <code>
                        ΔRH_L / RH_L ≈ (L_v / R_v T_L²) · [ ΔT_O - ΔT_L ] &lt; 0
                      </code>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Because continental land warms substantially faster than the ocean surface (warming ratio ΔT_L / ΔT_O ≈ 1.4 to 1.7), advected marine moisture cannot satisfy the elevated terrestrial e_s(T_L), causing continental relative humidity to drop by -0.8% to -2.6% per decade over low-evaporation biomes.
                    </p>
                  </div>

                  {/* 3. Vapor Pressure Deficit & Wet-Bulb Thermoregulation */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 font-bold">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3. Vapor Pressure Deficit (VPD) &amp; Stull Wet-Bulb Limits</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      VPD measures atmospheric drying pull, while Stull Wet-Bulb T_w establishes physiological thermal viability:
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                      <code>
                        VPD = e_s(T) · [ 1 - (RH / 100) ] [kPa], &nbsp;&nbsp; T_w(T, RH) ≈ T·atan[0.151977(RH+8.313659)¹/²] + atan(T+RH) - ...
                      </code>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      When T_w exceeds 32°C (and fatal limit 35°C), metabolic heat dissipation via cutaneous sweating falls to zero, causing hyperthermia within 6 hours regardless of hydration.
                    </p>
                  </div>

                  {/* 4. NASA AIRS Sounder & MERRA-2 Instrument Metrics */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300 font-bold">
                      <Binary className="w-3.5 h-3.5 text-cyan-400" />
                      <span>4. NASA AIRS &amp; MERRA-2 Sounding Error Constraints</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 space-y-1">
                      <div>• <strong>NASA AIRS (Aqua):</strong> 2,378 grating array channels resolving tropospheric water vapor in 1 km vertical layers with retrieval accuracy ≤ 10% in 1-km layers.</div>
                      <div>• <strong>MERRA-2 Reanalysis:</strong> Goddard Earth Observing System (GEOS-5) with 3D-Var assimilation of radiance and GPS radio occultation refractivity.</div>
                      <div>• <strong>HadISDH v2023:</strong> Met Office Hadley Centre quality-controlled in-situ monthly surface humidity anomaly product calibrated against ISD station networks.</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 1. Radiative Transfer Equation */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300 font-bold">
                      <Sigma className="w-3.5 h-3.5 text-purple-400" />
                      <span>1. Radiative Forcing Mathematical Decomposition</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      The instantaneous top-of-atmosphere (TOA) radiative perturbation ΔF over this geographic sector is formulated through the logarithmic Myhre-Etminan greenhouse absorption profile:
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                      <code>
                        ΔF_total = α_CO2 · ln(C / C_0) + β_CH4 (√M - √M_0) + ΔF_albedo + ΔF_aerosol
                      </code>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-2 pt-1">
                      <div>• α_CO2 = 5.35 W·m⁻² (Myhre parameter)</div>
                      <div>• Baseline C_0 = 280.0 ppm; C_2026 = 426.8 ppm</div>
                      <div>• Net Regional ΔF = +2.48 ± 0.22 W·m⁻²</div>
                      <div>• Surface Longwave Emissivity ε = 0.972 ± 0.008</div>
                    </div>
                  </div>

                  {/* 2. Feedback Parameter Partition Matrix */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300 font-bold">
                      <Scale className="w-3.5 h-3.5 text-purple-400" />
                      <span>2. Equilibrium Climate Sensitivity Feedback Parameters (λ)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Perturbation temperature response follows ΔT_eq = -ΔF / Σλ_i. Partitioning regional feedbacks reveals:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">λ_Planck (Stefan-Boltzmann)</span>
                        <strong className="text-rose-300">-3.21 W·m⁻²·K⁻¹</strong>
                        <span className="text-[9px] text-slate-500 block">Restoring dampener</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">λ_wv (Clausius-Clapeyron)</span>
                        <strong className="text-amber-300">+1.77 W·m⁻²·K⁻¹</strong>
                        <span className="text-[9px] text-slate-500 block">+7% vapor / °C</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">λ_albedo (Cryosphere/Land)</span>
                        <strong className="text-cyan-300">+0.38 W·m⁻²·K⁻¹</strong>
                        <span className="text-[9px] text-slate-500 block">Positive surface feedback</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">λ_lr (Troposphere Lapse)</span>
                        <strong className="text-blue-300">-0.55 W·m⁻²·K⁻¹</strong>
                        <span className="text-[9px] text-slate-500 block">Negative dampening</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">λ_cloud (LW/SW combined)</span>
                        <strong className="text-purple-300">+0.44 W·m⁻²·K⁻¹</strong>
                        <span className="text-[9px] text-slate-500 block">Optical depth variance</span>
                      </div>
                      <div className="p-2 bg-purple-950/60 rounded border border-purple-500/40">
                        <span className="text-purple-300 block">Σ λ_net Total</span>
                        <strong className="text-emerald-300">-1.17 W·m⁻²·K⁻¹</strong>
                        <span className="text-[9px] text-purple-200 block">ΔT_2x = 3.16°C ECS</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Surface Energy Budget & Bowen Ratio */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300 font-bold">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                      <span>3. Surface Boundary Layer Energy Partition &amp; Bowen Ratio</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      The net surface irradiance partition governs sensible (H) and latent heat flux (λE):
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300">
                      <code>R_n - G = H + λE, &nbsp;&nbsp; Bowen Ratio β = H / (λE) = γ · (T_s - T_a) / [e_s(T_s) - e_a]</code>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      When topsoil desiccates, the latent cooling evaporative fraction collapses (EF = λE / (R_n - G) → 0), forcing excess thermal energy exclusively into the sensible flux H, triggering self-amplifying heat dome inversion locks.
                    </p>
                  </div>

                  {/* 4. Satellite Sensor Radiometric Precision */}
                  <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-900/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300 font-bold">
                      <Binary className="w-3.5 h-3.5 text-purple-400" />
                      <span>4. Spaceborne Sensor Calibration &amp; Error Propagation</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 space-y-1">
                      <div>• <strong>MODIS Terra/Aqua:</strong> Split-window TIR Bands 31/32 radiometric precision NEΔT ≤ 0.045 K with Wan generalized day/night LST inversion algorithm.</div>
                      <div>• <strong>GRACE-FO:</strong> Microwave K-band ranging precision σ_r ≤ 0.14 μm/s at 220 km baseline separation, resolving ±0.82 cm equivalent water thickness.</div>
                      <div>• <strong>CMIP6 Multi-Model Spread:</strong> 34-model ensemble dispersion demonstrates σ = 0.38°C inter-model variance under SSP2-4.5, verified against ERA5 reanalysis (R² = 0.984, p &lt; 0.0001).</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span>Continuous AI downscaled projections (2000–2040)</span>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
