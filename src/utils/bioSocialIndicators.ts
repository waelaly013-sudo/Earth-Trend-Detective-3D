/**
 * NASA Earth Trend Detective - Biological & Social Action Indicators
 * Synthesizes abstract physical variables (Land Surface Temperature, Anomaly, Surface Pressure)
 * into concrete biological thresholds (human heat safety, crop pollen sterility, vector disease window)
 * and socially actionable municipal directives (grid cooling demand, water rationing tier, labor shifts).
 */

import { ActiveInspectorItem, ClimateRegion } from '../types/climate';

export type HeatIllnessAlertLevel =
  | 'Normal'
  | 'Caution (Hydration Alert)'
  | 'Advisory (Labor Rest Cycles)'
  | 'Warning (High Heatstroke Risk)'
  | 'Emergency (Lethal Thermal Strain)';

export type CropStressTier =
  | 'Optimal Growth'
  | 'Mild Heat Stress'
  | 'Pollen Sterility Hazard'
  | 'Severe Reproductive Failure';

export type GridStressLevel =
  | 'Nominal Load'
  | 'Elevated Cooling Demand'
  | 'High Peak Strain'
  | 'Critical Brownout Hazard';

export type WaterRationingTier =
  | 'Tier 0: Normal Reserves'
  | 'Tier 1: Voluntary Conservation'
  | 'Tier 2: Irrigation & Daytime Ban'
  | 'Tier 3: Emergency Reserve Rationing';

export type InfrastructureRisk =
  | 'Low Thermal Strain'
  | 'Moderate Track Expansion'
  | 'Asphalt Softening & Rail Buckling Risk';

export interface ActionGuideline {
  sector: 'Public Health' | 'Agriculture' | 'Energy Grid' | 'Civil Infrastructure';
  title: string;
  action: string;
  urgency: 'routine' | 'advisory' | 'immediate';
  icon: string;
}

export interface BioSocialSynthesis {
  // Primary Summary
  headline: string;
  primaryRiskSector: string;
  overallThreatScore: number; // 0 to 100

  // Biological: Human Thermal Physiology (WBGT / Labor)
  estimatedWbgtC: number;
  heatIllnessAlert: HeatIllnessAlertLevel;
  outdoorLaborCapacityLossPct: number; // 0 to 90%
  recommendedWorkRestCycle: string;
  vulnerablePopulationsAdvisory: string;

  // Biological: Agro-Ecosystem & Biome Shock
  cropStressTier: CropStressTier;
  estimatedCropYieldDeficitPct: number; // e.g. -4% to -28%
  cropRiskDescription: string;
  vectorDiseaseDaysExpansion: number; // +X days/yr suitable for mosquito transmission
  wildfireDroughtPressureIndex: number; // 1.0 to 5.0x

  // Social & Civic Actionable Indicators
  coolingElectricityDemandSurgePct: number; // +X% peak grid surge
  gridStressLevel: GridStressLevel;
  waterRationingTier: WaterRationingTier;
  infrastructureRisk: InfrastructureRisk;
  railSpeedRestrictionAdvised: boolean;

  // Immediate Action Directives
  actionDirectives: ActionGuideline[];
}

export type BioLocationContext =
  | ActiveInspectorItem
  | {
      lat: number;
      lng: number;
      id?: string;
      name?: string;
      domain?: string;
      continent?: string;
      [key: string]: any;
    };

