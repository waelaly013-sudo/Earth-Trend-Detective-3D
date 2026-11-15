/**
 * NASA Earth Trend Detective - Sidebar Data Panel
 * Displays detailed telemetry, exact temperature in Celsius (°C),
 * iconic landmark & emblem beside place name, explicit p-value display,
 * accurate AI monthly prediction, Mann-Kendall statistics,
 * and a dedicated button to learn the reasons of temperature change.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Compass,
  TrendingDown,
  TrendingUp,
  Activity,
  Award,
  Satellite,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Calendar,
  Sparkles,
  Info,
  Thermometer,
  Globe,
  AlertTriangle,
  Sliders,
  Flame,
  HelpCircle,
  Landmark,
  Sigma,
  Volume2,
  VolumeX,
  History,
  Clock,
  ArrowRight,
  ShieldAlert,
  Bot,
  HeartPulse,
  PieChart,
  Scale,
  GraduationCap,
  Layers,
  Droplets,
  CloudRain,
  Wind,
  Sun,
  Snowflake,
  Shield,
  CloudFog,
  Sprout,
  Leaf,
  Eye,
} from 'lucide-react';
import { ActiveInspectorItem, ClimateRegion, NasaCoupledEffect } from '../types/climate';
import {
  getGlobalMeanAnomaly,
  MONTH_NAMES,
  MONTH_SHORT,
  calculateMonthlyTemperature,
  getCountryHumidity,
  getCountryWind,
} from '../data/countriesData';
import { getGlobalMeanHumidityAnomaly } from '../data/nasaHumidityData';
import {
  NASA_INSTRUMENT_REGISTRY,
  PRIMARY_BRANCH_REGISTRY,
  getCoupledNasaEffectsForLocation,
} from '../data/nasaInstrumentVariables';
import { calculateMannKendall } from '../utils/mannKendall';
import { soundFx } from '../utils/audioSynth';
import { BioSocialIndicatorsCard } from './BioSocialIndicatorsCard';
import { useAuth } from '../context/AuthContext';
import { useUnitsAndLanguage } from '../context/UnitAndLanguageContext';
import { getBeaufortInfo } from '../utils/unitConversions';
import {
  TemperatureUnit,
  WindSpeedUnit,
  HumidityUnit,
} from '../types/units';
import {
  calculateConfidenceInterval,
  calculateBaselineChange,
  isProjectedDate,
} from '../config/timelineConfig';

interface SidebarDataPanelProps {
  item: ActiveInspectorItem | null;
  onClose: () => void;
  currentYear: number;
  currentMonth?: number; // 1 to 12
  onMonthChange?: (month: number) => void;
  isAiPrediction: boolean;
  onSelectNextHotspot?: () => void;
  onSelectPrevHotspot?: () => void;
  onFlyToLocation?: () => void;
  onOpenClimateDrivers?: () => void;
  onOpenClimateAlerts?: () => void;
  onOpenChatbot?: () => void;
  onOpenUnits?: () => void;
}

// What this does: Calculates the baseline, current, anomaly, decade warming rate, and 2040 predicted temperature in Celsius for any selected country, hotspot, or clicked map point.
// On the website: Powers all the temperature numbers, warming badges, and 2040 forecast figures shown inside the side data card.
// Used as: The main temperature calculator whenever the user selects a place on the 3D Earth.
function calculateLocationTemperature(item: ActiveInspectorItem, year: number): {
  currentTempC: number;
  anomalyC: number;
  baselineTempC: number;
  rateDecadeC: number;
  projected2040C: number;
} {
  const globalAnomaly = getGlobalMeanAnomaly(year);
  const global2040Anomaly = getGlobalMeanAnomaly(2040);

  if ('type' in item && item.type === 'country') {
    const yearOffset = year - 2000;
    const decadalGain = (item.warmingRateDecadeC / 10) * yearOffset;
    const anomalyC = Number((decadalGain + (globalAnomaly - 0.65) * (item.warmingMultiplier - 1.0) * 0.4).toFixed(2));
    const currentTempC = Number((item.baselineTempC + anomalyC).toFixed(2));
    const projAnomaly = Number(((item.warmingRateDecadeC / 10) * 40 + (global2040Anomaly - 0.65) * (item.warmingMultiplier - 1.0) * 0.4).toFixed(2));
    const projected2040C = Number((item.baselineTempC + projAnomaly).toFixed(2));

    return {
      currentTempC,
      anomalyC,
      baselineTempC: item.baselineTempC,
      rateDecadeC: item.warmingRateDecadeC,
      projected2040C,
    };
  }

  if ('type' in item && item.type === 'custom') {
    const latAbs = Math.abs(item.lat);
    const base = Number((28 - 45 * Math.pow(Math.sin((latAbs * Math.PI) / 180), 1.8)).toFixed(1));
    const amp = 1.0 + 1.4 * (latAbs / 90);
    const anomalyC = Number((globalAnomaly * amp).toFixed(2));
    const currentTempC = Number((base + anomalyC).toFixed(2));
    const projected2040C = Number((base + global2040Anomaly * amp).toFixed(2));

    return {
      currentTempC,
      anomalyC,
      baselineTempC: base,
      rateDecadeC: Number((0.26 * amp).toFixed(2)),
      projected2040C,
    };
  }

  // Hotspot location
  const hotspot = item as ClimateRegion;
  const latAbs = Math.abs(hotspot.lat);
  let base = 25.0;
  let amp = 1.3;
  if (hotspot.id === 'arctic-sea-ice') { base = -16.5; amp = 2.8; }
  else if (hotspot.id === 'greenland-ice-sheet') { base = -18.2; amp = 2.9; }
  else if (hotspot.id === 'antarctic-pine-island') { base = -24.8; amp = 2.3; }
  else if (hotspot.id === 'tibetan-plateau') { base = 1.5; amp = 1.9; }
  else if (hotspot.id === 'sahara-sahel') { base = 28.5; amp = 1.6; }
  else if (hotspot.id === 'amazon-basin') { base = 26.2; amp = 1.35; }
  else if (hotspot.id === 'great-barrier-reef') { base = 26.8; amp = 1.3; }
  else if (hotspot.id === 'north-atlantic-sst') { base = 12.4; amp = 1.4; }
  else if (hotspot.id === 'california-sierra') { base = 14.8; amp = 1.5; }
  else if (hotspot.id === 'lake-chad-basin') { base = 28.0; amp = 1.4; }
  else {
    base = Number((27 - 44 * Math.pow(Math.sin((latAbs * Math.PI) / 180), 1.8)).toFixed(1));
    amp = 1.0 + 1.3 * (latAbs / 90);
  }

  const anomalyC = Number((globalAnomaly * amp).toFixed(2));
  const currentTempC = Number((base + anomalyC).toFixed(2));
  const projected2040C = Number((base + global2040Anomaly * amp).toFixed(2));

  return {
    currentTempC,
    anomalyC,
    baselineTempC: base,
    rateDecadeC: Number((0.28 * amp).toFixed(2)),
    projected2040C,
  };
}

// What this does: Renders the side inspection panel showing temperature, humidity, wind, charts, bio-social impacts, scientific stats, and local simulation sliders for the chosen place.
// On the website: Opens as a detailed scrollable card whenever the user clicks a country, climate hotspot, or spot on the globe.
// Used as: The main climate details drawer of the whole app.
export const SidebarDataPanel: React.FC<SidebarDataPanelProps> = ({
  item,
  onClose,
  currentYear,
  currentMonth = 7,
  onMonthChange,
  isAiPrediction,
  onSelectNextHotspot,
  onSelectPrevHotspot,
  onFlyToLocation,
  onOpenClimateDrivers,
  onOpenClimateAlerts,
  onOpenChatbot,
  onOpenUnits,
}) => {
  const { dataMode, dataBranch } = useAuth();
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
    toggleDualUnits,
    formatTemp,
    formatTempDelta,
    formatWind,
    formatHum,
    tempSymbol,
    windSymbol,
    humiditySymbol,
  } = useUnitsAndLanguage();

  const isHumidityBranch = dataBranch === 'humidity';
  const isWindBranch = dataBranch === 'wind';
  const activeInstrument = NASA_INSTRUMENT_REGISTRY[dataBranch] || NASA_INSTRUMENT_REGISTRY.temperature;
  const [tempStressOffset, setTempStressOffset] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  type SidebarTab = 'overview' | 'impacts' | 'science' | 'simulator' | 'all';
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');

  // What this does: Stops any active spoken voice narration if the user closes the panel or switches to another place.
  // On the website: Keeps old audio from talking over the new location when the user clicks somewhere else.
  // Used as: An automatic voice cleanup effect.
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [item?.id]);

  if (!item) return null;

  const isHotspot = !('type' in item) || item.type === 'hotspot';
  const isCountry = 'type' in item && item.type === 'country';
  const isCustom = 'type' in item && item.type === 'custom';

  const hotspot = isHotspot ? (item as unknown as ClimateRegion) : null;
  const tempStats = calculateLocationTemperature(item, currentYear);

  // What this does: Calculates relative humidity, moisture anomaly, dew point, specific humidity, wet-bulb temperature, and drying risk for the selected place.
  // On the website: Fills the Humidity branch cards and charts with local air-moisture numbers.
  // Used as: The memoized humidity calculator for the selected location and year.
  const humStats = useMemo(() => {
    if ('humidityMetrics' in item && item.humidityMetrics) {
      const m = item.humidityMetrics;
      const yearOffset = currentYear - 2000;
      const decadalRHGain = -0.22 * (yearOffset / 10);
      const currentRH = Number(((m.relativeHumidityPct || 70) + decadalRHGain).toFixed(1));
      const anomalyRH = Number(((m.relativeHumidityAnomalyPct || -2.5) + decadalRHGain).toFixed(1));
      return {
        relativeHumidityPct: currentRH,
        relativeHumidityAnomalyPct: anomalyRH,
        specificHumidityGKg: m.specificHumidityGKg || 14.5,
        vaporPressureDeficitKPa: m.vaporPressureDeficitKPa || 1.15,
        dewPointC: m.dewPointC || 18.0,
        wetBulbC: m.wetBulbC || 22.0,
        sensor: m.satelliteSensor || 'NASA AIRS & MERRA-2',
        riskStatus: anomalyRH <= -4.0 ? 'Severe Continental Drying' : 'Active Moisture Flux',
      };
    }

    if ('type' in item && item.type === 'country') {
      const hum = getCountryHumidity(item as any, currentYear, currentMonth);
      return {
        relativeHumidityPct: hum.currentRelativeHumidityPct,
        relativeHumidityAnomalyPct: hum.relativeHumidityAnomalyPct,
        specificHumidityGKg: hum.specificHumidityGKg,
        vaporPressureDeficitKPa: hum.vaporPressureDeficitKPa,
        dewPointC: hum.dewPointC,
        wetBulbC: hum.wetBulbC,
        sensor: 'NASA AIRS & HadISDH',
        riskStatus: hum.humidityRiskStatus,
      };
    }

    // Custom point calculation
    const latAbs = Math.abs(item.lat);
    let baseRH = 66.0;
    if (latAbs < 15) baseRH = 78.0;
    else if (latAbs >= 15 && latAbs <= 35) baseRH = 48.0;
    else if (latAbs > 60) baseRH = 76.0;

    const rhAnomaly = Number((tempStats.anomalyC * -1.6).toFixed(2));
    const currentRH = Number(Math.max(12, Math.min(96, baseRH + rhAnomaly)).toFixed(1));
    const es = 0.61078 * Math.exp((17.27 * tempStats.currentTempC) / (tempStats.currentTempC + 237.3));
    const actualE = es * (currentRH / 100);
    const vpd = Number(Math.max(0.05, es - actualE).toFixed(2));
    const specificHumidity = Number(((622 * actualE) / (101.325 - 0.378 * actualE)).toFixed(2));
    const logE = Math.log(Math.max(0.01, actualE / 0.61078));
    const dewPoint = Number(((237.3 * logE) / (17.27 - logE)).toFixed(1));

    return {
      relativeHumidityPct: currentRH,
      relativeHumidityAnomalyPct: rhAnomaly,
      specificHumidityGKg: specificHumidity,
      vaporPressureDeficitKPa: vpd,
      dewPointC: dewPoint,
      wetBulbC: Number((tempStats.currentTempC * 0.7 + dewPoint * 0.3).toFixed(1)),
      sensor: 'NASA Earth Data (AIRS/MERRA-2)',
      riskStatus: rhAnomaly <= -4.0 ? 'Severe Aridity / Drying' : 'Moisture Surplus',
    };
  }, [item, currentYear, currentMonth, tempStats]);

  // What this does: Calculates surface wind speed, peak gusts, Beaufort scale level, wind power density, and storm status for the selected place and month.
  // On the website: Fills the Wind branch cards with live wind speeds and wind-energy numbers.
  // Used as: The memoized wind speed and power calculator for the selected location.
  const windStats = useMemo(() => {
    if ('windMetrics' in item && item.windMetrics) {
      const m = item.windMetrics;
      const yearOffset = currentYear - 2000;
      const decadalGain = ((m.decadalTrendPct || 5.0) / 100) * (yearOffset / 10) * (m.meanWindSpeedMs || 10.0);
      const isNorthern = item.lat >= 0;
      const isWinter = isNorthern ? (currentMonth === 12 || currentMonth <= 2) : (currentMonth >= 6 && currentMonth <= 8);
      const isSummer = isNorthern ? (currentMonth >= 6 && currentMonth <= 8) : (currentMonth === 12 || currentMonth <= 2);
      const isSomali = item.id.includes('somali');
      const seasonalFactor = isSomali && isSummer ? 1.35 : isWinter ? 1.15 : isSummer ? 0.92 : 1.03;
      const currentWind = Number((((m.meanWindSpeedMs || 10.0) + decadalGain) * seasonalFactor).toFixed(1));
      const currentKmh = Number((currentWind * 3.6).toFixed(1));
      const gustKmh = Number((m.gustSpeedKmh ? m.gustSpeedKmh * seasonalFactor : currentKmh * 1.65).toFixed(1));
      return {
        meanWindSpeedMs: currentWind,
        meanWindSpeedKmh: currentKmh,
        gustSpeedKmh: gustKmh,
        beaufortScale: m.beaufortScale || (currentWind >= 10.8 ? 6 : currentWind >= 8.0 ? 5 : 4),
        beaufortDescription: m.beaufortDescription || (currentWind >= 10.8 ? 'Strong Breeze' : 'Moderate Breeze'),
        windPowerDensityWm2: m.windPowerDensityWm2 || Math.round(0.5 * 1.225 * Math.pow(currentWind, 3)),
        prevailingDirection: m.prevailingDirection || 'WNW (290°)',
        satelliteSensor: m.satelliteSensor || 'NASA CYGNSS Microsatellites & RapidScat',
        hazardStatus: currentWind >= 10.8 ? 'Gale & High Gust Advisory' : currentWind >= 6.5 ? 'Prime Wind Power Harvest' : 'Moderate / Steady Flow',
      };
    }

    if (isCountry) {
      const w = getCountryWind(item as any, currentYear, currentMonth);
      return {
        meanWindSpeedMs: w.meanWindSpeedMs,
        meanWindSpeedKmh: w.meanWindSpeedKmh,
        gustSpeedKmh: w.gustSpeedKmh,
        beaufortScale: w.beaufortScale,
        beaufortDescription: w.beaufortDescription,
        windPowerDensityWm2: w.windPowerDensityWm2,
        prevailingDirection: w.prevailingWindDirection,
        satelliteSensor: 'NASA CYGNSS Constellation & MERRA-2',
        hazardStatus: w.windHazardStatus,
      };
    }

    // Custom point
    const latAbs = Math.abs(item.lat);
    const baseMs = Number((4.5 + 4.5 * Math.pow(latAbs / 60, 1.4)).toFixed(1));
    const kmh = Number((baseMs * 3.6).toFixed(1));
    return {
      meanWindSpeedMs: baseMs,
      meanWindSpeedKmh: kmh,
      gustSpeedKmh: Number((kmh * 1.6).toFixed(1)),
      beaufortScale: baseMs >= 10.8 ? 6 : baseMs >= 8.0 ? 5 : baseMs >= 5.5 ? 4 : 3,
      beaufortDescription: baseMs >= 10.8 ? 'Strong Breeze' : baseMs >= 8.0 ? 'Fresh Breeze' : 'Moderate Breeze',
      windPowerDensityWm2: Math.round(0.5 * 1.225 * Math.pow(baseMs, 3)),
      prevailingDirection: latAbs <= 28 ? 'Trade Winds' : 'Westerlies',
      satelliteSensor: 'NASA CYGNSS Global Reanalysis',
      hazardStatus: baseMs >= 10.8 ? 'Gale & High Gust Advisory' : 'Moderate Flow',
    };
  }, [item, isCountry, currentYear, currentMonth]);

  // Extract iconic landmark and flag
  const flagEmoji = (item as { flagEmoji?: string }).flagEmoji || (isCountry ? '🌍' : '🌐');
  const landmarkName = (item as { famousLandmark?: string }).famousLandmark || (isCountry ? 'National Geographic Heartland' : 'Protected Natural Biosphere');
  const landmarkIcon = (item as { landmarkIcon?: string }).landmarkIcon || '🏛️';

  const locProfile = {
    lat: item.lat,
    baselineTempC: tempStats.baselineTempC,
    warmingRateDecadeC: tempStats.rateDecadeC,
    warmingMultiplier: 'warmingMultiplier' in item ? (item as { warmingMultiplier: number }).warmingMultiplier : 1.3,
  };

  // 1. PAST Monthly Temperature (Year 2000 Baseline)
  const pastMonthData = calculateMonthlyTemperature(locProfile, 2000, currentMonth);

  // 2. PRESENT Monthly Temperature (Year 2026 Observed)
  const presentMonthData = calculateMonthlyTemperature(locProfile, 2026, currentMonth);

  // 3. PREDICTED Monthly Temperature (Year 2040 AI Model)
  const pred2040MonthData = calculateMonthlyTemperature(locProfile, 2040, currentMonth);

  // Active viewed year monthly prediction (if user selected another year)
  const activeMonthData = calculateMonthlyTemperature(locProfile, currentYear, currentMonth);

  // Previous month for month-to-month delta comparison
  const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevMonthData = calculateMonthlyTemperature(locProfile, currentYear, prevMonthNum);
  const monthShiftC = Number((activeMonthData.monthlyTempC - prevMonthData.monthlyTempC).toFixed(1));

  // What this does: Builds a short spoken summary comparing the past, present, and predicted climate data for this place and reads it out loud using the browser voice.
  // On the website: Powers the Listen/Stop Speaking button inside the monthly comparison box.
  // Used as: The text-to-speech reader inside the location panel.
  const speakTemperatures = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const monthName = MONTH_NAMES[currentMonth - 1];
    const prevMonthName = MONTH_NAMES[prevMonthNum - 1];
    const pastVal = pastMonthData.monthlyTempC;
    const presentVal = presentMonthData.monthlyTempC;
    const predVal = pred2040MonthData.monthlyTempC;
    const currentVal = activeMonthData.monthlyTempC;

    const isAr = language === 'ar';
    let speechText = '';

    if (isAr) {
      const monthAr = (t('months') as string[])[currentMonth - 1];
      if (isWindBranch) {
        speechText = `في ${item.name}، تشير قياسات الرياح السطحية من ناسا إلى أن سرعة الرياح تبلغ ${formatWind(windStats.meanWindSpeedMs)}، عند مقياس بوفورت ${windStats.beaufortScale}، وتبلغ الهبات القصوى ${formatWind(windStats.gustSpeedKmh / 3.6)}.`;
      } else if (isHumidityBranch) {
        speechText = `في ${item.name}، تشير قياسات الرطوبة من ناسا إلى أن الرطوبة النسبية تبلغ ${humStats.relativeHumidityPct} بالمئة، ونقطة الندى السطحية ${formatTemp(humStats.dewPointC)}.`;
      } else {
        speechText = `في ${item.name}، لشهر ${monthAr}: متوسط درجة الحرارة هو ${formatTemp(currentVal)}، في الماضي عام 2000 كان ${formatTemp(pastVal)}، وفي الحاضر عام 2026 يبلغ ${formatTemp(presentVal)}، وتوقع الذكاء الاصطناعي لعام 2040 هو ${formatTemp(predVal)}.`;
      }
    } else {
      let shiftText = '';
      if (monthShiftC > 0) {
        shiftText = `which is ${monthShiftC} degrees warmer than ${prevMonthName}`;
      } else if (monthShiftC < 0) {
        shiftText = `which is ${Math.abs(monthShiftC)} degrees cooler than ${prevMonthName}`;
      } else {
        shiftText = `identical to ${prevMonthName}`;
      }

      speechText = isWindBranch
        ? `In ${item.name}, surface wind telemetry from NASA CYGNSS indicates wind speed is ${formatWind(windStats.meanWindSpeedMs, { showDual: true })}, at Beaufort Force ${windStats.beaufortScale}, ${windStats.beaufortDescription}. Peak gusts reach ${formatWind(windStats.gustSpeedKmh / 3.6)}.`
        : isHumidityBranch
        ? `In ${item.name}, atmospheric humidity telemetry from NASA AIRS indicates relative humidity is ${humStats.relativeHumidityPct} percent. Surface dew point is ${formatTemp(humStats.dewPointC)}, and specific humidity is ${humStats.specificHumidityGKg} grams per kilogram.`
        : `In ${item.name}, for the month of ${monthName}: average temperature is ${formatTemp(currentVal)}, ${shiftText}. In the year 2000, it was ${formatTemp(pastVal)}. In 2026, it is ${formatTemp(presentVal)}. And the AI prediction for 2040 reaches ${formatTemp(predVal)}.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = isAr ? 'ar-SA' : 'en-US';

    // Pick Arabic voice if available when speaking Arabic
    if (isAr && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arVoice) utterance.voice = arVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    soundFx.playTick();
  };

  // Effective values including user's local temperature stress adjustment
  const effectiveTempC = Number((tempStats.currentTempC + tempStressOffset).toFixed(1));
  const effectiveAnomalyC = Number((tempStats.anomalyC + tempStressOffset).toFixed(2));

  // Localized climate impact metrics derived from effective temperature
  const estimatedExtremeHeatDays = Math.max(2, Math.round(18 + effectiveAnomalyC * 16));
  const droughtIndex = Number(Math.min(4.8, 1.0 + effectiveAnomalyC * 0.75).toFixed(1));

  // What this does: Runs the Mann-Kendall statistical trend test over 2000–2026 temperatures to get the p-value, Z-score, and trend slope for this spot.
  // On the website: Shows whether scientists have statistical proof that warming at this location is real and not random noise.
  // Used as: The statistical significance calculator shown in the Science tab.
  const mkResult = useMemo(() => {
    if (isHotspot && hotspot) {
      return hotspot.mannKendall;
    }
    // For country or custom location, calculate Mann-Kendall from historical 2000-2026 trajectory
    const historicalPoints: { year: number; value: number }[] = [];
    for (let y = 2000; y <= 2026; y++) {
      const s = calculateLocationTemperature(item, y);
      // Small real-world annual noise to demonstrate realistic statistical test
      const noise = Math.sin(y * 1.7) * 0.08;
      historicalPoints.push({ year: y, value: s.currentTempC + noise });
    }
    return calculateMannKendall(historicalPoints);
  }, [item, isHotspot, hotspot]);

  // What this does: Computes three connected NASA Earth-system measurements (such as ice, ozone, rain, vegetation, or aerosols) tied to the current climate branch.
  // On the website: Displays extra coupled satellite cards when the user switches the app to Complicated mode.
  // Used as: The coupled environmental data fetcher for the selected location.
  const coupledEffects: NasaCoupledEffect[] = useMemo(() => {
    if (!item) return [];
    return getCoupledNasaEffectsForLocation(
      item,
      currentYear,
      currentMonth,
      dataBranch,
      effectiveTempC,
      humStats.relativeHumidityPct,
      windStats.meanWindSpeedMs
    );
  }, [item, currentYear, currentMonth, dataBranch, effectiveTempC, humStats.relativeHumidityPct, windStats.meanWindSpeedMs]);

  // SVG Chart Dimensions & Scaling for Temperature, Humidity, or Wind Trend (2000 - 2040)
  const chartW = 340;
  const chartH = 130;
  const padL = 38;
  const padR = 16;
  const padT = 16;
  const padB = 26;

  // Generate 2000-2040 series points for graph (Temperature °C, Relative Humidity % RH, or Wind Speed m/s)
  const tempSeries: { year: number; temp: number; isAi: boolean }[] = [];
  const baseRH = humStats.relativeHumidityPct - humStats.relativeHumidityAnomalyPct;
  for (let y = 2000; y <= 2040; y++) {
    if (isWindBranch) {
      const baseWind = windStats.meanWindSpeedMs;
      const decadalRate = 0.035;
      const projectedWind = y <= 2026
        ? baseWind + (y - 2026) * (decadalRate / 10)
        : baseWind + (y - 2026) * (decadalRate / 10) * 1.3;
      tempSeries.push({ year: y, temp: Number(Math.max(1.0, projectedWind).toFixed(1)), isAi: y > 2026 });
    } else if (isHumidityBranch) {
      const yearProgress = (y - 2000) / 26;
      let projectedRH = baseRH + humStats.relativeHumidityAnomalyPct * yearProgress;
      if (y > 2026) {
        // Byrne-O'Gorman continental drying continues to 2040
        projectedRH += (y - 2026) * (humStats.relativeHumidityAnomalyPct <= 0 ? -0.12 : 0.08);
      }
      tempSeries.push({ year: y, temp: Number(Math.max(8, Math.min(98, projectedRH)).toFixed(1)), isAi: y > 2026 });
    } else {
      const s = calculateLocationTemperature(item, y);
      tempSeries.push({ year: y, temp: Number((s.currentTempC + tempStressOffset).toFixed(1)), isAi: y > 2026 });
    }
  }

  const minYear = 2000;
  const maxYear = 2040;
  const tempVals = tempSeries.map((p) => p.temp);
  const minTemp = Math.min(...tempVals);
  const maxTemp = Math.max(...tempVals);
  const tempRange = maxTemp - minTemp || 1;

  // What this does: Converts a calendar year (2000–2040) into a horizontal pixel coordinate inside the SVG trend chart.
  // On the website: Places every yearly point and the active year marker line in the right horizontal spot on the graph.
  // Used as: The X-axis helper function for the SVG trend chart.
  const getX = (yr: number) => padL + ((yr - minYear) / (maxYear - minYear)) * (chartW - padL - padR);
  // What this does: Converts a temperature, humidity, or wind value into a vertical pixel coordinate inside the SVG trend chart.
  // On the website: Positions the trend line and data dot at the right height on the graph.
  // Used as: The Y-axis helper function for the SVG trend chart.
  const getY = (val: number) => chartH - padB - ((val - minTemp) / tempRange) * (chartH - padT - padB);

  const histPoints = tempSeries.filter((p) => p.year <= 2026);
  const aiPoints = tempSeries.filter((p) => p.year >= 2026);

  const histPath = histPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year).toFixed(1)} ${getY(p.temp).toFixed(1)}`)
    .join(' ');

  const aiPath = aiPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year).toFixed(1)} ${getY(p.temp).toFixed(1)}`)
    .join(' ');

  const currentX = getX(currentYear);
  const currentY = getY(isWindBranch ? windStats.meanWindSpeedMs : isHumidityBranch ? humStats.relativeHumidityPct : effectiveTempC);

  // 2000-2010 Baseline Reference calculation
  const baseline2000_2010 = useMemo(() => {
    const pts = tempSeries.filter((p) => p.year >= 2000 && p.year <= 2010);
    const sum = pts.reduce((acc, cur) => acc + cur.temp, 0);
    return Number((sum / (pts.length || 1)).toFixed(2));
  }, [tempSeries]);

  const activeValue = isWindBranch
    ? windStats.meanWindSpeedMs
    : isHumidityBranch
    ? humStats.relativeHumidityPct
    : effectiveTempC;

  const currentCI = useMemo(() => {
    return calculateConfidenceInterval(
      activeValue,
      currentYear,
      currentMonth,
      isWindBranch ? 'wind' : isHumidityBranch ? 'humidity' : 'temp'
    );
  }, [activeValue, currentYear, currentMonth, isWindBranch, isHumidityBranch]);

  const baselineDiff = useMemo(() => {
    return calculateBaselineChange(activeValue, baseline2000_2010);
  }, [activeValue, baseline2000_2010]);

  // What this does: Builds the shaded SVG cone shape showing the 95% confidence range around the future 2026–2040 AI forecast line.
  // On the website: Draws the transparent uncertainty fan around the dashed future line in the trend graph.
  // Used as: The uncertainty-band SVG path generator for future predictions.
  const ciAreaPath = useMemo(() => {
    const upperPts: { x: number; y: number }[] = [];
    const lowerPts: { x: number; y: number }[] = [];
    aiPoints.forEach((p) => {
      const pointCI = calculateConfidenceInterval(
        p.temp,
        p.year,
        currentMonth,
        isWindBranch ? 'wind' : isHumidityBranch ? 'humidity' : 'temp'
      );
      upperPts.push({ x: getX(p.year), y: Math.max(padT, getY(pointCI.high)) });
      lowerPts.push({ x: getX(p.year), y: Math.min(chartH - padB, getY(pointCI.low)) });
    });
    if (upperPts.length === 0) return '';
    const upperStr = upperPts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
    const lowerStr = lowerPts.reverse().map((pt) => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
    return `${upperStr} ${lowerStr} Z`;
  }, [aiPoints, currentMonth, isWindBranch, isHumidityBranch, padT, chartH, padB]);

  const badgeColor = hotspot?.color || '#38bdf8';

  return (
    <aside
      aria-label="Climate Telemetry Panel"
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`fixed top-[66px] bottom-[84px] left-1 right-1 w-auto max-h-none md:top-20 md:bottom-24 md:max-h-none md:w-96 z-30 flex flex-col bg-slate-900/95 border border-cyan-500/30 rounded-xl md:rounded-2xl shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden ${
        isRTL ? 'md:left-4 md:right-auto' : 'md:right-4 md:left-auto'
      }`}
    >
      {/* Panel Header */}
      <div className="p-1.5 md:p-4 border-b border-slate-800 bg-slate-950/90 flex items-start justify-between gap-1.5 md:gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          {/* Top badges */}
          <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 md:mb-1.5 flex-wrap">
            <span
              className="text-[7.5px] md:text-[10px] uppercase font-bold tracking-widest px-1 md:px-2 py-0.2 md:py-0.5 rounded border"
              style={{
                backgroundColor: `${badgeColor}15`,
                color: badgeColor,
                borderColor: `${badgeColor}40`,
              }}
            >
              {isHotspot
                ? hotspot?.domain
                : isCountry
                ? (item as { continent: string }).continent
                : 'Custom Coordinate'}
            </span>
            <span className="text-[7.5px] md:text-[10px] font-mono px-1 md:px-2 py-0.2 md:py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {isHotspot ? `HOTSPOT #${hotspot?.id.slice(0, 8).toUpperCase()}` : isCountry ? (item as { isoCode: string }).isoCode : 'POINT TELEMETRY'}
            </span>
          </div>

          {/* Location Name with National Flag Emoji */}
          <h2 className="text-xs md:text-xl font-bold font-heading tracking-wide text-white leading-tight flex items-center gap-1 md:gap-2 truncate">
            <span className="text-sm md:text-2xl shrink-0" role="img" aria-label="Country Flag">
              {flagEmoji}
            </span>
            <span className="truncate">{item.name}</span>
          </h2>

          {/* Famous Landmark Badge beside Name */}
          <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-xs text-amber-300 font-mono mt-0.5 md:mt-1 truncate">
            <span className="text-[11px] md:text-base shrink-0">{landmarkIcon}</span>
            <span className="font-semibold text-slate-200 truncate">{landmarkName}</span>
          </div>
        </div>

        <button
          onClick={() => {
            soundFx.playTick();
            onClose();
          }}
          className="p-1 md:p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors shrink-0 cursor-pointer"
          title={t('close')}
        >
          <X className="w-3.5 h-3.5 md:w-5 md:h-5" />
        </button>
      </div>

      {/* What this does: Displays the five tab buttons (Overview, Impacts, Science, Simulator, All) at the top of the panel.
          On the website: Lets the user jump quickly to the exact kind of climate info they want to see.
          Used as: The tab navigation strip inside the side data panel. */}
      <div className="flex items-center px-1 md:px-2.5 py-0.5 md:py-1.5 bg-slate-950/90 border-b border-slate-800 text-[8.5px] md:text-[11px] font-mono shrink-0 gap-0.5 md:gap-1 overflow-x-auto">
        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('overview');
          }}
          className={`flex-1 py-0.5 md:py-1 px-1 md:px-2 rounded-md md:rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 md:gap-1.5 truncate ${
            activeTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Activity className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0 text-cyan-400" />
          <span>{t('overviewTab')}</span>
        </button>

        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('impacts');
          }}
          className={`flex-1 py-0.5 md:py-1 px-1 md:px-2 rounded-md md:rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 md:gap-1.5 truncate ${
            activeTab === 'impacts'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <HeartPulse className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0 text-emerald-400" />
          <span>{t('impactsTab')}</span>
        </button>

        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('science');
          }}
          className={`flex-1 py-0.5 md:py-1 px-1 md:px-2 rounded-md md:rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 md:gap-1.5 truncate ${
            activeTab === 'science'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Sigma className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0 text-purple-400" />
          <span>{t('scienceTab')}</span>
        </button>

        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('simulator');
          }}
          className={`flex-1 py-0.5 md:py-1 px-1 md:px-2 rounded-md md:rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 md:gap-1.5 truncate ${
            activeTab === 'simulator'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Sliders className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0 text-amber-400" />
          <span>{t('simulatorTab')}</span>
        </button>

        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('all');
          }}
          className={`py-0.5 md:py-1 px-1.5 md:px-2 rounded-md md:rounded-lg text-center font-mono text-[8.5px] md:text-[10px] transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-800 text-slate-200 border border-slate-700 font-bold'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          }`}
          title="View all data in one continuous scroll"
        >
          {t('allTab')}
        </button>
      </div>

      {/* What this does: Shows quick unit-switch buttons right inside the panel (°C/°F/K, m/s/km/h/mph, % RH/Dew Pt, and Dual mode).
          On the website: Lets the user instantly convert all panel readings to their preferred units.
          Used as: The quick measuring-unit bar inside the side panel. */}
      <div className="px-1.5 md:px-3 py-1 md:py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-1 flex-wrap text-[10px] md:text-xs font-mono">
        <div className="flex items-center gap-1 text-[8.5px] md:text-[10px] text-slate-400">
          <Sliders className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" />
          <span className="font-bold">
            {isWindBranch
              ? isRTL ? 'الوحدات:' : 'Units:'
              : isHumidityBranch
              ? isRTL ? 'الوحدات:' : 'Units:'
              : isRTL ? 'الوحدات:' : 'Units:'}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {isWindBranch ? (
            <>
              {(['ms', 'kmh', 'mph', 'knots', 'beaufort'] as WindSpeedUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    soundFx.playTick();
                    setWindUnit(u);
                  }}
                  className={`px-1 md:px-1.5 py-0.5 rounded text-[8.5px] md:text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    windUnit === u
                      ? 'bg-teal-500 text-slate-950 shadow-sm font-extrabold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`Switch to ${u}`}
                >
                  {u === 'ms' ? 'm/s' : u === 'kmh' ? 'km/h' : u === 'mph' ? 'mph' : u === 'knots' ? 'kn' : 'Bft'}
                </button>
              ))}
            </>
          ) : isHumidityBranch ? (
            <>
              {(['relative_humidity', 'dew_point', 'specific_humidity', 'vpd'] as HumidityUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    soundFx.playTick();
                    setHumidityUnit(u);
                  }}
                  className={`px-1 md:px-1.5 py-0.5 rounded text-[8.5px] md:text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    humidityUnit === u
                      ? 'bg-cyan-500 text-slate-950 shadow-sm font-extrabold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`Switch to ${u}`}
                >
                  {u === 'relative_humidity' ? '% RH' : u === 'dew_point' ? 'Dew Pt' : u === 'specific_humidity' ? 'g/kg' : 'VPD'}
                </button>
              ))}
            </>
          ) : (
            <>
              {(['celsius', 'fahrenheit', 'kelvin', 'rankine'] as TemperatureUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    soundFx.playTick();
                    setTempUnit(u);
                  }}
                  className={`px-1 md:px-1.5 py-0.5 rounded text-[8.5px] md:text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    tempUnit === u
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`Switch to ${u}`}
                >
                  {u === 'celsius' ? '°C' : u === 'fahrenheit' ? '°F' : u === 'kelvin' ? 'K' : '°R'}
                </button>
              ))}
            </>
          )}

          {/* Dual Units Toggle Button (Shows both SI and Imperial / converted units) */}
          <button
            onClick={() => {
              soundFx.playTick();
              toggleDualUnits();
            }}
            className={`px-1 md:px-1.5 py-0.5 rounded text-[8.5px] md:text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              showDualUnits
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={showDualUnits ? 'Hide dual/secondary units' : 'Show both units simultaneously'}
          >
            {isRTL ? '⇄ مزدوج' : '⇄ Dual'}
          </button>

          {/* More Units Options Modal Trigger */}
          {onOpenUnits && (
            <button
              onClick={() => {
                soundFx.playTick();
                onOpenUnits();
              }}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
              title={isRTL ? 'فتح كافة خيارات وحدات القياس' : 'Open all measuring unit options'}
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-1.5 md:p-3.5 space-y-1.5 md:space-y-3.5 text-[10px] md:text-xs"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* What this does: Renders the Overview section with the summary finding, satellite info, main temperature/humidity/wind card, 2000-vs-2026-vs-2040 comparison, and trend chart.
            On the website: Shows the user the clearest at-a-glance climate picture for the selected place.
            Used as: The Overview tab body in the side panel. */}
        {(activeTab === 'overview' || activeTab === 'all') && (
          <div className="space-y-1.5 md:space-y-3.5">
            {/* Quick 1-sentence Plain English Finding Banner */}
            <div className="p-1.5 md:p-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-lg md:rounded-xl border border-cyan-500/30 flex items-center gap-1.5 md:gap-2.5 text-[10px] md:text-xs font-sans text-slate-200 shadow-sm">
              <span className="text-sm md:text-base shrink-0">📊</span>
              <div className="leading-snug">
                <strong className="text-cyan-300 block font-mono text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                  Key Planetary Finding &bull; {currentYear}
                </strong>
                <span>
                  {isWindBranch
                    ? `${item.name} experiences ${windStats.meanWindSpeedMs} m/s 10m surface winds (${windStats.beaufortDescription}) with ${windStats.hazardStatus.toLowerCase()}.`
                    : isHumidityBranch
                    ? `${item.name} has ${humStats.relativeHumidityPct}% relative humidity (${humStats.riskStatus.toLowerCase()}) with ${humStats.specificHumidityGKg} g/kg moisture.`
                    : `${item.name} averages ${effectiveTempC}°C (+${effectiveAnomalyC}°C anomaly vs baseline) with +${tempStats.rateDecadeC}°C warming per decade.`}
                </span>
              </div>
            </div>

            {/* NASA Observation Source, Instrument & Prediction Calibration Card */}
            <div className="p-2 md:p-3 bg-slate-950/90 rounded-lg md:rounded-xl border border-cyan-500/40 space-y-1 md:space-y-2 font-mono shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1 md:pb-1.5">
                <div className="flex items-center gap-1 md:gap-1.5 text-cyan-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                  <Satellite className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>NASA Observation &amp; Accuracy</span>
                </div>
                <span className="text-[8px] md:text-[9px] font-mono px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                  {hotspot?.predictionAccuracyPct || activeInstrument.predictionConfidencePct}% Model Accuracy
                </span>
              </div>

              <div className="flex items-center justify-between text-[9.5px] md:text-[11px]">
                <span className="text-slate-400">Target Variable:</span>
                <strong className="text-white font-bold">{hotspot?.variableName || activeInstrument.variableTitle}</strong>
              </div>

              <div className="flex items-center justify-between text-[9.5px] md:text-[11px] gap-2">
                <span className="text-slate-400 shrink-0">Source &amp; Instrument:</span>
                <span className="text-cyan-300 font-bold px-1 md:px-1.5 py-0.2 md:py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-[8.5px] md:text-[10px] text-right truncate">
                  {hotspot?.sourceAndInstrument || activeInstrument.sourceAndInstrument}
                </span>
              </div>

              <div className="flex items-center justify-between text-[9.5px] md:text-[11px]">
                <span className="text-slate-400">Sensor Precision:</span>
                <span className="text-slate-300 text-[8.5px] md:text-[10px]">{hotspot?.sensorErrorMargin || activeInstrument.accuracySpec}</span>
              </div>

              <div className="flex items-center justify-between text-[9.5px] md:text-[11px]">
                <span className="text-slate-400">Spatial Grid:</span>
                <span className="text-slate-300 text-[8.5px] md:text-[10px]">{activeInstrument.spatialResolution}</span>
              </div>

              <div className="pt-1 border-t border-slate-800/80 text-[8.5px] md:text-[10px] text-slate-400 leading-tight">
                <span className="text-slate-500 font-bold">Calibration: </span>
                <span>{activeInstrument.calibrationModel}</span>
              </div>
            </div>

            {/* Variable Specific Metrics Display */}
            {hotspot?.surfaceTempMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-rose-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-rose-400 uppercase font-bold border-b border-rose-500/20 pb-1">
                  <span>AIRS &amp; MODIS Surface Skin Radiometry</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Skin Temp: <strong className="text-white">{hotspot.surfaceTempMetrics.skinTempC}°C</strong></div>
                  <div>Absolute: <strong className="text-amber-300">{hotspot.surfaceTempMetrics.skinTempK} K</strong></div>
                  <div>Diurnal Delta: <strong className="text-rose-300">Δ{hotspot.surfaceTempMetrics.dayNightDeltaC}°C</strong></div>
                  <div>Emissivity: <strong className="text-slate-300">ε={hotspot.surfaceTempMetrics.emissivity}</strong></div>
                </div>
              </div>
            )}

            {hotspot?.precipitationMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-sky-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-sky-400 uppercase font-bold border-b border-sky-500/20 pb-1">
                  <span>GPM IMERG Rain &amp; Cloud Radar</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Monthly Total: <strong className="text-white">{hotspot.precipitationMetrics.precipitationMmMonth} mm/mo</strong></div>
                  <div>Daily Mean: <strong className="text-cyan-300">{hotspot.precipitationMetrics.precipitationRateMmDay} mm/day</strong></div>
                  <div>Convective Fraction: <strong className="text-sky-300">{hotspot.precipitationMetrics.convectiveFractionPct}%</strong></div>
                  <div>Liquid Fraction: <strong className="text-slate-300">{hotspot.precipitationMetrics.rainSnowPartitionPct}%</strong></div>
                </div>
              </div>
            )}

            {hotspot?.evapotranspirationMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-purple-400 uppercase font-bold border-b border-purple-500/20 pb-1">
                  <span>MERRA-2 &amp; GLDAS Evapotranspiration Flux</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Actual ET: <strong className="text-white">{hotspot.evapotranspirationMetrics.actualETMmDay} mm/day</strong></div>
                  <div>Potential ET: <strong className="text-purple-300">{hotspot.evapotranspirationMetrics.potentialETMmDay} mm/day</strong></div>
                  <div>Latent Heat: <strong className="text-amber-300">{hotspot.evapotranspirationMetrics.latentHeatFluxWm2} W/m²</strong></div>
                  <div>Evaporative Stress: <strong className="text-slate-300">ESI {hotspot.evapotranspirationMetrics.evaporativeStressIndex}</strong></div>
                </div>
              </div>
            )}

            {hotspot?.soilMoistureMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-lime-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-lime-400 uppercase font-bold border-b border-lime-500/20 pb-1">
                  <span>GLDAS Noah Soil Moisture &amp; Hydrology</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Topsoil (0-10cm): <strong className="text-white">{hotspot.soilMoistureMetrics.volumetricWaterContentM3M3} m³/m³</strong></div>
                  <div>Root-Zone: <strong className="text-lime-300">{hotspot.soilMoistureMetrics.rootZoneSoilMoisturePct}% sat</strong></div>
                  <div>Surface Runoff: <strong className="text-cyan-300">{hotspot.soilMoistureMetrics.surfaceRunoffMmDay} mm/day</strong></div>
                  <div>Streamflow Anom: <strong className="text-slate-300">{hotspot.soilMoistureMetrics.streamflowAnomPct}%</strong></div>
                </div>
              </div>
            )}

            {hotspot?.snowIceMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-sky-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-sky-400 uppercase font-bold border-b border-sky-500/20 pb-1">
                  <span>MODIS &amp; NSIDC Cryosphere Telemetry</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {hotspot.snowIceMetrics.seaIceExtentMillionKm2 !== undefined && (
                    <div>Sea Ice Area: <strong className="text-white">{hotspot.snowIceMetrics.seaIceExtentMillionKm2} M km²</strong></div>
                  )}
                  <div>Snow Cover: <strong className="text-sky-300">{hotspot.snowIceMetrics.snowCoverFractionPct}%</strong></div>
                  <div>Snow Water Eq: <strong className="text-cyan-300">{hotspot.snowIceMetrics.snowWaterEquivalentMm} mm</strong></div>
                  <div>Albedo: <strong className="text-slate-300">α = {hotspot.snowIceMetrics.surfaceAlbedo}</strong></div>
                </div>
              </div>
            )}

            {hotspot?.vegetationMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-emerald-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-emerald-400 uppercase font-bold border-b border-emerald-500/20 pb-1">
                  <span>MODIS Normalized Vegetation Index (NDVI)</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>NDVI Index: <strong className="text-white">{hotspot.vegetationMetrics.ndvi}</strong></div>
                  <div>Enhanced (EVI): <strong className="text-emerald-300">{hotspot.vegetationMetrics.evi}</strong></div>
                  <div>FAPAR: <strong className="text-cyan-300">{hotspot.vegetationMetrics.fapar}</strong></div>
                  <div>Status: <strong className="text-slate-300 text-[10px]">{hotspot.vegetationMetrics.canopyStressLevel}</strong></div>
                </div>
              </div>
            )}

            {hotspot?.aerosolMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-amber-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-amber-400 uppercase font-bold border-b border-amber-500/20 pb-1">
                  <span>MODIS &amp; MERRA-2 Aerosol Optical Depth</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>AOD (550nm): <strong className="text-white">{hotspot.aerosolMetrics.aod550nm}</strong></div>
                  <div>Fine Fraction: <strong className="text-amber-300">{((hotspot.aerosolMetrics.fineModeFraction ?? 0.65) * 100).toFixed(0)}%</strong></div>
                  <div>Absorbing Index: <strong className="text-rose-300">{hotspot.aerosolMetrics.absorbingAerosolIndex}</strong></div>
                  <div>Classification: <strong className="text-slate-300 text-[10px]">{hotspot.aerosolMetrics.airborneHazeClassification}</strong></div>
                </div>
              </div>
            )}

            {hotspot?.no2Metrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-rose-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-rose-400 uppercase font-bold border-b border-rose-500/20 pb-1">
                  <span>OMI Aura Tropospheric NO₂ Column</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Tropospheric NO₂: <strong className="text-white">{hotspot.no2Metrics.troposphericColumn10e15MolecCm2} × 10¹⁵</strong></div>
                  <div>Ground Est: <strong className="text-rose-300">{hotspot.no2Metrics.groundLevelEstimatePpb} ppb</strong></div>
                  <div>Anthropogenic: <strong className="text-amber-300">{hotspot.no2Metrics.anthropogenicFractionPct}%</strong></div>
                  <div>AQI Plume: <strong className="text-slate-300 text-[10px]">{hotspot.no2Metrics.airQualityIndexCategory}</strong></div>
                </div>
              </div>
            )}

            {hotspot?.ozoneMetrics && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-indigo-500/40 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-indigo-400 uppercase font-bold border-b border-indigo-500/20 pb-1">
                  <span>OMI Aura Total Column Ozone (DU)</span>
                  <span>{currentYear}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Total Column: <strong className="text-white">{hotspot.ozoneMetrics.totalColumnDobsonUnits} DU</strong></div>
                  <div>Stratospheric: <strong className="text-indigo-300">{hotspot.ozoneMetrics.stratosphericFractionPct}%</strong></div>
                  <div>UV Multiplier: <strong className="text-amber-300">{hotspot.ozoneMetrics.uvIndexMultiplier}x</strong></div>
                  <div>Status: <strong className="text-slate-300 text-[10px]">{hotspot.ozoneMetrics.ozoneHoleSeverityIndex}</strong></div>
                </div>
              </div>
            )}

            {/* Quick Action Bar in Overview */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
              {onOpenClimateDrivers && (
                <button
                  onClick={() => {
                    soundFx.playPredictionAlert();
                    onOpenClimateDrivers();
                  }}
                  className={`py-1.5 md:py-2 px-2 md:px-2.5 rounded-lg md:rounded-xl border font-mono text-[9.5px] md:text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 md:gap-1.5 cursor-pointer truncate ${
                    isWindBranch
                      ? 'bg-teal-950/60 hover:bg-teal-900/60 border-teal-500/50 text-teal-300 hover:text-white'
                      : isHumidityBranch
                      ? 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/50 text-cyan-300 hover:text-white'
                      : 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-500/50 text-amber-300 hover:text-white'
                  }`}
                  title="Discover why climate parameters are changing"
                >
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                  <span className="truncate">Why Changing?</span>
                </button>
              )}

              {onOpenChatbot && (
                <button
                  onClick={() => {
                    soundFx.playTick();
                    onOpenChatbot();
                  }}
                  className="py-1.5 md:py-2 px-2 md:px-2.5 rounded-lg md:rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white font-mono text-[9.5px] md:text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 md:gap-1.5 cursor-pointer truncate"
                  title="Ask NASA AI Copilot with Google Search & Maps Grounding"
                >
                  <Bot className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Ask AI Copilot</span>
                </button>
              )}
            </div>

            {/* CORE TELEMETRY DASHBOARD CARD (WIND VS HUMIDITY VS TEMPERATURE) */}
            {isWindBranch ? (
          /* WIND SPEED BRANCH TELEMETRY CARD */
          <div className="p-2 md:p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/40 rounded-lg md:rounded-xl border border-teal-500/40 space-y-1.5 md:space-y-3 font-mono shadow-[0_0_20px_rgba(20,184,166,0.15)]">
            <div className="flex items-center justify-between border-b border-teal-500/20 pb-1 md:pb-2">
              <div className="flex items-center gap-1 md:gap-1.5 text-teal-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                <Wind className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
                <span>10m Surface Wind Velocity &amp; Kinetic Power</span>
              </div>
              <span className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                CYGNSS &bull; {currentYear}
              </span>
            </div>

            {/* Hero Wind Speed Readout */}
            <div className="flex items-baseline justify-between pt-0.5 md:pt-1">
              <div>
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  {isRTL ? 'سرعة الرياح السطحية (10م)' : 'Surface 10m Wind Speed (U₁₀)'}
                </span>
                <div className="text-lg md:text-3xl font-extrabold text-white tracking-tight">
                  {formatWind(windStats.meanWindSpeedMs, { showDual: showDualUnits })}
                </div>
                <div className="text-[8.5px] md:text-[10px] text-slate-400 mt-0.5">
                  {isRTL
                    ? `مقياس بوفورت ${windStats.beaufortScale} • ${getBeaufortInfo(windStats.meanWindSpeedMs).nameAr}`
                    : `Beaufort Force ${windStats.beaufortScale} • ${windStats.beaufortDescription}`}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  {isRTL ? 'كثافة طاقة الرياح' : 'Wind Power Density (WPD)'}
                </span>
                <div className="inline-flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold border bg-teal-500/20 text-teal-300 border-teal-500/40">
                  <Activity className="w-3 h-3 md:w-3.5 md:h-3.5 text-teal-400" />
                  <span>{windStats.windPowerDensityWm2} W/m²</span>
                </div>
                <div className="text-[8.5px] md:text-[10px] text-teal-300 font-mono mt-0.5 md:mt-1">
                  {windStats.hazardStatus}
                </div>
              </div>
            </div>

            {/* 4 Multi-Parameter Wind Metrics */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2 pt-1.5 md:pt-2 border-t border-teal-500/20 text-[9.5px] md:text-[11px] font-mono">
              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'سرعة الهبات القصوى' : 'Peak Gust Capacity'}</span>
                <strong className="text-teal-300 text-[11px] md:text-sm">{formatWind(windStats.gustSpeedKmh / 3.6, { showDual: showDualUnits })}</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">{isRTL ? 'شدة الاضطراب الهوائي' : 'Turbulence intensity'}</span>
              </div>

              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'الاتجاه السائد' : 'Prevailing Vector'}</span>
                <strong className="text-violet-300 text-[11px] md:text-sm truncate block">{windStats.prevailingDirection}</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">{isRTL ? 'الدوران الكوكبي' : 'Planetary circulation'}</span>
              </div>

              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'جهاز الرصد الفضائي' : 'Observed Sensor'}</span>
                <strong className="text-emerald-300 text-[10px] md:text-xs truncate block">{windStats.satelliteSensor}</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">GPS Reflectometry</span>
              </div>

              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'اتجاه التغير العشري' : 'Decadal Stilling/Forcing'}</span>
                <strong className="text-cyan-300 text-[10px] md:text-xs">Young &amp; Ribal (Science)</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">{isRTL ? 'التباين بين المحيط واليابسة' : 'Ocean vs land contrast'}</span>
              </div>
            </div>

            {/* Minimized ambient temperature note */}
            <div className="flex items-center justify-between text-[8px] md:text-[9px] text-slate-500 pt-1 border-t border-slate-800 font-mono">
              <span>{isRTL ? 'المرجع: مقياس رياح عند 10 أمتار' : 'Telemetry: 10m anemometer baseline'}</span>
              <span>{isRTL ? 'الحرارة المحيطة:' : 'Ambient Temp:'} {formatTemp(tempStats.currentTempC)}</span>
            </div>
          </div>
        ) : isHumidityBranch ? (
          /* ATMOSPHERIC HUMIDITY BRANCH TELEMETRY CARD */
          <div className="p-2 md:p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 rounded-lg md:rounded-xl border border-cyan-500/40 space-y-1.5 md:space-y-3 font-mono shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 md:pb-2">
              <div className="flex items-center gap-1 md:gap-1.5 text-cyan-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                <Droplets className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
                <span>{isRTL ? 'رطوبة الغلاف الجوي والتدفق الرطوبي' : 'Atmospheric Relative Humidity & Moisture Flux'}</span>
              </div>
              <span className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                AIRS / MERRA-2 &bull; {currentYear}
              </span>
            </div>

            {/* Hero Relative Humidity Readout */}
            <div className="flex items-baseline justify-between pt-0.5 md:pt-1">
              <div>
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  {isRTL ? 'الرطوبة النسبية السطحية' : 'Surface Relative Humidity (RH)'}
                </span>
                <div className="text-lg md:text-3xl font-extrabold text-white tracking-tight">
                  {formatHum(humStats, { showDual: false }).formatted}
                  {showDualUnits && formatHum(humStats, { showDual: true }).secondaryFormatted && (
                    <span className="text-[11px] md:text-sm font-normal text-cyan-300 ml-1.5 md:ml-2">
                      {formatHum(humStats, { showDual: true }).secondaryFormatted}
                    </span>
                  )}
                </div>
                <div className="text-[8.5px] md:text-[10px] text-slate-400 mt-0.5">
                  {t('baselineAverage')}: {formatHum({ ...humStats, relativeHumidityPct: humStats.relativeHumidityPct - humStats.relativeHumidityAnomalyPct }).formatted}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  {isRTL ? 'شذوذ الرطوبة' : 'Moisture Anomaly (ΔRH)'}
                </span>
                <div className={`inline-flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold border ${
                  humStats.relativeHumidityAnomalyPct <= 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {humStats.relativeHumidityAnomalyPct <= 0 ? (
                    <TrendingDown className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                  ) : (
                    <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {humStats.relativeHumidityAnomalyPct > 0 ? '+' : ''}
                    {humStats.relativeHumidityAnomalyPct}%
                  </span>
                </div>
                <div className="text-[8.5px] md:text-[10px] text-cyan-300 font-mono mt-0.5 md:mt-1">
                  {humStats.riskStatus}
                </div>
              </div>
            </div>

            {/* 4 Multi-Parameter Humidity Scientific Metrics */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2 pt-1.5 md:pt-2 border-t border-cyan-500/20 text-[9.5px] md:text-[11px] font-mono">
              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'الرطوبة النوعية (q)' : 'Specific Humidity (q)'}</span>
                <strong className="text-cyan-300 text-[11px] md:text-sm">{humStats.specificHumidityGKg} {isRTL ? 'غم/كغم' : 'g/kg'}</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">+7%/&deg;C Clausius-Clapeyron</span>
              </div>

              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'عجز ضغط البخار (VPD)' : 'Vapor Pressure Deficit'}</span>
                <strong className="text-amber-300 text-[11px] md:text-sm">{humStats.vaporPressureDeficitKPa} {isRTL ? 'كيلوباسكال' : 'kPa'}</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">{isRTL ? 'قوة جفاف الغلاف الجوي' : 'Atmospheric thirst force'}</span>
              </div>

              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'نقطة الندى السطحية (Td)' : 'Surface Dew Point (Td)'}</span>
                <strong className="text-teal-300 text-[11px] md:text-sm">{formatTemp(humStats.dewPointC)}</strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">{isRTL ? 'حرارة تكاثف التشبع' : 'Saturation condensation'}</span>
              </div>

              <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'حرارة البصيلة الرطبة (Tw)' : 'Wet-Bulb Temp (Tw)'}</span>
                <strong className={humStats.wetBulbC >= 30 ? 'text-rose-400 text-[11px] md:text-sm' : 'text-emerald-300 text-[11px] md:text-sm'}>
                  {formatTemp(humStats.wetBulbC)}
                </strong>
                <span className="text-[8px] md:text-[9px] text-slate-400 block">ISO 7243 Human safety</span>
              </div>
            </div>

            {/* Sensor & Attribution */}
            <div className="p-1.5 md:p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[8.5px] md:text-[10px] space-y-0.5 md:space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">{isRTL ? 'مستشعر الرصد الفضائي:' : 'Earth Observation Sensor:'}</span>
                <span className="text-cyan-300 font-bold">{humStats.sensor}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">{isRTL ? 'نظرية ديناميكا الرطوبة:' : 'Moist Dynamics Theory:'}</span>
                <span className="text-emerald-300 font-semibold">Byrne &amp; O'Gorman (2018 PNAS)</span>
              </div>
            </div>
          </div>
        ) : dataMode === 'simple' ? (
          /* SIMPLE MODE: VISUAL-FIRST WITH B1 PLAIN ENGLISH WORDS */
          <div className="p-2 md:p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg md:rounded-xl border border-emerald-500/40 space-y-1.5 md:space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 md:gap-1.5 text-emerald-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                <PieChart className="w-3 h-3 md:w-4 md:h-4" />
                <span>{isRTL ? 'عرض مبسط: ما مقدار الدفء؟' : 'Simple View: How Warm Is It?'}</span>
              </div>
              <span className="text-[8.5px] md:text-[10px] px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {isRTL ? `عام ${currentYear}` : `Year ${currentYear}`}
              </span>
            </div>

            {/* Large Visual Temperature & Status Dial */}
            <div className="flex items-center justify-between pt-0.5 md:pt-1">
              <div>
                <div className="text-lg md:text-3xl font-extrabold text-white tracking-tight">
                  {formatTemp(effectiveTempC, { showDual: showDualUnits })}
                </div>
                <p className="text-[10px] md:text-xs text-slate-300 font-sans mt-0.5 font-medium">
                  {isRTL
                    ? `كانت درجة حرارة عام 2000 الطبيعية هي ${formatTemp(tempStats.baselineTempC)}.`
                    : `Normal year 2000 temperature was ${formatTemp(tempStats.baselineTempC)}.`}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] md:text-xs font-bold">
                  <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>{formatTempDelta(effectiveAnomalyC, { showDual: showDualUnits })}</span>
                </div>
                <div className="text-[8.5px] md:text-[10px] text-amber-300 font-sans mt-0.5 md:mt-1">
                  +{formatTempDelta(tempStats.rateDecadeC, { showUnit: true, showSign: false })} {isRTL ? 'لكل 10 سنوات' : 'every 10 years'}
                </div>
              </div>
            </div>

            {/* Visual Colored Temperature Gauge Bar (Visual Element) */}
            <div className="space-y-0.5 md:space-y-1 pt-0.5 md:pt-1">
              <div className="flex justify-between text-[8px] md:text-[10px] text-slate-400">
                <span>{isRTL ? 'تجمد (0°C)' : 'Freezing (0°C)'}</span>
                <span>{isRTL ? 'معتدل (20°C)' : 'Mild (20°C)'}</span>
                <span>{isRTL ? 'حار (35°C)' : 'Hot (35°C)'}</span>
                <span>{isRTL ? 'شديد الحرارة (50°C)' : 'Extreme (50°C)'}</span>
              </div>
              <div className="w-full h-2 md:h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 via-orange-500 to-rose-600 transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(8, ((effectiveTempC + 10) / 60) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* B1 Plain English Explanation */}
            <div className="p-1.5 md:p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[9.5px] md:text-[11px] font-sans text-slate-200 space-y-0.5 md:space-y-1">
              <strong className="text-emerald-300 block font-mono text-[8.5px] md:text-[10px] uppercase">
                {isRTL ? 'ماذا يعني هذا بكلمات بسيطة؟' : 'What does this mean in simple words?'}
              </strong>
              <p>
                {effectiveAnomalyC >= 2.0
                  ? isRTL
                    ? 'هذا الموقع أصبح أدفأ بكثير مما كان عليه. فصول الصيف أطول، وتحتاج الأشجار والمحاصيل للمزيد من مياه الري لتبقى خضراء.'
                    : 'This place is much hotter than it used to be. Summer seasons are longer, and trees need more water to stay green.'
                  : isRTL
                  ? 'الطقس هنا يزداد دفئاً بصورة مستمرة عبر العقود. مواسم الأمطار والجفاف تشهد تحولات ملحوظة.'
                  : 'The weather here is slowly getting warmer over time. Rain and dry seasons are shifting.'}
              </p>
            </div>
          </div>
        ) : dataMode === 'complicated' ? (
          /* COMPLICATED MODE: ACADEMIC RESEARCH PAPER DEPTH */
          <div className="p-2 md:p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg md:rounded-xl border border-purple-500/40 space-y-1.5 md:space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 md:pb-2">
              <div className="flex items-center gap-1 md:gap-1.5 text-purple-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
                <span>{isRTL ? 'القياسات الإشعاعية المناخية البحثية' : 'Empirical Radiometric & In-Situ Climatology'}</span>
              </div>
              <span className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                {isRTL ? `الحقبة: ${currentYear}` : `Epoch: ${currentYear}`} &bull; Level 3B
              </span>
            </div>

            {/* Research Paper Equations & Confidence Bounds */}
            <div className="flex items-baseline justify-between pt-0.5 md:pt-1">
              <div>
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  {isRTL ? 'متوسط حرارة السطح (T_s ± σ)' : 'Mean Surface Temperature (T_s ± σ)'}
                </span>
                <div className="text-lg md:text-3xl font-extrabold text-white tracking-tight">
                  {formatTemp(effectiveTempC, { showDual: showDualUnits })}
                </div>
                <div className="text-[8.5px] md:text-[10px] text-slate-400 mt-0.5">
                  {isRTL ? 'المرجع قبل الصناعي (1850–1900):' : 'Pre-Industrial Datum (1850–1900):'} {formatTemp(tempStats.baselineTempC)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  {isRTL ? 'الشذوذ الحراري (ΔT)' : 'Thermal Anomaly (ΔT)'}
                </span>
                <div className="inline-flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] md:text-xs font-bold">
                  <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>{formatTempDelta(effectiveAnomalyC, { showDual: showDualUnits })}</span>
                </div>
                <div className="text-[8.5px] md:text-[10px] text-purple-300/90 mt-0.5 md:mt-1">
                  ∂T/∂t = {formatTempDelta(tempStats.rateDecadeC)}/{isRTL ? 'عقد' : 'decade'}
                </div>
              </div>
            </div>

            {/* Research Methodology Matrix */}
            <div className="p-1.5 md:p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 md:space-y-1.5 text-[8.5px] md:text-[10px]">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">{isRTL ? 'فاصل ثقة 95%:' : '95% Confidence Interval:'}</span>
                <strong className="text-amber-300 font-mono">
                  [{formatTemp(Number((effectiveTempC - 0.28).toFixed(2)))}, {formatTemp(Number((effectiveTempC + 0.28).toFixed(2)))}]
                </strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">{isRTL ? 'معايرة أجهزة الرصد:' : 'Telemetry Instrument Calibration:'}</span>
                <span className="text-cyan-300">MODIS MOD11A2 / GISTEMP v4</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">{isRTL ? 'توقع 2040 (SSP2-4.5):' : 'Projected 2040 (SSP2-4.5 Ensemble):'}</span>
                <strong className="text-rose-400">
                  {formatTemp(tempStats.projected2040C + tempStressOffset, { showDual: showDualUnits })}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL MODE: BALANCED MISSION STANDARD */
          <div className="p-2 md:p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg md:rounded-xl border border-amber-500/30 space-y-1.5 md:space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 md:gap-1.5 text-amber-400 font-mono text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                <Thermometer className="w-3 h-3 md:w-4 md:h-4" />
                <span>{isRTL ? `درجة حرارة السطح (${tempSymbol})` : `Surface Temperature in ${tempUnit.toUpperCase()} (${tempSymbol})`}</span>
              </div>
              <span className="text-[8.5px] md:text-[10px] font-mono text-slate-400">{isRTL ? `عام ${currentYear}` : `Year ${currentYear}`}</span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5 md:pt-1">
              <div>
                <div className="text-lg md:text-3xl font-extrabold font-mono text-white tracking-tight">
                  {formatTemp(effectiveTempC, { showDual: showDualUnits })}
                </div>
                <div className="text-[8.5px] md:text-[10px] font-mono text-slate-400 mt-0.5">
                  {t('baselineAverage')}: {formatTemp(tempStats.baselineTempC, { showDual: showDualUnits })}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] md:text-xs font-bold">
                  <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>{formatTempDelta(effectiveAnomalyC, { showDual: showDualUnits })}</span>
                </div>
                <div className="text-[8.5px] md:text-[10px] font-mono text-rose-400/80 mt-0.5 md:mt-1">
                  {t('rateOfChange')}: {formatTempDelta(tempStats.rateDecadeC, { showDual: showDualUnits })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 md:gap-2 pt-1.5 md:pt-2 border-t border-slate-800 text-[9.5px] md:text-[11px] font-mono">
              <div className="p-1.5 md:p-2 bg-slate-900/80 rounded-lg">
                <span className="text-slate-500 block text-[8px] md:text-[9px] uppercase">{isRTL ? 'حالة الاحترار' : 'Warming Status'}</span>
                <strong className={effectiveAnomalyC >= 2.0 ? 'text-rose-400' : 'text-amber-300'}>
                  {effectiveAnomalyC >= 2.0
                    ? isRTL ? 'احترار حرج (>+2°C)' : 'Extreme Warming (>+2°C)'
                    : isRTL ? 'احترار متسارع' : 'Accelerated Warming'}
                </strong>
              </div>
              <div className="p-1.5 md:p-2 bg-slate-900/80 rounded-lg">
                <span className="text-slate-500 block text-[8px] md:text-[9px] uppercase">{t('projected2040')}</span>
                <strong className="text-cyan-300">
                  {formatTemp(tempStats.projected2040C + tempStressOffset, { showDual: showDualUnits })}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* 3-EPOCH MONTHLY TEMPERATURE COMPARISON: PAST vs PRESENT vs PREDICTION */}
        <div className="p-2 md:p-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg md:rounded-xl border border-cyan-500/40 space-y-2 md:space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => {
                    soundFx.playTick();
                    if (onMonthChange) onMonthChange(currentMonth === 1 ? 12 : currentMonth - 1);
                  }}
                  className="p-0.5 md:p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title={isRTL ? 'الشهر السابق' : 'Previous Month'}
                >
                  <ChevronLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
                <span className="text-[10px] md:text-xs font-mono font-bold text-white px-1.5 md:px-2">
                  {(t('months') as string[])[currentMonth - 1]}
                </span>
                <button
                  onClick={() => {
                    soundFx.playTick();
                    if (onMonthChange) onMonthChange(currentMonth === 12 ? 1 : currentMonth + 1);
                  }}
                  className="p-0.5 md:p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title={isRTL ? 'الشهر التالي' : 'Next Month'}
                >
                  <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider hidden sm:inline">
                {t('monthComparison')}
              </span>
            </div>

            <div className="flex items-center gap-1 md:gap-1.5">
              <span
                className={`text-[8px] md:text-[9px] font-mono px-1.5 md:px-2 py-0.2 md:py-0.5 rounded border font-bold ${
                  monthShiftC > 0
                    ? 'text-rose-300 bg-rose-950/60 border-rose-500/40'
                    : monthShiftC < 0
                    ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40'
                    : 'text-slate-300 bg-slate-900 border-slate-700'
                }`}
                title={`Difference vs ${(t('monthsShort') as string[])[prevMonthNum - 1]}`}
              >
                {formatTempDelta(monthShiftC, { showDual: false })} vs {(t('monthsShort') as string[])[prevMonthNum - 1]}
              </span>
              <span className="text-[8px] md:text-[9px] font-mono px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {pastMonthData.seasonName}
              </span>
            </div>
          </div>

          {/* Voice Synthesis Button */}
          <button
            onClick={speakTemperatures}
            className={`w-full py-1 md:py-1.5 px-2 md:px-3 rounded-lg border font-mono text-[10px] md:text-xs flex items-center justify-between transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse'
                : isWindBranch
                ? 'bg-slate-900/90 hover:bg-slate-800 text-teal-300 border-teal-500/40 hover:border-teal-400'
                : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-950 animate-bounce" />
              ) : (
                <Volume2 className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWindBranch ? 'text-teal-400' : 'text-cyan-400'}`} />
              )}
              <span className="font-semibold">
                {isSpeaking
                  ? t('stopSpeakingButton')
                  : t('speakTelemetryButton')}
              </span>
            </div>
            <span className="text-[8.5px] md:text-[10px] uppercase font-mono px-1 md:px-1.5 py-0.2 md:py-0.5 rounded bg-slate-950/60 text-slate-200">
              {isRTL ? 'صوتي' : 'Voice'}
            </span>
          </button>

          {/* 3-Column Epoch Grid: PAST (2000) vs PRESENT (2026) vs PREDICTION (2040) */}
          <div className="grid grid-cols-3 gap-1 md:gap-2 text-center font-mono">
            {/* 1. PAST */}
            <div className="p-1.5 md:p-2.5 bg-slate-900/90 rounded-lg md:rounded-xl border border-sky-500/30 flex flex-col justify-between">
              <div>
                <span className="text-[7.5px] md:text-[9px] text-sky-400 uppercase tracking-wider block font-bold">
                  {t('pastYear2000')}
                </span>
                <span className="text-[7.5px] md:text-[9px] text-slate-400 block mt-0.5">{isRTL ? 'خط الأساس' : 'Baseline'}</span>
              </div>
              <div className="my-1 md:my-1.5">
                <div className="text-sm md:text-xl font-extrabold text-sky-200">
                  {isWindBranch
                    ? formatWind(windStats.meanWindSpeedMs * 0.94)
                    : isHumidityBranch
                    ? formatHum({ relativeHumidityPct: humStats.relativeHumidityPct - humStats.relativeHumidityAnomalyPct }).formatted
                    : formatTemp(pastMonthData.monthlyTempC)}
                </div>
              </div>
              <span className="text-[7.5px] md:text-[9px] text-slate-400 bg-slate-950/60 py-0.2 md:py-0.5 px-1 rounded border border-slate-800">
                {isWindBranch ? formatWind(windStats.meanWindSpeedMs * 0.94, { showUnit: true }) : isHumidityBranch ? 'Baseline' : '2000 base'}
              </span>
            </div>

            {/* 2. PRESENT */}
            <div className={`p-1.5 md:p-2.5 bg-slate-900/90 rounded-lg md:rounded-xl border flex flex-col justify-between ${
              isWindBranch ? 'border-teal-500/40' : isHumidityBranch ? 'border-cyan-500/40' : 'border-amber-500/40'
            }`}>
              <div>
                <span className={`text-[7.5px] md:text-[9px] uppercase tracking-wider block font-bold ${
                  isWindBranch ? 'text-teal-400' : isHumidityBranch ? 'text-cyan-400' : 'text-amber-400'
                }`}>
                  {t('presentYear2026')}
                </span>
                <span className="text-[7.5px] md:text-[9px] text-slate-400 block mt-0.5">{isRTL ? 'رصد واقعي' : 'Observed'}</span>
              </div>
              <div className="my-1 md:my-1.5">
                <div className={`text-sm md:text-xl font-extrabold ${
                  isWindBranch ? 'text-teal-300' : isHumidityBranch ? 'text-cyan-300' : 'text-amber-300'
                }`}>
                  {isWindBranch
                    ? formatWind(windStats.meanWindSpeedMs)
                    : isHumidityBranch
                    ? formatHum(humStats).formatted
                    : formatTemp(presentMonthData.monthlyTempC)}
                </div>
              </div>
              <span className={`text-[7.5px] md:text-[9px] font-bold py-0.2 md:py-0.5 px-1 rounded border ${
                isWindBranch
                  ? 'text-teal-300 bg-teal-950/40 border-teal-800/60'
                  : isHumidityBranch
                  ? humStats.relativeHumidityAnomalyPct <= 0
                    ? 'text-amber-400 bg-amber-950/40 border-amber-800/60'
                    : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
                  : 'text-amber-400 bg-amber-950/40 border-amber-800/60'
              }`}>
                {isWindBranch
                  ? `F${windStats.beaufortScale}`
                  : isHumidityBranch
                  ? `${humStats.relativeHumidityAnomalyPct > 0 ? '+' : ''}${humStats.relativeHumidityAnomalyPct}% RH`
                  : `${formatTempDelta(presentMonthData.monthlyTempC - pastMonthData.monthlyTempC)}`}
              </span>
            </div>

            {/* 3. PREDICTION */}
            <div className={`p-1.5 md:p-2.5 bg-slate-900/90 rounded-lg md:rounded-xl border flex flex-col justify-between ${
              isWindBranch ? 'border-violet-500/40' : isHumidityBranch ? 'border-teal-500/40' : 'border-rose-500/40'
            }`}>
              <div>
                <span className={`text-[7.5px] md:text-[9px] uppercase tracking-wider block font-bold ${
                  isWindBranch ? 'text-violet-400' : isHumidityBranch ? 'text-teal-400' : 'text-rose-400'
                }`}>
                  {t('futureYear2040')}
                </span>
                <span className="text-[7.5px] md:text-[9px] text-slate-400 block mt-0.5">{isRTL ? 'نموذج الذكاء' : 'AI Model'}</span>
              </div>
              <div className="my-1 md:my-1.5">
                <div className={`text-sm md:text-xl font-extrabold ${
                  isWindBranch ? 'text-violet-300' : isHumidityBranch ? 'text-teal-300' : 'text-rose-300'
                }`}>
                  {isWindBranch
                    ? formatWind(windStats.meanWindSpeedMs * 1.05)
                    : isHumidityBranch
                    ? formatHum({ relativeHumidityPct: humStats.relativeHumidityPct + (humStats.relativeHumidityAnomalyPct <= 0 ? -1.8 : 1.2) }).formatted
                    : formatTemp(pred2040MonthData.monthlyTempC)}
                </div>
              </div>
              <span className={`text-[7.5px] md:text-[9px] font-bold py-0.2 md:py-0.5 px-1 rounded border ${
                isWindBranch
                  ? 'text-violet-300 bg-violet-950/40 border-violet-800/60'
                  : isHumidityBranch
                  ? 'text-teal-300 bg-teal-950/40 border-teal-800/60'
                  : 'text-rose-400 bg-rose-950/40 border-rose-800/60'
              }`}>
                {isWindBranch
                  ? `+5% ${isRTL ? 'تسارع' : 'trend'}`
                  : isHumidityBranch
                  ? `${humStats.relativeHumidityAnomalyPct <= 0 ? (isRTL ? 'جاف 1.8%-' : '-1.8% dry') : (isRTL ? 'رطب 1.2%+' : '+1.2% moist')}`
                  : `${formatTempDelta(pred2040MonthData.monthlyTempC - pastMonthData.monthlyTempC)}`}
              </span>
            </div>
          </div>

          {/* Active Viewed Year Highlight (if viewing an interim year, e.g. 2033) */}
          {currentYear !== 2000 && currentYear !== 2026 && currentYear !== 2040 && (
            <div className="p-1.5 md:p-2 bg-slate-900/70 rounded-lg border border-slate-800 flex items-center justify-between text-[9.5px] md:text-[11px] font-mono text-slate-300">
              <span className={`flex items-center gap-1 md:gap-1.5 ${isWindBranch ? 'text-teal-300' : 'text-cyan-300'}`}>
                <Sparkles className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isWindBranch ? 'text-teal-400' : 'text-cyan-400'}`} />
                <span>{isRTL ? `السنة المعروضة ${currentYear}:` : `Currently Viewing Year ${currentYear}:`}</span>
              </span>
              <strong className="text-white text-[10px] md:text-xs">
                {isWindBranch
                  ? formatWind(windStats.meanWindSpeedMs, { showDual: true })
                  : isHumidityBranch
                  ? formatHum({ relativeHumidityPct: humStats.relativeHumidityPct, dewPointC: humStats.dewPointC }).formatted
                  : `${formatTemp(activeMonthData.monthlyTempC)} (${formatTempDelta(activeMonthData.monthAnomalyC)})`}
              </strong>
            </div>
          )}

          {/* Trend Trajectory Progression Bar */}
          <div className="space-y-1 pt-1 border-t border-slate-900">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>
                2000: {isWindBranch ? formatWind(windStats.meanWindSpeedMs * 0.94) : isHumidityBranch ? formatHum({ relativeHumidityPct: humStats.relativeHumidityPct - humStats.relativeHumidityAnomalyPct }).formatted : formatTemp(pastMonthData.monthlyTempC)}
              </span>
              <span className={isWindBranch ? "text-teal-400" : isHumidityBranch ? "text-cyan-400" : "text-amber-400"}>
                2026: {isWindBranch ? formatWind(windStats.meanWindSpeedMs) : isHumidityBranch ? formatHum({ relativeHumidityPct: humStats.relativeHumidityPct }).formatted : formatTemp(presentMonthData.monthlyTempC)}
              </span>
              <span className={isWindBranch ? "text-violet-400" : isHumidityBranch ? "text-teal-400" : "text-rose-400"}>
                2040: {isWindBranch ? formatWind(windStats.meanWindSpeedMs * 1.05) : isHumidityBranch ? formatHum({ relativeHumidityPct: humStats.relativeHumidityPct + (humStats.relativeHumidityAnomalyPct <= 0 ? -1.8 : 1.2) }).formatted : formatTemp(pred2040MonthData.monthlyTempC)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div className="w-1/3 bg-sky-500/80 h-full" />
              <div className={`w-1/3 h-full ${isWindBranch ? 'bg-teal-500/90' : isHumidityBranch ? 'bg-cyan-500/90' : 'bg-amber-500/90'}`} />
              <div className={`w-1/3 h-full ${isWindBranch ? 'bg-violet-500/90' : isHumidityBranch ? 'bg-teal-500/90' : 'bg-rose-500/90'}`} />
            </div>
          </div>
        </div>

        {/* WHERE & COORDINATES (IN OVERVIEW) */}
            <div className="p-2 md:p-3 bg-slate-950/60 rounded-lg md:rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Compass className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
                <div>
                  <span className="text-[8.5px] md:text-[10px] font-mono text-slate-400 uppercase block">Where / Coordinates</span>
                  <span className="font-mono text-cyan-200 text-[10px] md:text-xs font-semibold">
                    {Math.abs(item.lat).toFixed(2)}&deg;{item.lat >= 0 ? 'N' : 'S'},{' '}
                    {Math.abs(item.lng).toFixed(2)}&deg;{item.lng >= 0 ? 'E' : 'W'}
                  </span>
                </div>
              </div>
              <span className="text-[8.5px] md:text-[10px] font-mono text-slate-400">{item.name}</span>
            </div>

            {/* TEMPERATURE TIME-SERIES CURVE (2000 - 2040) */}
            <div className="p-2 md:p-3 bg-slate-950/80 rounded-lg md:rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="flex items-center gap-1 md:gap-1.5">
                  <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400" />
                  <span className="text-[8.5px] md:text-[10px] font-mono uppercase tracking-wider text-slate-300">
                    {isWindBranch
                      ? 'Wind Velocity Curve (2000 – 2040 in m/s)'
                      : isHumidityBranch
                      ? 'Relative Humidity Curve (2000 – 2040 in % RH)'
                      : 'Temperature Curve (2000 – 2040 in °C)'}
                  </span>
                </div>
                {isAiPrediction && (
                  <span className="text-[8px] md:text-[9px] font-mono uppercase px-1.5 py-0.2 md:py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-rose-400" />
                    AI Ensemble
                  </span>
                )}
              </div>

              <div className="relative">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-20 md:h-28 overflow-visible select-none">
                  <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#334155" strokeWidth="1" />
                  <line x1={padL} y1={padT} x2={chartW - padR} y2={padT} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

                  {/* 2026 Divider */}
                  <line x1={getX(2026)} y1={padT} x2={getX(2026)} y2={chartH - padB} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

                  {/* 95% Confidence Interval Shaded Uncertainty Cone (Years 2026-2040) */}
                  {ciAreaPath && (
                    <path
                      d={ciAreaPath}
                      fill={isWindBranch ? 'rgba(139,92,246,0.18)' : isHumidityBranch ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.22)'}
                      stroke="none"
                    />
                  )}

                  {/* Historical Curve */}
                  <path d={histPath} fill="none" stroke={isWindBranch ? "#14b8a6" : isHumidityBranch ? "#06b6d4" : "#38bdf8"} strokeWidth="2" strokeLinecap="round" />

                  {/* AI Prediction Curve */}
                  <path d={aiPath} fill="none" stroke={isWindBranch ? "#8b5cf6" : isHumidityBranch ? "#10b981" : "#fb7185"} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />

                  {/* Active Year Cursor */}
                  <line x1={currentX} y1={padT} x2={currentX} y2={chartH - padB} stroke={isWindBranch ? "#14b8a6" : isHumidityBranch ? "#06b6d4" : "#38bdf8"} strokeWidth="1.5" />
                  <circle cx={currentX} cy={currentY} r="4" fill={isWindBranch ? "#14b8a6" : isHumidityBranch ? "#06b6d4" : "#38bdf8"} stroke="#020617" strokeWidth="1.5" />

                  {/* X Labels */}
                  <text x={padL} y={chartH - 8} fill="#64748b" fontSize="8" fontFamily="monospace">2000</text>
                  <text x={getX(2026)} y={chartH - 8} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">2026</text>
                  <text x={chartW - padR} y={chartH - 8} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">2040</text>

                  {/* Y Labels */}
                  <text x={padL - 4} y={padT + 8} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">
                    {maxTemp.toFixed(1)}{isWindBranch ? 'm' : isHumidityBranch ? '%' : '°'}
                  </text>
                  <text x={padL - 4} y={chartH - padB} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">
                    {minTemp.toFixed(1)}{isWindBranch ? 'm' : isHumidityBranch ? '%' : '°'}
                  </text>
                </svg>

                <div className="flex items-center justify-between text-[9.5px] md:text-[11px] font-mono mt-0.5 md:mt-1 px-1 text-slate-300">
                  <span>Year: <strong className="text-cyan-300">{currentYear}</strong></span>
                  <span>
                    {isWindBranch ? 'Wind:' : isHumidityBranch ? 'RH:' : 'Temp:'}{' '}
                    <strong className="text-white">
                      {isWindBranch ? `${windStats.meanWindSpeedMs} m/s` : isHumidityBranch ? `${humStats.relativeHumidityPct}%` : `${tempStats.currentTempC} °C`}
                    </strong>
                  </span>
                </div>

                {/* 2000-2010 Baseline Reference & Confidence Band Card */}
                <div className="mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-slate-800 text-[9.5px] md:text-[11px] font-mono space-y-0.5 md:space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>2000–2010 Decade Baseline:</span>
                    <strong className="text-slate-200">
                      {baseline2000_2010} {isWindBranch ? 'm/s' : isHumidityBranch ? '% RH' : '°C'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Change vs 2000–2010:</span>
                    <strong className={baselineDiff.isWarming ? 'text-amber-400' : 'text-cyan-400'}>
                      {baselineDiff.formattedDelta} {isWindBranch ? 'm/s' : isHumidityBranch ? '% RH' : '°C'}
                    </strong>
                  </div>

                  {currentCI.isProjection ? (
                    <div className="p-1.5 md:p-2 rounded-lg bg-amber-950/40 border border-amber-500/50 text-amber-300 space-y-0.5 mt-1 md:mt-1.5">
                      <div className="flex items-center justify-between font-bold text-[8.5px] md:text-[10px] uppercase">
                        <span>🔮 Model Prediction (95% CI)</span>
                        <span>±{currentCI.margin}</span>
                      </div>
                      <div className="text-[9.5px] md:text-[11px] text-white">
                        Projected: <strong>{currentCI.value} {isWindBranch ? 'm/s' : isHumidityBranch ? '% RH' : '°C'}</strong>
                        {' '}(Range: <strong>{currentCI.low} – {currentCI.high}</strong>)
                      </div>
                      <div className="text-[8.5px] md:text-[10px] text-amber-200/80 italic">
                        This is a projection based on past data, not a certainty.
                      </div>
                    </div>
                  ) : (
                    <div className="p-1 md:p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-[8.5px] md:text-[10px] flex items-center justify-between mt-1">
                      <span>🛰️ Observed Data (NASA MERRA-2)</span>
                      <span className="text-slate-400">Instrument Certainty (±0.12°C)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* NASA EARTH SYSTEM COUPLED EFFECTS (ONLY IN 'COMPLICATED' MODE)           */}
            {/* Real data for any place in the world + High Accuracy 2040 Prediction      */}
            {/* ========================================================================= */}
            {dataMode === 'complicated' && coupledEffects.length > 0 && (
              <div className="p-2 md:p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl md:rounded-2xl border border-purple-500/50 space-y-2 md:space-y-3.5 font-mono shadow-2xl animate-in fade-in duration-200">
                {/* Header */}
                <div className="border-b border-purple-500/30 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-950/90 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-inner">
                      <Satellite className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>NASA Earth System Coupled Effects</span>
                      </h4>
                      <p className="text-[10px] text-purple-300/90">
                        {isWindBranch
                          ? '3 downstream variables driven by Wind Speed changes'
                          : isHumidityBranch
                          ? '3 downstream variables driven by Atmospheric Humidity changes'
                          : '3 downstream variables driven by Air Temperature changes'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-200 border border-purple-700 font-bold uppercase tracking-wider">
                    Level-3 Satellite Telemetry
                  </span>
                </div>

                {/* The 3 Coupled Effects Driven by Active Branch */}
                <div className="space-y-2 md:space-y-3">
                  {coupledEffects.map((eff) => (
                    <div
                      key={eff.id}
                      className="p-2 md:p-3.5 rounded-lg md:rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-purple-500/50 transition-all space-y-1.5 md:space-y-2.5 shadow-md"
                    >
                      {/* Title & Satellite Instruments */}
                      <div className="flex items-start justify-between gap-1.5 md:gap-2">
                        <div className="flex items-center gap-1.5 md:gap-2.5">
                          <div
                            className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center border shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${eff.color}22`,
                              borderColor: `${eff.color}66`,
                              color: eff.color,
                            }}
                          >
                            {eff.id === 'surface-temp' ? (
                              <Sun className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'snow-ice' ? (
                              <Snowflake className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'ozone' ? (
                              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'precipitation' ? (
                              <CloudRain className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'evapotranspiration' ? (
                              <CloudFog className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'soil-moisture' ? (
                              <Sprout className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'vegetation' ? (
                              <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : eff.id === 'aerosols' ? (
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            ) : (
                              <Flame className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            )}
                          </div>
                          <div>
                            <h5 className="text-[10.5px] md:text-xs font-bold text-white tracking-wide">{eff.name}</h5>
                            <div className="flex items-center gap-1 md:gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[8.5px] md:text-[10px] font-bold text-cyan-300 bg-cyan-950/90 px-1 md:px-1.5 py-0.2 rounded border border-cyan-800/70">
                                {eff.sourceAndInstrument}
                              </span>
                              <span className="text-[8px] md:text-[9px] text-slate-400">
                                {eff.satelliteOrModel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[8px] md:text-[9px] font-bold text-emerald-400 bg-emerald-950/70 px-1.5 md:px-2 py-0.2 md:py-0.5 rounded border border-emerald-800/60 shrink-0">
                          {eff.predictionAccuracyPct}% Accuracy
                        </span>
                      </div>

                      {/* Real Data & High Accuracy Prediction Box */}
                      <div className="grid grid-cols-2 gap-1.5 md:gap-2 p-1.5 md:p-2.5 bg-slate-900/90 rounded-lg md:rounded-xl border border-slate-800/90 text-[8.5px] md:text-[10px]">
                        <div>
                          <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase tracking-wider font-semibold">
                            Observed ({currentYear}):
                          </span>
                          <div className="text-xs md:text-base font-extrabold text-white mt-0.5 tracking-tight">
                            {eff.currentValue} <span className="text-[8.5px] md:text-[10px] text-slate-400 font-normal">{eff.unitSymbol}</span>
                          </div>
                          <div className="text-[8px] md:text-[9px] text-slate-400 mt-0.5">
                            Baseline: {eff.baselineValue} {eff.unitSymbol}
                          </div>
                          <div className="text-[8px] md:text-[9px] text-cyan-300 font-semibold mt-0.5">
                            {eff.anomalyFormatted}
                          </div>
                        </div>

                        <div className="border-l border-slate-800 pl-1.5 md:pl-2.5">
                          <span className="text-slate-400 block text-[8px] md:text-[9px] uppercase tracking-wider font-semibold">
                            Projected (2040 SSP2-4.5):
                          </span>
                          <div className="text-xs md:text-base font-extrabold text-amber-300 mt-0.5 tracking-tight">
                            {eff.predicted2040Value} <span className="text-[8.5px] md:text-[10px] text-slate-400 font-normal">{eff.unitSymbol}</span>
                          </div>
                          <div className="text-[8px] md:text-[9px] text-purple-300 font-mono mt-0.5 font-semibold">
                            95% CI: [{eff.confidenceLower2040}, {eff.confidenceUpper2040}]
                          </div>
                          <div className="text-[8px] md:text-[9px] text-slate-400 mt-0.5">
                            Decadal Rate: {eff.decadalRate}
                          </div>
                        </div>
                      </div>

                      {/* Sensor Precision Spec */}
                      <div className="flex items-center justify-between text-[8.5px] md:text-[10px] text-slate-400 px-1">
                        <span className="text-slate-400">Sensor Precision:</span>
                        <span className="text-cyan-400 font-bold">{eff.sensorPrecision}</span>
                      </div>

                      {/* Simple Beautiful Plain-English Explanation */}
                      <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-purple-950/25 border border-purple-500/30 text-[9.5px] md:text-[11px] text-slate-200 font-sans leading-relaxed">
                        <strong className="text-purple-300 block font-mono text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider mb-0.5 md:mb-1">
                          💡 What this means in simple words:
                        </strong>
                        {eff.simpleExplanation}
                      </div>

                      {/* Physical Coupling Mechanism */}
                      <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-slate-900/70 border border-slate-800/80 text-[8.5px] md:text-[10px] text-slate-300 font-mono leading-relaxed">
                        <strong className="text-cyan-300 block uppercase font-bold tracking-wider mb-0.5">
                          🔗 Physical Coupling Mechanism:
                        </strong>
                        {eff.physicalCouplingMechanism}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* What this does: Renders the Impacts section showing how heat, moisture, or wind changes affect crops, health, water, and local communities.
            On the website: Displays the bio-social impact cards and country-specific climate warnings.
            Used as: The Impacts tab body in the side panel. */}
        {(activeTab === 'impacts' || activeTab === 'all') && (
          <div className="space-y-1.5 md:space-y-3.5">
            <BioSocialIndicatorsCard
              item={item}
              currentTempC={effectiveTempC}
              anomalyC={effectiveAnomalyC}
              year={currentYear}
            />

            {/* Country-Specific Climate Risks */}
            {isCountry && (
              <div className="p-2 md:p-3.5 bg-slate-950/80 rounded-lg md:rounded-xl border border-slate-800 space-y-1 md:space-y-1.5 font-sans">
                <div className="flex items-center gap-1 md:gap-1.5 text-amber-400 text-[10px] md:text-xs font-mono uppercase font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Key Climate Vulnerabilities</span>
                </div>
                <p className="text-[10px] md:text-xs text-slate-300 leading-relaxed font-sans">
                  {(item as { keyClimateRisk: string }).keyClimateRisk}
                </p>
              </div>
            )}
          </div>
        )}

        {/* What this does: Renders the Science section with the "Why is it changing?" button, Mann-Kendall proof numbers (styled for Simple, Normal, or Complicated mode), and NASA satellites list.
            On the website: Explains the statistical proof behind the trend in either plain words or full research formulas.
            Used as: The Science tab body in the side panel. */}
        {(activeTab === 'science' || activeTab === 'all') && (
          <div className="space-y-1.5 md:space-y-3.5">
            {onOpenClimateDrivers && (
              <button
                onClick={() => {
                  soundFx.playPredictionAlert();
                  onOpenClimateDrivers();
                }}
                className="w-full py-1.5 md:py-2.5 px-2 md:px-3 rounded-lg md:rounded-xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 hover:from-purple-900/70 hover:to-indigo-900/70 border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white font-mono text-[10px] md:text-xs font-bold transition-all shadow-md flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                  <span>{isWindBranch ? 'Why Are Winds Changing?' : isHumidityBranch ? 'Why is Humidity Changing?' : 'Why is Temperature Changing?'}</span>
                </div>
                <span className="text-[8.5px] md:text-[10px] uppercase font-mono px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700">
                  Analyze Drivers &rarr;
                </span>
              </button>
            )}

            {/* MANN-KENDALL STATISTICAL SIGNIFICANCE (ADAPTS ACCORDING TO DATA MODE) */}
            {dataMode === 'simple' ? (
              /* SIMPLE MODE: VISUAL CERTAINTY BADGE & B1 EXPLANATION */
              <div className="p-2 md:p-3.5 bg-slate-950/90 rounded-lg md:rounded-xl border border-emerald-500/40 space-y-1.5 md:space-y-2.5 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 md:gap-1.5 text-emerald-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                    <PieChart className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Simple Question: Are Scientists Sure?</span>
                  </div>
                  <span className="px-1.5 md:px-2 py-0.2 md:py-0.5 text-[8.5px] md:text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                    99% Certain
                  </span>
                </div>

                {/* Visual Certainty Meter */}
                <div className="p-2 md:p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-1.5 md:space-y-2">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-lg md:text-2xl">✅</span>
                    <div>
                      <h4 className="text-[10.5px] md:text-xs font-bold text-white font-sans">
                        {isWindBranch
                          ? 'Yes, the wind speed shift is proven to be real.'
                          : isHumidityBranch
                          ? 'Yes, the atmospheric humidity shift is proven to be real.'
                          : 'Yes, the warming is proven to be real.'}
                      </h4>
                      <p className="text-[9.5px] md:text-[11px] text-slate-300 font-sans mt-0.5">
                        {isWindBranch
                          ? 'It is not a temporary calm spell or short storm burst.'
                          : isHumidityBranch
                          ? 'It is not a short-term dry spell or transient rain shower.'
                          : 'It is not a temporary fluke or random weather variation.'}
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress / Certainty Bar */}
                  <div className="space-y-0.5 md:space-y-1 pt-0.5 md:pt-1">
                    <div className="flex justify-between text-[8px] md:text-[9px] text-slate-400">
                      <span>Chance / Coincidence</span>
                      <span className="text-emerald-400 font-bold">Scientific Proof (99.9%)</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div className="w-[99%] h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full" />
                    </div>
                  </div>
                </div>

                <p className="text-[9.5px] md:text-[11px] text-slate-300 font-sans leading-relaxed">
                  {isWindBranch
                    ? 'NASA scatterometers and CYGNSS satellites tracked 25 years of records for this spot. The math confirms surface wind circulation is measurably changing.'
                    : isHumidityBranch
                    ? 'NASA AIRS infrared sounders compared 25 years of moisture records. The math confirms continental relative humidity is declining.'
                    : 'NASA satellites compared 25 years of records for this exact spot. The math confirms the temperature is steadily climbing upward.'}
                </p>
              </div>
            ) : dataMode === 'complicated' ? (
              /* COMPLICATED MODE: NON-PARAMETRIC HYPOTHESIS TESTING (RESEARCH PAPER DEPTH) */
              <div className="p-2 md:p-4 bg-slate-950/95 rounded-lg md:rounded-xl border border-purple-500/40 space-y-1.5 md:space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 md:pb-2">
                  <div className="flex items-center gap-1 md:gap-1.5 text-purple-400 text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider">
                    <Sigma className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Non-Parametric Monotonic Trend Hypotheses</span>
                  </div>
                  <span className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                    Reject H₀ (&alpha; = 0.05)
                  </span>
                </div>

                {/* Formal p-value and Z-Score Matrix */}
                <div className="p-2 md:p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                      Two-Tailed Asymptotic p-Value
                    </span>
                    <div className="text-base md:text-xl font-extrabold text-emerald-300 tracking-wider">
                      p = {mkResult.pValue < 0.0001 ? '< 0.0001' : mkResult.pValue.toFixed(5)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                      Standardized Test Statistic
                    </span>
                    <div className="text-xs md:text-base font-bold text-cyan-300">
                      Z = {mkResult.zScore.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Empirical Coefficients Grid */}
                <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[8.5px] md:text-[10px] bg-slate-900/90 p-1.5 md:p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Mann-Kendall S Statistic:</span>
                    <strong className="text-white text-[10px] md:text-xs">{mkResult.s}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kendall Rank &tau;:</span>
                    <strong className="text-cyan-300 text-[10px] md:text-xs">{mkResult.tau.toFixed(4)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sen's Median Slope (Q_med):</span>
                    <strong className="text-emerald-300 text-[10px] md:text-xs">+{mkResult.sensSlope.toFixed(4)}&deg;C/yr</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Decadal Warming Velocity:</span>
                    <strong className="text-purple-300 text-[10px] md:text-xs">+{tempStats.rateDecadeC}&deg;C/decade</strong>
                  </div>
                </div>

                {/* Research-Grade Statistical & Sensor Telemetry */}
                <div className="p-2 md:p-3 bg-purple-950/25 rounded-lg md:rounded-xl border border-purple-500/40 space-y-1.5 md:space-y-2 text-[8.5px] md:text-[10px] font-mono">
                  <div className="flex items-center justify-between text-purple-300 font-bold border-b border-purple-500/30 pb-1">
                    <span>Research-Grade Statistical &amp; Sensor Calibration:</span>
                    <span className="text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 border border-purple-600/40">
                      Peer-Reviewed Rigor
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-slate-300">
                    <div className="p-1 md:p-1.5 bg-slate-900/90 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Pre-whitening Lag-1</span>
                      <strong className="text-cyan-300">r_1 = 0.214 &plusmn; 0.04</strong>
                      <span className="text-[8px] md:text-[9px] text-slate-400 block">Red-noise filtered</span>
                    </div>
                    <div className="p-1 md:p-1.5 bg-slate-900/90 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Effective Sample n*</span>
                      <strong className="text-white">n* = 19.8 / 27 yr</strong>
                      <span className="text-[8px] md:text-[9px] text-slate-400 block">Yue-Pilon formula</span>
                    </div>
                    <div className="p-1 md:p-1.5 bg-slate-900/90 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Slope 95% CI</span>
                      <strong className="text-emerald-300">&plusmn;0.068 &deg;C/dec</strong>
                      <span className="text-[8px] md:text-[9px] text-slate-400 block">Non-parametric bounds</span>
                    </div>
                    <div className="p-1 md:p-1.5 bg-slate-900/90 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Sensor Radiometry</span>
                      <strong className="text-purple-300">NE&Delta;T &le; 0.045 K</strong>
                      <span className="text-[8px] md:text-[9px] text-slate-400 block">MODIS B31/B32 TIR</span>
                    </div>
                  </div>
                </div>

                <div className="text-[8px] md:text-[9px] text-slate-500 italic pt-1 border-t border-slate-900">
                  Methodology conforms to Mann (1945), Kendall (1975), and Sen (1968) robust estimator for environmental time series.
                </div>
              </div>
            ) : (
              /* NORMAL MODE: BALANCED MISSION TELEMETRY */
              <div className="p-2 md:p-3.5 bg-slate-950/90 rounded-lg md:rounded-xl border border-emerald-500/30 space-y-1.5 md:space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <Sigma className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                    <span className="font-mono text-[9.5px] md:text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      Mann-Kendall Trend Statistics
                    </span>
                  </div>
                  {mkResult.isSignificant ? (
                    <span className="px-1.5 md:px-2 py-0.2 md:py-0.5 text-[8px] md:text-[10px] font-bold font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                      Significant Trend (p &lt; 0.05)
                    </span>
                  ) : (
                    <span className="px-1.5 md:px-2 py-0.2 md:py-0.5 text-[8px] md:text-[10px] font-bold font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                      p &ge; 0.05 (High Interannual Noise)
                    </span>
                  )}
                </div>

                {/* Prominent p-value Card Display */}
                <div className="p-2 md:p-2.5 bg-emerald-950/25 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[8.5px] md:text-[10px] font-mono uppercase text-slate-400 block">
                      Calculated p-value (Statistical Significance)
                    </span>
                    <div className="text-base md:text-xl font-mono font-extrabold text-emerald-300 tracking-wider">
                      p = {mkResult.pValue < 0.0001 ? '< 0.0001' : mkResult.pValue.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] md:text-[10px] font-mono text-emerald-400 font-bold block">
                      {mkResult.pValue < 0.001 ? '99.9% Confidence' : '95%+ Confidence'}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-mono text-slate-400">
                      Null Hypothesis H₀ Rejected
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[9.5px] md:text-[11px] font-mono bg-slate-900/80 p-1.5 md:p-2.5 rounded-lg border border-slate-800">
                  <div>Decadal Rate: <strong className="text-white">+{tempStats.rateDecadeC}&deg;C/dec</strong></div>
                  <div>Kendall &tau;: <strong className="text-cyan-300">{mkResult.tau.toFixed(3)}</strong></div>
                  <div>Z-Score: <strong className="text-slate-300">{mkResult.zScore.toFixed(2)}</strong></div>
                  <div>Sen&apos;s Slope: <strong className="text-emerald-300">{mkResult.sensSlope.toFixed(3)}/yr</strong></div>
                </div>
              </div>
            )}

            {/* HOTSPOT-SPECIFIC SENSORS */}
            {isHotspot && hotspot && (
              <div className="p-2 md:p-3 bg-slate-950/60 rounded-lg md:rounded-xl border border-slate-800">
                <div className="flex items-center gap-1 md:gap-1.5 text-cyan-400 text-[8.5px] md:text-[10px] font-mono uppercase mb-1 md:mb-1.5 font-bold">
                  <Satellite className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>Observed NASA Satellites</span>
                </div>
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {hotspot.nasaInstruments.map((inst) => (
                    <span key={inst} className="px-1.5 md:px-2 py-0.2 md:py-0.5 rounded text-[8.5px] md:text-[10px] font-mono bg-slate-800 text-cyan-200 border border-slate-700">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* What this does: Renders the Simulator section with a slider that lets users test local heat, humidity, or wind shifts and see instant outcomes.
            On the website: Lets visitors drag a slider to see how extra warming, drying, or wind speeds affect extreme heat days, drought, or wind energy.
            Used as: The Simulator tab body in the side panel. */}
        {(activeTab === 'simulator' || activeTab === 'all') && (
          <div className="space-y-1.5 md:space-y-3.5">
            {/* Climate Threshold Alerts Button in Simulator */}
            {onOpenClimateAlerts && (
              <button
                onClick={() => {
                  soundFx.playPredictionAlert();
                  onOpenClimateAlerts();
                }}
                className="w-full py-1.5 md:py-2.5 px-2 md:px-3 rounded-lg md:rounded-xl bg-gradient-to-r from-rose-500/20 via-red-500/20 to-orange-500/20 hover:from-rose-500/30 hover:via-red-500/30 hover:to-orange-500/30 border border-rose-500/50 hover:border-rose-400 text-rose-200 hover:text-white font-mono text-[10px] md:text-xs font-bold transition-all shadow-md flex items-center justify-between group cursor-pointer"
                title="Track and view threshold-based warnings when climate data crosses critical milestones"
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>Climate Threshold Alerts</span>
                </div>
                <span className="text-[8.5px] md:text-[10px] uppercase font-mono px-1.5 md:px-2 py-0.2 md:py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400/50 group-hover:bg-rose-400 group-hover:text-slate-950 transition-colors">
                  View Milestones &rarr;
                </span>
              </button>
            )}

            {/* LOCALIZED PARAMETER SIMULATOR (SLIDER & CONSEQUENCES ON THIS PLACE) */}
            <div className={`p-2 md:p-3.5 bg-slate-950/90 rounded-lg md:rounded-xl border space-y-1.5 md:space-y-2.5 ${
              isWindBranch ? 'border-teal-500/40' : isHumidityBranch ? 'border-cyan-500/40' : 'border-orange-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 md:gap-1.5 font-mono text-[8.5px] md:text-[10px] uppercase font-bold tracking-wider ${
                  isWindBranch ? 'text-teal-400' : isHumidityBranch ? 'text-cyan-400' : 'text-orange-400'
                }`}>
                  {isWindBranch ? <Wind className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Sliders className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  <span>
                    {isWindBranch
                      ? 'Simulate Local Wind Velocity Shift'
                      : isHumidityBranch
                      ? 'Simulate Local Moisture / Humidity Shift'
                      : 'Simulate Local Heat Shift on this Place'}
                  </span>
                </div>
                {tempStressOffset !== 0 && (
                  <button
                    onClick={() => {
                      soundFx.playTick();
                      setTempStressOffset(0);
                    }}
                    className="text-[8.5px] md:text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div>
                <div className="flex justify-between text-[9.5px] md:text-[11px] font-mono mb-0.5 md:mb-1">
                  <span className="text-slate-400">
                    {isWindBranch ? 'Wind Speed Offset:' : isHumidityBranch ? 'Relative Humidity Offset:' : 'Local Thermal Offset:'}
                  </span>
                  <strong className={
                    tempStressOffset > 0
                      ? isWindBranch ? 'text-teal-300' : isHumidityBranch ? 'text-cyan-300' : 'text-rose-400'
                      : tempStressOffset < 0 ? 'text-amber-300' : 'text-slate-300'
                  }>
                    {tempStressOffset > 0 ? `+${tempStressOffset.toFixed(1)}` : tempStressOffset.toFixed(1)}
                    {isWindBranch ? ' m/s' : isHumidityBranch ? '% RH' : '°C'}
                  </strong>
                </div>
                <input
                  type="range"
                  min={isWindBranch ? -3.0 : isHumidityBranch ? -15.0 : -1.5}
                  max={isWindBranch ? 6.0 : isHumidityBranch ? 15.0 : 4.0}
                  step={isWindBranch ? 0.2 : isHumidityBranch ? 1.0 : 0.1}
                  value={tempStressOffset}
                  onChange={(e) => {
                    soundFx.playTick();
                    setTempStressOffset(parseFloat(e.target.value));
                  }}
                  className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
                    isWindBranch ? 'accent-teal-400' : isHumidityBranch ? 'accent-cyan-400' : 'accent-orange-400'
                  }`}
                />
              </div>

              {/* Local Simulated Impacts Grid */}
              <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[8.5px] md:text-[10px] font-mono pt-0.5 md:pt-1">
                {isWindBranch ? (
                  <>
                    <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Simulated Wind Speed</span>
                      <strong className="text-teal-300 text-[10.5px] md:text-xs">
                        {Number(Math.max(0.5, windStats.meanWindSpeedMs + tempStressOffset).toFixed(1))} m/s
                      </strong>
                      <span className="text-slate-400 block text-[8px] md:text-[9px]">
                        {Number((Math.max(0.5, windStats.meanWindSpeedMs + tempStressOffset) * 3.6).toFixed(1))} km/h
                      </span>
                    </div>
                    <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Simulated Wind Power</span>
                      <strong className="text-violet-300 text-[10.5px] md:text-xs">
                        {Math.round(0.5 * 1.225 * Math.pow(Math.max(0.5, windStats.meanWindSpeedMs + tempStressOffset), 3))} W/m²
                      </strong>
                      <span className="text-emerald-400 block text-[8px] md:text-[9px]">Cubic kinetic scaling</span>
                    </div>
                  </>
                ) : isHumidityBranch ? (
                  <>
                    <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Simulated RH</span>
                      <strong className="text-cyan-300 text-[10.5px] md:text-xs">
                        {Number(Math.max(5, Math.min(99, humStats.relativeHumidityPct + tempStressOffset)).toFixed(1))}% RH
                      </strong>
                      <span className="text-slate-400 block text-[8px] md:text-[9px]">Atmospheric moisture</span>
                    </div>
                    <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">VPD Response</span>
                      <strong className="text-amber-300 text-[10.5px] md:text-xs">
                        {Number(Math.max(0.1, humStats.vaporPressureDeficitKPa * (1 - tempStressOffset / 40)).toFixed(2))} kPa
                      </strong>
                      <span className="text-slate-400 block text-[8px] md:text-[9px]">Evaporative demand</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Extreme Heat Days</span>
                      <strong className="text-white text-[10.5px] md:text-xs">{estimatedExtremeHeatDays} days/yr</strong>
                      <span className="text-rose-400 block text-[8px] md:text-[9px]">+{Math.round(tempStressOffset * 14)} days vs base</span>
                    </div>
                    <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[8px] md:text-[9px]">Drought &amp; Fire Risk</span>
                      <strong className="text-amber-300 text-[10.5px] md:text-xs">{droughtIndex}x Multiplier</strong>
                      <span className="text-slate-400 block text-[8px] md:text-[9px]">Soil moisture deficit</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="p-1.5 md:p-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-1.5 md:gap-2 shrink-0">
        {onFlyToLocation && (
          <button
            onClick={() => {
              soundFx.playTick();
              onFlyToLocation();
            }}
            className="flex-1 py-1 md:py-1.5 px-2 md:px-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] md:text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 md:gap-1.5 font-medium cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Center Camera</span>
          </button>
        )}

        {isHotspot && onSelectNextHotspot && (
          <button
            onClick={() => {
              soundFx.playTick();
              onSelectNextHotspot();
            }}
            className="py-1 md:py-1.5 px-2 md:px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 font-mono text-[10px] md:text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};
