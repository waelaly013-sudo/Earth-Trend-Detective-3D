/**
 * NASA Earth Trend Detective - Climate Alerts & Scientific Milestone Engine
 * Evaluates threshold-based scientific milestones (IPCC AR6, Paris Agreement, NOAA Coral Reef Watch, WMO)
 * for any selected country, NASA hotspot, or planetary coordinate.
 */

import { ActiveInspectorItem, ClimateRegion } from '../types/climate';
import { getGlobalMeanAnomaly, calculateMonthlyTemperature, MONTH_NAMES } from '../data/countriesData';

export type AlertStatus = 'TRIGGERED' | 'IMMINENT' | 'APPROACHING' | 'SAFE';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface ClimateAlertMilestone {
  id: string;
  title: string;
  category: 'Thermal Anomaly' | 'Seasonal Extremes' | 'Tipping Point' | 'Ecosystem & Human';
  thresholdValue: number;
  currentValue: number;
  unit: string;
  status: AlertStatus;
  crossingYear: number | null; // e.g. 2018 or 2031
  severity: AlertSeverity;
  scientificBasis: string;
  observedImpact: string;
  adaptationAction: string;
  progressPercent: number; // 0 to 100+
}

export interface ClimateAlertsReport {
  locationName: string;
  flagEmoji?: string;
  famousLandmark?: string;
  currentYear: number;
  currentMonth: number;
  anomalyC: number;
  currentTempC: number;
  criticalCount: number;
  imminentCount: number;
  approachingCount: number;
  safeCount: number;
  highestSeverity: AlertSeverity;
  primaryWarningHeadline: string;
  alerts: ClimateAlertMilestone[];
}

// What this does: Calculates how many degrees warmer (or cooler) a country, hotspot, or point is in any given year from 2000 to 2040.
// On the website: Feeds the "+X.X°C" warming numbers into the alert cards and progress bars.
// Used as: The yearly temperature-change helper inside climate alert checks.
export function getAnomalyForYear(item: ActiveInspectorItem, y: number): number {
  const globalAnomaly = getGlobalMeanAnomaly(y);
  if ('type' in item && item.type === 'country') {
    const yearOffset = y - 2000;
    const decadalGain = (item.warmingRateDecadeC / 10) * yearOffset;
    return Number((decadalGain + (globalAnomaly - 0.65) * (item.warmingMultiplier - 1.0) * 0.4).toFixed(2));
  }
  if ('type' in item && item.type === 'custom') {
    const latAbs = Math.abs(item.lat);
    const amp = 1.0 + 1.4 * (latAbs / 90);
    return Number((globalAnomaly * amp).toFixed(2));
  }
  const hotspot = item as ClimateRegion;
  const latAbs = Math.abs(hotspot.lat);
  let amp = 1.3;
  if (hotspot.id === 'arctic-sea-ice') amp = 2.8;
  else if (hotspot.id === 'greenland-ice-sheet') amp = 2.9;
  else if (hotspot.id === 'antarctic-pine-island') amp = 2.3;
  else if (hotspot.id === 'tibetan-plateau') amp = 1.9;
  else if (hotspot.id === 'sahara-sahel') amp = 1.6;
  else if (hotspot.id === 'amazon-basin') amp = 1.35;
  else if (hotspot.id === 'great-barrier-reef') amp = 1.3;
  else if (hotspot.id === 'north-atlantic-sst') amp = 1.4;
  else if (hotspot.id === 'california-sierra') amp = 1.5;
  else if (hotspot.id === 'lake-chad-basin') amp = 1.4;
  else amp = 1.0 + 1.3 * (latAbs / 90);

  return Number((globalAnomaly * amp).toFixed(2));
}

// What this does: Loops from year 2000 to 2040 to find the exact first year when warming crosses a danger threshold (like +1.5°C).
// On the website: Shows users "Crosses in 2029" inside the Climate Alerts window so they can see when a danger point hits.
// Used as: The threshold crossing-year finder.
function findAnomalyCrossingYear(item: ActiveInspectorItem, threshold: number): number | null {
  for (let y = 2000; y <= 2040; y++) {
    const a = getAnomalyForYear(item, y);
    if (a >= threshold) {
      return y;
    }
  }
  return null;
}