// What this does: Guesses normal local humidity, air pressure, and whether a place is a farm zone or crowded city based on its map position and region type.
// On the website: Helps calculate realistic heat-stress and crop risk warnings even when only temperature is given.
// Used as: Background environment helper for the Bio-Social Indicators card.
function estimateEnvironmentalContext(item: BioLocationContext): {
  relativeHumidityPct: number;
  surfacePressureHpa: number;
  isAgriculturalZone: boolean;
  isUrbanDense: boolean;
} {
  const lat = Math.abs(item.lat);

  // Default standard sea level pressure
  let surfacePressureHpa = 1013.25;

  // Altitude/terrain adjustments for known high-elevation landmarks
  if ('id' in item) {
    if (item.id === 'tibetan-plateau') surfacePressureHpa = 620; // High altitude ~4500m
    else if (item.id === 'california-sierra') surfacePressureHpa = 850;
    else if (item.id === 'greenland-ice-sheet') surfacePressureHpa = 720;
    else if (item.id === 'nepal' || item.id === 'bolivia') surfacePressureHpa = 750;
  }

  // Relative humidity estimate based on latitudinal bands and domains
  let relativeHumidityPct = 60;

  if ('domain' in item) {
    const domain = (item as ClimateRegion).domain;
    if (domain === 'Cryosphere') relativeHumidityPct = 40;
    else if (domain === 'Hydrosphere' || domain === 'Ocean Heat') relativeHumidityPct = 80;
    else if (domain === 'Biosphere') relativeHumidityPct = 75;
    else if (domain === 'Atmosphere') relativeHumidityPct = 50;
  } else if ('continent' in item) {
    const continent = (item as { continent: string }).continent;
    if (continent === 'Africa') relativeHumidityPct = 45;
    else if (continent === 'South America') relativeHumidityPct = 75;
    else if (continent === 'Asia') relativeHumidityPct = 68;
    else if (continent === 'Europe') relativeHumidityPct = 62;
    else if (continent === 'North America') relativeHumidityPct = 58;
    else if (continent === 'Oceania') relativeHumidityPct = 55;
  }

  // Intertropical Convergence Zone (ITCZ) humidity boost
  if (lat < 15) {
    relativeHumidityPct = Math.min(88, relativeHumidityPct + 15);
  } else if (lat > 20 && lat < 35) {
    // Subtropical desert high-pressure belts
    relativeHumidityPct = Math.max(25, relativeHumidityPct - 20);
  }

  const isAgriculturalZone = lat >= 10 && lat <= 55;
  const isUrbanDense = lat >= 20 && lat <= 50;

  return { relativeHumidityPct, surfacePressureHpa, isAgriculturalZone, isUrbanDense };
}

// What this does: Combines air temperature and humidity to estimate "feels-like heat stress in the shade" (Wet-Bulb Globe Temperature).
// On the website: Shows the heat safety score and outdoor worker rest recommendations in the side panel.
// Used as: The human heat-safety math helper.
function calculateEstimatedWbgt(tempC: number, rhPct: number): number {
  if (tempC < 10) return tempC;
  // Natural wet bulb temperature approximation (Stull formula simplified)
  const tw =
    tempC * Math.atan(0.151977 * Math.sqrt(rhPct + 8.313659)) +
    Math.atan(tempC + rhPct) -
    Math.atan(rhPct - 1.676331) +
    0.00391838 * Math.pow(rhPct, 1.5) * Math.atan(0.023101 * rhPct) -
    4.686035;

  // Approximate shaded WBGT: ~0.7 Tw + 0.3 Ta
  const wbgt = 0.7 * tw + 0.3 * tempC;
  return Number(wbgt.toFixed(1));
}

