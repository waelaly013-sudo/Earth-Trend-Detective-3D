/**
 * NASA Earth Trend Detective - Visual Climate Simulator (Farm & Polar Cryosphere)
 * Dual interactive eco-simulation sandbox:
 * 1. Temperate Agricultural Farm: High-accuracy physiological plant growth,
 *    VPD transpiration, GDD, stem elongation, and crop phenology stages.
 * 2. Polar Cryosphere Station: Glacial ice shelf calving, albedo feedback,
 *    katabatic blizzards, permafrost thaw methane, and arctic marine wildlife.
 *
 * Fully reactive on any user adjustment, with real-time AI predictions from
 * Gemini 3.8 Flash and procedural environmental sound synthesis.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Sparkles,
  Thermometer,
  Droplets,
  Wind,
  Flame,
  Sun,
  CloudRain,
  Snowflake,
  ShieldAlert,
  Sprout,
  Activity,
  RotateCcw,
  Zap,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  Eye,
  Camera,
  Trees,
  Mountain,
  Compass,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';

// What this does: Lists the two virtual world modes the simulator can display (Farm or Polar).
// On the website: Switches the entire scene, sliders, and AI report between a crop farm and a melting glacier.
// Used as: A TypeScript union type for the environment state.
export type SimulatorEnvironment = 'farm' | 'polar';

// What this does: Lists the four camera/sensor visual filters users can click above the simulation picture.
// On the website: Changes how the sky and canvas look (Daylight, Thermal IR, VPD Vapor, or Night).
// Used as: A TypeScript union type for the canvas viewing mode.
export type ViewMode = 'natural' | 'thermal' | 'moisture' | 'night';

// What this does: Defines the inputs passed into the Visual Climate Simulator popup.
// On the website: Opens the simulator pre-loaded with either Farm or Polar mode and optional starting weather.
// Used as: The TypeScript props contract for VisualFarmSimulatorModal.
export interface VisualFarmSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEnvironment?: SimulatorEnvironment;
  initialTemp?: number;
  initialHumidity?: number;
  initialWind?: number;
}

// What this does: Describes the full plant-growth and fire/drought prediction object returned for Farm mode.
// On the website: Powers the Farm condition badge, growth stats, advice list, and AI story card.
// Used as: The TypeScript response interface for farm AI predictions.
export interface FarmPredictionData {
  condition: 'thriving' | 'drought' | 'wildfire' | 'frost' | 'flooded' | 'wind_damage';
  healthScore: number;
  title: string;
  summary: string;
  plainEnglishStory: string;
  vpdKPa: number;
  stomataStatus: string;
  soilCondition: 'fertile_moist' | 'cracked_arid' | 'charred_ash' | 'frozen_permafrost' | 'waterlogged_mud';
  fireRiskLevel: 'none' | 'low' | 'moderate' | 'high' | 'extreme_firestorm';
  cropYieldImpact: string;
  farmerAdvice: string[];
  scientificTelemetry: {
    saturationVaporPressureKPa: number;
    actualVaporPressureKPa: number;
    windPowerDensityWm2: number;
    lodgingRiskPercent: number;
    transpirationStressIndex: number;
    fireSpreadSpeedMMin: number;
    dailyGrowthCm?: number;
    gddDaily?: number;
    plantHeightMultiplier?: number;
    stomatalConductanceMmol?: number;
    canopyTemperatureC?: number;
    biomassYieldPercent?: number;
    phenologyStage?: string;
  };
  visualState: {
    skyTheme: 'clear_sunny' | 'golden_hour' | 'smoky_fire' | 'hazy_arid' | 'stormy_dark' | 'frozen_gray';
    cropColor: string;
    leafWiltDeg: number;
    windDeflectionDeg: number;
    fireIntensity: number;
    particleType: 'pollinators' | 'gentle_dust' | 'embers' | 'flying_debris' | 'rain' | 'snow' | 'none';
    plantHeightMultiplier?: number;
  };
  aiModelUsed: string;
}

// What this does: Describes the full ice, albedo, and permafrost prediction object returned for Polar mode.
// On the website: Powers the Polar condition badge, calving risk, methane flux, and research advice card.
// Used as: The TypeScript response interface for polar AI predictions.
export interface PolarPredictionData {
  condition: 'deep_freeze' | 'stable_ice' | 'ice_calving' | 'blizzard_storm' | 'tundra_thaw' | 'polar_heatwave';
  healthScore: number;
  title: string;
  summary: string;
  plainEnglishStory: string;
  albedo: number;
  windChillC: number;
  meltRateCmMonth: number;
  permafrostThawCm: number;
  methaneFluxMgDay: number;
  seaIceAnomalyPercent: number;
  calvingRiskPercent: number;
  wildlifeStatus: string;
  wildlifeImpact?: string;
  iceState: 'thick_polar_pack' | 'stable_shelf' | 'calving_shatter' | 'slumped_thaw' | 'open_dark_sea';
  skyTheme: 'aurora_borealis' | 'midnight_sun' | 'blizzard_whiteout' | 'arctic_twilight' | 'overcast_drip';
  researchAdvice: string[];
  aiModelUsed: string;
}

// ==========================================
// CONFIGURATIONS FOR FARM & POLAR PLACES
// ==========================================

// What this does: Lists the four crop types users can test in the Farm simulator along with their ideal growing temperatures.
// On the website: Appears as clickable crop buttons (Golden Wheat, Maize, Grapes, Vegetables) in the control panel.
// Used as: Configuration data for crop growth speed and Degree-Day math.
const CROP_OPTIONS = [
  { id: 'Golden Wheat', label: 'Golden Wheat', icon: '🌾', baseT: 0, optT: 22, maxGrowthRateCm: 3.8 },
  { id: 'Maize & Corn', label: 'Field Corn / Maize', icon: '🌽', baseT: 10, optT: 26, maxGrowthRateCm: 5.8 },
  { id: 'Vineyard Grapes', label: 'Vineyard Grapes', icon: '🍇', baseT: 10, optT: 24, maxGrowthRateCm: 2.8 },
  { id: 'Market Garden', label: 'Market Vegetables', icon: '🥬', baseT: 4, optT: 19, maxGrowthRateCm: 4.2 },
];

// What this does: Lists the four polar regions users can study in Polar mode.
// On the website: Appears as clickable biome buttons (Sea Ice, Glacial Shelf, Permafrost, Marine Wildlife).
// Used as: Configuration options passed to the polar prediction engine.
const POLAR_BIOME_OPTIONS = [
  { id: 'arctic-sea-ice', label: 'Arctic Ocean Sea Ice Pack', icon: '🧊', focus: 'Albedo & Ice Thickness' },
  { id: 'antarctic-shelf', label: 'Antarctic Glacial Ice Shelf', icon: '🏔️', focus: 'Calving & Crevasses' },
  { id: 'permafrost-tundra', label: 'Permafrost Tundra & Methane', icon: '🌿', focus: 'Thermokarst Thaw' },
  { id: 'polar-wildlife', label: 'Marine Wildlife Sanctuary', icon: '🦭', focus: 'Seals & Polar Bears' },
];

// What this does: Stores one-click weather presets for Farm mode (like Bumper Growth, Wildfire, Drought, and Frost).
// On the website: Renders the "Interactive Agricultural Presets" buttons below the farm picture.
// Used as: Quick-test presets that jump the weather sliders to dramatic scenarios.
const FARM_PRESETS = [
  {
    name: '🌿 Bumper Peak Growth',
    desc: 'Goldilocks range: 22°C, 65% RH, 3.5 m/s breeze fosters +4.8 cm/day growth',
    temp: 22,
    hum: 65,
    wind: 3.5,
    tag: 'Bumper Crop',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    name: '🔥 Catastrophic Wildfire',
    desc: 'Red Flag inferno: 46°C, 10% RH, 22 m/s dry gales ignite standing stalks',
    temp: 46,
    hum: 10,
    wind: 22,
    tag: 'Firestorm',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    name: '🏜️ Severe Evaporative Drought',
    desc: 'Desiccating thirst: 39°C, 12% RH, 7 m/s dry air forces stomata closed',
    temp: 39,
    hum: 12,
    wind: 7,
    tag: 'Stunted Wilt',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    name: '❄️ Sub-Zero Polar Frost',
    desc: 'Cellular freeze: -6°C, 42% RH, 12 m/s wind chill halts sap circulation',
    temp: -6,
    hum: 42,
    wind: 12,
    tag: 'Frost Shock',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  {
    name: '🌊 Monsoon Waterlogging',
    desc: 'Saturated roots & mold: 28°C, 98% RH, 15 m/s storm breeds root rot',
    temp: 28,
    hum: 98,
    wind: 15,
    tag: 'Root Hypoxia',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    name: '💨 Violent Windthrow Gale',
    desc: 'Mechanical lodging: 19°C, 70% RH, 34 m/s severe gale bends stalks flat',
    temp: 19,
    hum: 70,
    wind: 34,
    tag: 'Stem Lodging',
    tagColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  },
];

// What this does: Stores one-click extreme weather presets for Polar mode (like Deep Glaciation, Ice Calving, and Arctic Heatwave).
// On the website: Renders the "Interactive Cryospheric Presets" buttons below the polar picture.
// Used as: Quick-test presets for exploring polar climate tipping points.
const POLAR_PRESETS = [
  {
    name: '🧊 Deep Polar Glaciation',
    desc: 'Pristine cryosphere: -28°C, 65% RH, 4 m/s wind. High albedo (0.85)',
    temp: -28,
    hum: 65,
    wind: 4,
    tag: 'High Albedo',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    name: '💥 Catastrophic Ice Calving',
    desc: 'Glacial shatter: +4°C warmth, 75% RH, 12 m/s winds crash icebergs into sea',
    temp: 4,
    hum: 75,
    wind: 12,
    tag: 'Calving Surge',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    name: '🌪️ Howling Katabatic Blizzard',
    desc: 'Whiteout gale: -16°C, 92% RH, 38 m/s wind chill drops to -34°C',
    temp: -16,
    hum: 92,
    wind: 38,
    tag: 'Whiteout',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    name: '🔥 Severe Arctic Heatwave',
    desc: 'Albedo flip: +11°C, 45% RH, 8 m/s. Dark ocean absorbs 90%+ solar heat',
    temp: 11,
    hum: 45,
    wind: 8,
    tag: 'Albedo Collapse',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    name: '🌿 Permafrost Methane Thaw',
    desc: 'Thermokarst sinkholes: +6°C, 80% RH. Microbial decay vents methane gas',
    temp: 6,
    hum: 80,
    wind: 5,
    tag: 'CH4 Venting',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
];

// What this does: Creates and controls the interactive Visual Farm & Polar Cryosphere simulator popup.
// On the website: Displays a live animated SVG landscape that reacts to temperature, humidity, wind, and AI predictions.
// Used as: The sandbox climate simulator modal opened from the Explore / Visual Places menu.
export const VisualFarmSimulatorModal: React.FC<VisualFarmSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialEnvironment = 'farm',
  initialTemp,
  initialHumidity,
  initialWind,
}) => {
  // Active Environment Switcher: 'farm' vs 'polar'
  const [environment, setEnvironment] = useState<SimulatorEnvironment>(initialEnvironment);

  // What this does: Resets the simulator to the right starting mode and default weather whenever the modal opens.
  // On the website: Opens straight to Farm (~22°C) or Polar (-18°C) depending on which button the user clicked.
  // Used as: An open-state initialization effect.
  useEffect(() => {
    if (isOpen) {
      setEnvironment(initialEnvironment);
      if (initialEnvironment === 'polar') {
        setTemperature(initialTemp !== undefined ? initialTemp : -18);
        setHumidity(initialHumidity !== undefined ? initialHumidity : 65);
        setWindSpeed(initialWind !== undefined ? initialWind : 5.5);
      } else {
        setTemperature(initialTemp !== undefined ? initialTemp : 22);
        setHumidity(initialHumidity !== undefined ? initialHumidity : 65);
        setWindSpeed(initialWind !== undefined ? initialWind : 3.5);
      }
    }
  }, [isOpen, initialEnvironment, initialTemp, initialHumidity, initialWind]);

  // Shared Weather Controls
  const [temperature, setTemperature] = useState<number>(initialTemp ?? 22);
  const [humidity, setHumidity] = useState<number>(initialHumidity ?? 65);
  const [windSpeed, setWindSpeed] = useState<number>(initialWind ?? 3.5);
  const [viewMode, setViewMode] = useState<ViewMode>('natural');

  // Farm Specific State
  const [cropType, setCropType] = useState<string>('Golden Wheat');
  const [shelterbeltActive, setShelterbeltActive] = useState<boolean>(false);
  const [irrigationActive, setIrrigationActive] = useState<boolean>(false);
  const [growthBoosterActive, setGrowthBoosterActive] = useState<boolean>(false);
  const [manualGrowthStage, setManualGrowthStage] = useState<number>(3); // 1: Seedling, 2: Vegetative, 3: Grain Fill, 4: Bumper Harvest
  const [farmPrediction, setFarmPrediction] = useState<FarmPredictionData | null>(null);

  // Polar Specific State
  const [polarBiome, setPolarBiome] = useState<string>('arctic-sea-ice');
  const [albedoBoosterActive, setAlbedoBoosterActive] = useState<boolean>(false);
  const [thermosyphonActive, setThermosyphonActive] = useState<boolean>(false);
  const [polarPrediction, setPolarPrediction] = useState<PolarPredictionData | null>(null);

  // General Controls
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Animation frame loop
  const [animTime, setAnimTime] = useState<number>(0);
  const [windmillAngle, setWindmillAngle] = useState<number>(0);
  const requestRef = useRef<number>(0);
  const lastSoundTriggerRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const clientPredictionCache = useRef<Map<string, any>>(new Map());

  // Effective wind calculation
  const effectiveWind = environment === 'farm' && shelterbeltActive ? Math.max(0.5, windSpeed * 0.48) : windSpeed;

  // What this does: Runs a smooth browser animation loop (~60fps) that keeps waves, wind blades, snow, and animals moving.
  // On the website: Powers the continuous motion of the farm windmill, blowing wheat, polar bears, seals, and calving icebergs.
  // Used as: A requestAnimationFrame loop driving animTime and windmillAngle.
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const deltaSec = (time - lastTime) / 1000;
      lastTime = time;

      const activeWind = environment === 'polar' ? windSpeed : effectiveWind;
      setAnimTime((prev) => prev + deltaSec * 1000);
      setWindmillAngle((prev) => (prev + Math.max(0.8, activeWind) * 26 * deltaSec) % 360);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [effectiveWind, windSpeed, environment]);

  // What this does: Calculates crop physics locally (VPD, growing degree days, plant height, wilting, and fire risk) right away.
  // On the website: Makes the farm drawing and stats react instantly to slider drags without waiting for the AI server.
  // Used as: A memoized real-time farm science model and fallback.
  const localFarmTelemetry = useMemo(() => {
    const T = temperature;
    const RH = humidity;
    const W = effectiveWind;

    const es = 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
    const ea = es * (RH / 100);
    const vpd = Math.max(0, es - ea);
    const wpd = Math.round(0.5 * 1.225 * Math.pow(Math.max(0.2, W), 3));

    let condition: 'thriving' | 'drought' | 'wildfire' | 'frost' | 'flooded' | 'wind_damage';
    if (T <= 0) {
      condition = 'frost';
    } else if ((T >= 35 && RH <= 25 && W >= 8) || (T >= 42 && RH <= 30)) {
      condition = 'wildfire';
    } else if ((vpd >= 2.2 && T >= 28) || (RH <= 20 && T >= 26)) {
      condition = 'drought';
    } else if (W >= 22) {
      condition = 'wind_damage';
    } else if (RH >= 90 && T >= 22) {
      condition = 'flooded';
    } else {
      condition = 'thriving';
    }

    const cropObj = CROP_OPTIONS.find((c) => c.id === cropType) || CROP_OPTIONS[0];
    const gdd = Math.max(0, Number((T - cropObj.baseT).toFixed(1)));

    // Physiological Growth Rate & Visual Plant Elongation
    let growthRateCm = 0;
    let plantScale = 1.0;
    let phenology = 'Vegetative Elongation';

    if (condition === 'thriving') {
      const tempFactor = 1.0 - Math.pow((T - cropObj.optT) / 20, 2);
      const vpdFactor = Math.max(0.3, 1.0 - Math.abs(vpd - 1.0) * 0.4);
      growthRateCm = Number((cropObj.maxGrowthRateCm * Math.max(0.3, tempFactor * vpdFactor)).toFixed(2));
      plantScale = Number((0.95 + (growthRateCm / cropObj.maxGrowthRateCm) * 0.35).toFixed(2));
      phenology = T >= 23 ? 'Vigorous Anthesis & Grain Filling' : 'Rapid Leaf & Stalk Elongation';
    } else if (condition === 'drought') {
      growthRateCm = 0.2;
      plantScale = 0.75;
      phenology = 'Stomata Clamped / Stunted Growth';
    } else if (condition === 'frost') {
      growthRateCm = 0.0;
      plantScale = 0.65;
      phenology = 'Cryo-Dormancy / Frozen Tissues';
    } else if (condition === 'wildfire') {
      growthRateCm = -0.5;
      plantScale = 0.45;
      phenology = 'Scorched Charcoal Desiccation';
    } else if (condition === 'flooded') {
      growthRateCm = 0.5;
      plantScale = 0.88;
      phenology = 'Root Hypoxia & Chlorosis';
    } else {
      growthRateCm = 0.4;
      plantScale = 0.7;
      phenology = 'Lodged Stalks / Mechanical Stress';
    }

    // Manual growth stage multiplier (1: 0.55x, 2: 0.80x, 3: 1.05x, 4: 1.30x)
    const stageMultiplier = 0.55 + (manualGrowthStage - 1) * 0.25;
    const finalVisualPlantHeight = Number((plantScale * stageMultiplier).toFixed(2));

    const windDeflection = Math.min(58, Math.round(W * 1.45));
    const leafWilt = condition === 'wildfire' ? 55 : condition === 'drought' ? Math.min(52, Math.round(vpd * 14)) : condition === 'frost' ? 32 : 0;
    const fireIntensity = condition === 'wildfire' ? Math.min(1.0, 0.4 + (T - 35) * 0.03 + (W / 40) * 0.3) : 0;

    return {
      es,
      ea,
      vpd,
      wpd,
      condition,
      gdd,
      growthRateCm,
      finalVisualPlantHeight,
      phenology,
      windDeflection,
      leafWilt,
      fireIntensity,
      health: condition === 'thriving' ? 98 : condition === 'wildfire' ? 12 : condition === 'frost' ? 30 : condition === 'drought' ? 42 : 55,
    };
  }, [temperature, humidity, effectiveWind, cropType, manualGrowthStage]);

  // What this does: Calculates polar ice and climate math locally (wind chill, albedo reflection, melt rate, and calving risk).
  // On the website: Updates the glacier cliff, rising ocean water, and Arctic stats the moment sliders move.
  // Used as: A memoized real-time polar science model and offline fallback.
  const localPolarTelemetry = useMemo(() => {
    const T = temperature;
    const RH = humidity;
    const W = windSpeed;

    // Katabatic wind chill equivalent temperature
    const windChillC = W > 1.3
      ? Number((13.12 + 0.6215 * T - 11.37 * Math.pow(W, 0.16) + 0.3965 * T * Math.pow(W, 0.16)).toFixed(1))
      : T;

    // Albedo reflectivity
    let albedo = 0.85;
    if (albedoBoosterActive) {
      albedo = Math.min(0.92, albedo + 0.08);
    }
    if (T > 0) {
      albedo = Number(Math.max(0.08, 0.65 - T * 0.04 - (W / 40) * 0.1 + (albedoBoosterActive ? 0.08 : 0)).toFixed(2));
    } else if (T > -8) {
      albedo = Number((0.80 + T * 0.015 + (albedoBoosterActive ? 0.05 : 0)).toFixed(2));
    }

    // Basal melt rate & permafrost thaw
    const meltRateCmMonth = T > 0 ? Number((T * 12.5 + (W / 10) * 3.5).toFixed(1)) : 0;
    let permafrostThawCm = T > 0 ? Math.min(220, Math.round(18 + T * 14.5)) : Math.max(5, Math.round(15 + T * 0.4));
    if (thermosyphonActive) {
      permafrostThawCm = Math.max(10, Math.round(permafrostThawCm * 0.4));
    }

    const methaneFluxMgDay = T > 2 && !thermosyphonActive ? Math.min(250, Math.round(Math.pow(T - 1, 1.8) * 8.5)) : 0;
    const calvingRiskPercent = T > 1 ? Math.min(100, Math.round(Math.pow(T, 1.6) * 12 + W * 0.8)) : T > -3 && W > 25 ? Math.min(60, Math.round(W * 1.2)) : 5;

    let condition: 'deep_freeze' | 'stable_ice' | 'ice_calving' | 'blizzard_storm' | 'tundra_thaw' | 'polar_heatwave';
    if (W >= 24) {
      condition = 'blizzard_storm';
    } else if (T >= 6) {
      condition = 'polar_heatwave';
    } else if (T > 0 && calvingRiskPercent >= 45) {
      condition = 'ice_calving';
    } else if (T > 0 && polarBiome === 'permafrost-tundra') {
      condition = 'tundra_thaw';
    } else if (T <= -20) {
      condition = 'deep_freeze';
    } else {
      condition = 'stable_ice';
    }

    let health = 95;
    if (condition === 'polar_heatwave') health = Math.max(8, 25 - Math.round(T - 6) * 3);
    else if (condition === 'ice_calving') health = Math.max(20, 55 - Math.round(calvingRiskPercent * 0.4));
    else if (condition === 'tundra_thaw') health = Math.max(25, 60 - Math.round(T * 4));
    else if (condition === 'blizzard_storm') health = Math.max(30, 70 - Math.round(W * 0.8));

    return {
      windChillC,
      albedo,
      meltRateCmMonth,
      permafrostThawCm,
      methaneFluxMgDay,
      calvingRiskPercent,
      condition,
      health,
    };
  }, [temperature, humidity, windSpeed, polarBiome, albedoBoosterActive, thermosyphonActive]);

  // What this does: Plays matching nature or hazard sound effects (fire crackle, frost chime, rain, wind, or calving ice).
  // On the website: Gives audio feedback when the user drags sliders into extreme weather conditions (unless muted).
  // Used as: A throttled sound-effect trigger React effect.
  useEffect(() => {
    if (soundMuted || !isOpen) return;
    const now = Date.now();
    if (now - lastSoundTriggerRef.current < 450) return;
    lastSoundTriggerRef.current = now;

    if (environment === 'farm') {
      if (localFarmTelemetry.condition === 'wildfire') soundFx.playFireCrackle();
      else if (localFarmTelemetry.condition === 'frost') soundFx.playFrostChime();
      else if (localFarmTelemetry.condition === 'flooded') soundFx.playRainDrops();
      else if (effectiveWind >= 15) soundFx.playWindBreeze(effectiveWind);
      else if (localFarmTelemetry.condition === 'thriving' && Math.random() < 0.25) soundFx.playBirdChirp();
    } else if (environment === 'polar') {
      if (localPolarTelemetry.condition === 'ice_calving') soundFx.playIceCalving();
      else if (localPolarTelemetry.condition === 'blizzard_storm') soundFx.playBlizzardHowl();
      else if (localPolarTelemetry.condition === 'deep_freeze') soundFx.playFrostChime();
      else if (windSpeed >= 12) soundFx.playWindBreeze(windSpeed);
    }
  }, [environment, localFarmTelemetry.condition, localPolarTelemetry.condition, effectiveWind, windSpeed, soundMuted, isOpen]);

  // What this does: Sends the current temperature, humidity, wind, and crop/biome to the Gemini AI server (with local caching).
  // On the website: Populates the plain-English impact story and recommended farmer/researcher protocols card.
  // Used as: The async AI prediction caller with abort and cache protection.
  const executePrediction = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check client memory cache first
    const targetBiome = environment === 'farm' ? cropType : polarBiome;
    const activeWind = environment === 'farm' ? effectiveWind : windSpeed;
    const cacheKey = `${environment}:${Math.round(temperature)}:${Math.round(humidity)}:${Math.round(activeWind * 2) / 2}:${targetBiome}`;
    if (clientPredictionCache.current.has(cacheKey)) {
      const cached = clientPredictionCache.current.get(cacheKey);
      if (environment === 'farm') {
        setFarmPrediction(cached);
      } else {
        setPolarPrediction(cached);
      }
      setIsLoadingAi(false);
      return;
    }

    setIsLoadingAi(true);

    try {
      if (environment === 'farm') {
        const res = await fetch('/api/predict-farm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            temperature,
            humidity,
            windSpeed: effectiveWind,
            cropType,
          }),
        });
        if (!res.ok) throw new Error('Farm Prediction API failed');
        const data: FarmPredictionData = await res.json();
        clientPredictionCache.current.set(cacheKey, data);
        setFarmPrediction(data);
      } else {
        const res = await fetch('/api/predict-polar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            temperature,
            humidity,
            windSpeed,
            biome: polarBiome,
          }),
        });
        if (!res.ok) throw new Error('Polar Prediction API failed');
        const data: PolarPredictionData = await res.json();
        clientPredictionCache.current.set(cacheKey, data);
        setPolarPrediction(data);
      }
    } catch (_err: unknown) {
      // Seamless silent fallback to local high-precision telemetry
    } finally {
      setIsLoadingAi(false);
    }
  }, [environment, temperature, humidity, effectiveWind, windSpeed, cropType, polarBiome]);

  // What this does: Waits 600ms after the user finishes moving a slider before asking the AI server for a new report.
  // On the website: Prevents overwhelming the server while still updating the AI story automatically after slider changes.
  // Used as: A debounced auto-prediction React effect.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      executePrediction();
    }, 600);
    return () => clearTimeout(timer);
  }, [isOpen, environment, temperature, humidity, effectiveWind, windSpeed, cropType, polarBiome, executePrediction]);

  // What this does: Switches the simulator between Farm mode and Polar mode and loads suitable starting weather values.
  // On the website: Runs when clicking the "🌾 Farm" or "❄️ Polar" toggle buttons in the top bar.
  // Used as: The environment-switch click handler.
  const handleSelectEnvironment = (newEnv: SimulatorEnvironment) => {
    if (newEnv === environment) return;
    soundFx.playChime();
    setEnvironment(newEnv);

    if (newEnv === 'polar') {
      setTemperature(-18);
      setHumidity(65);
      setWindSpeed(6);
    } else {
      setTemperature(22);
      setHumidity(65);
      setWindSpeed(3.5);
    }
  };

  // What this does: Sprays cooling mist in Farm mode, dropping air temperature by 2°C and raising humidity by 14%.
  // On the website: Powers the "💦 Irrigate Field" button and animates sprinkler water droplets on the crops.
  // Used as: The farm irrigation intervention handler.
  const handleIrrigate = () => {
    soundFx.playWaterSprinkler();
    setIrrigationActive(true);
    setTemperature((t) => Math.max(-10, Math.round((t - 2.0) * 10) / 10));
    setHumidity((h) => Math.min(100, h + 14));
    setTimeout(() => setIrrigationActive(false), 3200);
  };

  // What this does: Advances the farm crop to the next growth stage (Seedling -> Vegetative -> Grain Fill -> Bumper Harvest).
  // On the website: Powers the "🌿 Feed & Grow Plants" button and visibly grows taller crops on the screen.
  // Used as: The crop growth booster click handler.
  const handleAccelerateGrowth = () => {
    soundFx.playChime();
    setGrowthBoosterActive(true);
    setManualGrowthStage((prev) => (prev < 4 ? prev + 1 : 1));
    setTimeout(() => setGrowthBoosterActive(false), 1800);
  };

  // What this does: Triggers snow/cloud brightening in Polar mode, cooling the scene by 1.5°C and boosting reflectivity.
  // On the website: Powers the "❄️ Boost Albedo" button to slow down glacial melting.
  // Used as: The polar albedo intervention click handler.
  const handleAlbedoSpray = () => {
    soundFx.playFrostChime();
    setAlbedoBoosterActive(true);
    setTemperature((t) => Math.max(-50, Math.round((t - 1.5) * 10) / 10));
    setTimeout(() => setAlbedoBoosterActive(false), 4500);
  };

  // What this does: Turns snowpack & permafrost cooling insulation on or off in Polar mode.
  // On the website: Powers the "❄️ Pack Igloo Snow" button to lower permafrost thaw and methane venting.
  // Used as: The polar insulation toggle handler.
  const handleToggleThermosyphon = () => {
    soundFx.playTick();
    setThermosyphonActive((prev) => !prev);
  };

  if (!isOpen) return null;

  // Farm Computed Visual Values
  const currentFarmCondition = farmPrediction?.condition || localFarmTelemetry.condition;
  const currentFarmHealth = farmPrediction?.healthScore ?? localFarmTelemetry.health;
  const currentVpd = farmPrediction?.vpdKPa ?? Number(localFarmTelemetry.vpd.toFixed(2));
  const currentGrowthRate = farmPrediction?.scientificTelemetry?.dailyGrowthCm ?? localFarmTelemetry.growthRateCm;
  const visualPlantScale = farmPrediction?.scientificTelemetry?.plantHeightMultiplier ?? localFarmTelemetry.finalVisualPlantHeight;

  // Polar Computed Visual Values
  const currentPolarCondition = polarPrediction?.condition || localPolarTelemetry.condition;
  const currentPolarHealth = polarPrediction?.healthScore ?? localPolarTelemetry.health;
  const currentAlbedo = polarPrediction?.albedo ?? localPolarTelemetry.albedo;
  const currentWindChill = polarPrediction?.windChillC ?? localPolarTelemetry.windChillC;
  const currentCalvingRisk = polarPrediction?.calvingRiskPercent ?? localPolarTelemetry.calvingRiskPercent;

  // Real-Time Biophysical Impacts of Temperature, Humidity & Wind in Polar Cryosphere
  const polarWaterRisePx = temperature <= 0 ? 0 : Math.min(36, Math.round((temperature / 15) * 36));
  const polarWaterLevelRiseCm = Number((polarWaterRisePx * 0.45).toFixed(1));
  const polarSeaWaterY = 248 - polarWaterRisePx;
  const polarIceMeltFraction = temperature <= 0 ? 0 : Math.min(1, temperature / 14);
  const polarIceMeltPct = Math.round(polarIceMeltFraction * 100);
  const polarFogOpacity = Math.max(0, Math.min(0.85, (humidity - 45) / 55));
  const polarSublimationVapor = humidity <= 35 ? Math.max(0, (35 - humidity) / 35) : 0;
  const polarWaveAmplitude = Math.min(8, 1 + (windSpeed / 50) * 7);
  const polarWaveChopCount = Math.min(18, Math.floor(windSpeed / 2.8) + 3);
  const polarBlizzardIntensity = Math.min(1, windSpeed / 45);

  // Dynamic Iceberg Calving Animation (Triggered when temperature crosses 0°C melting threshold)
  const isPolarCalving = temperature > 0;
  // Cycle rate scales with temperature: warmer = faster, more frequent detachment events
  const calvingCycleRate = isPolarCalving ? 0.00035 + Math.min(0.00075, (temperature / 15) * 0.00075) : 0;
  const calvingProgress = isPolarCalving ? ((animTime * calvingCycleRate) % 1) : 0;
  const shelfEdgeX = 295 - Math.round(polarIceMeltFraction * 70);

  // Sky Gradients
  let skyThemeClasses = 'from-sky-900 via-sky-800 to-indigo-900';
  if (environment === 'farm') {
    if (viewMode === 'night') skyThemeClasses = 'from-slate-950 via-indigo-950 to-slate-900';
    else if (viewMode === 'thermal') skyThemeClasses = 'from-indigo-950 via-purple-950 to-slate-900';
    else if (viewMode === 'moisture') skyThemeClasses = 'from-cyan-950 via-teal-950 to-slate-900';
    else if (currentFarmCondition === 'wildfire') skyThemeClasses = 'from-red-950 via-orange-950 to-amber-950';
    else if (currentFarmCondition === 'drought') skyThemeClasses = 'from-amber-900/90 via-yellow-950/70 to-stone-900';
    else if (currentFarmCondition === 'frost') skyThemeClasses = 'from-slate-900 via-sky-950 to-slate-950';
    else if (currentFarmCondition === 'flooded' || currentFarmCondition === 'wind_damage') skyThemeClasses = 'from-slate-900 via-stone-900 to-slate-950';
    else skyThemeClasses = 'from-sky-700 via-amber-600/30 to-emerald-900/30';
  } else {
    // Polar Sky
    if (viewMode === 'night' || currentPolarCondition === 'deep_freeze') skyThemeClasses = 'from-slate-950 via-indigo-950 to-emerald-950/50';
    else if (currentPolarCondition === 'blizzard_storm') skyThemeClasses = 'from-slate-800 via-slate-700 to-slate-900';
    else if (currentPolarCondition === 'polar_heatwave') skyThemeClasses = 'from-sky-600 via-cyan-700 to-blue-900';
    else skyThemeClasses = 'from-slate-950 via-sky-950 to-indigo-950';
  }

  // Soil / Terrain colors
  const farmGroundColor =
    currentFarmCondition === 'wildfire' ? '#1c1917' :
    currentFarmCondition === 'drought' ? '#78350f' :
    currentFarmCondition === 'frost' ? '#475569' :
    currentFarmCondition === 'flooded' ? '#3b2818' : '#2e1c0c';

  const cropFill =
    currentFarmCondition === 'wildfire' ? '#44403c' :
    currentFarmCondition === 'drought' ? '#ca8a04' :
    currentFarmCondition === 'frost' ? '#93c5fd' :
    currentFarmCondition === 'thriving' ? '#16a34a' : '#65a30d';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[90dvh] sm:max-h-[96vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-xl sm:rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* ========================================================================= */}
        {/* TOP MODAL HEADER: TITLE & DUAL ENVIRONMENT SWITCHER (FARM VS POLAR)       */}
        {/* ========================================================================= */}
        <div className="px-2.5 sm:px-5 py-2 sm:py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${
              environment === 'farm'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/30'
                : 'bg-gradient-to-br from-sky-400 to-indigo-600 shadow-sky-500/30'
            }`}>
              {environment === 'farm' ? (
                <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
              ) : (
                <Snowflake className="w-4 h-4 sm:w-5 sm:h-5 text-sky-100" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`text-[8.5px] sm:text-[10px] font-mono uppercase tracking-wider sm:tracking-widest font-bold ${
                  environment === 'farm' ? 'text-emerald-400' : 'text-sky-300'
                }`}>
                  {environment === 'farm'
                    ? 'NASA Biophysical Agronomy'
                    : 'NASA Polar Cryosphere'}
                </span>
                <span className="hidden sm:flex text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Real-Time Reactive Sim</span>
                </span>
              </div>
              <h2 className="text-xs sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>
                  {environment === 'farm'
                    ? 'Visual Climate Farm'
                    : 'Visual Polar Cryosphere'}
                </span>
                <span className="text-xs font-mono font-normal text-slate-400 hidden md:inline">
                  {environment === 'farm'
                    ? '— Accurate physiological growth & microclimate feedbacks'
                    : '— Glacial calving, albedo feedback & permafrost thaw'}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Dedicated Environment Switcher: Farm <-> Polar */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-slate-950 border border-slate-700 shadow-inner">
              <button
                onClick={() => handleSelectEnvironment('farm')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  environment === 'farm'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌾 Farm</span>
              </button>
              <button
                onClick={() => handleSelectEnvironment('polar')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  environment === 'polar'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>❄️ Polar</span>
              </button>
            </div>

            {/* Audio Ambient Mute Toggle */}
            <button
              onClick={() => {
                soundFx.playTick();
                setSoundMuted((m) => !m);
              }}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                soundMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
              }`}
              title={soundMuted ? 'Unmute Environmental Soundscape' : 'Mute Soundscape'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                soundFx.playTick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              title="Close Simulator"
              aria-label="Close Simulator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY: SCROLLABLE WITH TOUCH ERGONOMICS                               */}
        {/* ========================================================================= */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-5"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {/* ========================================================================= */}
          {/* LEFT COLUMN: THE INTERACTIVE VISUAL CANVAS (7 COLS)                       */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Top Toolbar: Camera Mode & Context Subtitle */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] uppercase font-bold">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>{environment === 'farm' ? 'Camera Mode:' : 'Cryo Sensor Mode:'}</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'natural', label: environment === 'farm' ? 'Daylight' : 'Natural Ice', icon: Sun },
                    { id: 'thermal', label: 'Thermal IR', icon: Thermometer },
                    { id: 'moisture', label: environment === 'farm' ? 'VPD Vapor' : 'Snow Sat', icon: Droplets },
                    { id: 'night', label: environment === 'farm' ? 'Night / Glow' : 'Aurora Night', icon: Eye },
                  ] as const
                ).map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        soundFx.playTick();
                        setViewMode(mode.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        viewMode === mode.id
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Farm / Polar Canvas Container */}
            <div
              className={`relative w-full h-[290px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-gradient-to-b ${skyThemeClasses} transition-colors duration-700 select-none touch-pan-y`}
              style={{ touchAction: 'pan-y' }}
            >
              {/* Heat Haze Filter for High Temperatures in Farm */}
              <svg className="absolute w-0 h-0" aria-hidden="true">
                <defs>
                  <filter id="simHeatHaze">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.15" numOctaves="2" result="noise">
                      <animate attributeName="baseFrequency" dur="8s" values="0.02 0.15; 0.03 0.25; 0.02 0.15" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>

              {/* Status Badge Overlay */}
              <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-lg flex items-center gap-1.5 ${
                    environment === 'farm'
                      ? currentFarmCondition === 'wildfire'
                        ? 'bg-rose-950/90 text-rose-200 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse'
                        : currentFarmCondition === 'drought'
                        ? 'bg-amber-950/90 text-amber-200 border-amber-500/80'
                        : currentFarmCondition === 'frost'
                        ? 'bg-sky-950/90 text-sky-200 border-sky-400/80'
                        : 'bg-emerald-950/90 text-emerald-200 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : environment === 'polar'
                      ? currentPolarCondition === 'ice_calving'
                        ? 'bg-rose-950/90 text-rose-200 border-rose-500/80 animate-pulse'
                        : currentPolarCondition === 'blizzard_storm'
                        ? 'bg-indigo-950/90 text-indigo-200 border-indigo-400/80'
                        : currentPolarCondition === 'polar_heatwave'
                        ? 'bg-amber-950/90 text-amber-200 border-amber-500/80'
                        : 'bg-sky-950/90 text-sky-200 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  {environment === 'farm' ? (
                    <>
                      {currentFarmCondition === 'wildfire' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                      {currentFarmCondition === 'drought' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                      {currentFarmCondition === 'frost' && <Snowflake className="w-3.5 h-3.5 text-sky-400" />}
                      {currentFarmCondition === 'thriving' && <Sprout className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{farmPrediction?.title || localFarmTelemetry.condition.toUpperCase()}</span>
                    </>
                  ) : (
                    <>
                      {currentPolarCondition === 'ice_calving' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                      {currentPolarCondition === 'blizzard_storm' && <Wind className="w-3.5 h-3.5 text-indigo-400" />}
                      {currentPolarCondition === 'deep_freeze' && <Snowflake className="w-3.5 h-3.5 text-sky-400" />}
                      <span>{polarPrediction?.title || localPolarTelemetry.condition.toUpperCase()}</span>
                    </>
                  )}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-xs font-mono font-bold text-slate-200">
                  {environment === 'farm' ? 'Canopy Health: ' : 'Ice Shelf Stability: '}
                  <strong className={(environment === 'farm' ? currentFarmHealth : currentPolarHealth) >= 70 ? 'text-emerald-400' : (environment === 'farm' ? currentFarmHealth : currentPolarHealth) <= 35 ? 'text-rose-400' : 'text-amber-400'}>
                    {environment === 'farm' ? currentFarmHealth : currentPolarHealth}%
                  </strong>
                </span>

                {/* Farm Plant Growth Rate Badge */}
                {environment === 'farm' && (
                  <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/85 border border-emerald-600/70 text-xs font-mono font-bold text-emerald-300 shadow-md">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Growth: <strong className="text-white">+{currentGrowthRate} cm/day</strong></span>
                  </span>
                )}

                {/* Polar Albedo Badge */}
                {environment === 'polar' && (
                  <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/85 border border-sky-600/70 text-xs font-mono font-bold text-sky-300 shadow-md">
                    <Sun className="w-3.5 h-3.5 text-sky-400" />
                    <span>Albedo: <strong className="text-white">{currentAlbedo}</strong></span>
                  </span>
                )}

                <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-800 text-[10px] font-mono text-cyan-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLoadingAi ? 'bg-amber-400 animate-spin' : 'bg-emerald-400'}`} />
                  <span>{isLoadingAi ? 'AI Predicting...' : 'AI Active'}</span>
                </span>
              </div>

              {/* ===================================================================== */}
              {/* SVG VISUAL CANVAS: CONDITIONAL RENDERING (FARM VS POLAR)              */}
              {/* ===================================================================== */}
              {environment === 'farm' ? (
                /* =================================================================== */
                /* 🌾 FARM SVG: DETAILED CROPS WITH DYNAMIC PLANT GROWTH SCALE         */
                /* =================================================================== */
                <svg
                  viewBox="0 0 640 400"
                  className={`w-full h-full select-none pointer-events-none ${temperature >= 35 ? 'filter-[url(#simHeatHaze)]' : ''}`}
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Distant Mountains */}
                  <path d="M0,210 Q90,165 210,195 T450,180 T640,190 L640,400 L0,400 Z" className={currentFarmCondition === 'wildfire' ? 'fill-[#1c1917]' : currentFarmCondition === 'drought' ? 'fill-[#451a03]' : currentFarmCondition === 'frost' ? 'fill-[#1e293b]' : 'fill-[#064e3b]'} opacity="0.7" />
                  <path d="M0,230 Q160,195 340,225 T640,215 L640,400 L0,400 Z" className={currentFarmCondition === 'wildfire' ? 'fill-[#292524]' : currentFarmCondition === 'drought' ? 'fill-[#713f12]' : currentFarmCondition === 'frost' ? 'fill-[#334155]' : 'fill-[#047857]'} opacity="0.85" />

                  {/* Ground Soil Terrain */}
                  <path d="M0,250 Q260,240 640,255 L640,400 L0,400 Z" fill={farmGroundColor} className="transition-colors duration-700" />

                  {/* Cracked Drought Fissures */}
                  {currentFarmCondition === 'drought' && (
                    <g stroke="#3a2312" strokeWidth="1.8" fill="none" opacity="0.8">
                      <path d="M70,290 L95,305 L110,295 L140,320 M95,305 L105,335" />
                      <path d="M210,275 L235,290 L265,285 L290,315" />
                      <path d="M360,285 L390,300 L415,295 L445,325" />
                    </g>
                  )}

                  {/* Barn Architecture */}
                  <g transform="translate(85, 170)">
                    <rect x="0" y="30" width="76" height="55" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" rx="2" />
                    <polygon points="-6,30 18,5 58,5 82,30" fill={currentFarmCondition === 'frost' ? '#cbd5e1' : '#f8fafc'} stroke="#e2e8f0" strokeWidth="1.5" />
                    <rect x="26" y="52" width="24" height="33" fill="#450a0a" />
                    <line x1="26" y1="52" x2="50" y2="85" stroke="#f8fafc" strokeWidth="1.2" />
                    <line x1="50" y1="52" x2="26" y2="85" stroke="#f8fafc" strokeWidth="1.2" />
                    <rect x="33" y="18" width="10" height="10" fill={viewMode === 'night' ? '#fbbf24' : '#fed7aa'} stroke="#7f1d1d" strokeWidth="1" />
                    <rect x="82" y="15" width="24" height="70" fill="#64748b" rx="4" />
                    <ellipse cx="94" cy="15" rx="12" ry="7" fill="#94a3b8" />
                  </g>

                  {/* Spinning Windmill */}
                  <g transform="translate(515, 145)">
                    <polygon points="14,0 36,0 45,115 5,115" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
                    <line x1="12" y1="30" x2="38" y2="30" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="9" y1="65" x2="41" y2="65" stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx="25" cy="0" r="6" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                    <g transform={`translate(25, 0) rotate(${windmillAngle})`}>
                      <line x1="0" y1="-38" x2="0" y2="38" stroke="#f8fafc" strokeWidth="2.5" />
                      <line x1="-38" y1="0" x2="38" y2="0" stroke="#f8fafc" strokeWidth="2.5" />
                      <polygon points="3,-36 12,-36 9,-8 3,-8" fill="#38bdf8" opacity="0.9" />
                      <polygon points="-3,36 -12,36 -9,8 -3,8" fill="#38bdf8" opacity="0.9" />
                      <polygon points="36,3 36,12 8,9 8,3" fill="#38bdf8" opacity="0.9" />
                      <polygon points="-36,-3 -36,-12 -8,-9 -8,-3" fill="#38bdf8" opacity="0.9" />
                    </g>
                  </g>

                  {/* 4 PERSPECTIVE CROP ROWS (WITH ACCURATE PLANT GROWTH SCALE & MULTI-LEAF TOPOLOGY) */}
                  {[
                    { baseY: 280, count: 16, baseScale: 0.65, xOffset: 25 },
                    { baseY: 310, count: 14, baseScale: 0.85, xOffset: 35 },
                    { baseY: 345, count: 12, baseScale: 1.05, xOffset: 50 },
                    { baseY: 385, count: 10, baseScale: 1.25, xOffset: 65 },
                  ].map((row, rIdx) => (
                    <g key={rIdx}>
                      {Array.from({ length: row.count }).map((_, pIdx) => {
                        const px = row.xOffset + pIdx * (560 / row.count);
                        const py = row.baseY;
                        const deflection = localFarmTelemetry.windDeflection;
                        const wilt = localFarmTelemetry.leafWilt;

                        // Harmonic organic wave sways
                        const harmonicWave = Math.sin((animTime * 0.0035 * (effectiveWind + 1.5)) + (pIdx * 0.45) + (rIdx * 0.3)) * (2 + effectiveWind * 0.45);
                        const totalRotation = Math.min(65, deflection + harmonicWave);

                        // Dynamic Plant Height Scaling (Visualizing Plant Growth!)
                        const currentPlantScale = row.baseScale * visualPlantScale;
                        const stemHeight = -42 * visualPlantScale;

                        return (
                          <g
                            key={pIdx}
                            transform={`translate(${px}, ${py}) scale(${currentPlantScale}) rotate(${totalRotation})`}
                            className="transition-transform duration-200"
                          >
                            {/* Plant Main Stem (Elongates as growth increases) */}
                            <line
                              x1="0"
                              y1="0"
                              x2={wilt * 0.28}
                              y2={stemHeight + wilt * 0.45}
                              stroke={cropFill}
                              strokeWidth="4"
                              strokeLinecap="round"
                            />

                            {/* Lower Arching Leaf */}
                            <path
                              d={`M0,-16 Q-18,${-24 + wilt * 0.55} ${-24 + wilt * 0.25},${-14 + wilt * 0.65}`}
                              fill="none"
                              stroke={cropFill}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />

                            {/* Upper Wind-Deflected Leaf */}
                            <path
                              d={`M0,${stemHeight * 0.5} Q20,${stemHeight * 0.65 + wilt * 0.4} ${26 + deflection * 0.22},${stemHeight * 0.5 + wilt * 0.55}`}
                              fill="none"
                              stroke={cropFill}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />

                            {/* Extra lush leaves when in Bumper Growth Stage */}
                            {visualPlantScale >= 1.05 && (
                              <path
                                d={`M0,${stemHeight * 0.75} Q-16,${stemHeight * 0.85} -20,${stemHeight * 0.7}`}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                              />
                            )}

                            {/* Grain Head / Spike (Enlarges with growth) */}
                            {currentFarmCondition === 'wildfire' ? (
                              <g transform={`translate(${wilt * 0.28}, ${stemHeight - 4 + wilt * 0.45})`}>
                                <path d="M0,0 Q-5,-10 0,-18 Q5,-10 0,0 Z" fill="#f97316" className="animate-pulse" />
                                <circle cx="0" cy="-6" r="3.5" fill="#fde047" />
                              </g>
                            ) : cropType === 'Maize & Corn' ? (
                              <g transform={`translate(${wilt * 0.28}, ${stemHeight - 4 + wilt * 0.45})`}>
                                <ellipse cx="0" cy="0" rx={4.5 * visualPlantScale} ry={9 * visualPlantScale} fill={currentFarmCondition === 'thriving' ? '#eab308' : '#ca8a04'} />
                                <line x1="0" y1="-8" x2="-2" y2="-15" stroke="#fde047" strokeWidth="1.2" />
                                <line x1="0" y1="-8" x2="2" y2="-15" stroke="#fde047" strokeWidth="1.2" />
                              </g>
                            ) : cropType === 'Vineyard Grapes' ? (
                              <g transform={`translate(${wilt * 0.28}, ${stemHeight - 3 + wilt * 0.45})`}>
                                <circle cx="-3" cy="-4" r={3 * visualPlantScale} fill="#7e22ce" />
                                <circle cx="3" cy="-4" r={3 * visualPlantScale} fill="#9333ea" />
                                <circle cx="0" cy="0" r={3.2 * visualPlantScale} fill="#6b21a8" />
                              </g>
                            ) : (
                              /* Golden Wheat Grain Head with Nodding Awns */
                              <g transform={`translate(${wilt * 0.28}, ${stemHeight - 4 + wilt * 0.45})`}>
                                <ellipse cx="0" cy="0" rx={4 * visualPlantScale} ry={8 * visualPlantScale} fill={currentFarmCondition === 'thriving' ? '#eab308' : '#ca8a04'} />
                                <line x1="0" y1="-7" x2="-4" y2="-18" stroke="#fde047" strokeWidth="1.2" />
                                <line x1="0" y1="-7" x2="0" y2="-20" stroke="#fde047" strokeWidth="1.2" />
                                <line x1="0" y1="-7" x2="4" y2="-18" stroke="#fde047" strokeWidth="1.2" />
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  ))}
                </svg>
              ) : (
                /* =================================================================== */
                /* ❄️ POLAR CRYOSPHERE: PHOTOREALISTIC GLACIAL ICE SHELF & ATMOSPHERE */
                /* =================================================================== */
                <svg
                  viewBox="0 0 640 400"
                  className="w-full h-full select-none pointer-events-none"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    {/* Sky Atmospheric Gradients */}
                    <linearGradient id="polarSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      {viewMode === 'night' || localPolarTelemetry.condition === 'deep_freeze' ? (
                        <>
                          <stop offset="0%" stopColor="#020617" />
                          <stop offset="40%" stopColor="#0f172a" />
                          <stop offset="75%" stopColor="#072227" />
                          <stop offset="100%" stopColor="#022c22" />
                        </>
                      ) : localPolarTelemetry.condition === 'blizzard_storm' ? (
                        <>
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="50%" stopColor="#334155" />
                          <stop offset="85%" stopColor="#64748b" />
                          <stop offset="100%" stopColor="#cbd5e1" />
                        </>
                      ) : localPolarTelemetry.condition === 'polar_heatwave' ? (
                        <>
                          <stop offset="0%" stopColor="#0369a1" />
                          <stop offset="45%" stopColor="#38bdf8" />
                          <stop offset="80%" stopColor="#bae6fd" />
                          <stop offset="100%" stopColor="#f0f9ff" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#082f49" />
                          <stop offset="35%" stopColor="#0284c7" />
                          <stop offset="70%" stopColor="#7dd3fc" />
                          <stop offset="100%" stopColor="#f0f9ff" />
                        </>
                      )}
                    </linearGradient>

                    {/* Aurora Borealis Multi-Stop Emission Gradients */}
                    <linearGradient id="auroraCurtainA" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                      <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.9" />
                      <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="auroraCurtainB" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.75" />
                      <stop offset="45%" stopColor="#10b981" stopOpacity="0.85" />
                      <stop offset="80%" stopColor="#a855f7" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
                    </linearGradient>

                    {/* Sun Dog & Halo Gradients */}
                    <radialGradient id="sunHaloGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="75%" stopColor="#bae6fd" stopOpacity="0" />
                      <stop offset="88%" stopColor="#fef08a" stopOpacity="0.55" />
                      <stop offset="94%" stopColor="#f43f5e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="sunPillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0" />
                      <stop offset="50%" stopColor="#fef08a" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                    </linearGradient>

                    {/* Glacial Ice & Crevasse Shading Gradients */}
                    <linearGradient id="iceShelfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="25%" stopColor="#f1f5f9" />
                      <stop offset="65%" stopColor="#bae6fd" />
                      <stop offset="90%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id="iceCliffFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#bae6fd" />
                      <stop offset="30%" stopColor="#38bdf8" />
                      <stop offset="75%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#0369a1" />
                    </linearGradient>
                    <linearGradient id="rayleighCrevasseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#082f49" />
                      <stop offset="45%" stopColor="#00f0ff" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>

                    {/* Sub-Polar Ocean Gradient */}
                    <linearGradient id="oceanDeepGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={currentPolarCondition === 'polar_heatwave' ? '#0369a1' : '#0284c7'} />
                      <stop offset="35%" stopColor="#075985" />
                      <stop offset="75%" stopColor="#0c4a6e" />
                      <stop offset="100%" stopColor="#082f49" />
                    </linearGradient>

                    {/* Pristine Arctic Glacial Shelf & Fast-Ice Gradient (Zero Brown Land) */}
                    <linearGradient id="polarFastIceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="25%" stopColor="#f1f5f9" />
                      <stop offset="55%" stopColor="#e0f2fe" />
                      <stop offset="85%" stopColor="#bae6fd" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>

                    {/* Cerulean Supraglacial Melt Lake Gradient */}
                    <radialGradient id="meltLakeGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#0284c7" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
                    </radialGradient>

                    {/* Arctic Freezing Sea Smoke Fog Gradient (Responsive to Humidity) */}
                    <linearGradient id="seaSmokeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="45%" stopColor="#f0f9ff" stopOpacity="0.7" />
                      <stop offset="85%" stopColor="#e0f2fe" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
                    </linearGradient>

                    {/* Authentic Igloo Snow Block Dome Gradient */}
                    <linearGradient id="iglooSnowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="35%" stopColor="#f8fafc" />
                      <stop offset="70%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                  </defs>

                  {/* Sky Base */}
                  <rect x="0" y="0" width="640" height="400" fill="url(#polarSkyGrad)" />

                  {/* Atmospheric Sun Dog & Parhelia (Visible when daytime & below freezing) */}
                  {viewMode !== 'night' && localPolarTelemetry.condition !== 'deep_freeze' && localPolarTelemetry.condition !== 'blizzard_storm' && (
                    <g>
                      {/* Vertical Sun Pillar */}
                      <rect x="477" y="30" width="6" height="95" fill="url(#sunPillarGrad)" />
                      {/* Low Arctic Sun */}
                      <circle cx="480" cy="95" r="16" fill="#fffbeb" stroke="#fef08a" strokeWidth="2" />
                      {/* 22° Optical Ice Crystal Halo Ring */}
                      <circle cx="480" cy="95" r="66" fill="url(#sunHaloGrad)" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.55" />
                      {/* Left Parhelion (Sun Dog) */}
                      <ellipse cx="414" cy="95" rx="7" ry="12" fill="#fed7aa" opacity="0.75" className="animate-pulse" />
                      {/* Right Parhelion (Sun Dog) */}
                      <ellipse cx="546" cy="95" rx="7" ry="12" fill="#fed7aa" opacity="0.75" className="animate-pulse" />
                    </g>
                  )}

                  {/* Shimmering Diamond Dust Micro-Crystals (Sub-Zero Atmospheric Phenomenon) */}
                  {temperature <= -5 && (
                    <g opacity="0.75">
                      {[
                        { x: 75, y: 85, s: 2.5 },
                        { x: 135, y: 120, s: 3 },
                        { x: 215, y: 70, s: 2 },
                        { x: 310, y: 95, s: 3.5 },
                        { x: 395, y: 65, s: 2.2 },
                        { x: 440, y: 135, s: 3 },
                        { x: 520, y: 75, s: 2.8 },
                        { x: 590, y: 110, s: 3.2 },
                        { x: 160, y: 45, s: 2.4 },
                        { x: 275, y: 130, s: 2.6 },
                        { x: 350, y: 50, s: 3.4 },
                        { x: 485, y: 40, s: 2 },
                      ].map((c, idx) => {
                        const shimmer = 0.3 + Math.sin(animTime * 0.003 + idx * 1.5) * 0.45;
                        return (
                          <g key={idx} transform={`translate(${c.x}, ${c.y})`} opacity={shimmer}>
                            <polygon points="0,-4 3,0 0,4 -3,0" fill="#ffffff" />
                            <circle cx="0" cy="0" r={c.s * 0.7} fill="#e0f2fe" />
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Magnificent Aurora Borealis Curtains (Night or Deep Freeze $T \le -15^\circ\text{C}$) */}
                  {(viewMode === 'night' || localPolarTelemetry.condition === 'deep_freeze' || temperature <= -18) && (
                    <g opacity="0.8">
                      {/* Curtain Wave 1 (Upper) */}
                      <path
                        d={`M0,45 Q160,${20 + Math.sin(animTime * 0.0012) * 15} 320,55 T640,35 L640,125 Q480,${85 + Math.cos(animTime * 0.0015) * 12} 320,110 T0,105 Z`}
                        fill="url(#auroraCurtainA)"
                        opacity="0.85"
                      />
                      {/* Curtain Wave 2 (Lower Ribbon) */}
                      <path
                        d={`M0,75 Q200,${45 + Math.cos(animTime * 0.001) * 16} 400,85 T640,65 L640,150 Q440,${115 + Math.sin(animTime * 0.0013) * 14} 240,135 T0,120 Z`}
                        fill="url(#auroraCurtainB)"
                        opacity="0.75"
                      />
                      {/* Shimmering Vertical Filament Rays */}
                      {[60, 130, 205, 280, 360, 440, 520, 595].map((rx, idx) => (
                        <line
                          key={idx}
                          x1={rx + Math.sin(animTime * 0.0015 + idx) * 8}
                          y1="40"
                          x2={rx + Math.sin(animTime * 0.0015 + idx) * 8}
                          y2="135"
                          stroke="#a7f3d0"
                          strokeWidth="2.5"
                          opacity={0.4 + Math.sin(animTime * 0.0025 + idx) * 0.35}
                          strokeLinecap="round"
                        />
                      ))}
                    </g>
                  )}

                  {/* Soaring Arctic Kittiwakes (Seabirds flying in wind formation) */}
                  <g opacity="0.85">
                    {[
                      { x: 190, y: 75, s: 0.9 },
                      { x: 215, y: 65, s: 0.8 },
                      { x: 235, y: 80, s: 0.7 },
                      { x: 260, y: 70, s: 0.85 },
                    ].map((b, idx) => {
                      const driftX = (b.x + (animTime * 0.02 * (windSpeed * 0.3 + 1)) + idx * 25) % 680 - 40;
                      const driftY = b.y + Math.sin(animTime * 0.002 + idx) * 4;
                      return (
                        <path
                          key={idx}
                          d={`M${driftX - 7 * b.s},${driftY + 2} Q${driftX - 2 * b.s},${driftY - 4 * b.s} ${driftX},${driftY} Q${driftX + 2 * b.s},${driftY - 4 * b.s} ${driftX + 7 * b.s},${driftY + 2}`}
                          fill="none"
                          stroke="#f8fafc"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </g>

                  {/* =================================================================== */}
                  {/* TIER 1: DISTANT ARCTIC FJORD CREST (Sweeping Glaciated Horizon)     */}
                  {/* Replaced triangular pyramids with organic coastal fjord morphology */}
                  {/* =================================================================== */}
                  <g>
                    {/* Far Distant Fjord Wall (Continuous rolling atmospheric massif) */}
                    <path
                      d="M0,215 L35,188 L85,198 L145,160 L210,185 L275,152 L340,172 L420,146 L490,168 L565,150 L640,168 L640,240 L0,240 Z"
                      fill="#475569"
                      opacity="0.55"
                    />
                    {/* High Alpine Snow Caps & Ice Fields along distant crest */}
                    <path
                      d="M125,170 L145,160 L170,175 L210,185 L180,188 L140,178 Z"
                      fill="#e2e8f0"
                      opacity="0.75"
                    />
                    <path
                      d="M255,162 L275,152 L310,165 L340,172 L300,174 L270,166 Z"
                      fill="#e2e8f0"
                      opacity="0.75"
                    />
                    <path
                      d="M395,156 L420,146 L455,160 L490,168 L445,170 L410,162 Z"
                      fill="#e2e8f0"
                      opacity="0.75"
                    />
                  </g>

                  {/* =================================================================== */}
                  {/* TIER 2: RUGGED ARCTIC FJORD MASSIFS, CIRQUE GLACIERS & SEA CLIFFS   */}
                  {/* Asymmetrical alpine massifs, hanging bowl glaciers, and rock buttresses */}
                  {/* =================================================================== */}
                  <g>
                    {/* --- MASSIF 1: WESTERN FJORD ESCARPMENT & TABLELAND (x: 0 to 200) --- */}
                    {/* Main Dark Basalt Massif Shoulder */}
                    <path
                      d="M0,235 L0,178 L35,174 L75,142 L115,150 L155,182 L205,235 Z"
                      fill="#1e293b"
                    />
                    {/* West Alpine Ice Cap & Fluted Snow Apron */}
                    <path
                      d="M0,178 L35,174 L75,142 L95,146 L65,178 L20,182 L0,185 Z"
                      fill="#f8fafc"
                      opacity="0.95"
                    />
                    {/* Hanging Snow Couloirs running down into glacier */}
                    <path d="M75,142 L68,172 L55,200 L40,230" stroke="#bae6fd" strokeWidth="2.5" fill="none" opacity="0.85" />
                    <path d="M95,146 L90,175 L80,215" stroke="#bae6fd" strokeWidth="1.8" fill="none" opacity="0.8" />
                    <path d="M115,150 L125,185 L145,225" stroke="#334155" strokeWidth="2" fill="none" opacity="0.6" />

                    {/* --- MASSIF 2: CENTRAL GLACIAL CIRQUE & ASYMMETRIC HORN (x: 180 to 420) --- */}
                    {/* Natural scooped bowl amphitheater nestled high in the mountain wall */}
                    <path
                      d="M175,235 L205,175 L245,118 L285,158 L330,132 L380,185 L420,235 Z"
                      fill="#334155"
                    />
                    {/* Shaded Precipice Facet (North-facing shadow) */}
                    <path
                      d="M245,118 L285,158 L330,132 L345,175 L300,195 L260,185 L245,118 Z"
                      fill="#1e293b"
                      opacity="0.95"
                    />
                    {/* Perennial Cirque Bowl Glacier (Curved amphitheater of blue glacial ice) */}
                    <path
                      d="M245,118 L220,155 L215,190 L260,185 L285,158 Z"
                      fill="#f8fafc"
                    />
                    <path
                      d="M228,152 Q245,165 272,156 Q255,178 230,174 Z"
                      fill="#bae6fd"
                      opacity="0.85"
                    />
                    {/* Knife-Edge Arête Ridge Line */}
                    <line x1="245" y1="118" x2="260" y2="185" stroke="#93c5fd" strokeWidth="2" opacity="0.8" />
                    <line x1="330" y1="132" x2="345" y2="195" stroke="#93c5fd" strokeWidth="1.8" opacity="0.7" />

                    {/* --- MASSIF 3: EASTERN FJORD BUTTRESS & STEPPED SEA CLIFFS (x: 390 to 640) --- */}
                    {/* Horizontal stepped volcanic strata terraces dropping into fjord */}
                    <path
                      d="M385,235 L425,168 L475,138 L545,148 L605,135 L640,150 L640,235 Z"
                      fill="#1e293b"
                    />
                    {/* Layered Basalt Terrace Steps */}
                    <path
                      d="M475,138 L545,148 L530,165 L460,155 Z"
                      fill="#334155"
                    />
                    <path
                      d="M545,148 L605,135 L640,150 L640,165 L590,155 L530,165 Z"
                      fill="#f8fafc"
                      opacity="0.9"
                    />
                    {/* Terrace Snow Ledges & Ice Aprons */}
                    <path
                      d="M425,168 L475,138 L495,144 L445,175 Z"
                      fill="#f8fafc"
                      opacity="0.95"
                    />
                    {/* Geological Horizontal Strata Lines (Natural layered rock) */}
                    <line x1="435" y1="185" x2="525" y2="178" stroke="#0f172a" strokeWidth="1.8" opacity="0.7" />
                    <line x1="450" y1="188" x2="520" y2="182" stroke="#bae6fd" strokeWidth="1.2" opacity="0.6" />
                    <line x1="535" y1="172" x2="630" y2="168" stroke="#0f172a" strokeWidth="1.8" opacity="0.7" />
                    <line x1="545" y1="175" x2="625" y2="171" stroke="#bae6fd" strokeWidth="1.2" opacity="0.6" />
                    <line x1="470" y1="205" x2="590" y2="200" stroke="#0f172a" strokeWidth="2" opacity="0.6" />
                  </g>

                  {/* DYNAMIC ARCTIC OCEAN (Rises dynamically up to 36px with rising temperature) */}
                  <rect x="0" y={polarSeaWaterY} width="640" height={400 - polarSeaWaterY} fill="url(#oceanDeepGrad)" />

                  {/* Dynamic Sea Level Waterline & Wind-Driven Wave Crests */}
                  <g>
                    {/* Animated Surface Wave Crest Line */}
                    <path
                      d={`M0,${polarSeaWaterY} Q160,${polarSeaWaterY - polarWaveAmplitude * Math.sin(animTime * 0.003)} 320,${polarSeaWaterY + polarWaveAmplitude * Math.cos(animTime * 0.003)} T640,${polarSeaWaterY} L640,${polarSeaWaterY + 6} L0,${polarSeaWaterY + 6} Z`}
                      fill="#7dd3fc"
                      opacity="0.45"
                    />

                    {/* Wind-blown Wave Whitecaps & Ocean Spray (Driven by windSpeed) */}
                    {windSpeed >= 8 && (
                      <g stroke="#ffffff" strokeWidth={Math.min(2.8, 1 + windSpeed * 0.04)} opacity="0.85" strokeLinecap="round">
                        {Array.from({ length: polarWaveChopCount }).map((_, wIdx) => {
                          const wx = (wIdx * (600 / polarWaveChopCount) + animTime * 0.06 * (windSpeed * 0.25 + 1)) % 620 + 10;
                          const wy = polarSeaWaterY + 10 + (wIdx % 4) * 20;
                          return (
                            <path
                              key={wIdx}
                              d={`M${wx},${wy} Q${wx + 10},${wy - polarWaveAmplitude * 0.7} ${wx + 22},${wy + 1}`}
                              fill="none"
                            />
                          );
                        })}
                      </g>
                    )}

                    {/* Arctic Freezing Sea Smoke / Steam Fog (Dense when humidity >= 45%) */}
                    {polarFogOpacity > 0.05 && (
                      <rect
                        x="0"
                        y={polarSeaWaterY - 24}
                        width="640"
                        height="48"
                        fill="url(#seaSmokeGrad)"
                        opacity={polarFogOpacity}
                      />
                    )}
                  </g>

                  {/* =================================================================== */}
                  {/* TIER 3: PRIMARY GLACIAL ICE SHELF (Dynamic Melting & Tongue Retreat) */}
                  {/* =================================================================== */}
                  {/* Glacial tongue horizontal edge retracts as ice melts */}
                  <path
                    d={`M0,195 L${275 - Math.round(polarIceMeltFraction * 60)},195 L${295 - Math.round(polarIceMeltFraction * 70)},235 L${265 - Math.round(polarIceMeltFraction * 60)},${polarSeaWaterY + 15} L0,${polarSeaWaterY + 15} Z`}
                    fill="url(#iceShelfGrad)"
                    stroke="#7dd3fc"
                    strokeWidth="1.5"
                  />
                  {/* Ice Cliff Face Subsurface Drop */}
                  <path
                    d={`M0,235 L${295 - Math.round(polarIceMeltFraction * 70)},235 L${285 - Math.round(polarIceMeltFraction * 68)},${polarSeaWaterY + 15} L0,${polarSeaWaterY + 15} Z`}
                    fill="url(#iceCliffFaceGrad)"
                    opacity="0.85"
                  />

                  {/* Supraglacial Cerulean Meltwater Lakes (Forms & expands on glacier when T > 0°C) */}
                  {temperature > 0 && (
                    <g>
                      {/* Primary Melt Lake */}
                      <ellipse
                        cx="140"
                        cy="198"
                        rx={10 + polarIceMeltFraction * 28}
                        ry={3 + polarIceMeltFraction * 6}
                        fill="url(#meltLakeGrad)"
                        stroke="#00f0ff"
                        strokeWidth="1.2"
                      />
                      {/* Secondary Melt Puddle */}
                      <ellipse
                        cx="65"
                        cy="197"
                        rx={7 + polarIceMeltFraction * 16}
                        ry={2.5 + polarIceMeltFraction * 4}
                        fill="url(#meltLakeGrad)"
                        stroke="#00f0ff"
                        strokeWidth="1"
                      />
                    </g>
                  )}

                  {/* Rayleigh Light-Scattering Glacial Crevasses (Electric Blue Subsurface Glow) */}
                  <g stroke="url(#rayleighCrevasseGrad)" strokeWidth="3" fill="none" strokeLinecap="round">
                    <path d={`M35,200 L55,235 L45,${Math.min(275, polarSeaWaterY + 10)}`} />
                    <path d={`M110,198 L135,240 L125,${Math.min(278, polarSeaWaterY + 12)}`} />
                    <path d={`M195,202 L220,245 L205,${Math.min(275, polarSeaWaterY + 8)}`} />
                    {polarIceMeltFraction < 0.6 && (
                      <path d={`M${255 - Math.round(polarIceMeltFraction * 40)},205 L${272 - Math.round(polarIceMeltFraction * 45)},242 L${260 - Math.round(polarIceMeltFraction * 45)},${Math.min(270, polarSeaWaterY + 6)}`} />
                    )}
                  </g>
                  {/* Secondary Fracture Fissures */}
                  <g stroke="#00f0ff" strokeWidth="1.5" fill="none" opacity="0.85">
                    <path d="M55,235 L75,255" />
                    <path d="M135,240 L155,265" />
                    <path d="M220,245 L235,268" />
                  </g>

                  {/* Hanging Icicles along the Ice Cliff Lip */}
                  <g fill="#bae6fd" opacity="0.9">
                    {[20, 45, 80, 105, 140, 175, 210, 245].filter(ix => ix < (285 - polarIceMeltFraction * 65)).map((ix, idx) => (
                      <polygon
                        key={idx}
                        points={`${ix},235 ${ix + 4},235 ${ix + 2},${244 + (idx % 3) * 4}`}
                      />
                    ))}
                  </g>

                  {/* Supraglacial Meltwater Waterfall (Plunges into rising sea level when Temp > 0°C) */}
                  {temperature > 0 && (
                    <g>
                      {/* Supraglacial Melt Stream Ribbon on top of shelf */}
                      <path d="M140,198 Q180,215 205,235" fill="none" stroke="#00f0ff" strokeWidth="3" opacity="0.9" />
                      {/* Plunging Waterfall over cliff face directly into polarSeaWaterY */}
                      <rect x="203" y="235" width="6" height={Math.max(4, polarSeaWaterY - 235)} fill="#38bdf8" opacity="0.9" />
                      <line x1="206" y1="235" x2="206" y2={polarSeaWaterY} stroke="#ffffff" strokeWidth="2" strokeDasharray="4 2" />
                      {/* White Foam & Splash Mist at water surface */}
                      <ellipse cx="206" cy={polarSeaWaterY} rx="15" ry="4.5" fill="#ffffff" opacity="0.95" />
                      <ellipse cx="206" cy={polarSeaWaterY} rx="24" ry="7.5" fill="none" stroke="#bae6fd" strokeWidth="2" className="animate-ping" />
                    </g>
                  )}

                  {/* =================================================================== */}
                  {/* DYNAMIC ICEBERG CALVING ANIMATION (Triggered when Temp > 0°C)       */}
                  {/* Chunks break away from main shelf, plunge, splash, and drift out    */}
                  {/* =================================================================== */}
                  {isPolarCalving ? (
                    <g>
                      {/* PHASE 0: TENSILE CREVASSE FISSURE (Rifts open right before detachment) */}
                      {calvingProgress < 0.28 && (
                        <g>
                          {/* Widening glowing blue tension fracture at the cliff edge */}
                          <line
                            x1={shelfEdgeX - 6}
                            y1="195"
                            x2={shelfEdgeX - 4}
                            y2={polarSeaWaterY}
                            stroke="#00f0ff"
                            strokeWidth={Math.min(6, 1.5 + (calvingProgress / 0.28) * 4.5)}
                            opacity={0.9}
                          />
                          <line
                            x1={shelfEdgeX - 6}
                            y1="195"
                            x2={shelfEdgeX - 4}
                            y2={polarSeaWaterY}
                            stroke="#ffffff"
                            strokeWidth="1.2"
                          />
                          {/* Crumbling ice dust trickling down fissure */}
                          {Array.from({ length: 4 }).map((_, dIdx) => (
                            <circle
                              key={dIdx}
                              cx={shelfEdgeX - 5 + Math.sin(animTime * 0.01 + dIdx) * 2}
                              cy={200 + ((animTime * 0.08 + dIdx * 15) % Math.max(10, polarSeaWaterY - 200))}
                              r="1.2"
                              fill="#ffffff"
                              opacity="0.8"
                            />
                          ))}
                        </g>
                      )}

                      {/* PHASE 1: DETACHING & PLUNGING ICE CHUNKS (Breaking away from shelf) */}
                      {calvingProgress >= 0.20 && calvingProgress < 0.58 && (() => {
                        const fallProg = (calvingProgress - 0.20) / 0.38;
                        const easeFall = fallProg * fallProg; // Gravity acceleration
                        const chunkX = (shelfEdgeX - 4) + fallProg * 28;
                        const chunkY = 196 + easeFall * (polarSeaWaterY - 188);
                        const chunkRot = fallProg * 36;

                        // Secondary smaller serac fragment falling beside it
                        const chunk2X = shelfEdgeX + 8 + fallProg * 42;
                        const chunk2Y = 210 + Math.pow(fallProg, 1.7) * (polarSeaWaterY - 198);
                        const chunk2Rot = -fallProg * 58;

                        return (
                          <g>
                            {/* Primary Massive Tabular Ice Chunk Shearing Off */}
                            <g transform={`translate(${chunkX}, ${chunkY}) rotate(${chunkRot})`}>
                              {/* Crystalline Tabular Ice Block */}
                              <polygon points="0,0 36,-12 42,38 6,46" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.5" />
                              {/* Subsurface Electric Cyan Core */}
                              <polygon points="6,46 42,38 46,55 10,60" fill="#0284c7" opacity="0.85" />
                              <line x1="12" y1="4" x2="16" y2="42" stroke="#bae6fd" strokeWidth="1.2" />
                            </g>

                            {/* Secondary Jagged Serac Fragment Tumbling */}
                            <g transform={`translate(${chunk2X}, ${chunk2Y}) rotate(${chunk2Rot})`}>
                              <polygon points="0,0 18,-6 22,22 4,26" fill="#e0f2fe" stroke="#00f0ff" strokeWidth="1.2" />
                              <polygon points="4,26 22,22 25,32 7,35" fill="#0369a1" opacity="0.8" />
                            </g>

                            {/* Small Shards & Ice Splinters Showering Down */}
                            {[
                              { ox: 12, oy: -8, r: 2 },
                              { ox: 25, oy: 15, r: 2.5 },
                              { ox: -5, oy: 25, r: 1.8 },
                              { ox: 38, oy: 5, r: 2.2 },
                            ].map((shard, sIdx) => (
                              <circle
                                key={sIdx}
                                cx={chunkX + shard.ox + Math.sin(animTime * 0.02 + sIdx) * 4}
                                cy={chunkY + shard.oy + easeFall * 15}
                                r={shard.r}
                                fill="#ffffff"
                                stroke="#7dd3fc"
                                strokeWidth="0.8"
                                opacity="0.9"
                              />
                            ))}
                          </g>
                        );
                      })()}

                      {/* PHASE 2: EXPLOSIVE OCEAN IMPACT & WATER SPLASH GEYSERS */}
                      {calvingProgress >= 0.50 && calvingProgress < 0.78 && (() => {
                        const splashProg = (calvingProgress - 0.50) / 0.28;
                        const impactX = shelfEdgeX + 26;
                        const splashHeight = Math.sin(splashProg * Math.PI) * 44;
                        const splashWidth = 18 + splashProg * 38;
                        const fadeOpacity = Math.max(0, 1 - splashProg);

                        return (
                          <g opacity={fadeOpacity}>
                            {/* Towering Twin Water Plumes Erupting Skyward */}
                            <path
                              d={`M${impactX},${polarSeaWaterY} Q${impactX - splashWidth * 0.5},${polarSeaWaterY - splashHeight * 1.1} ${impactX - splashWidth},${polarSeaWaterY - splashHeight * 0.7} Q${impactX - splashWidth * 0.6},${polarSeaWaterY - splashHeight * 0.2} ${impactX - splashWidth * 0.3},${polarSeaWaterY} Z`}
                              fill="#e0f2fe"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <path
                              d={`M${impactX},${polarSeaWaterY} Q${impactX + splashWidth * 0.5},${polarSeaWaterY - splashHeight * 1.2} ${impactX + splashWidth},${polarSeaWaterY - splashHeight * 0.75} Q${impactX + splashWidth * 0.6},${polarSeaWaterY - splashHeight * 0.2} ${impactX + splashWidth * 0.3},${polarSeaWaterY} Z`}
                              fill="#e0f2fe"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />

                            {/* Concentric Impact Surge Wave Rings in Ocean */}
                            <ellipse
                              cx={impactX}
                              cy={polarSeaWaterY}
                              rx={18 + splashProg * 58}
                              ry={4.5 + splashProg * 14}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth={Math.max(1, 3.5 * (1 - splashProg))}
                            />
                            <ellipse
                              cx={impactX}
                              cy={polarSeaWaterY}
                              rx={10 + splashProg * 38}
                              ry={2.5 + splashProg * 9}
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="2"
                            />

                            {/* Foaming White Splash Beads in Air */}
                            {[
                              { dx: -18, dy: -28, r: 3.5 },
                              { dx: -8, dy: -38, r: 3 },
                              { dx: 10, dy: -42, r: 3.5 },
                              { dx: 22, dy: -26, r: 3 },
                              { dx: 0, dy: -22, r: 4 },
                            ].map((drop, dIdx) => (
                              <circle
                                key={dIdx}
                                cx={impactX + drop.dx * (1 + splashProg * 0.5)}
                                cy={polarSeaWaterY + drop.dy * Math.sin(splashProg * Math.PI)}
                                r={drop.r * (1 - splashProg * 0.3)}
                                fill="#ffffff"
                                stroke="#7dd3fc"
                                strokeWidth="0.8"
                              />
                            ))}
                          </g>
                        );
                      })()}

                      {/* PHASE 3: BUOYANT BOBBING & DRIFTING CALVED ICEBERG */}
                      {calvingProgress >= 0.72 && (() => {
                        const driftProg = (calvingProgress - 0.72) / 0.28;
                        const bergX = shelfEdgeX + 28 + driftProg * 45;
                        const bobDamp = Math.sin(driftProg * Math.PI * 4) * (8 * (1 - driftProg));
                        const bergY = polarSeaWaterY - 14 + bobDamp;
                        const bergRot = 14 + Math.sin(driftProg * Math.PI * 3) * (6 * (1 - driftProg));

                        return (
                          <g transform={`translate(${bergX}, ${bergY}) rotate(${bergRot})`}>
                            {/* Freshly Calved Tabular Iceberg */}
                            <polygon points="0,0 44,-10 50,28 8,36" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.8" />
                            {/* Submerged Blue Base */}
                            <polygon points="8,36 50,28 54,48 12,52" fill="#0284c7" opacity="0.85" />
                            {/* Calving Cleavage Line */}
                            <line x1="20" y1="2" x2="24" y2="32" stroke="#bae6fd" strokeWidth="1.2" />
                            {/* Waterline Wake Foam */}
                            <ellipse cx="26" cy="30" rx="32" ry="5.5" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity={0.8} />
                          </g>
                        );
                      })()}

                      {/* Drifting Older Calved Bergs in the Fjord (Visual evidence of ongoing melting) */}
                      <g transform={`translate(${shelfEdgeX + 95 + Math.sin(animTime * 0.001) * 6}, ${polarSeaWaterY - 8 + Math.cos(animTime * 0.002) * 2}) rotate(8)`}>
                        <polygon points="0,0 35,-8 40,22 6,28" fill="#f1f5f9" stroke="#7dd3fc" strokeWidth="1.4" />
                        <polygon points="6,28 40,22 43,36 9,40" fill="#0284c7" opacity="0.75" />
                        <ellipse cx="20" cy="24" rx="26" ry="5" fill="none" stroke="#bae6fd" strokeWidth="1" opacity={0.6} />
                      </g>
                    </g>
                  ) : (
                    /* INTACT SOLID GLACIAL SHELF (Sub-Zero Freeze Equilibrium - Zero Calving) */
                    <g>
                      {/* Intact Grounded Tabular Iceberg locked in shorefast ice */}
                      <g>
                        <polygon points="315,245 375,195 425,245 405,275 330,270" fill="#f8fafc" stroke="#93c5fd" strokeWidth="1.8" />
                        <polygon points="330,270 405,275 395,285 340,282" fill="#0284c7" opacity="0.8" />
                        <line x1="375" y1="195" x2="370" y2="272" stroke="#bae6fd" strokeWidth="1.5" />
                      </g>
                    </g>
                  )}

                  {/* Floating Sea Ice Pack Floes (Dynamically Shrinking with Temperature) */}
                  <g>
                    {/* Floe 1 (Main resting floe for Harp Seals) */}
                    <ellipse
                      cx="465"
                      cy="305"
                      rx={Math.max(22, Math.round(68 * (1 - polarIceMeltFraction * 0.6)))}
                      ry={Math.max(7, Math.round(18 * (1 - polarIceMeltFraction * 0.6)))}
                      fill="#f8fafc"
                      stroke="#7dd3fc"
                      strokeWidth="1.8"
                    />
                    <ellipse
                      cx="465"
                      cy="307"
                      rx={Math.max(20, Math.round(65 * (1 - polarIceMeltFraction * 0.6)))}
                      ry={Math.max(6, Math.round(15 * (1 - polarIceMeltFraction * 0.6)))}
                      fill="#e0f2fe"
                      opacity="0.65"
                    />
                    {/* Melt Puddle on Floe 1 when T > 0°C */}
                    {temperature > 0 && (
                      <ellipse
                        cx="475"
                        cy="305"
                        rx={Math.max(4, 18 * polarIceMeltFraction)}
                        ry={Math.max(1.5, 5 * polarIceMeltFraction)}
                        fill="#38bdf8"
                        opacity="0.75"
                      />
                    )}

                    {/* Floe 2 (Drifting sea ice floe) */}
                    <ellipse
                      cx="365"
                      cy="345"
                      rx={Math.max(14, Math.round(58 * (1 - polarIceMeltFraction * 0.7)))}
                      ry={Math.max(4.5, Math.round(15 * (1 - polarIceMeltFraction * 0.7)))}
                      fill="#f8fafc"
                      stroke="#7dd3fc"
                      strokeWidth="1.8"
                    />

                    {/* Floe 3 */}
                    <ellipse
                      cx="565"
                      cy="340"
                      rx={Math.max(12, Math.round(52 * (1 - polarIceMeltFraction * 0.75)))}
                      ry={Math.max(4, Math.round(14 * (1 - polarIceMeltFraction * 0.75)))}
                      fill="#f8fafc"
                      stroke="#7dd3fc"
                      strokeWidth="1.8"
                    />

                    {/* Drifting Melting Brash Ice Bits */}
                    <polygon points="275,325 285,322 288,328 278,330" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1" />
                    <polygon points="420,365 432,362 435,368 422,370" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1" />
                    {temperature > 4 && (
                      <g fill="#bae6fd" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8">
                        <polygon points="340,310 348,308 349,313 342,314" />
                        <polygon points="505,348 514,346 515,351 507,352" />
                      </g>
                    )}
                  </g>

                  {/* =================================================================== */}
                  {/* RIGHT COASTLINE: PRISTINE ARCTIC FAST-ICE PLATFORM (ZERO BROWN LAND)*/}
                  {/* Dynamic ice foot retreats and submerges under rising polar sea level */}
                  {/* =================================================================== */}
                  <g>
                    {/* Pristine Multi-Year Fast-Ice Crystalline Platform */}
                    <path
                      d={`M${485 + Math.round(polarIceMeltFraction * 45)},${Math.max(248, polarSeaWaterY + 4)} Q560,${236 + Math.round(polarIceMeltFraction * 20)} 640,${244 + Math.round(polarIceMeltFraction * 18)} L640,400 L${475 + Math.round(polarIceMeltFraction * 40)},400 Z`}
                      fill="url(#polarFastIceGrad)"
                      stroke="#7dd3fc"
                      strokeWidth="1.5"
                    />

                    {/* Glacial Pressure Ridges & Crystalline Ice Crevasses (Electric Blue) */}
                    <g stroke="#00f0ff" strokeWidth="1.8" fill="none" opacity="0.85" strokeLinecap="round">
                      <path d="M525,270 L555,282 L595,276 L630,288" />
                      <path d="M555,282 L568,318" />
                      <path d="M595,276 L608,308" />
                      <path d="M512,300 L542,314 L580,306" />
                    </g>
                    <g stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.7">
                      <path d="M535,288 L552,298" />
                      <path d="M575,290 L590,302" />
                      <path d="M605,315 L625,325" />
                    </g>

                    {/* Supraglacial Cerulean Meltwater Lakes on Right Fast-Ice (Expanding with Temp) */}
                    {temperature > 0 && (
                      <g>
                        <ellipse
                          cx="570"
                          cy="268"
                          rx={8 + polarIceMeltFraction * 18}
                          ry={2.5 + polarIceMeltFraction * 5}
                          fill="url(#meltLakeGrad)"
                          stroke="#00f0ff"
                          strokeWidth="1"
                        />
                        <ellipse
                          cx="618"
                          cy="282"
                          rx={5 + polarIceMeltFraction * 12}
                          ry={1.8 + polarIceMeltFraction * 3.5}
                          fill="url(#meltLakeGrad)"
                          stroke="#00f0ff"
                          strokeWidth="0.8"
                        />
                      </g>
                    )}

                    {/* Crystalline Subsurface Rim along Waterline */}
                    <line
                      x1={480 + Math.round(polarIceMeltFraction * 45)}
                      y1={polarSeaWaterY}
                      x2={640}
                      y2={polarSeaWaterY}
                      stroke="#bae6fd"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  </g>

                  {/* =================================================================== */}
                  {/* ARCTIC WILDLIFE: DYNAMIC POLAR BEARS, HARP SEALS & SWIMMING SEALS   */}
                  {/* =================================================================== */}
                  {/* Soaring Arctic Snow Petrels (Banking & Flapping in the Wind) */}
                  <g opacity={localPolarTelemetry.condition === 'blizzard_storm' ? 0.35 : 0.85}>
                    {[
                      { bx: 170, by: 72, speed: 0.014, s: 0.75, flapSpeed: 0.013 },
                      { bx: 260, by: 58, speed: 0.017, s: 0.9, flapSpeed: 0.015 },
                      { bx: 340, by: 82, speed: 0.012, s: 0.65, flapSpeed: 0.011 },
                    ].map((bird, bIdx) => {
                      const bx = (bird.bx + animTime * bird.speed * (windSpeed * 0.08 + 1)) % 700 - 40;
                      const by = bird.by + Math.sin(animTime * 0.003 + bIdx * 2) * 8;
                      const wingWing = Math.sin(animTime * bird.flapSpeed + bIdx) * 5.5;
                      return (
                        <g key={bIdx} transform={`translate(${bx}, ${by}) scale(${bird.s})`}>
                          <path
                            d={`M0,0 Q7,${-5 + wingWing} 15,${-1 + wingWing} Q8,2 0,0 Q-7,${-5 + wingWing} -15,${-1 + wingWing} Q-8,2 0,0`}
                            fill="#f8fafc"
                            stroke="#bae6fd"
                            strokeWidth="0.8"
                          />
                          <ellipse cx="0" cy="1" rx="2.5" ry="1.2" fill="#cbd5e1" />
                        </g>
                      );
                    })}
                  </g>

                  {/* Distant Bowhead Whale / Beluga Surfacing with Blowhole Water Spout */}
                  {polarSeaWaterY <= 248 && (
                    <g transform={`translate(285, ${polarSeaWaterY - 14})`}>
                      {/* Whale Sleek Dark Back Surfacing */}
                      <ellipse cx="0" cy="14" rx="28" ry="6" fill="#0f172a" opacity="0.8" />
                      {/* Periodic Blowhole Geyser / Steam Spout */}
                      {((animTime * 0.0008) % 4) < 1.3 && (
                        <g opacity={1 - (((animTime * 0.0008) % 4) / 1.3)}>
                          <path
                            d="M0,14 C-4,5 -7,-7 -10,-15 C-5,-10 0,0 0,14 C0,0 5,-10 10,-15 C7,-7 4,5 0,14"
                            fill="#e0f2fe"
                            stroke="#ffffff"
                            strokeWidth="0.9"
                          />
                          <circle cx="-10" cy="-15" r="3" fill="#ffffff" opacity="0.95" />
                          <circle cx="10" cy="-15" r="3" fill="#ffffff" opacity="0.95" />
                          <ellipse cx="0" cy="14" rx="16" ry="3.5" fill="none" stroke="#bae6fd" strokeWidth="1.2" className="animate-ping" />
                        </g>
                      )}
                    </g>
                  )}

                  {/* Polar Bear Family (Mother + Cub with Dynamic Walk Cycle & Warm Breath Puffs) */}
                  {temperature <= 2 && (
                    <g>
                      {/* Fresh Paw Prints in the Glacial Snow */}
                      <g fill="#94a3b8" opacity="0.5">
                        <ellipse cx="115" cy="202" rx="2" ry="1.2" />
                        <ellipse cx="128" cy="204" rx="2" ry="1.2" />
                        <ellipse cx="140" cy="202" rx="2" ry="1.2" />
                        <ellipse cx="155" cy="203" rx="2.5" ry="1.5" />
                        <ellipse cx="170" cy="202" rx="2.5" ry="1.5" />
                      </g>

                      {/* Mother Polar Bear (Dynamic Walking Gait & Breath Cloud) */}
                      <g transform={`translate(${185 + Math.sin(animTime * 0.002) * 2.5}, ${192 + Math.abs(Math.sin(animTime * 0.004)) * 1.5})`}>
                        {/* Body Torso */}
                        <ellipse cx="0" cy="0" rx="18" ry="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
                        {/* Muscular Shoulders & Neck */}
                        <ellipse cx="12" cy="-3" rx="10" ry="7" fill="#f8fafc" />
                        {/* Head & Snout with Subtle Tilt */}
                        <g transform={`rotate(${Math.sin(animTime * 0.002) * 3}, 21, -4)`}>
                          <circle cx="21" cy="-4" r="5" fill="#f8fafc" />
                          <path d="M21,-6 L27,-3 L21,0 Z" fill="#f8fafc" />
                          {/* Black Nose & Eye */}
                          <circle cx="27" cy="-3" r="1.3" fill="#0f172a" />
                          <circle cx="21" cy="-5" r="1" fill="#0f172a" />
                          {/* Small Rounded Furry Ear */}
                          <circle cx="18" cy="-8" r="1.5" fill="#e2e8f0" />

                          {/* Exhaled Condensation Breath Puff (Sub-zero Arctic Phenomenon) */}
                          <g opacity={Math.max(0.3, 0.85 - (temperature + 20) * 0.02)}>
                            <ellipse
                              cx={29 + ((animTime * 0.003) % 1) * 7}
                              cy={-4 - ((animTime * 0.003) % 1) * 5}
                              rx={1.5 + ((animTime * 0.003) % 1) * 3.5}
                              ry={1.2 + ((animTime * 0.003) % 1) * 2.2}
                              fill="#ffffff"
                              opacity={0.75 * (1 - ((animTime * 0.003) % 1))}
                            />
                          </g>
                        </g>

                        {/* 4 Heavy Polar Paws (Animated Walking Strides) */}
                        <rect
                          x="-14"
                          y="6"
                          width="4.5"
                          height="9"
                          fill="#f8fafc"
                          rx="1"
                          transform={`rotate(${Math.sin(animTime * 0.005) * 8}, -12, 6)`}
                        />
                        <rect
                          x="-6"
                          y="5"
                          width="4.5"
                          height="9"
                          fill="#e2e8f0"
                          rx="1"
                          transform={`rotate(${-Math.sin(animTime * 0.005) * 8}, -4, 5)`}
                        />
                        <rect
                          x="6"
                          y="5"
                          width="4.5"
                          height="9"
                          fill="#f8fafc"
                          rx="1"
                          transform={`rotate(${Math.sin(animTime * 0.005) * 8}, 8, 5)`}
                        />
                        <rect
                          x="13"
                          y="6"
                          width="4.5"
                          height="9"
                          fill="#e2e8f0"
                          rx="1"
                          transform={`rotate(${-Math.sin(animTime * 0.005) * 8}, 15, 6)`}
                        />
                        {/* Little Tail with Gentle Wag */}
                        <circle
                          cx="-18"
                          cy="-2"
                          r="2"
                          fill="#f8fafc"
                          transform={`rotate(${Math.sin(animTime * 0.008) * 10}, -18, -2)`}
                        />
                      </g>

                      {/* Playful Polar Bear Cub (Bouncing Behind Mother & Wagging Tail) */}
                      <g transform={`translate(${152 + Math.sin(animTime * 0.002) * 2.5}, ${196 + Math.abs(Math.sin(animTime * 0.006)) * 2}) scale(0.6)`}>
                        <ellipse cx="0" cy="0" rx="14" ry="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                        <circle cx="14" cy="-3" r="4.5" fill="#f8fafc" />
                        <circle cx="18" cy="-3" r="1.1" fill="#0f172a" />
                        <circle cx="13" cy="-4.5" r="0.9" fill="#0f172a" />
                        <circle cx="11" cy="-6" r="1.2" fill="#e2e8f0" />
                        {/* Cub Snout Breath Cloud */}
                        <circle
                          cx={20 + ((animTime * 0.004) % 1) * 6}
                          cy={-3 - ((animTime * 0.004) % 1) * 4}
                          r={1.2 + ((animTime * 0.004) % 1) * 2.2}
                          fill="#ffffff"
                          opacity={0.7 * (1 - ((animTime * 0.004) % 1))}
                        />
                        {/* Cub Stepping Paws */}
                        <rect x="-10" y="4" width="3.5" height="7" fill="#f8fafc" rx="1" transform={`rotate(${Math.sin(animTime * 0.007) * 9}, -8, 4)`} />
                        <rect x="6" y="4" width="3.5" height="7" fill="#f8fafc" rx="1" transform={`rotate(${-Math.sin(animTime * 0.007) * 9}, 8, 4)`} />
                        {/* Cub Playful Tail Wag */}
                        <circle cx="-14" cy="-1" r="1.6" fill="#f8fafc" transform={`rotate(${Math.sin(animTime * 0.012) * 15}, -14, -1)`} />
                      </g>
                    </g>
                  )}

                  {/* Harp Seal & Fluffy Whitecoat Pup on Ice Floe (With Head Turns & Tail Wiggles) */}
                  <g transform="translate(460, 298)">
                    {/* Mother Harp Seal */}
                    <ellipse cx="0" cy="0" rx="15" ry="7" fill="#475569" stroke="#334155" strokeWidth="1" />
                    {/* Head with Alert Head Tilts */}
                    <g transform={`rotate(${Math.sin(animTime * 0.002) * 4}, -13, -4)`}>
                      <circle cx="-13" cy="-4" r="5" fill="#334155" />
                      <circle cx="-14" cy="-5" r="1" fill="#f8fafc" />
                      {/* Mother Seal Breath Vapor Puff */}
                      <circle
                        cx={-17 - ((animTime * 0.0025) % 1) * 5}
                        cy={-4 - ((animTime * 0.0025) % 1) * 4}
                        r={1 + ((animTime * 0.0025) % 1) * 2.5}
                        fill="#ffffff"
                        opacity={0.65 * (1 - ((animTime * 0.0025) % 1))}
                      />
                    </g>
                    {/* Rear Flipper gently flapping */}
                    <g transform={`rotate(${Math.sin(animTime * 0.004) * 8}, 14, 2)`}>
                      <ellipse cx="14" cy="2" rx="6" ry="2.5" fill="#334155" />
                    </g>

                    {/* Cute Fluffy Whitecoat Pup (Blinks & Wiggles Flippers) */}
                    <g transform="translate(9, -4)">
                      <ellipse cx="0" cy="0" rx="8" ry="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
                      {/* Pup Head with Cute Shiny Dark Eyes */}
                      <circle cx="-6" cy="-1" r="3" fill="#ffffff" />
                      <circle cx="-7" cy="-1.5" r={0.9 + Math.sin(animTime * 0.004) * 0.15} fill="#0f172a" />
                      <circle cx="-7.3" cy="-1.8" r="0.3" fill="#ffffff" />
                      {/* Little Black Snout & Whiskers */}
                      <circle cx="-8.8" cy="-0.6" r="0.6" fill="#0f172a" />
                      <line x1="-9" y1="-0.6" x2="-11" y2="-1" stroke="#cbd5e1" strokeWidth="0.5" />
                      <line x1="-9" y1="-0.6" x2="-11" y2="0" stroke="#cbd5e1" strokeWidth="0.5" />
                      {/* Little Side Flipper Wiggling */}
                      <ellipse
                        cx="0"
                        cy="3"
                        rx="3"
                        ry="1.4"
                        fill="#f1f5f9"
                        stroke="#cbd5e1"
                        strokeWidth="0.5"
                        transform={`rotate(${Math.sin(animTime * 0.006) * 12}, 0, 3)`}
                      />
                    </g>
                  </g>

                  {/* Swimming Seal Surfacing & Diving in Open Water Lead */}
                  {(() => {
                    const divePhase = Math.sin(animTime * 0.0018);
                    const swimX = 335 + Math.sin(animTime * 0.001) * 25;
                    const swimY = 332 + divePhase * 5;
                    const isSurfaced = divePhase < 0.4;

                    return (
                      <g transform={`translate(${swimX}, ${swimY})`}>
                        {/* Subsurface Body Silhouette */}
                        <ellipse cx="0" cy="2" rx="7" ry="3.5" fill="#1e293b" opacity="0.65" />
                        {/* Surfaced Seal Head & Whiskers */}
                        {isSurfaced && (
                          <g>
                            <circle cx="0" cy="-2" r="5.5" fill="#334155" />
                            <circle cx="-1.5" cy="-3.5" r="1.2" fill="#ffffff" />
                            <circle cx="-1.5" cy="-3.5" r="0.7" fill="#0f172a" />
                            <ellipse cx="0" cy="0" rx="3" ry="1.5" fill="#1e293b" />
                            {/* Whiskers */}
                            <line x1="2" y1="-0.5" x2="6" y2="-1" stroke="#94a3b8" strokeWidth="0.6" />
                            <line x1="2" y1="0.5" x2="6" y2="1.5" stroke="#94a3b8" strokeWidth="0.6" />
                            {/* Exhaled Breathing Steam Puff */}
                            <circle cx="2" cy="-6" r="2.5" fill="#ffffff" opacity="0.65" className="animate-pulse" />
                            {/* Surface Droplet Splashes */}
                            <circle cx="-4" cy="-1" r="1.2" fill="#7dd3fc" opacity="0.9" />
                            <circle cx="4" cy="-1" r="1.2" fill="#7dd3fc" opacity="0.9" />
                          </g>
                        )}
                        {/* Expanding Concentric Water Ripple Rings */}
                        <ellipse cx="0" cy="4" rx="16" ry="4.5" fill="none" stroke="#7dd3fc" strokeWidth="1.5" className="animate-ping" />
                        <ellipse cx="0" cy="4" rx="9" ry="2.5" fill="none" stroke="#bae6fd" strokeWidth="1" />
                      </g>
                    );
                  })()}

                  {/* =================================================================== */}
                  {/* AUTHENTIC ARCTIC SNOW IGLOO (Traditional Dome, Firelight & Chimney) */}
                  {/* Erased weird machines and replaced with beautiful traditional igloo */}
                  {/* =================================================================== */}
                  <g transform="translate(54, 150)">
                    {/* Natural Surrounding Snow Mound Foundation */}
                    <ellipse cx="46" cy="46" rx="48" ry="12" fill="#f8fafc" stroke="#bae6fd" strokeWidth="1.2" />

                    {/* Main Igloo Hemispherical Snow-Block Dome */}
                    <path
                      d="M10,46 C10,18 26,4 46,4 C66,4 82,18 82,46 Z"
                      fill="url(#iglooSnowGrad)"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                    />

                    {/* Carved Snow-Block Seam Lines (Traditional Spiraling Architecture) */}
                    <g stroke="#93c5fd" strokeWidth="1.1" fill="none" opacity="0.75">
                      {/* Horizontal Brick Tiers */}
                      <path d="M14,36 Q46,41 78,36" />
                      <path d="M20,25 Q46,29 72,25" />
                      <path d="M28,15 Q46,18 64,15" />
                      {/* Vertical Block Interlocking Joints */}
                      <line x1="30" y1="36" x2="28" y2="46" />
                      <line x1="48" y1="36" x2="48" y2="46" />
                      <line x1="66" y1="36" x2="68" y2="46" />
                      <line x1="24" y1="25" x2="22" y2="36" />
                      <line x1="40" y1="26" x2="38" y2="36" />
                      <line x1="58" y1="26" x2="60" y2="36" />
                      <line x1="36" y1="15" x2="34" y2="25" />
                      <line x1="54" y1="15" x2="56" y2="25" />
                    </g>

                    {/* Translucent Freshwater Ice Window Pane */}
                    <ellipse cx="46" cy="22" rx="7.5" ry="5.5" fill="#fef08a" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />
                    {/* Cozy Amber Warmth Glow through the window */}
                    <ellipse cx="46" cy="22" rx="10" ry="7.5" fill="#f59e0b" opacity={0.35 + Math.sin(animTime * 0.003) * 0.15} />

                    {/* Low Wind-Deflecting Entrance Tunnel (Vestibule) */}
                    <path
                      d="M-2,46 C-2,34 8,33 18,34 L18,46 Z"
                      fill="#f1f5f9"
                      stroke="#93c5fd"
                      strokeWidth="1.3"
                    />
                    <path d="M2,40 Q10,42 18,40" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.6" />
                    {/* Arched Crawlway Tunnel Entrance */}
                    <ellipse cx="5" cy="42" rx="4.5" ry="5.5" fill="#0f172a" />
                    {/* Warm Firelight Spill from inside the tunnel onto the blue snow */}
                    <ellipse cx="5" cy="44" rx="9" ry="3.5" fill="#fbbf24" opacity={0.45 + Math.sin(animTime * 0.003) * 0.12} />

                    {/* Top Ventilation Smoke Hole with Gentle Curling Smoke */}
                    <ellipse cx="46" cy="4" rx="3.5" ry="1.5" fill="#1e293b" />
                    <g opacity="0.75">
                      {[0, 1, 2].map((sIdx) => {
                        const smokeCycle = (animTime * 0.0018 + sIdx * 0.33) % 1;
                        const smokeY = 2 - smokeCycle * 26;
                        const smokeX = 46 + Math.sin(animTime * 0.004 + sIdx) * 4 + (windSpeed * smokeCycle * 1.8);
                        return (
                          <circle
                            key={sIdx}
                            cx={smokeX}
                            cy={smokeY}
                            r={2 + smokeCycle * 4}
                            fill="#f8fafc"
                            opacity={0.65 * (1 - smokeCycle)}
                          />
                        );
                      })}
                    </g>

                    {/* Traditional Arctic Wooden Sled (Qamutik) leaning against snow */}
                    <g transform="translate(86, 34) rotate(-16)">
                      <line x1="0" y1="0" x2="0" y2="18" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="7" y1="0" x2="7" y2="18" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="-1" y1="4" x2="8" y2="4" stroke="#b45309" strokeWidth="1.5" />
                      <line x1="-1" y1="9" x2="8" y2="9" stroke="#b45309" strokeWidth="1.5" />
                      <line x1="-1" y1="14" x2="8" y2="14" stroke="#b45309" strokeWidth="1.5" />
                    </g>

                    {/* Traditional Wooden Snowshoes planted in snow */}
                    <g transform="translate(74, 36)">
                      <ellipse cx="0" cy="0" rx="3" ry="8" fill="none" stroke="#92400e" strokeWidth="1.2" transform="rotate(7)" />
                      <line x1="-2" y1="-4" x2="2" y2="4" stroke="#d97706" strokeWidth="0.8" />
                      <line x1="2" y1="-4" x2="-2" y2="4" stroke="#d97706" strokeWidth="0.8" />
                    </g>
                  </g>

                  {/* =================================================================== */}
                  {/* DYNAMIC KATABATIC BLIZZARD STREAMERS (Reactive to Wind Speed)       */}
                  {/* =================================================================== */}
                  {windSpeed >= 6 && (
                    <g stroke="#ffffff" opacity={Math.min(0.95, 0.35 + (windSpeed / 50) * 0.6)} strokeLinecap="round">
                      {[
                        { x: 20, y: 80, l: 35 + windSpeed * 1.5, w: 1.2 },
                        { x: 120, y: 150, l: 50 + windSpeed * 1.8, w: 1.6 },
                        { x: 240, y: 95, l: 45 + windSpeed * 1.6, w: 1.4 },
                        { x: 340, y: 175, l: 60 + windSpeed * 2.0, w: 2.0 },
                        { x: 440, y: 120, l: 40 + windSpeed * 1.5, w: 1.5 },
                        { x: 530, y: 200, l: 55 + windSpeed * 1.8, w: 1.8 },
                        { x: 80, y: 260, l: 40 + windSpeed * 1.4, w: 1.2 },
                        { x: 280, y: 310, l: 65 + windSpeed * 2.2, w: 2.2 },
                        { x: 480, y: 350, l: 50 + windSpeed * 1.7, w: 1.6 },
                        { x: 580, y: 270, l: 45 + windSpeed * 1.5, w: 1.4 },
                      ].map((stream, idx) => {
                        const shiftX = (stream.x + animTime * (0.05 * (windSpeed * 0.4 + 1)) + idx * 40) % 700 - 60;
                        const angleDrop = 4 + (windSpeed > 25 ? 2 : 6);
                        return (
                          <line
                            key={idx}
                            x1={shiftX}
                            y1={stream.y}
                            x2={shiftX + stream.l}
                            y2={stream.y + angleDrop}
                            strokeWidth={stream.w}
                            className="animate-pulse"
                          />
                        );
                      })}
                    </g>
                  )}
                </svg>
              )}

              {/* Bottom Quick Metric Pills on Canvas */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Temp: <strong className="text-white">{temperature}°C</strong>
                    {environment === 'polar' && <span className="text-sky-300 ml-1">(Chill: {currentWindChill}°C)</span>}
                  </span>
                </div>
                {environment === 'polar' && (
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Sea Level: <strong className={polarWaterLevelRiseCm > 0 ? "text-amber-300" : "text-emerald-300"}>{polarWaterLevelRiseCm > 0 ? `+${polarWaterLevelRiseCm}cm` : 'Baseline'}</strong>
                      {polarIceMeltPct > 0 ? (
                        <span className="text-rose-300 ml-1">
                          (-{polarIceMeltPct}% Ice · <span className="text-amber-300 font-bold animate-pulse">⚡ Active Calving</span>)
                        </span>
                      ) : (
                        <span className="text-sky-300 ml-1">(Solid Ice Shelf)</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {environment === 'farm'
                      ? `RH: ${humidity}% (VPD: ${currentVpd} kPa)`
                      : `Humidity: ${humidity}%`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>
                    Wind: <strong className="text-white">{windSpeed} m/s</strong>{' '}
                    ({(windSpeed * 3.6).toFixed(0)} km/h)
                  </span>
                </div>
              </div>
            </div>

            {/* Dedicated Interactive Interventions Toolbar */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  {environment === 'farm' ? (
                    <Sprout className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Mountain className="w-4 h-4 text-sky-400" />
                  )}
                  <span>
                    {environment === 'farm'
                      ? 'Agronomic Interventions:'
                      : 'Cryospheric Interventions:'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {environment === 'farm'
                    ? 'Active crop defenses & growth acceleration'
                    : 'Snowpack albedo & traditional igloo insulation'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {environment === 'farm' ? (
                  <>
                    {/* Accelerate Growth Button */}
                    <button
                      onClick={handleAccelerateGrowth}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
                        growthBoosterActive
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 scale-95 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-emerald-950/80 hover:bg-emerald-900/90 border-emerald-500/50 text-emerald-200 hover:border-emerald-400'
                      }`}
                      title="Feed sun & nutrients to visually accelerate plant growth stages"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${growthBoosterActive ? 'animate-spin text-slate-950' : 'text-emerald-400'}`} />
                      <span>{growthBoosterActive ? 'Accelerating Growth...' : '🌿 Feed & Grow Plants'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/70 text-emerald-300 hidden md:inline border border-emerald-700/50">
                        Stage {manualGrowthStage}/4
                      </span>
                    </button>

                    {/* Irrigation Booster */}
                    <button
                      onClick={handleIrrigate}
                      disabled={irrigationActive}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
                        irrigationActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 scale-95 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                          : 'bg-cyan-950/80 hover:bg-cyan-900/90 border-cyan-500/50 text-cyan-200 hover:border-cyan-400'
                      }`}
                      title="Spray irrigation mist: Cools crop canopy by -2°C and adds +14% humidity"
                    >
                      <CloudRain className={`w-3.5 h-3.5 ${irrigationActive ? 'animate-bounce text-slate-950' : 'text-cyan-400'}`} />
                      <span>{irrigationActive ? 'Spraying Mist...' : '💦 Irrigate Field'}</span>
                    </button>

                    {/* Shelterbelt Toggle */}
                    <button
                      onClick={() => setShelterbeltActive((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
                        shelterbeltActive
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                      title="Toggle windbreak tree line: cuts wind velocity hitting crops by 50%"
                    >
                      <Trees className={`w-3.5 h-3.5 ${shelterbeltActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                      <span>{shelterbeltActive ? '🌲 Windbreak: ON' : '🌲 Plant Windbreak'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Albedo Cloud Seeding */}
                    <button
                      onClick={handleAlbedoSpray}
                      disabled={albedoBoosterActive}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
                        albedoBoosterActive
                          ? 'bg-cyan-400 text-slate-950 border-cyan-200 scale-95 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                          : 'bg-sky-950/80 hover:bg-sky-900/90 border-sky-500/50 text-sky-200 hover:border-sky-400'
                      }`}
                      title="Deploy marine cloud brightening to boost snow surface albedo by +0.08 and cool by -1.5°C"
                    >
                      <Sun className="w-3.5 h-3.5 text-sky-300" />
                      <span>{albedoBoosterActive ? 'Boosting Albedo...' : '❄️ Boost Albedo'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-900/70 text-sky-200 hidden md:inline border border-sky-700/50">
                        +0.08 Refl
                      </span>
                    </button>

                    {/* Pack Snowpack & Igloo Insulation Toggle */}
                    <button
                      onClick={handleToggleThermosyphon}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-md ${
                        thermosyphonActive
                          ? 'bg-sky-400 text-slate-950 border-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                      title="Pack fresh snowpack to insulate the igloo and preserve multi-year fast-ice"
                    >
                      <Snowflake className={`w-3.5 h-3.5 ${thermosyphonActive ? 'text-slate-950 animate-spin' : 'text-sky-400'}`} />
                      <span>{thermosyphonActive ? '❄️ Pack Snow: ON' : '❄️ Pack Igloo Snow'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Climate Scenarios Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Interactive{' '}
                    {environment === 'farm'
                      ? 'Agricultural'
                      : environment === 'polar'
                      ? 'Cryospheric'
                      : 'Oceanographic'}{' '}
                    Presets (Click to Test)
                  </span>
                </span>
                <span className="text-[9px] font-mono text-cyan-400">
                  Instant Response
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(environment === 'farm' ? FARM_PRESETS : POLAR_PRESETS).map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      soundFx.playTick();
                      setTemperature(p.temp);
                      setHumidity(p.hum);
                      setWindSpeed(p.wind);
                    }}
                    className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                        {p.name}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${p.tagColor}`}>
                        {p.tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1">
                      {p.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: INTERACTIVE SLIDERS & REAL-TIME AI PREDICTION (5 COLS)     */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-3.5">
            {/* Sliders Control Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>
                    {environment === 'farm'
                      ? 'Farm Microclimate Controls'
                      : 'Polar Weather Controls'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    soundFx.playTick();
                    if (environment === 'farm') {
                      setTemperature(22);
                      setHumidity(65);
                      setWindSpeed(3.5);
                      setShelterbeltActive(false);
                      setManualGrowthStage(3);
                    } else {
                      setTemperature(-18);
                      setHumidity(65);
                      setWindSpeed(6);
                      setAlbedoBoosterActive(false);
                      setThermosyphonActive(false);
                    }
                  }}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Baseline</span>
                </button>
              </div>

              {/* Slider 1: Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Surface Air Temperature:</span>
                  </span>
                  <strong className="text-amber-300 font-bold">
                    {temperature}°C <span className="text-slate-400 font-normal">({(temperature * 1.8 + 32).toFixed(1)}°F)</span>
                  </strong>
                </div>
                <input
                  type="range"
                  min={environment === 'farm' ? -10 : -50}
                  max={environment === 'farm' ? 50 : 15}
                  step={0.5}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 touch-pan-x"
                  style={{ touchAction: 'pan-x' }}
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>{environment === 'farm' ? '-10°C (Frost)' : '-50°C (Glacial Cryo)'}</span>
                  <span className="text-emerald-400 font-bold">
                    {environment === 'farm' ? '22°C (Optimal Growth)' : '0°C (Thaw Threshold)'}
                  </span>
                  <span>{environment === 'farm' ? '50°C (Inferno)' : environment === 'polar' ? '+15°C (Heatwave)' : '38°C (Extreme Bleaching)'}</span>
                </div>
              </div>

              {/* Slider 2: Relative Humidity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {environment === 'farm'
                        ? 'Relative Humidity:'
                        : environment === 'polar'
                        ? 'Snow Moisture Saturation:'
                        : 'Maritime Boundary Layer Humidity:'}
                    </span>
                  </span>
                  <strong className="text-cyan-300 font-bold">
                    {humidity}% RH
                  </strong>
                </div>
                <input
                  type="range"
                  min={environment === 'farm' ? 5 : environment === 'polar' ? 10 : 30}
                  max={100}
                  step={1}
                  value={humidity}
                  onChange={(e) => setHumidity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 touch-pan-x"
                  style={{ touchAction: 'pan-x' }}
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>{environment === 'farm' ? '5% (Bone-Dry)' : '10% (Polar Desert)'}</span>
                  <span className="text-emerald-400 font-bold">65% (Equilibrium)</span>
                  <span>{environment === 'farm' ? '100% (Saturation)' : '100% (Blizzard)'}</span>
                </div>
              </div>

              {/* Slider 3: Wind Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      {environment === 'farm'
                        ? '10m Wind Speed:'
                        : 'Katabatic Wind Speed:'}
                    </span>
                  </span>
                  <strong className="text-teal-300 font-bold">
                    {windSpeed} m/s <span className="text-slate-400 font-normal">({(windSpeed * 3.6).toFixed(0)} km/h)</span>
                  </strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={environment === 'farm' ? 40 : 50}
                  step={0.5}
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 touch-pan-x"
                  style={{ touchAction: 'pan-x' }}
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>0 m/s (Beaufort 0: Calm)</span>
                  <span className="text-emerald-400 font-bold">
                    {environment === 'farm' ? '3.5 m/s (Gentle)' : '6 m/s (Moderate)'}
                  </span>
                  <span>{environment === 'farm' ? '40 m/s (Gale)' : '50 m/s (Blizzard)'}</span>
                </div>
              </div>

              {/* Target Selector (Crops vs Polar Biomes) */}
              <div className="pt-1">
                <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                  {environment === 'farm'
                    ? 'Target Crop Selection:'
                    : 'Target Cryosphere Biome:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(environment === 'farm' ? CROP_OPTIONS : POLAR_BIOME_OPTIONS).map((opt) => {
                    const isSelected = environment === 'farm' ? cropType === opt.id : polarBiome === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundFx.playTick();
                          if (environment === 'farm') setCropType(opt.id);
                          else setPolarBiome(opt.id);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span className="truncate text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Farm Only: Interactive Plant Growth Stage Time-Lapse Slider */}
              {environment === 'farm' && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Visual Crop Phenology Stage:</span>
                    </span>
                    <strong className="text-white">Stage {manualGrowthStage}/4</strong>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                    {['🌱 Seedling', '🌿 Vegetative', '🌾 Grain Fill', '✨ Bumper'].map((st, sIdx) => (
                      <button
                        key={st}
                        onClick={() => {
                          soundFx.playTick();
                          setManualGrowthStage(sIdx + 1);
                        }}
                        className={`py-1 rounded border transition-all cursor-pointer ${
                          manualGrowthStage === sIdx + 1
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Gemini AI Action Button */}
              <button
                onClick={() => {
                  soundFx.playPredictionAlert();
                  executePrediction();
                }}
                disabled={isLoadingAi}
                className={`w-full py-2.5 px-4 rounded-xl text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg ${
                  environment === 'farm'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 shadow-emerald-500/25'
                    : environment === 'polar'
                    ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-600 hover:from-sky-500 shadow-sky-500/25'
                    : 'bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-500 hover:from-blue-500 shadow-blue-500/25'
                }`}
              >
                <Sparkles className={`w-4 h-4 text-cyan-200 ${isLoadingAi ? 'animate-spin' : ''}`} />
                <span>
                  {isLoadingAi
                    ? 'Gemini AI Calculating...'
                    : `Re-Analyze with Gemini AI (${environment === 'farm' ? 'Agronomy' : environment === 'polar' ? 'Glaciology' : 'Oceanography'})`}
                </span>
              </button>
            </div>

            {/* AI Prediction & Narrative Results Card */}
            <div className="p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/30 space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    {environment === 'farm'
                      ? 'NASA Agronomic AI Prediction'
                      : environment === 'polar'
                      ? 'NASA Cryospheric AI Prediction'
                      : 'NOAA / NASA Oceanographic AI Prediction'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                    Live Reactive
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(environment === 'farm'
                      ? farmPrediction?.aiModelUsed
                      : polarPrediction?.aiModelUsed) || 'gemini-3.8-flash'}
                  </span>
                </div>
              </div>

              {/* Story Narrative */}
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-cyan-300">
                  {environment === 'farm'
                    ? farmPrediction?.title || 'Ecological Agricultural Impact'
                    : polarPrediction?.title || 'Cryosphere & Glacial Impact'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {environment === 'farm'
                    ? farmPrediction?.plainEnglishStory || 'Adjust temperature, humidity, and wind above to simulate real-time agricultural response.'
                    : polarPrediction?.plainEnglishStory || 'Adjust sub-zero temperature, snow moisture, and katabatic winds to simulate glacial calving and albedo.'}
                </p>
              </div>

              {/* Biophysical Metrics Grid (Differences between Farm vs Polar vs Ocean) */}
              {environment === 'farm' ? (
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Daily Growth Rate</span>
                    <strong className="text-emerald-400">+{currentGrowthRate} cm/day</strong>
                    <span className="text-slate-500 block text-[8px]">GDD: {localFarmTelemetry.gdd}°C-d</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Vapor Pressure Deficit</span>
                    <strong className={currentVpd > 2.2 ? 'text-amber-400' : 'text-emerald-300'}>{currentVpd} kPa</strong>
                    <span className="text-slate-500 block text-[8px]">{currentVpd > 2.2 ? 'High thirst' : 'Balanced'}</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Canopy Temp</span>
                    <strong className="text-cyan-300">
                      {farmPrediction?.scientificTelemetry?.canopyTemperatureC ?? (temperature - 1.2).toFixed(1)}°C
                    </strong>
                    <span className="text-slate-500 block text-[8px]">Transpiration cooled</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Lodging Risk</span>
                    <strong className={effectiveWind >= 20 ? 'text-rose-400' : 'text-emerald-300'}>
                      {farmPrediction?.scientificTelemetry?.lodgingRiskPercent ?? Math.min(100, Math.round(Math.pow(effectiveWind / 28, 2.5) * 100))}%
                    </strong>
                    <span className="text-slate-500 block text-[8px]">Stem bend angle: {localFarmTelemetry.windDeflection}°</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Surface Albedo</span>
                    <strong className={currentAlbedo >= 0.7 ? 'text-emerald-400' : 'text-rose-400'}>{currentAlbedo}</strong>
                    <span className="text-slate-500 block text-[8px]">{currentAlbedo >= 0.7 ? 'High reflection' : 'Heat absorption'}</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Katabatic Wind Chill</span>
                    <strong className="text-sky-300">{currentWindChill}°C</strong>
                    <span className="text-slate-500 block text-[8px]">Convective frost risk</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Calving Risk</span>
                    <strong className={currentCalvingRisk >= 40 ? 'text-rose-400' : 'text-emerald-300'}>{currentCalvingRisk}%</strong>
                    <span className="text-slate-500 block text-[8px]">Melt rate: {localPolarTelemetry.meltRateCmMonth} cm/mo</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Permafrost Thaw</span>
                    <strong className={localPolarTelemetry.permafrostThawCm > 50 ? 'text-amber-400' : 'text-slate-300'}>
                      {localPolarTelemetry.permafrostThawCm} cm
                    </strong>
                    <span className="text-slate-500 block text-[8px]">Methane: {localPolarTelemetry.methaneFluxMgDay} mg/m²</span>
                  </div>
                </div>
              )}

              {/* Actionable Recommendations (Farmer Advice vs Polar Research Advice) */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {environment === 'farm'
                      ? 'Agronomic Recommendations:'
                      : 'Polar Research Protocols:'}
                  </span>
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {(environment === 'farm'
                    ? farmPrediction?.farmerAdvice || [
                        'Maintain drip irrigation cycles during night to optimize transpiration.',
                        'Erect multi-row shelterbelts to protect elongating stalks from lodging.',
                        'Monitor soil moisture sensors to ensure active root zone aeration.'
                      ]
                    : polarPrediction?.researchAdvice || [
                        'Deploy automated oceanographic CTD gliders to measure basal ice shelf melt.',
                        'Maintain satellite radar interferometry monitoring of grounding line migration.',
                        'Sustain continuous eddy-covariance atmospheric methane flux sensor towers.'
                      ]
                  ).map((adv: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER BAR                                                                */}
        {/* ========================================================================= */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {environment === 'farm'
                ? 'Agricultural simulator modeled with FAO-56 Penman-Monteith, GDD, and Medlyn stomatal equations.'
                : 'Polar cryosphere simulator modeled with NOAA Siple-Passel wind chill, ice shelf albedo, and calving thermodynamics.'}
            </span>
          </div>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer border border-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