// What this does: Checks all major climate danger rules (Paris +1.5°C limit, summer heatwaves, coral/ice thresholds) for the selected place and builds a full warning report.
// On the website: Powers the "Climate Threshold Alerts" popup window and warning counters in the side panel.
// Used as: The main alert evaluation engine for any country or hotspot.
export function evaluateClimateAlerts(
  item: ActiveInspectorItem,
  currentYear: number,
  currentMonth: number = 7
): ClimateAlertsReport {
  const currentAnomaly = getAnomalyForYear(item, currentYear);

  // Extract baseline and rates
  let baselineTemp = 20.0;
  let rateDecade = 0.35;
  let warmingMultiplier = 1.3;

  if ('type' in item && item.type === 'country') {
    baselineTemp = item.baselineTempC;
    rateDecade = item.warmingRateDecadeC;
    warmingMultiplier = item.warmingMultiplier;
  } else if ('type' in item && item.type === 'custom') {
    const latAbs = Math.abs(item.lat);
    baselineTemp = Number((28 - 45 * Math.pow(Math.sin((latAbs * Math.PI) / 180), 1.8)).toFixed(1));
    rateDecade = Number((0.26 * (1.0 + 1.4 * (latAbs / 90))).toFixed(2));
    warmingMultiplier = 1.0 + 1.2 * (latAbs / 90);
  } else {
    const h = item as ClimateRegion;
    if (h.id === 'arctic-sea-ice') { baselineTemp = -16.5; rateDecade = 0.78; warmingMultiplier = 2.8; }
    else if (h.id === 'greenland-ice-sheet') { baselineTemp = -18.2; rateDecade = 0.81; warmingMultiplier = 2.9; }
    else if (h.id === 'antarctic-pine-island') { baselineTemp = -24.8; rateDecade = 0.64; warmingMultiplier = 2.3; }
    else if (h.id === 'tibetan-plateau') { baselineTemp = 1.5; rateDecade = 0.53; warmingMultiplier = 1.9; }
    else if (h.id === 'sahara-sahel') { baselineTemp = 28.5; rateDecade = 0.45; warmingMultiplier = 1.6; }
    else if (h.id === 'amazon-basin') { baselineTemp = 26.2; rateDecade = 0.38; warmingMultiplier = 1.35; }
    else if (h.id === 'great-barrier-reef') { baselineTemp = 26.8; rateDecade = 0.36; warmingMultiplier = 1.3; }
    else if (h.id === 'north-atlantic-sst') { baselineTemp = 12.4; rateDecade = 0.39; warmingMultiplier = 1.4; }
    else if (h.id === 'california-sierra') { baselineTemp = 14.8; rateDecade = 0.42; warmingMultiplier = 1.5; }
    else if (h.id === 'lake-chad-basin') { baselineTemp = 28.0; rateDecade = 0.39; warmingMultiplier = 1.4; }
    else {
      const latAbs = Math.abs(h.lat);
      baselineTemp = Number((27 - 44 * Math.pow(Math.sin((latAbs * Math.PI) / 180), 1.8)).toFixed(1));
      rateDecade = Number((0.28 * (1.0 + 1.3 * (latAbs / 90))).toFixed(2));
    }
  }

  const currentTempC = Number((baselineTemp + currentAnomaly).toFixed(1));

  // Monthly temperature climatology
  const locProfile = { lat: item.lat, baselineTempC: baselineTemp, warmingRateDecadeC: rateDecade, warmingMultiplier };
  const currentMonthData = calculateMonthlyTemperature(locProfile, currentYear, currentMonth);

  // Peak summer month temperature
  const isNorthern = item.lat >= 0;
  const peakWarmMonth = isNorthern ? 7 : 1;
  const peakWarmData = calculateMonthlyTemperature(locProfile, currentYear, peakWarmMonth);

  const alerts: ClimateAlertMilestone[] = [];

  // Helper to determine status and progress
  const getStatus = (current: number, threshold: number, crossingYr: number | null): AlertStatus => {
    if (current >= threshold || (crossingYr !== null && crossingYr <= currentYear)) {
      return 'TRIGGERED';
    }
    if (crossingYr !== null && crossingYr <= currentYear + 5) {
      return 'IMMINENT';
    }
    if (crossingYr !== null && crossingYr <= 2040) {
      return 'APPROACHING';
    }
    return 'SAFE';
  };

  // 1. Threshold 1: +1.5°C Paris Agreement Limit
  const t1Limit = 1.5;
  const t1Year = findAnomalyCrossingYear(item, t1Limit);
  const t1Status = getStatus(currentAnomaly, t1Limit, t1Year);
  alerts.push({
    id: 'paris-1-5c',
    title: '+1.5°C Paris Agreement Guardrail',
    category: 'Thermal Anomaly',
    thresholdValue: t1Limit,
    currentValue: currentAnomaly,
    unit: '°C',
    status: t1Status,
    crossingYear: t1Year,
    severity: t1Status === 'TRIGGERED' ? 'CRITICAL' : t1Status === 'IMMINENT' ? 'HIGH' : 'MODERATE',
    scientificBasis: 'UNFCCC Paris Agreement Article 2 & IPCC Special Report on 1.5°C (SR15).',
    observedImpact: 'Exceeding this boundary sharply increases extreme rainfall volatility, agricultural heat stress, and shifts marine habitats poleward.',
    adaptationAction: 'Deploy renewable micro-grids, expand municipal shaded green corridors, and enforce building insulation thermal codes.',
    progressPercent: Math.min(150, Math.round((currentAnomaly / t1Limit) * 100)),
  });

  // 2. Threshold 2: +2.0°C High-Risk Tipping Threshold
  const t2Limit = 2.0;
  const t2Year = findAnomalyCrossingYear(item, t2Limit);
  const t2Status = getStatus(currentAnomaly, t2Limit, t2Year);
  alerts.push({
    id: 'paris-2-0c',
    title: '+2.0°C Severe Destabilization Limit',
    category: 'Thermal Anomaly',
    thresholdValue: t2Limit,
    currentValue: currentAnomaly,
    unit: '°C',
    status: t2Status,
    crossingYear: t2Year,
    severity: t2Status === 'TRIGGERED' ? 'CRITICAL' : t2Status === 'IMMINENT' ? 'HIGH' : 'MODERATE',
    scientificBasis: 'IPCC WGII Sixth Assessment Report (AR6) Chapter 16 Key Risks & Burning Embers.',
    observedImpact: 'Doubling of extreme drought frequency, acute surface water deficits in summer months, and accelerated loss of endemic species.',
    adaptationAction: 'Implement drip irrigation mandates, wastewater recycling, and early heat-health emergency response systems.',
    progressPercent: Math.min(150, Math.round((currentAnomaly / t2Limit) * 100)),
  });

  // 3. Threshold 3: +2.5°C Regional Extreme Heating
  const t3Limit = 2.5;
  const t3Year = findAnomalyCrossingYear(item, t3Limit);
  const t3Status = getStatus(currentAnomaly, t3Limit, t3Year);
  alerts.push({
    id: 'extreme-2-5c',
    title: '+2.5°C Regional Hyper-Warming',
    category: 'Thermal Anomaly',
    thresholdValue: t3Limit,
    currentValue: currentAnomaly,
    unit: '°C',
    status: t3Status,
    crossingYear: t3Year,
    severity: t3Status === 'TRIGGERED' ? 'CRITICAL' : t3Status === 'IMMINENT' ? 'HIGH' : 'MODERATE',
    scientificBasis: 'NASA GISTEMP v4 & WMO State of the Global Climate Indicators.',
    observedImpact: 'Persistent atmospheric heat domes, extensive wildfire fuel drying, and severe degradation of topsoil moisture reserves.',
    adaptationAction: 'Construct regional water retention reservoirs, install cool-pavement reflective coatings, and establish climate-resilient crop reserves.',
    progressPercent: Math.min(150, Math.round((currentAnomaly / t3Limit) * 100)),
  });

  // 4. Threshold 4: +3.0°C Planetary Biome Transformation
  const t4Limit = 3.0;
  const t4Year = findAnomalyCrossingYear(item, t4Limit);
  const t4Status = getStatus(currentAnomaly, t4Limit, t4Year);
  alerts.push({
    id: 'catastrophic-3-0c',
    title: '+3.0°C Biome & Permafrost Collapse Boundary',
    category: 'Thermal Anomaly',
    thresholdValue: t4Limit,
    currentValue: currentAnomaly,
    unit: '°C',
    status: t4Status,
    crossingYear: t4Year,
    severity: t4Status === 'TRIGGERED' ? 'CRITICAL' : t4Status === 'IMMINENT' ? 'HIGH' : 'LOW',
    scientificBasis: 'IPCC AR6 WGI Chapter 4 & Global Tipping Points Report (Lenton et al.).',
    observedImpact: 'Non-linear ecological restructuring, potential transition of closed forests to dry savanna, and irreversible permafrost carbon release.',
    adaptationAction: 'National strategic retreat planning in high-risk zones, reforestation buffer belts, and radical emissions abatement.',
    progressPercent: Math.min(150, Math.round((currentAnomaly / t4Limit) * 100)),
  });

  // 5. Threshold 5: Peak Summer Human Heat Stress (38°C / 40°C or +4°C summer swing)
  // Determine realistic local extreme heat threshold based on baseline
  const heatStressThreshold = baselineTemp > 24 ? 40.0 : baselineTemp > 16 ? 36.0 : 28.0;
  const peakSummerTemp = peakWarmData.monthlyTempC;
  const heatStressTriggered = peakSummerTemp >= heatStressThreshold;
  const heatStressImminent = peakSummerTemp >= heatStressThreshold - 1.2;
  alerts.push({
    id: 'heat-stress-extreme',
    title: `Extreme Summer Physiological Stress (${heatStressThreshold}°C Max)`,
    category: 'Seasonal Extremes',
    thresholdValue: heatStressThreshold,
    currentValue: peakSummerTemp,
    unit: '°C',
    status: heatStressTriggered ? 'TRIGGERED' : heatStressImminent ? 'IMMINENT' : 'SAFE',
    crossingYear: heatStressTriggered ? currentYear : null,
    severity: heatStressTriggered ? 'CRITICAL' : heatStressImminent ? 'HIGH' : 'MODERATE',
    scientificBasis: 'WHO/WMO Heat-Health Action Plans & Wet-Bulb Globe Temperature (WBGT) Limits.',
    observedImpact: `Peak ${MONTH_NAMES[peakWarmMonth - 1]} average temperatures reaching ${peakSummerTemp}°C threaten outdoor labor safety and escalate peak electrical grid cooling loads.`,
    adaptationAction: 'Legislate mandatory work pauses during peak daytime thermal hours, establish public air-conditioned cooling centers.',
    progressPercent: Math.min(140, Math.round((peakSummerTemp / heatStressThreshold) * 100)),
  });

  // 6. Threshold 6: Decadal Acceleration Alert (>0.35°C / decade)
  const rateLimit = 0.35;
  const rateTriggered = rateDecade >= rateLimit;
  alerts.push({
    id: 'decadal-acceleration',
    title: 'Amplified Decadal Warming Pace (>0.35°C/dec)',
    category: 'Tipping Point',
    thresholdValue: rateLimit,
    currentValue: rateDecade,
    unit: '°C/decade',
    status: rateTriggered ? 'TRIGGERED' : 'SAFE',
    crossingYear: 2000,
    severity: rateDecade >= 0.5 ? 'CRITICAL' : rateTriggered ? 'HIGH' : 'LOW',
    scientificBasis: 'Sen’s Slope Non-Parametric Estimator & NOAA National Centers for Environmental Information.',
    observedImpact: `Warming at ${rateDecade}°C per decade exceeds planetary background velocity, shrinking the evolutionary adaptation window for local flora and fauna.`,
    adaptationAction: 'Accelerate biodiversity conservation corridors and implement assisted species migration programs.',
    progressPercent: Math.min(180, Math.round((rateDecade / rateLimit) * 100)),
  });

  // 7. Domain / Location Specific Critical Milestone
  let domainAlert: ClimateAlertMilestone | null = null;
  const isHotspot = !('type' in item) || item.type === 'hotspot';
  const hotspotId = isHotspot ? (item as ClimateRegion).id : '';

  if (hotspotId === 'arctic-sea-ice') {
    domainAlert = {
      id: 'blue-ocean-event',
      title: 'Arctic Blue Ocean Event (<1.0M km² Sea Ice)',
      category: 'Tipping Point',
      thresholdValue: 1.0,
      currentValue: currentYear >= 2035 ? 0.9 : 3.8,
      unit: 'M km²',
      status: currentYear >= 2035 ? 'TRIGGERED' : currentYear >= 2030 ? 'IMMINENT' : 'APPROACHING',
      crossingYear: 2034,
      severity: 'CRITICAL',
      scientificBasis: 'CMIP6 Multi-Model Sea Ice Extent Projections & NASA Cryospheric Sciences.',
      observedImpact: 'Near total loss of multi-year polar pack ice during September minimum, shifting Arctic albedo from 0.85 (reflective) to 0.07 (absorbing ocean).',
      adaptationAction: 'International maritime regulation of emerging Arctic shipping lanes and strict polar black carbon emission bans.',
      progressPercent: Math.min(100, Math.round(((currentYear - 2000) / 34) * 100)),
    };
  } else if (hotspotId === 'amazon-basin') {
    domainAlert = {
      id: 'amazon-dieback-point',
      title: 'Amazon Basin Hydro-Ecological Tipping Point (>20% Deforestation + Warming)',
      category: 'Tipping Point',
      thresholdValue: 20.0,
      currentValue: currentYear >= 2031 ? 21.4 : 17.8,
      unit: '% Canopy Deficit',
      status: currentYear >= 2031 ? 'TRIGGERED' : currentYear >= 2027 ? 'IMMINENT' : 'APPROACHING',
      crossingYear: 2031,
      severity: 'CRITICAL',
      scientificBasis: 'Nobre et al. (Science Advances) & NASA GRACE Terrestrial Water Storage records.',
      observedImpact: 'Loss of self-sustaining atmospheric aerial rivers, transforming dense moist evergreen broadleaf forest into degraded scrub savanna.',
      adaptationAction: 'Immediate moratorium on primary rainforest clearing, aggressive reforestation of the Trans-Amazonian agricultural frontier.',
      progressPercent: Math.min(120, Math.round((currentYear >= 2031 ? 105 : 88))),
    };
  } else if (hotspotId === 'great-barrier-reef') {
    domainAlert = {
      id: 'catastrophic-bleaching-dhw',
      title: 'Mass Coral Bleaching Mortality Threshold (>8 DHW)',
      category: 'Ecosystem & Human',
      thresholdValue: 8.0,
      currentValue: currentYear >= 2026 ? 9.2 : 6.1,
      unit: '°C-weeks',
      status: currentYear >= 2026 ? 'TRIGGERED' : 'IMMINENT',
      crossingYear: 2024,
      severity: 'CRITICAL',
      scientificBasis: 'NOAA Coral Reef Watch Degree Heating Weeks (DHW) Index.',
      observedImpact: 'Multi-year thermal accumulation exceeds symbiont zooxanthellae photosynthetic tolerance, triggering pan-regional skeletal bleaching.',
      adaptationAction: 'Deployment of marine cloud brightening prototypes and selective breeding of thermally resilient larval corals.',
      progressPercent: Math.min(140, Math.round((9.2 / 8.0) * 100)),
    };
  } else if (hotspotId === 'north-atlantic-sst') {
    domainAlert = {
      id: 'amoc-deceleration-threshold',
      title: 'Atlantic Meridional Overturning Circulation Slowdown (>25%)',
      category: 'Tipping Point',
      thresholdValue: 25.0,
      currentValue: currentYear >= 2035 ? 27.5 : 18.2,
      unit: '% Slowdown',
      status: currentYear >= 2035 ? 'TRIGGERED' : currentYear >= 2028 ? 'IMMINENT' : 'APPROACHING',
      crossingYear: 2033,
      severity: 'CRITICAL',
      scientificBasis: 'Rahmstorf et al. & RAPID Array Subpolar Buoy Telemetry.',
      observedImpact: 'Subpolar North Atlantic "cold blob" intensification, destabilizing European storm tracks and exacerbating US East Coast sea-level rise.',
      adaptationAction: 'Coastal surge barrier fortification and long-range winter storm defense preparation.',
      progressPercent: Math.min(115, Math.round((currentYear >= 2035 ? 110 : 73))),
    };
  } else if (hotspotId === 'sahara-sahel' || hotspotId === 'lake-chad-basin') {
    domainAlert = {
      id: 'desertification-front',
      title: 'Sahelian Soil Moisture Deficit & Desertification Surge',
      category: 'Ecosystem & Human',
      thresholdValue: 30.0,
      currentValue: currentYear >= 2025 ? 33.2 : 24.5,
      unit: '% Moisture Deficit',
      status: currentYear >= 2025 ? 'TRIGGERED' : 'IMMINENT',
      crossingYear: 2023,
      severity: 'CRITICAL',
      scientificBasis: 'NASA SMAP (Soil Moisture Active Passive) Satellite & UNCCD Desertification Framework.',
      observedImpact: 'Evaporation heavily outstrips sparse seasonal precipitation, accelerating the southward migration of arid sand dunes.',
      adaptationAction: 'Reinforce the African Great Green Wall bio-barrier with acacia agroforestry and sand dune fixation.',
      progressPercent: Math.min(130, Math.round((33.2 / 30.0) * 100)),
    };
  } else {
    // Country or regional custom point
    const flag = (item as { flagEmoji?: string }).flagEmoji || '🌍';
    domainAlert = {
      id: 'national-vulnerability-alert',
      title: `${item.name} Regional Climate Vulnerability Benchmark`,
      category: 'Ecosystem & Human',
      thresholdValue: 1.8,
      currentValue: currentAnomaly,
      unit: '°C Anomaly',
      status: currentAnomaly >= 1.8 ? 'TRIGGERED' : currentAnomaly >= 1.4 ? 'IMMINENT' : 'SAFE',
      crossingYear: findAnomalyCrossingYear(item, 1.8),
      severity: currentAnomaly >= 1.8 ? 'CRITICAL' : 'HIGH',
      scientificBasis: 'IPCC AR6 Regional Atlas & National Adaptation Plans (NAPs).',
      observedImpact: `Localized warming shifts hydrological cycles, intensifying evaporative soil stress and compounding seasonal peak heatwaves.`,
      adaptationAction: 'Transition agricultural baselines toward drought-tolerant seed varietals and upgrade stormwater retention systems.',
      progressPercent: Math.min(140, Math.round((currentAnomaly / 1.8) * 100)),
    };
  }

  if (domainAlert) {
    alerts.push(domainAlert);
  }

  // Count milestones by status
  const criticalCount = alerts.filter((a) => a.status === 'TRIGGERED').length;
  const imminentCount = alerts.filter((a) => a.status === 'IMMINENT').length;
  const approachingCount = alerts.filter((a) => a.status === 'APPROACHING').length;
  const safeCount = alerts.filter((a) => a.status === 'SAFE').length;

  let highestSeverity: AlertSeverity = 'LOW';
  if (criticalCount > 0) highestSeverity = 'CRITICAL';
  else if (imminentCount > 0) highestSeverity = 'HIGH';
  else if (approachingCount > 0) highestSeverity = 'MODERATE';

  let primaryWarningHeadline = '';
  if (criticalCount >= 3) {
    primaryWarningHeadline = `${criticalCount} Critical Scientific Thresholds Already Breached at ${currentYear}`;
  } else if (criticalCount > 0) {
    primaryWarningHeadline = `${criticalCount} Milestone Triggered • ${imminentCount} Imminent Warnings by 2030`;
  } else if (imminentCount > 0) {
    primaryWarningHeadline = `Approaching Critical Thresholds: ${imminentCount} Milestones Imminent Within 5 Years`;
  } else {
    primaryWarningHeadline = 'All Primary Climate Guardrails Maintained Below Critical Thresholds';
  }

  return {
    locationName: item.name,
    flagEmoji: (item as { flagEmoji?: string }).flagEmoji || '🌍',
    famousLandmark: (item as { famousLandmark?: string }).famousLandmark,
    currentYear,
    currentMonth,
    anomalyC: currentAnomaly,
    currentTempC,
    criticalCount,
    imminentCount,
    approachingCount,
    safeCount,
    highestSeverity,
    primaryWarningHeadline,
    alerts,
  };
}