// What this does: Turns raw weather numbers into everyday human impacts—like worker heat safety, crop yield loss, mosquito season growth, AC power spikes, and water saving tiers.
// On the website: Fills the entire "Bio-Social Indicators" card inside the country/hotspot side panel so people see how climate change affects real daily life.
// Used as: The real-world impact translator for any chosen place on Earth.
export function synthesizeBioSocialIndicators(
  item: BioLocationContext,
  currentTempC: number,
  anomalyC: number,
  year: number
): BioSocialSynthesis {
  const env = estimateEnvironmentalContext(item);
  const wbgt = calculateEstimatedWbgt(currentTempC, env.relativeHumidityPct);

  // 1. Human Thermal Physiology & Occupational Labor
  let heatIllnessAlert: HeatIllnessAlertLevel = 'Normal';
  let outdoorLaborCapacityLossPct = 0;
  let recommendedWorkRestCycle = 'Continuous work permitted (Standard hydration)';
  let vulnerablePopulationsAdvisory = 'Normal ambient conditions for general public.';

  if (wbgt >= 33.5 || currentTempC >= 42) {
    heatIllnessAlert = 'Emergency (Lethal Thermal Strain)';
    outdoorLaborCapacityLossPct = 85;
    recommendedWorkRestCycle = '10 min light work / 50 min shaded rest or halt strenuous labor';
    vulnerablePopulationsAdvisory = 'Severe medical emergency for elderly, infants, and outdoors: 100% AC access required.';
  } else if (wbgt >= 30.5 || currentTempC >= 38) {
    heatIllnessAlert = 'Warning (High Heatstroke Risk)';
    outdoorLaborCapacityLossPct = 55;
    recommendedWorkRestCycle = '15 min work / 45 min shaded rest per hour';
    vulnerablePopulationsAdvisory = 'High risk of heat exhaustion and kidney strain; open civic cooling centers.';
  } else if (wbgt >= 28.0 || currentTempC >= 33) {
    heatIllnessAlert = 'Advisory (Labor Rest Cycles)';
    outdoorLaborCapacityLossPct = 30;
    recommendedWorkRestCycle = '30 min work / 30 min rest; mandatory hydration intervals';
    vulnerablePopulationsAdvisory = 'Restrict non-essential outdoor physical exertion during 11:00-16:00.';
  } else if (wbgt >= 25.5 || currentTempC >= 29) {
    heatIllnessAlert = 'Caution (Hydration Alert)';
    outdoorLaborCapacityLossPct = 12;
    recommendedWorkRestCycle = '45 min work / 15 min rest; 750ml water/hour mandated';
    vulnerablePopulationsAdvisory = 'Adequate fluid replacement advised for outdoor workers and athletes.';
  }

  // 2. Agricultural & Ecosystem Biological Indicators
  let cropStressTier: CropStressTier = 'Optimal Growth';
  let estimatedCropYieldDeficitPct = 0;
  let cropRiskDescription = 'Temperatures within staple crop photosynthesis optimum range.';

  if (currentTempC >= 36) {
    cropStressTier = 'Severe Reproductive Failure';
    estimatedCropYieldDeficitPct = Number((18 + Math.max(0, anomalyC) * 6).toFixed(1));
    cropRiskDescription = 'Maize/wheat pollen denaturing; irreversible flower shedding and yield collapse.';
  } else if (currentTempC >= 32) {
    cropStressTier = 'Pollen Sterility Hazard';
    estimatedCropYieldDeficitPct = Number((9 + Math.max(0, anomalyC) * 4.5).toFixed(1));
    cropRiskDescription = 'Critical reproductive shock threshold breached; grain filling rate suppressed.';
  } else if (currentTempC >= 28 && anomalyC >= 1.2) {
    cropStressTier = 'Mild Heat Stress';
    estimatedCropYieldDeficitPct = Number((3.5 + Math.max(0, anomalyC) * 2.5).toFixed(1));
    cropRiskDescription = 'Accelerated vegetative senescence; increased irrigation requirement.';
  }

  // Mosquito Vector Breeding Expansion (optimal between 23C and 32C with adequate anomaly)
  let vectorDiseaseDaysExpansion = 0;
  if (currentTempC >= 18 && currentTempC <= 34) {
    vectorDiseaseDaysExpansion = Math.round(Math.max(0, anomalyC * 16));
  }

  // Wildfire Drought Pressure Multiplier
  const wildfireDroughtPressureIndex = Number(
    Math.min(5.0, Math.max(1.0, 1.0 + (anomalyC > 0 ? anomalyC * 0.9 : 0) + (currentTempC > 28 ? (currentTempC - 28) * 0.15 : 0))).toFixed(1)
  );

  // 3. Social & Civic Infrastructure Indicators
  // Cooling electricity surge: ~5% to 8% per deg above 22C
  let coolingElectricityDemandSurgePct = 0;
  if (currentTempC > 22) {
    coolingElectricityDemandSurgePct = Number(((currentTempC - 22) * 5.8 + Math.max(0, anomalyC) * 4.2).toFixed(1));
  }

  let gridStressLevel: GridStressLevel = 'Nominal Load';
  if (coolingElectricityDemandSurgePct >= 40) {
    gridStressLevel = 'Critical Brownout Hazard';
  } else if (coolingElectricityDemandSurgePct >= 22) {
    gridStressLevel = 'High Peak Strain';
  } else if (coolingElectricityDemandSurgePct >= 8) {
    gridStressLevel = 'Elevated Cooling Demand';
  }

  // Water rationing tier
  let waterRationingTier: WaterRationingTier = 'Tier 0: Normal Reserves';
  if (wildfireDroughtPressureIndex >= 3.5 || anomalyC >= 2.5) {
    waterRationingTier = 'Tier 3: Emergency Reserve Rationing';
  } else if (wildfireDroughtPressureIndex >= 2.5 || anomalyC >= 1.6) {
    waterRationingTier = 'Tier 2: Irrigation & Daytime Ban';
  } else if (wildfireDroughtPressureIndex >= 1.7 || anomalyC >= 0.8) {
    waterRationingTier = 'Tier 1: Voluntary Conservation';
  }

  // Infrastructure Risk (Rail & Asphalt)
  let infrastructureRisk: InfrastructureRisk = 'Low Thermal Strain';
  let railSpeedRestrictionAdvised = false;
  if (currentTempC >= 38) {
    infrastructureRisk = 'Asphalt Softening & Rail Buckling Risk';
    railSpeedRestrictionAdvised = true;
  } else if (currentTempC >= 32) {
    infrastructureRisk = 'Moderate Track Expansion';
  }

  // Calculate Overall Threat Score (0 - 100)
  const thermalScore = Math.min(40, Math.max(0, (wbgt - 20) * 2.5));
  const anomalyScore = Math.min(30, Math.max(0, anomalyC * 12));
  const gridScore = Math.min(30, coolingElectricityDemandSurgePct * 0.6);
  const overallThreatScore = Math.min(100, Math.round(thermalScore + anomalyScore + gridScore));

  // Determine Primary Risk Sector
  let primaryRiskSector = 'Stable Equilibrium';
  let headline = 'Telemetry within baseline resilience envelopes.';
  if (overallThreatScore >= 70) {
    primaryRiskSector = 'Acute Multi-Sector Emergency';
    headline = 'Severe compound shock: Human heat threshold and electrical grid operating under critical stress.';
  } else if (heatIllnessAlert === 'Warning (High Heatstroke Risk)' || heatIllnessAlert === 'Emergency (Lethal Thermal Strain)') {
    primaryRiskSector = 'Public Health & Outdoor Labor';
    headline = 'Human physiological heat limits breached: Substantial outdoor labor capacity loss.';
  } else if (cropStressTier === 'Severe Reproductive Failure' || cropStressTier === 'Pollen Sterility Hazard') {
    primaryRiskSector = 'Agricultural Grain Security';
    headline = 'Staple grain reproductive pollination failure imminent due to sustained thermal shock.';
  } else if (gridStressLevel === 'High Peak Strain' || gridStressLevel === 'Critical Brownout Hazard') {
    primaryRiskSector = 'Municipal Power & Grid';
    headline = 'Air conditioning surge threatening localized distribution transformer trip-outs.';
  } else if (wildfireDroughtPressureIndex >= 2.8) {
    primaryRiskSector = 'Watershed & Wildfire';
    headline = 'High vapor pressure deficit exacerbating forest fuel aridity and reservoir depletion.';
  }

  // Generate 4 Concrete, Actionable Directives
  const actionDirectives: ActionGuideline[] = [];

  // Public Health directive
  if (outdoorLaborCapacityLossPct >= 30) {
    actionDirectives.push({
      sector: 'Public Health',
      title: 'Mandate Dawn Labor Shifts & Cooling Centers',
      action: `Shift agricultural and construction crews to 05:00–10:00. Open air-conditioned municipal cooling refuges for unhoused and elderly citizens.`,
      urgency: outdoorLaborCapacityLossPct >= 55 ? 'immediate' : 'advisory',
      icon: '🏥',
    });
  } else {
    actionDirectives.push({
      sector: 'Public Health',
      title: 'Standard Occupational Hydration',
      action: 'Ensure clean drinking water supply and shaded rest pavilions at municipal and industrial worksites.',
      urgency: 'routine',
      icon: '💧',
    });
  }

  // Agricultural directive
  if (estimatedCropYieldDeficitPct >= 8) {
    actionDirectives.push({
      sector: 'Agriculture',
      title: 'Emergency Night Irrigation & Shade Mulching',
      action: `Schedule drip irrigation strictly between 21:00–04:00 to reduce evaporative loss; apply organic soil mulching to shield grain root crowns.`,
      urgency: estimatedCropYieldDeficitPct >= 15 ? 'immediate' : 'advisory',
      icon: '🌾',
    });
  } else {
    actionDirectives.push({
      sector: 'Agriculture',
      title: 'Soil Moisture Monitoring',
      action: 'Maintain standard agro-meteorological soil sensor tracking to optimize standard seasonal planting schedules.',
      urgency: 'routine',
      icon: '🌱',
    });
  }

  // Energy Grid directive
  if (coolingElectricityDemandSurgePct >= 15) {
    actionDirectives.push({
      sector: 'Energy Grid',
      title: 'Enact Peak Cooling Load-Shedding & Pre-Cooling',
      action: `Signal smart thermostats to pre-cool municipal buildings prior to 13:00; ready utility battery storage reserves to prevent substation trip-outs.`,
      urgency: coolingElectricityDemandSurgePct >= 30 ? 'immediate' : 'advisory',
      icon: '⚡',
    });
  } else {
    actionDirectives.push({
      sector: 'Energy Grid',
      title: 'Grid Baseline Stability',
      action: 'Power grid operating within standard dispatch tolerances; routine transmission monitoring active.',
      urgency: 'routine',
      icon: '🔋',
    });
  }

  // Civil Infrastructure directive
  if (railSpeedRestrictionAdvised) {
    actionDirectives.push({
      sector: 'Civil Infrastructure',
      title: 'Impose Rail Speed Restrictions & Pavement Audits',
      action: `Cap passenger and freight rail speeds to 60 km/h on unshaded tracks to prevent thermal misalignment derailments; inspect airport runway joint sealant.`,
      urgency: 'immediate',
      icon: '🚆',
    });
  } else if (waterRationingTier !== 'Tier 0: Normal Reserves') {
    actionDirectives.push({
      sector: 'Civil Infrastructure',
      title: 'Water Utility Rationing Protocol',
      action: `Enforce municipal bans on non-essential decorative fountains and daytime residential lawn watering to protect reservoir buffers.`,
      urgency: 'advisory',
      icon: '🚰',
    });
  } else {
    actionDirectives.push({
      sector: 'Civil Infrastructure',
      title: 'Routine Municipal Maintenance',
      action: 'Maintain regular storm drainage clearing and urban tree canopy maintenance cycles.',
      urgency: 'routine',
      icon: '🏗️',
    });
  }

  return {
    headline,
    primaryRiskSector,
    overallThreatScore,
    estimatedWbgtC: wbgt,
    heatIllnessAlert,
    outdoorLaborCapacityLossPct,
    recommendedWorkRestCycle,
    vulnerablePopulationsAdvisory,
    cropStressTier,
    estimatedCropYieldDeficitPct,
    cropRiskDescription,
    vectorDiseaseDaysExpansion,
    wildfireDroughtPressureIndex,
    coolingElectricityDemandSurgePct,
    gridStressLevel,
    waterRationingTier,
    infrastructureRisk,
    railSpeedRestrictionAdvised,
    actionDirectives,
  };
}
