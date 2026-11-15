/**
 * Global Countries & Territories Climate Dataset
 * Includes baseline annual mean temperature in Celsius (°C),
 * regional warming amplification factors (IPCC AR6 / CMIP6),
 * iconic landmarks, flag emojis, scientific reasons for temperature change,
 * and high-precision monthly AI temperature prediction models (2000-2040).
 */

// What this does: Defines the climate profile for a country (location, baseline temperature, warming speed, flag, and landmark).
// On the website: Supplies all the details shown when a user clicks or searches for a country on the globe.
// Used as: The item format for every country in COUNTRIES_DATABASE.
export interface CountryClimateData {
  id: string;
  name: string;
  isoCode: string;
  continent: string;
  lat: number;
  lng: number;
  baselineTempC: number;        // Baseline annual mean surface temperature (°C, 1951-1980 / 2000 baseline)
  warmingMultiplier: number;    // Regional climate sensitivity (Arctic = 2.4x - 3.5x, High latitude = 1.6x, Tropics = 1.1x)
  historicalAnomaly2026C: number; // Observed anomaly in 2026 (°C)
  warmingRateDecadeC: number;   // °C per decade
  vulnerabilityStatus: 'Critical' | 'Severe' | 'Elevated' | 'Moderate';
  keyClimateRisk: string;
  flagEmoji: string;
  famousLandmark: string;
  landmarkIcon: string;
  temperatureChangeReasons: string[];
}

// What this does: Lists the full English names of all 12 calendar months in order.
// On the website: Displays readable month names on the timeline slider, voice banner, and report cards.
// Used as: A shared month-name lookup array (1 = January through 12 = December).
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// What this does: Lists the three-letter short names of all 12 calendar months.
// On the website: Shows compact month labels on tight mobile controls, graphs, and timeline ticks.
// Used as: A compact month-name lookup array across charts and timeline bars.
export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// What this does: Calculates the planet's overall average temperature rise above pre-industrial levels for any year.
// On the website: Updates the global temperature anomaly badge as the user scrubs the year slider from 2000 to 2040.
// Used as: The baseline global warming curve shared by country, monthly, and heatmap calculations.
export function getGlobalMeanAnomaly(year: number): number {
  if (year < 2000) {
    const t = Math.max(0, (year - 1980) / 20);
    return Number((0.32 + t * (0.65 - 0.32)).toFixed(2));
  } else if (year <= 2026) {
    const t = (year - 2000) / 26;
    return Number((0.65 + t * (1.38 - 0.65)).toFixed(2));
  } else if (year <= 2050) {
    const t = (year - 2026) / 24;
    return Number((1.38 + t * (2.45 - 1.38)).toFixed(2));
  } else {
    const t = Math.min(1.0, (year - 2050) / 50);
    return Number((2.45 + t * (3.65 - 2.45)).toFixed(2));
  }
}

// What this does: Adjusts the global temperature anomaly slightly for the chosen month's seasonal land-heating swing.
// On the website: Reflects small month-to-month shifts in the global warming readout when changing months.
// Used as: The monthly global anomaly calculator for timeline and header readouts.
export function getGlobalMonthlyAnomaly(year: number, month: number = 7): number {
  const baseAnomaly = getGlobalMeanAnomaly(year);
  // Boreal summer (July = month 7) has maximum landmass solar absorption: +0.08°C; Boreal winter (Jan = month 1): -0.06°C
  const monthAngle = ((month - 7) / 12) * 2 * Math.PI;
  const seasonalDelta = 0.08 * Math.cos(monthAngle);
  return Number((baseAnomaly + seasonalDelta).toFixed(2));
}

// What this does: Estimates a specific country's annual temperature and warming anomaly for any selected year.
// On the website: Shows how much hotter a country is in the chosen year compared to its historical baseline.
// Used as: The country annual temperature calculator for country cards and search previews.
export function getCountryTemperature(
  country: CountryClimateData,
  year: number
): {
  currentTempC: number;
  anomalyC: number;
  baselineTempC: number;
  anomalyVsPreIndustrialC: number;
} {
  const globalAnomaly = getGlobalMeanAnomaly(year);
  const yearOffset = year - 2000;
  const decadalGain = (country.warmingRateDecadeC / 10) * yearOffset;
  const anomalyC = Number((decadalGain + (globalAnomaly - 0.65) * (country.warmingMultiplier - 1.0) * 0.4).toFixed(2));
  const currentTempC = Number((country.baselineTempC + anomalyC).toFixed(2));
  const anomalyVsPreIndustrialC = Number((anomalyC + 0.65).toFixed(2));

  return {
    currentTempC,
    anomalyC,
    baselineTempC: country.baselineTempC,
    anomalyVsPreIndustrialC,
  };
}

// What this does: Estimates a place's temperature for an exact year and month using its latitude, season, and warming speed.
// On the website: Updates the country's temperature, season name, and anomaly right away when you switch months or years.
// Used as: The seasonal monthly temperature model for countries and custom clicked points.
export function calculateMonthlyTemperature(
  location: { lat: number; baselineTempC: number; warmingRateDecadeC: number; warmingMultiplier?: number },
  year: number,
  month: number // 1 to 12
): {
  monthlyTempC: number;
  baselineMonthTempC: number;
  monthAnomalyC: number;
  seasonName: string;
  isPeakWarmMonth: boolean;
  isPeakColdMonth: boolean;
} {
  const lat = location.lat;
  const latAbs = Math.abs(lat);
  const isNorthern = lat >= 0;

  // 1. Seasonal Temperature Amplitude A(latitude) in Celsius
  // Equator has gentle 1.5 - 3°C swing; temperate zones have 12-20°C swing; polar regions reach 28-36°C swing
  const seasonalAmp = Math.max(1.8, 1.8 + 27.5 * Math.pow(latAbs / 90, 1.28));

  // 2. Solar Hemispheric Peak Alignment (July for North, January for South)
  const peakMonth = isNorthern ? 7 : 1; // 7 = July, 1 = January
  const monthAngle = ((month - peakMonth) / 12) * 2 * Math.PI;
  const seasonalSwing = seasonalAmp * Math.cos(monthAngle);

  // 3. Baseline monthly temperature before human-driven post-2000 warming
  const baselineMonthTempC = Number((location.baselineTempC + seasonalSwing).toFixed(1));

  // 4. Decadal warming trend up to the target year
  const globalAnomaly = getGlobalMeanAnomaly(year);
  const yearOffset = year - 2000;
  const multiplier = location.warmingMultiplier ?? (1.0 + 1.2 * (latAbs / 90));
  const baseDecadalAnomaly = (location.warmingRateDecadeC / 10) * yearOffset + (globalAnomaly - 0.65) * (multiplier - 1.0) * 0.4;

  // 5. Monthly Warming Amplification:
  // High-latitude winters warm faster (Arctic amplification / delayed sea-ice freeze).
  // Subtropical summers warm faster (soil desiccation / stationary high pressure heat domes).
  let monthlyAmplification = 1.0;
  if (latAbs > 50 && (month === 12 || month === 1 || month === 2)) {
    monthlyAmplification = 1.22; // High latitude winter amplified warming
  } else if (latAbs >= 18 && latAbs <= 40 && (month >= 6 && month <= 8)) {
    monthlyAmplification = 1.18; // Subtropical summer heat dome amplification
  }

  const monthAnomalyC = Number((baseDecadalAnomaly * monthlyAmplification).toFixed(2));
  const monthlyTempC = Number((baselineMonthTempC + monthAnomalyC).toFixed(1));

  // Season classification
  let seasonName = '';
  if (latAbs < 12) {
    seasonName = month >= 5 && month <= 10 ? 'Equatorial Wet / Monsoonal' : 'Equatorial Dry';
  } else if (isNorthern) {
    if (month >= 3 && month <= 5) seasonName = 'Boreal Spring';
    else if (month >= 6 && month <= 8) seasonName = 'Boreal Summer';
    else if (month >= 9 && month <= 11) seasonName = 'Boreal Autumn';
    else seasonName = 'Boreal Winter';
  } else {
    if (month >= 3 && month <= 5) seasonName = 'Austral Autumn';
    else if (month >= 6 && month <= 8) seasonName = 'Austral Winter';
    else if (month >= 9 && month <= 11) seasonName = 'Austral Spring';
    else seasonName = 'Austral Summer';
  }

  const isPeakWarmMonth = isNorthern ? month === 7 : month === 1;
  const isPeakColdMonth = isNorthern ? month === 1 : month === 7;

  return {
    monthlyTempC,
    baselineMonthTempC,
    monthAnomalyC,
    seasonName,
    isPeakWarmMonth,
    isPeakColdMonth,
  };
}

// What this does: Calculates a country's humidity, dew point, air dryness (VPD), wet-bulb heat, and moisture reasons for any year and month.
// On the website: Powers all humidity numbers, risk badges, and explanations in the side panel when Humidity mode is selected.
// Used as: The country humidity calculator called when inspecting any country.
export function getCountryHumidity(
  country: CountryClimateData,
  year: number,
  month: number = 7
): {
  baselineRelativeHumidityPct: number;
  currentRelativeHumidityPct: number;
  relativeHumidityAnomalyPct: number;
  specificHumidityGKg: number;
  dewPointC: number;
  vaporPressureDeficitKPa: number;
  wetBulbC: number;
  humidityRiskStatus: 'Extreme Moist Heat' | 'Severe Aridity / Drying' | 'Elevated Desiccation' | 'Moisture Surplus';
  humidityChangeReasons: string[];
} {
  const monthTempData = calculateMonthlyTemperature(
    {
      lat: country.lat,
      baselineTempC: country.baselineTempC,
      warmingRateDecadeC: country.warmingRateDecadeC,
      warmingMultiplier: country.warmingMultiplier,
    },
    year,
    month
  );
  
  // Baseline relative humidity based on geographical latitude and continent
  let baseRH = 66.0;
  const latAbs = Math.abs(country.lat);
  if (latAbs < 15) baseRH = 78.0; // Equatorial tropics
  else if (latAbs >= 15 && latAbs <= 35) baseRH = 48.0; // Subtropical arid
  else if (latAbs > 60) baseRH = 76.0; // Subpolar maritime
  else baseRH = 64.0; // Temperate

  // Specific regional baseline adjustments
  if (['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Iraq', 'Algeria', 'Libya', 'Oman'].includes(country.name)) {
    baseRH = 35.0;
  } else if (['Brazil', 'Indonesia', 'Malaysia', 'Philippines', 'Thailand', 'Colombia', 'Congo'].includes(country.name)) {
    baseRH = 82.0;
  } else if (['United Kingdom', 'Ireland', 'Iceland', 'New Zealand'].includes(country.name)) {
    baseRH = 80.0;
  }

  // Monthly seasonal RH adjustment (Boreal summer vs winter moisture phase)
  const isNorthern = country.lat >= 0;
  const summerMonth = isNorthern ? 7 : 1;
  const seasonalCycle = Math.cos(((month - summerMonth) / 12) * 2 * Math.PI);
  // Inland continents tend to have lower RH in warm summer; monsoonal regions have higher RH in summer
  const isMonsoon = ['India', 'Bangladesh', 'Vietnam', 'Thailand', 'Philippines', 'Pakistan'].includes(country.name);
  const seasonalRHOp = isMonsoon ? seasonalCycle * 8.5 : -seasonalCycle * 6.0;

  // Byrne & O'Gorman (2018) continental drying sensitivity: dRH/dT ≈ -1.6% per °C of land warming
  const rhDeclineRate = -1.6;
  const rhAnomaly = Number((monthTempData.monthAnomalyC * rhDeclineRate).toFixed(2));
  const currentRH = Number(Math.max(12, Math.min(96, baseRH + seasonalRHOp + rhAnomaly)).toFixed(1));

  // Saturation vapor pressure e_s(T) via Tetens equation using monthly temperature in kPa
  const es = 0.61078 * Math.exp((17.27 * monthTempData.monthlyTempC) / (monthTempData.monthlyTempC + 237.3));
  const actualVaporPressure = es * (currentRH / 100);
  const vpd = Number(Math.max(0.05, es - actualVaporPressure).toFixed(2));

  // Specific humidity q ≈ 622 * e / (p - 0.378 * e) in g/kg at sea-level p ≈ 101.325 kPa
  const p = 101.325;
  const specificHumidity = Number(((622 * actualVaporPressure) / (p - 0.378 * actualVaporPressure)).toFixed(2));

  // Dew point T_d from actual vapor pressure: T_d = (237.3 * ln(e / 0.61078)) / (17.27 - ln(e / 0.61078))
  const logE = Math.log(Math.max(0.01, actualVaporPressure / 0.61078));
  const dewPoint = Number(((237.3 * logE) / (17.27 - logE)).toFixed(1));

  // Stull (2011) empirical wet-bulb temperature formulation
  const T = monthTempData.monthlyTempC;
  const RH = currentRH;
  const wetBulb = Number((
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035
  ).toFixed(1));

  let risk: 'Extreme Moist Heat' | 'Severe Aridity / Drying' | 'Elevated Desiccation' | 'Moisture Surplus' = 'Elevated Desiccation';
  if (wetBulb >= 29 || (monthTempData.monthlyTempC >= 36 && specificHumidity >= 18)) {
    risk = 'Extreme Moist Heat';
  } else if (rhAnomaly <= -4.5 || vpd >= 2.0) {
    risk = 'Severe Aridity / Drying';
  } else if (specificHumidity >= 17) {
    risk = 'Moisture Surplus';
  }

  const reasons = [
    `Byrne & O'Gorman Land-Sea Contrast: Continental temperature warming at +${country.warmingRateDecadeC}°C/decade outpaces oceanic evaporation, driving relative humidity down by ${Math.abs(rhAnomaly)}% in ${MONTH_NAMES[month - 1]}`,
    `Atmospheric Vapor Pressure Deficit (VPD): Atmospheric drying demand stands at ${vpd} kPa in ${MONTH_NAMES[month - 1]}, accelerating soil moisture desiccation and vegetative water stress`,
    `Clausius-Clapeyron Moisture Capacity: Absolute atmospheric water vapor capacity increases at ~7% per °C, yielding specific humidity of ${specificHumidity} g/kg at ${monthTempData.monthlyTempC}°C`,
    `Dew Point & Moist Heat Index: Current surface dew point of ${dewPoint}°C with a wet-bulb temperature of ${wetBulb}°C under peak ${MONTH_NAMES[month - 1]} conditions`,
  ];

  return {
    baselineRelativeHumidityPct: baseRH,
    currentRelativeHumidityPct: currentRH,
    relativeHumidityAnomalyPct: rhAnomaly,
    specificHumidityGKg: specificHumidity,
    dewPointC: dewPoint,
    vaporPressureDeficitKPa: vpd,
    wetBulbC: wetBulb,
    humidityRiskStatus: risk,
    humidityChangeReasons: reasons,
  };
}

// What this does: Estimates a country's 10m wind speed, peak gusts, Beaufort rating, wind power density, and wind direction.
// On the website: Powers the Wind Speed numbers, hazard level, and wind explanations shown when inspecting a country in Wind mode.
// Used as: The country wind calculator called during location inspection.
export function getCountryWind(
  country: CountryClimateData,
  year: number,
  month: number = 7
): {
  meanWindSpeedMs: number;
  meanWindSpeedKmh: number;
  gustSpeedKmh: number;
  beaufortScale: number;
  beaufortDescription: string;
  windPowerDensityWm2: number;
  prevailingWindDirection: string;
  windHazardStatus: 'Gale & High Gust Advisory' | 'Prime Wind Power Harvest' | 'Moderate / Steady Flow' | 'Stagnant / Low Inversion';
  windChangeReasons: string[];
} {
  const latAbs = Math.abs(country.lat);

  // Baseline 10m wind velocity based on geographic latitude, continental position, and exposure
  let baseWindMs = 5.2;

  if (['United Kingdom', 'Ireland', 'Iceland', 'New Zealand', 'Norway', 'Denmark', 'Chile'].includes(country.name)) {
    baseWindMs = 7.8; // Maritime gale and storm track exposed
  } else if (['Netherlands', 'Portugal', 'Spain', 'South Africa', 'Argentina', 'Australia'].includes(country.name)) {
    baseWindMs = 6.4; // High coastal and steppe wind yield
  } else if (['Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Oman', 'Algeria', 'Libya', 'Morocco'].includes(country.name)) {
    baseWindMs = 5.8; // Desert trade winds & Harmattan/Khamsin low-level jets
  } else if (['United States', 'Canada', 'Germany', 'France', 'Poland', 'Russia', 'China'].includes(country.name)) {
    baseWindMs = 4.8; // Continental temperate mixed terrain
  } else if (['Indonesia', 'Malaysia', 'Singapore', 'Brazil', 'Colombia', 'Congo'].includes(country.name)) {
    baseWindMs = 3.2; // Equatorial ITCZ / doldrums low-gradient zone
  } else if (latAbs > 55) {
    baseWindMs = 6.8; // Polar and subpolar maritime
  }

  // Monthly seasonal baroclinicity modulation
  const isNorthern = country.lat >= 0;
  const isWinter = isNorthern ? (month === 12 || month <= 2) : (month >= 6 && month <= 8);
  const isMonsoon = ['India', 'Bangladesh', 'Vietnam', 'Philippines', 'Oman', 'Somalia'].includes(country.name);
  
  let seasonalWindFactor = 1.0;
  if (isMonsoon && (month >= 6 && month <= 8)) {
    seasonalWindFactor = 1.32; // Strong boreal summer monsoon low-level jet surge
  } else if (isWinter) {
    seasonalWindFactor = 1.15; // Enhanced equator-to-pole thermal gradient accelerates winter storm tracks
  } else if ((isNorthern && month >= 6 && month <= 8) || (!isNorthern && (month === 12 || month <= 2))) {
    seasonalWindFactor = 0.90; // Relaxed summer baroclinicity
  } else {
    seasonalWindFactor = 1.04; // Equinoctial frontal transition
  }

  // Trend modulation: Young & Ribal oceanic acceleration (+0.6% / decade) vs continental stilling
  const yearOffset = year - 2000;
  const isHighWindCoast = ['United Kingdom', 'Ireland', 'Iceland', 'New Zealand', 'Norway', 'Chile', 'Japan', 'Philippines'].includes(country.name);
  const trendRatePerYear = isHighWindCoast ? 0.038 : (latAbs > 40 ? 0.015 : -0.008);
  const currentWindMs = Number(Math.max(1.8, (baseWindMs + trendRatePerYear * yearOffset) * seasonalWindFactor).toFixed(1));
  const currentWindKmh = Number((currentWindMs * 3.6).toFixed(1));

  // Gust speed multiplier (turbulence intensity typically 1.55x to 1.75x)
  const gustMultiplier = isHighWindCoast ? 1.72 : 1.58;
  const gustSpeedKmh = Number((currentWindKmh * gustMultiplier).toFixed(1));

  // Beaufort Wind Scale calculation (0 - 12)
  let beaufort = 0;
  let beaufortDesc = 'Calm';
  if (currentWindMs < 0.5) { beaufort = 0; beaufortDesc = 'Calm'; }
  else if (currentWindMs <= 1.5) { beaufort = 1; beaufortDesc = 'Light Air'; }
  else if (currentWindMs <= 3.3) { beaufort = 2; beaufortDesc = 'Light Breeze'; }
  else if (currentWindMs <= 5.4) { beaufort = 3; beaufortDesc = 'Gentle Breeze'; }
  else if (currentWindMs <= 7.9) { beaufort = 4; beaufortDesc = 'Moderate Breeze'; }
  else if (currentWindMs <= 10.7) { beaufort = 5; beaufortDesc = 'Fresh Breeze'; }
  else if (currentWindMs <= 13.8) { beaufort = 6; beaufortDesc = 'Strong Breeze'; }
  else if (currentWindMs <= 17.1) { beaufort = 7; beaufortDesc = 'Near Gale / High Wind'; }
  else if (currentWindMs <= 20.7) { beaufort = 8; beaufortDesc = 'Gale'; }
  else if (currentWindMs <= 24.4) { beaufort = 9; beaufortDesc = 'Strong Gale'; }
  else if (currentWindMs <= 28.4) { beaufort = 10; beaufortDesc = 'Storm'; }
  else if (currentWindMs <= 32.6) { beaufort = 11; beaufortDesc = 'Violent Storm'; }
  else { beaufort = 12; beaufortDesc = 'Hurricane Force'; }

  // Wind Power Density: WPD = 0.5 * rho * v^3 (rho ≈ 1.225 kg/m^3 at sea level)
  const wpd = Math.round(0.5 * 1.225 * Math.pow(currentWindMs, 3));

  // Prevailing planetary wind belt direction
  let prevailingDir = 'Variable / Local Breeze';
  if (latAbs <= 28) {
    prevailingDir = country.lat >= 0 ? 'NE Trade Winds (045°)' : 'SE Trade Winds (135°)';
  } else if (latAbs > 28 && latAbs <= 62) {
    prevailingDir = country.lat >= 0 ? 'Prevailing South-Westerlies (240°)' : 'Roaring North-Westerlies (300°)';
  } else {
    prevailingDir = country.lat >= 0 ? 'Polar North-Easterlies (030°)' : 'Polar South-Easterlies (150°)';
  }

  // Hazard classification
  let hazard: 'Gale & High Gust Advisory' | 'Prime Wind Power Harvest' | 'Moderate / Steady Flow' | 'Stagnant / Low Inversion' = 'Moderate / Steady Flow';
  if (currentWindMs >= 10.8 || gustSpeedKmh >= 65) {
    hazard = 'Gale & High Gust Advisory';
  } else if (currentWindMs >= 6.2) {
    hazard = 'Prime Wind Power Harvest';
  } else if (currentWindMs <= 2.8) {
    hazard = 'Stagnant / Low Inversion';
  }

  const reasons = [
    `Equator-to-Pole Geostrophic Gradient & Jet Stream Shift: Seasonal baroclinicity in ${MONTH_NAMES[month - 1]} sets the 10m surface wind speed at ${currentWindMs} m/s (${currentWindKmh} km/h) with a decadal trend of ${trendRatePerYear > 0 ? '+' : ''}${(trendRatePerYear * 10).toFixed(2)} m/s per decade`,
    `Atmospheric Boundary-Layer Kinetic Yield: Local wind power density of ${wpd} W/m² (Beaufort Force ${beaufort} • ${beaufortDesc}) driving boundary-layer mechanical shear and turbine power output`,
    `Surface Friction Velocity & Turbulence Intensity: Aerodynamic drag over land and topography governs gust capacity reaching ${gustSpeedKmh} km/h under convective and frontal forcing`,
    `Planetary Circulation & Hadley Cell Migration: Steered by prevailing ${prevailingDir} and modulated by regional surface roughness (z₀) and jet stream latitude`
  ];

  return {
    meanWindSpeedMs: currentWindMs,
    meanWindSpeedKmh: currentWindKmh,
    gustSpeedKmh,
    beaufortScale: beaufort,
    beaufortDescription: beaufortDesc,
    windPowerDensityWm2: wpd,
    prevailingWindDirection: prevailingDir,
    windHazardStatus: hazard,
    windChangeReasons: reasons,
  };
}

// What this does: Stores the full catalog of countries and territories with their coordinates, landmarks, and climate baselines.
// On the website: Lets users search for any country, click countries on the 3D globe, and inspect their climate metrics.
// Used as: The master countries dataset used by CountrySearchModal, SidebarDataPanel, and EarthGlobe.
export const COUNTRIES_DATABASE: CountryClimateData[] = [
  // North America
  {
    id: 'usa',
    name: 'United States',
    isoCode: 'USA',
    continent: 'North America',
    lat: 37.09,
    lng: -95.71,
    baselineTempC: 11.5,
    warmingMultiplier: 1.45,
    historicalAnomaly2026C: 1.42,
    warmingRateDecadeC: 0.32,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Severe drought in the Southwest, intensifying Gulf hurricanes, and wildfire season expansion.',
    flagEmoji: '🇺🇸',
    famousLandmark: 'Statue of Liberty & Grand Canyon',
    landmarkIcon: '🗽',
    temperatureChangeReasons: [
      'Jet Stream Meandering: Slower, wavier polar jet stream locks in prolonged heat domes and atmospheric rivers',
      'Southwest Soil Desiccation: Positive soil-moisture feedback amplifying sensible heat flux',
      'Gulf Coast Sea Surface Warming: Supercharging Atlantic hurricane vapor enthalpy and storm surge',
      'Urban Thermal Mass: Large metropolitan corridors retaining trapped nocturnal re-radiation'
    ],
  },
  {
    id: 'can',
    name: 'Canada',
    isoCode: 'CAN',
    continent: 'North America',
    lat: 56.13,
    lng: -106.35,
    baselineTempC: -5.3,
    warmingMultiplier: 2.1,
    historicalAnomaly2026C: 2.15,
    warmingRateDecadeC: 0.52,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Permafrost thaw, boreal forest wildfires, and Arctic coastline erosion.',
    flagEmoji: '🇨🇦',
    famousLandmark: 'Niagara Falls & Banff Rocky Mountains',
    landmarkIcon: '🍁',
    temperatureChangeReasons: [
      'Polar Amplification: Cryospheric albedo loss as snow and tundra ice retreat earlier each spring',
      'Boreal Wildfire Carbon Feedbacks: Massive forest fires darkening surface albedo with soot deposits',
      'Permafrost Thaw: Sub-surface active layer microbial respiration releasing latent greenhouse gases',
      'High-Latitude Winter Warming: Dramatic winter night temperature increases due to diminished radiative inversion'
    ],
  },
  {
    id: 'mex',
    name: 'Mexico',
    isoCode: 'MEX',
    continent: 'North America',
    lat: 23.63,
    lng: -102.55,
    baselineTempC: 21.0,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.35,
    warmingRateDecadeC: 0.28,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Extreme heat waves, agricultural drought, and water shortages in northern states.',
    flagEmoji: '🇲🇽',
    famousLandmark: 'Chichen Itza Mayan Pyramid',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Hadley Cell Poleward Expansion: Descending dry air suppressive zone migrating over northern agricultural plains',
      'Pacific Decadal Oscillation & El Niño teleconnections driving multi-year severe precipitation deficits',
      'Plateau Sensible Heating: High-elevation Mexican Altiplano heating rapidly under clear skies',
      'Groundwater Depletion: Falling water tables reduce local evaporative cooling'
    ],
  },

  // South America
  {
    id: 'bra',
    name: 'Brazil',
    isoCode: 'BRA',
    continent: 'South America',
    lat: -14.23,
    lng: -51.92,
    baselineTempC: 25.0,
    warmingMultiplier: 1.3,
    historicalAnomaly2026C: 1.48,
    warmingRateDecadeC: 0.34,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Amazon rainforest dieback, Pantanal wetland wildfires, and hydro-power water deficits.',
    flagEmoji: '🇧🇷',
    famousLandmark: 'Christ the Redeemer & Amazon River Basin',
    landmarkIcon: '🌴',
    temperatureChangeReasons: [
      'Deforestation-Evapotranspiration Decoupling: Forest loss reduces biogenic flying rivers and latent heat cooling',
      'Amazon Tipping Point Dynamics: Transition of tropical rainforest margins toward fire-prone savanna',
      'South Atlantic Tropical SST Anomalies: Modulating equatorial moisture convergence zones',
      'Pantanal Basin Drying: Wetland water table collapse accelerating daytime surface scorching'
    ],
  },
  {
    id: 'arg',
    name: 'Argentina',
    isoCode: 'ARG',
    continent: 'South America',
    lat: -38.41,
    lng: -63.61,
    baselineTempC: 14.8,
    warmingMultiplier: 1.2,
    historicalAnomaly2026C: 1.15,
    warmingRateDecadeC: 0.25,
    vulnerabilityStatus: 'Elevated',
    keyClimateRisk: 'Glacier loss in the Andes and heat stress across agricultural Pampas.',
    flagEmoji: '🇦🇷',
    famousLandmark: 'Iguazu Falls & Perito Moreno Glacier',
    landmarkIcon: '☀️',
    temperatureChangeReasons: [
      'Andean Glacial Recession: Diminishing meltwater runoff reducing river volume during peak summer',
      'Subtropical Anticyclone Intensification: Prolonged high-pressure ridges baking the fertile Pampas',
      'Southern Annular Mode (SAM) Poleward Shift: Shifting storm tracks south away from central crop belts',
      'Soil Moisture Depletion: Intensifying daytime ground radiation'
    ],
  },
  {
    id: 'col',
    name: 'Colombia',
    isoCode: 'COL',
    continent: 'South America',
    lat: 4.57,
    lng: -74.29,
    baselineTempC: 24.5,
    warmingMultiplier: 1.15,
    historicalAnomaly2026C: 1.22,
    warmingRateDecadeC: 0.26,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'High-altitude paramo ecosystem retreat and torrential rainfall landslide risks.',
    flagEmoji: '🇨🇴',
    famousLandmark: 'Coffee Cultural Landscape & Monserrate Sanctuary',
    landmarkIcon: '☕',
    temperatureChangeReasons: [
      'Tropical Glacier Disintegration: Rapid vanishing of ice on volcanic peaks (Nevado del Ruiz)',
      'Paramo High-Altitude Warming: High mountain ecosystems warming 1.5x faster than lowland plains',
      'ENSO Heat Swings: Strong El Niño cycles causing severe hydro-reservoir thermal spikes',
      'Cloud Forest Line Elevation: Lifting condensation level forcing microclimatic warming'
    ],
  },
  {
    id: 'chl',
    name: 'Chile',
    isoCode: 'CHL',
    continent: 'South America',
    lat: -35.67,
    lng: -71.54,
    baselineTempC: 11.2,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.28,
    warmingRateDecadeC: 0.29,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Decade-long mega-drought in Central Chile and Andean snowpack reduction.',
    flagEmoji: '🇨🇱',
    famousLandmark: 'Torres del Paine & Moai Statues of Easter Island',
    landmarkIcon: '🗿',
    temperatureChangeReasons: [
      'Central Chile Mega-Drought: Decade-plus rainfall deficit elevating ground surface thermal equilibrium',
      'Andean Zero-Degree Isotherm Rise: Snowline climbing hundreds of meters, reducing summer reflective albedo',
      'Humboldt Current Temperature Fluctuations: Modulating coastal fog (Camanchaca) persistence',
      'Atacama Desert Thermal Radiation: Extreme diurnal radiant energy exchange'
    ],
  },

  // Europe
  {
    id: 'gbr',
    name: 'United Kingdom',
    isoCode: 'GBR',
    continent: 'Europe',
    lat: 55.37,
    lng: -3.43,
    baselineTempC: 9.2,
    warmingMultiplier: 1.4,
    historicalAnomaly2026C: 1.35,
    warmingRateDecadeC: 0.31,
    vulnerabilityStatus: 'Elevated',
    keyClimateRisk: 'Summer heatwaves breaking 40°C records and coastal sea level surge risks.',
    flagEmoji: '🇬🇧',
    famousLandmark: 'Big Ben & Stonehenge',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'North Atlantic Atmospheric Blocking: High-pressure omega blocks pulling continental Saharan plumes over Britain',
      'AMOC Deceleration Signal: Altering regional marine wind currents and thermal distributions',
      'Urban Microclimate Accumulation: London thermal dome concentrating building heat',
      'North Sea Warming: Warmer coastal waters preventing rapid nighttime coastal cooling'
    ],
  },
  {
    id: 'fra',
    name: 'France',
    isoCode: 'FRA',
    continent: 'Europe',
    lat: 46.22,
    lng: 2.21,
    baselineTempC: 11.8,
    warmingMultiplier: 1.55,
    historicalAnomaly2026C: 1.62,
    warmingRateDecadeC: 0.38,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Mediterranean drought, vineyard heat stress, and river cooling constraints for nuclear power.',
    flagEmoji: '🇫🇷',
    famousLandmark: 'Eiffel Tower & Palace of Versailles',
    landmarkIcon: '🗼',
    temperatureChangeReasons: [
      'Mediterranean Hotspot Amplification: Expansion of southern European summer heat domes',
      'Soil Moisture Deficit Coupling: Early spring ground drying accelerates summer peak air temperatures',
      'Pyrenean & Alpine Glacier Loss: Decreased cold katabatic wind cooling in southern river valleys',
      'River Water Temperature Surges: Lower river discharge elevating base temperature'
    ],
  },
  {
    id: 'deu',
    name: 'Germany',
    isoCode: 'DEU',
    continent: 'Europe',
    lat: 51.16,
    lng: 10.45,
    baselineTempC: 8.8,
    warmingMultiplier: 1.5,
    historicalAnomaly2026C: 1.58,
    warmingRateDecadeC: 0.36,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Rhine River low-water navigation shutdowns and flash flooding hazards.',
    flagEmoji: '🇩🇪',
    famousLandmark: 'Brandenburg Gate & Neuschwanstein Castle',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'Central European Continental Heating: Summer thermal convection without ocean buffering',
      'Jet Stream Stagnation: Stalled high-pressure weather systems causing prolonged multi-week heatwaves',
      'Spruce Forest Dieback: Large bark-beetle defoliation lowering vegetative transpiration',
      'Reduced Low Cloud Cover: Higher incoming shortwave solar radiation during summer months'
    ],
  },
  {
    id: 'esp',
    name: 'Spain',
    isoCode: 'ESP',
    continent: 'Europe',
    lat: 40.46,
    lng: -3.74,
    baselineTempC: 15.4,
    warmingMultiplier: 1.65,
    historicalAnomaly2026C: 1.84,
    warmingRateDecadeC: 0.44,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Desertification across Andalusia, reservoir exhaustion, and extreme summer thermal stress.',
    flagEmoji: '🇪🇸',
    famousLandmark: 'Sagrada Familia & Alhambra Palace',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'Northward Migration of the Sahara Climate Zone: Iberian Peninsula experiencing subtropical desertification',
      'Severe Soil Evaporation Depletion: Parched Mediterranean soils cannot provide evaporative cooling',
      'Azores High Persistent Expansion: Blocking Atlantic winter rain depressions from entering mainland',
      'Marine Heatwaves in the Balearic & Alboran Seas: Preventing coastal relief during tropical nights'
    ],
  },
  {
    id: 'ita',
    name: 'Italy',
    isoCode: 'ITA',
    continent: 'Europe',
    lat: 41.87,
    lng: 12.56,
    baselineTempC: 13.5,
    warmingMultiplier: 1.6,
    historicalAnomaly2026C: 1.76,
    warmingRateDecadeC: 0.41,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Po Valley drought, Alpine glacier melt, and Venice storm-surge tidal frequency.',
    flagEmoji: '🇮🇹',
    famousLandmark: 'Colosseum & Leaning Tower of Pisa',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Subtropical African Anticyclone Invasions: "Cerberus" and "Lucifer" heat domes trapped by Alps',
      'Po River Basin Thermal Inversion: Heavy agricultural and industrial basin trapping summer heat',
      'Rapid Alpine Glacier Retraction: Reduction in reflective snowpack along northern border ranges',
      'Mediterranean Sea Thermal Accumulation: Record SSTs exceeding 30°C along Tyrrhenian coast'
    ],
  },
  {
    id: 'nor',
    name: 'Norway',
    isoCode: 'NOR',
    continent: 'Europe',
    lat: 60.47,
    lng: 8.46,
    baselineTempC: 2.1,
    warmingMultiplier: 2.2,
    historicalAnomaly2026C: 2.24,
    warmingRateDecadeC: 0.54,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Winter warming, rapid reduction in ski-season snow cover, and fjord ecosystem shifts.',
    flagEmoji: '🇳🇴',
    famousLandmark: 'Geirangerfjord & Northern Lights (Tromsø)',
    landmarkIcon: '🌌',
    temperatureChangeReasons: [
      'Sub-Arctic Polar Amplification: Snow cover duration shortened by over 35 days per year',
      'Barents Sea Sea-Ice Loss: Open water warming northern air masses moving over Finnmark',
      'Norwegian Sea Warming: Warm Atlantic inflow maintaining elevated winter minimums',
      'Glacier Tongue Retreat: Jostedalsbreen and northern ice cap mass balance losses'
    ],
  },
  {
    id: 'swe',
    name: 'Sweden',
    isoCode: 'SWE',
    continent: 'Europe',
    lat: 60.12,
    lng: 18.64,
    baselineTempC: 2.8,
    warmingMultiplier: 2.1,
    historicalAnomaly2026C: 2.18,
    warmingRateDecadeC: 0.51,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Arctic warming amplification and Baltic Sea winter ice cover decline.',
    flagEmoji: '🇸🇪',
    famousLandmark: 'Stockholm Old Town (Gamla Stan) & Icehotel',
    landmarkIcon: '👑',
    temperatureChangeReasons: [
      'Baltic Sea Winter Ice Reduction: Loss of reflective sea ice leads to higher heat retention in water',
      'Scandinavian Mountain Snowline Retreat: Earlier spring thaw reducing summer cooling breezes',
      'Boreal Forest Heat Trapping: Evergreen canopy absorbing more solar energy than reflective winter snow',
      'Arctic Cold Air Outbreak Weakening: Warmer winter polar vortex regimes'
    ],
  },
  {
    id: 'grc',
    name: 'Greece',
    isoCode: 'GRC',
    continent: 'Europe',
    lat: 39.07,
    lng: 21.82,
    baselineTempC: 16.2,
    warmingMultiplier: 1.7,
    historicalAnomaly2026C: 1.92,
    warmingRateDecadeC: 0.46,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Catastrophic wildfire seasons and Aegean marine heatwaves affecting tourism and fisheries.',
    flagEmoji: '🇬🇷',
    famousLandmark: 'Parthenon on the Acropolis & Santorini Caldera',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Eastern Mediterranean Climate Tipping: Persistent subtropical high pressure ridges locking in 45°C heat',
      'Aegean Sea Extreme Marine Heatwaves: Sea temperatures 3-5°C above seasonal norms',
      'Meltemi Wind Thermal Dynamics: Dry northern winds desiccating pine forest fuel before summer heat waves',
      'Deforestation & Wildfire Burn Scars: Dark ash scars increase land surface solar absorption'
    ],
  },

  // Africa
  {
    id: 'egy',
    name: 'Egypt',
    isoCode: 'EGY',
    continent: 'Africa',
    lat: 26.82,
    lng: 30.80,
    baselineTempC: 22.8,
    warmingMultiplier: 1.55,
    historicalAnomaly2026C: 1.75,
    warmingRateDecadeC: 0.40,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Nile Delta soil salinization from sea-level rise and extreme urban heat stress in Cairo.',
    flagEmoji: '🇪🇬',
    famousLandmark: 'Great Pyramids of Giza, Sphinx & Nile River Valley',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Subtropical Ridge Expansion: Northward migration of the intense Sahara high-pressure subsidence dome',
      'Nile Basin Evaporative Stress: Rising atmospheric vapor pressure deficit dehydrating agricultural delta soils',
      'Greater Cairo Urban Heat Island (UHI): Enormous concrete/asphalt thermal mass trapping solar radiation up to +5°C',
      'Declining Soil Moisture Albedo Feedback: Loss of marginal greenery converts solar radiation directly into sensible heat'
    ],
  },
  {
    id: 'nga',
    name: 'Nigeria',
    isoCode: 'NGA',
    continent: 'Africa',
    lat: 9.08,
    lng: 8.67,
    baselineTempC: 26.8,
    warmingMultiplier: 1.2,
    historicalAnomaly2026C: 1.25,
    warmingRateDecadeC: 0.28,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Sahelian desert encroachment in the north and heavy coastal flooding in Lagos.',
    flagEmoji: '🇳🇬',
    famousLandmark: 'Zuma Rock & Lekki Conservation Center',
    landmarkIcon: '🪨',
    temperatureChangeReasons: [
      'Sahelian Desert Encroachment: Sahara advancing south, stripping vegetative ground cover in northern states',
      'Gulf of Guinea Marine Surface Heating: Elevating coastal humidity and extreme wet-bulb temperatures',
      'Lagos Megacity Urban Heat Canopy: High population density and generator emissions forming heat domes',
      'Shifting West African Monsoon (WAM): Irregular rainfall timing causing extended pre-monsoon heat waves'
    ],
  },
  {
    id: 'zaf',
    name: 'South Africa',
    isoCode: 'ZAF',
    continent: 'Africa',
    lat: -30.55,
    lng: 22.93,
    baselineTempC: 17.5,
    warmingMultiplier: 1.5,
    historicalAnomaly2026C: 1.62,
    warmingRateDecadeC: 0.37,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Day Zero municipal water shortages (Cape Town/Gauteng) and agricultural crop heat stress.',
    flagEmoji: '🇿🇦',
    famousLandmark: 'Table Mountain & Kruger National Park',
    landmarkIcon: '⛰️',
    temperatureChangeReasons: [
      'Southern African Interior Warming: Inland plateau heating at twice the global average rate',
      'Subtropical High-Pressure Cell Shift: Southern Indian & Atlantic anticyclones blocking westerly cold fronts',
      'Karoo Semi-Desert Expansion: Soil desiccation converting scrubland into high-temperature dust sources',
      'Agulhas Current Boundary Warming: Modulating eastern coast thunderstorm intensity and thermal load'
    ],
  },
  {
    id: 'ken',
    name: 'Kenya',
    isoCode: 'KEN',
    continent: 'Africa',
    lat: -0.02,
    lng: 37.90,
    baselineTempC: 24.2,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.34,
    warmingRateDecadeC: 0.31,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Severe Horn of Africa multi-year droughts devastating livestock and subsistence farming.',
    flagEmoji: '🇰🇪',
    famousLandmark: 'Maasai Mara & Mount Kenya Glacial Peak',
    landmarkIcon: '🦁',
    temperatureChangeReasons: [
      'Indian Ocean Dipole (IOD) Disruption: Positive IOD events altering East African "short rains"',
      'Mount Kenya Glacial Disappearance: Ice loss reducing high-altitude cooling and mountain runoff',
      'Rift Valley Thermal Convergence: Low-humidity semi-arid plains radiating high sensible heat flux',
      'Horn of Africa Multi-Year Drought: Dry soil profiles accelerating ground heating'
    ],
  },
  {
    id: 'mar',
    name: 'Morocco',
    isoCode: 'MAR',
    continent: 'Africa',
    lat: 31.79,
    lng: -7.09,
    baselineTempC: 17.8,
    warmingMultiplier: 1.6,
    historicalAnomaly2026C: 1.81,
    warmingRateDecadeC: 0.42,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Severe agricultural drought, oasis aquifer depletion, and high heatwave mortality.',
    flagEmoji: '🇲🇦',
    famousLandmark: 'Hassan II Mosque & Atlas Mountains',
    landmarkIcon: '🕌',
    temperatureChangeReasons: [
      'Atlas Mountains Snowpack Depletion: Reduced winter snowpack lowers reflective albedo and spring runoff',
      'Sahara Chergui Wind Invasions: Super-heated southeasterly desert winds blowing over the coastal plains',
      'Canary Current Coastal Upwelling Weakening: Reduced cold water upwelling along the Atlantic coast',
      'Oasis Vegetative Retreat: Falling groundwater tables reducing local transpiration buffers'
    ],
  },

  // Asia & Middle East
  {
    id: 'chn',
    name: 'China',
    isoCode: 'CHN',
    continent: 'Asia',
    lat: 35.86,
    lng: 104.19,
    baselineTempC: 8.2,
    warmingMultiplier: 1.6,
    historicalAnomaly2026C: 1.68,
    warmingRateDecadeC: 0.41,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Yangtze River record droughts, Tibetan plateau glacial runoff shifts, and mega-city heat domes.',
    flagEmoji: '🇨🇳',
    famousLandmark: 'Great Wall of China & Forbidden City',
    landmarkIcon: '🏯',
    temperatureChangeReasons: [
      'Tibetan Plateau "Third Pole" Amplification: High-elevation plateau warming at 3x the global rate',
      'Western Pacific Subtropical High (WPSH) Northward Shift: Causing severe summer heat domes in the Yangtze basin',
      'Rapid Industrial Megacity Agglomerations: Pearl & Yangtze River Deltas forming immense thermal footprints',
      'Northern Desert Expansion: Gobi Desert dust storms depositing dark particulates that accelerate snowmelt'
    ],
  },
  {
    id: 'ind',
    name: 'India',
    isoCode: 'IND',
    continent: 'Asia',
    lat: 20.59,
    lng: 78.96,
    baselineTempC: 24.0,
    warmingMultiplier: 1.35,
    historicalAnomaly2026C: 1.44,
    warmingRateDecadeC: 0.33,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Wet-bulb temperatures exceeding 35°C human survivability limit and erratic monsoon rainfall.',
    flagEmoji: '🇮🇳',
    famousLandmark: 'Taj Mahal & Ganges River Ghats',
    landmarkIcon: '🕌',
    temperatureChangeReasons: [
      'Pre-Monsoon Extreme Heat Waves: Northern plains experiencing prolonged 48-50°C temperatures in May/June',
      'Atmospheric Brown Cloud & Aerosol Interaction: Complex solar dimming and black carbon atmospheric heating',
      'Himalayan Cryosphere Retreat: Melting glaciers reducing downstream cooling water volume',
      'High Wet-Bulb Thermal Stress: Humid air from the Bay of Bengal meeting blistering inland heat'
    ],
  },
  {
    id: 'jpn',
    name: 'Japan',
    isoCode: 'JPN',
    continent: 'Asia',
    lat: 36.20,
    lng: 138.25,
    baselineTempC: 11.5,
    warmingMultiplier: 1.45,
    historicalAnomaly2026C: 1.55,
    warmingRateDecadeC: 0.35,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Intensifying super-typhoon precipitation and coastal marine fisheries collapse.',
    flagEmoji: '🇯🇵',
    famousLandmark: 'Mount Fuji & Kinkaku-ji Golden Pavilion',
    landmarkIcon: '🗻',
    temperatureChangeReasons: [
      'Kuroshio Current Warming & Meander: Warm western boundary ocean current running 2-3°C above baseline',
      'Subtropical High Invasions: Pacific high-pressure cell stalling over Honshu during July and August',
      'Sea of Japan Winter Warming: Drastic reduction in winter sea-surface temperature gradient',
      'Tokyo-Kanto Basin Heat Island: Dense concrete architecture generating heavy night thermal retention'
    ],
  },
  {
    id: 'sau',
    name: 'Saudi Arabia',
    isoCode: 'SAU',
    continent: 'Asia',
    lat: 23.88,
    lng: 45.07,
    baselineTempC: 25.5,
    warmingMultiplier: 1.7,
    historicalAnomaly2026C: 1.95,
    warmingRateDecadeC: 0.47,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Summer peak temperatures exceeding 52°C, acute water scarcity, and dust storm escalation.',
    flagEmoji: '🇸🇦',
    famousLandmark: 'Mada\'in Saleh (Hegra) & Kingdom Centre',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Hyper-Arid Radiation Balance: Pure sand terrain with negligible moisture converts all solar radiation to heat',
      'Indian Monsoon Thermal Low Teleconnection: Deep thermal depressions pulling blistering Arabian desert air',
      'Persian Gulf & Red Sea Water Warming: Coastal water reaching 36°C creates suffocating humidity with 50°C heat',
      'Subsidence Heating: Descending dry air parcels in the descending branch of the Hadley Cell adiabatic heating'
    ],
  },
  {
    id: 'are',
    name: 'United Arab Emirates',
    isoCode: 'ARE',
    continent: 'Asia',
    lat: 23.42,
    lng: 53.84,
    baselineTempC: 27.0,
    warmingMultiplier: 1.65,
    historicalAnomaly2026C: 1.88,
    warmingRateDecadeC: 0.45,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Persian Gulf marine heatwaves, extreme air conditioning load, and flash desert flooding.',
    flagEmoji: '🇦🇪',
    famousLandmark: 'Burj Khalifa & Sheikh Zayed Grand Mosque',
    landmarkIcon: '🏙️',
    temperatureChangeReasons: [
      'Shallow Gulf Basin Heat Absorption: The Arabian Gulf acts as a massive thermal reservoir with minimal outflow',
      'Extreme Urban Construction & Glass: Hyper-dense skyscraper corridors reflecting and trapping thermal radiation',
      'Adiabatic Downdrafts: High pressure over the empty quarter forcing hot air downward',
      'Absence of Vegetative Transpiration: Bare sand surfaces reach ground temperatures over 65°C'
    ],
  },
  {
    id: 'idn',
    name: 'Indonesia',
    isoCode: 'IDN',
    continent: 'Asia',
    lat: -0.78,
    lng: 113.92,
    baselineTempC: 26.5,
    warmingMultiplier: 1.15,
    historicalAnomaly2026C: 1.18,
    warmingRateDecadeC: 0.25,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Jakarta coastal subsidence and sea-level rise forcing national capital relocation.',
    flagEmoji: '🇮🇩',
    famousLandmark: 'Borobudur Temple & Mount Bromo',
    landmarkIcon: '🌋',
    temperatureChangeReasons: [
      'Indo-Pacific Warm Pool Expansion: Global ocean heat accumulation centered in the surrounding archipelagic seas',
      'Peatland Drainage & Forest Fires: Dried peat fires releasing massive carbon aerosols and darkening terrain',
      'El Niño Teleconnection Sensitivity: Suppressed convection during El Niño years brings scorching dry spells',
      'Jakarta Coastal Urban Sinking: Land subsidence worsening coastal microclimate humidity and thermal load'
    ],
  },
  {
    id: 'tur',
    name: 'Turkey',
    isoCode: 'TUR',
    continent: 'Asia',
    lat: 38.96,
    lng: 35.24,
    baselineTempC: 11.8,
    warmingMultiplier: 1.6,
    historicalAnomaly2026C: 1.78,
    warmingRateDecadeC: 0.42,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Lake Van water level drops, Anatolian wheat crop failure, and Mediterranean wildfire storms.',
    flagEmoji: '🇹🇷',
    famousLandmark: 'Hagia Sophia & Cappadocia Fairy Chimneys',
    landmarkIcon: '🎈',
    temperatureChangeReasons: [
      'Mediterranean-Middle East Basin Warming: Located at the intersection of European and Middle Eastern heat zones',
      'Anatolian Plateau Dryout: Semiarid central plains drying out earlier in the season, reducing cloud formation',
      'Glacial Retreat on Mount Ararat & Kaçkar: Vanishing high-elevation ice buffers',
      'Persistent High-Pressure Blocking: Deflecting cool Atlantic air currents north of the Black Sea'
    ],
  },

  // Oceania
  {
    id: 'aus',
    name: 'Australia',
    isoCode: 'AUS',
    continent: 'Oceania',
    lat: -25.27,
    lng: 133.77,
    baselineTempC: 21.6,
    warmingMultiplier: 1.45,
    historicalAnomaly2026C: 1.54,
    warmingRateDecadeC: 0.36,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Great Barrier Reef bleaching, "Black Summer" bushfire recurrence, and Murray-Darling basin drought.',
    flagEmoji: '🇦🇺',
    famousLandmark: 'Sydney Opera House & Uluru (Ayers Rock)',
    landmarkIcon: '🦘',
    temperatureChangeReasons: [
      'Subtropical Ridge Expansion: Continental interior acts as a massive thermal furnace pumping heat across coastlines',
      'Indian Ocean Dipole & SAM Shifts: Blocking westerly cold fronts from sweeping over southern states',
      'Eucalypt Forest Dryout: High fuel aridity creating catastrophic pyro-convective bushfire storms',
      'Coral Sea Ocean Heatwaves: Prolonged thermal stress triggering mass coral bleaching along 2,300km reef'
    ],
  },
  {
    id: 'nzl',
    name: 'New Zealand',
    isoCode: 'NZL',
    continent: 'Oceania',
    lat: -40.90,
    lng: 174.88,
    baselineTempC: 10.8,
    warmingMultiplier: 1.2,
    historicalAnomaly2026C: 1.18,
    warmingRateDecadeC: 0.26,
    vulnerabilityStatus: 'Moderate',
    keyClimateRisk: 'Southern Alps glacier volume loss and subtropical storm inundation across North Island.',
    flagEmoji: '🇳🇿',
    famousLandmark: 'Milford Sound & Mount Cook (Aoraki)',
    landmarkIcon: '🥝',
    temperatureChangeReasons: [
      'Tasman Sea Marine Heatwaves: Ocean surface temperatures 2-4°C above normal blowing warm moist air ashore',
      'Southern Alps Glacier Shrinkage: Loss of over 35% of ice volume since 1970 reducing reflective albedo',
      'Westerly Wind Belt Migration: Shift in southern storm tracks altering rainfall distribution between islands',
      'Subtropical Air Invasions: Atmospheric rivers carrying warm tropical moisture plumes from the Coral Sea'
    ],
  },

  // Polar Regions
  {
    id: 'grl',
    name: 'Greenland (Denmark)',
    isoCode: 'GRL',
    continent: 'Polar',
    lat: 71.70,
    lng: -42.60,
    baselineTempC: -18.2,
    warmingMultiplier: 3.1,
    historicalAnomaly2026C: 3.25,
    warmingRateDecadeC: 0.78,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Massive ice sheet surface melting driving global sea level rise by up to 7 meters if destabilized.',
    flagEmoji: '🇬🇱',
    famousLandmark: 'Ilulissat Icefjord & Arctic Tundra',
    landmarkIcon: '🧊',
    temperatureChangeReasons: [
      'Arctic Amplification & Ice-Albedo Positive Feedback: Melting white snow exposes dark bare ice and cryoconite holes',
      'Atmospheric Blocking over Greenland: Persistent summer anticyclones drawing warm air plumes directly up from the Atlantic',
      'Warm Ocean Currents Infiltrating Fjord Basins: Subsurface Atlantic water eroding glacier grounding lines from beneath',
      'Elevation-Melt Feedback: As the ice sheet thins, its surface drops into warmer lower-altitude air layers'
    ],
  },
  {
    id: 'ata',
    name: 'Antarctica',
    isoCode: 'ATA',
    continent: 'Polar',
    lat: -75.25,
    lng: 0.0,
    baselineTempC: -45.0,
    warmingMultiplier: 2.2,
    historicalAnomaly2026C: 2.15,
    warmingRateDecadeC: 0.48,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Basal melting of West Antarctic ice shelves (Pine Island and Thwaites) threatening marine ice cliff collapse.',
    flagEmoji: '🇦🇶',
    famousLandmark: 'South Pole Station & Transantarctic Mountains',
    landmarkIcon: '🐧',
    temperatureChangeReasons: [
      'Circumpolar Deep Water (CDW) Intrusion: Warm dense ocean water surging onto the continental shelf melting ice shelves from below',
      'Antarctic Peninsula Atmospheric Warming: One of the fastest-warming regions on Earth with ice shelf collapses (Larsen B/C)',
      'Southern Annular Mode (SAM) Changes: Stronger circumpolar winds driving warm water upwelling toward coastal glaciers',
      'Record-Low Antarctic Sea Ice Extent: Diminished winter sea ice buffer allowing greater ocean-to-atmosphere heat transfer'
    ],
  },

  // Additional Expanded Countries - Europe
  {
    id: 'ita',
    name: 'Italy',
    isoCode: 'ITA',
    continent: 'Europe',
    lat: 41.87,
    lng: 12.56,
    baselineTempC: 13.5,
    warmingMultiplier: 1.55,
    historicalAnomaly2026C: 1.58,
    warmingRateDecadeC: 0.38,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Po River agricultural desiccation, Alpine glacier retreat, and Mediterranean marine heatwaves.',
    flagEmoji: '🇮🇹',
    famousLandmark: 'Colosseum & Venice Grand Canal',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Subtropical Anticyclone Migration: African heat domes persistently settling over the Tyrrhenian basin',
      'Alpine Elevation Warming: High altitude snow-albedo loss accelerating northern glacier loss',
      'Po Valley Soil Desiccation: Spring soil moisture deficits converting solar energy into sensible heating',
      'Mediterranean Marine Heatwaves: Sea temperatures exceeding +4°C anomaly preventing night cooling'
    ],
  },
  {
    id: 'grc',
    name: 'Greece',
    isoCode: 'GRC',
    continent: 'Europe',
    lat: 39.07,
    lng: 21.82,
    baselineTempC: 15.4,
    warmingMultiplier: 1.6,
    historicalAnomaly2026C: 1.65,
    warmingRateDecadeC: 0.40,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Prolonged summer heat domes exceeding 44°C and destructive wildfire seasons across islands.',
    flagEmoji: '🇬🇷',
    famousLandmark: 'Acropolis of Athens & Parthenon',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Aegean Atmospheric Stagnation: Weakened summer meltemi winds trapping superheated air',
      'Dry Shrubland Aridity: Accelerated evapotranspiration priming catastrophic wildfire feedback',
      'Subtropical Ridge Expansion: Stationary Saharan high pressure ridge anchoring over Peloponnese',
      'East Mediterranean Surface Warming: Record sea temperatures diminishing coastal marine breeze buffer'
    ],
  },
  {
    id: 'prt',
    name: 'Portugal',
    isoCode: 'PRT',
    continent: 'Europe',
    lat: 39.40,
    lng: -8.22,
    baselineTempC: 15.2,
    warmingMultiplier: 1.48,
    historicalAnomaly2026C: 1.52,
    warmingRateDecadeC: 0.35,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Iberian mega-droughts, pine forest fires, and Atlantic coastal erosion.',
    flagEmoji: '🇵🇹',
    famousLandmark: 'Belém Tower & Sintra Pena Palace',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'Azores High Expansion: Winter precipitation blockages causing multi-year hydrological deficits',
      'Iberian Thermal Depression: Interior Alentejo baking under intense summer solar insolation',
      'Canary Current Upwelling Changes: Altered offshore sea surface temperatures reducing fog protection',
      'Eucalyptus Monoculture Wildfire Feedback: Pyrogenic plant species amplifying local surface heating'
    ],
  },
  {
    id: 'che',
    name: 'Switzerland',
    isoCode: 'CHE',
    continent: 'Europe',
    lat: 46.82,
    lng: 8.23,
    baselineTempC: 5.5,
    warmingMultiplier: 1.95,
    historicalAnomaly2026C: 2.1,
    warmingRateDecadeC: 0.48,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Alpine glacier collapse, permafrost rockfalls, and water reserve loss for Rhine basin.',
    flagEmoji: '🇨🇭',
    famousLandmark: 'Matterhorn & Swiss Alps Glaciers',
    landmarkIcon: '🏔️',
    temperatureChangeReasons: [
      'Elevation-Dependent Warming: Alpine peaks warming at double the global rate due to snowline retreat',
      'Zero-Degree Isotherm Rise: Freezing level climbing above 5,000 meters in peak summer months',
      'Glacier Albedo Inversion: Melting ice uncovers dark moraine rock that absorbs incoming radiation',
      'Permafrost Creep: Warming sub-surface ice destabilizing mountain faces and cableway towers'
    ],
  },
  {
    id: 'nld',
    name: 'Netherlands',
    isoCode: 'NLD',
    continent: 'Europe',
    lat: 52.13,
    lng: 5.29,
    baselineTempC: 9.8,
    warmingMultiplier: 1.4,
    historicalAnomaly2026C: 1.38,
    warmingRateDecadeC: 0.32,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'North Sea surge vulnerability, polder soil subsidence, and Rhine summer discharge depletion.',
    flagEmoji: '🇳🇱',
    famousLandmark: 'Windmills of Kinderdijk & Delta Works',
    landmarkIcon: '🚲',
    temperatureChangeReasons: [
      'North Sea Warming Corridor: Coastal marine heat damping cold easterly winter air masses',
      'Peatland Oxidation: Drained low-lying polders drying and releasing stored carbon dioxide',
      'Summer Continental Inversions: Stationary easterly continental wind blocks bringing dry heat spikes',
      'Urbanized Randstad Heating: Concentrated asphalt infrastructure trapping evening sensible heat'
    ],
  },
  {
    id: 'pol',
    name: 'Poland',
    isoCode: 'POL',
    continent: 'Europe',
    lat: 51.92,
    lng: 19.15,
    baselineTempC: 7.9,
    warmingMultiplier: 1.5,
    historicalAnomaly2026C: 1.46,
    warmingRateDecadeC: 0.34,
    vulnerabilityStatus: 'Elevated',
    keyClimateRisk: 'Vistula and Oder river drought, reduced winter snowpack, and agricultural soil drying.',
    flagEmoji: '🇵🇱',
    famousLandmark: 'Wawel Castle & Białowieża Forest',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'Baltic Sea Winter Ice Loss: Diminished frozen sea buffer increasing coastal humidity and heat',
      'Continental Interior Drying: Reduced Atlantic moisture penetration causing prolonged summer droughts',
      'Earlier Snowmelt: Vanishing spring snow cover uncovering darker agricultural soils earlier',
      'High-Pressure Blocking: Cut-off atmospheric anticyclones diverting rain systems away from central plains'
    ],
  },
  {
    id: 'swe',
    name: 'Sweden',
    isoCode: 'SWE',
    continent: 'Europe',
    lat: 60.13,
    lng: 18.64,
    baselineTempC: 2.1,
    warmingMultiplier: 1.85,
    historicalAnomaly2026C: 1.95,
    warmingRateDecadeC: 0.46,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Baltic Sea winter ice retreat, boreal forest beetle infestations, and sub-Arctic tundra warming.',
    flagEmoji: '🇸🇪',
    famousLandmark: 'Stockholm Archipelago & Icehotel',
    landmarkIcon: '❄️',
    temperatureChangeReasons: [
      'Scandinavian Cryospheric Feedback: Shorter snow cover duration exposing dark coniferous forests',
      'Gulf Stream Teleconnections: Warm Atlantic water anomalies advecting into the Norwegian Sea',
      'Sub-Arctic Peat Thawing: Norrland mire permafrost degradations altering regional moisture balance',
      'Winter Minimum Temperature Surge: Polar nights warming faster than daytime summer hours'
    ],
  },
  {
    id: 'tur',
    name: 'Turkey',
    isoCode: 'TUR',
    continent: 'Europe',
    lat: 38.96,
    lng: 35.24,
    baselineTempC: 11.2,
    warmingMultiplier: 1.65,
    historicalAnomaly2026C: 1.72,
    warmingRateDecadeC: 0.42,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Anatolian plateau desertification, agricultural water rationing, and Mediterranean pine fires.',
    flagEmoji: '🇹🇷',
    famousLandmark: 'Hagia Sophia & Cappadocia Fairy Chimneys',
    landmarkIcon: '🕌',
    temperatureChangeReasons: [
      'Anatolian High-Altitude Desiccation: Central steppe losing winter moisture to evaporation',
      'Eastern Mediterranean Hotspot: Sea surface warming exceeding 2.5°C suppressing rain fronts',
      'Taurus Mountain Snow Deficits: Earlier snowpack depletion reducing irrigation reservoir recharge',
      'Persian Gulf Heat Plumes: Atmospheric ridges advecting dry desert thermal air into southeastern provinces'
    ],
  },

  // Additional Expanded Countries - Middle East & North Africa
  {
    id: 'mar',
    name: 'Morocco',
    isoCode: 'MAR',
    continent: 'Africa',
    lat: 31.79,
    lng: -7.09,
    baselineTempC: 17.1,
    warmingMultiplier: 1.5,
    historicalAnomaly2026C: 1.54,
    warmingRateDecadeC: 0.36,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'High Atlas snowpack depletion, Saharan dust encroachment, and olive orchard failure.',
    flagEmoji: '🇲🇦',
    famousLandmark: 'Hassan II Mosque & Atlas Mountains',
    landmarkIcon: '🕌',
    temperatureChangeReasons: [
      'Chergui Desert Wind Events: Superheated Saharan air blowing west over the Atlas crest',
      'Atlas Snowpack Decline: Loss of high mountain snow reservoirs accelerating summer heat peaks',
      'Hadley Cell Descent: Subtropical high-pressure zone preventing winter rain storms from landing',
      'Canary Ocean Current Shifting: Diminishing cold Atlantic water upwelling along coastal ports'
    ],
  },
  {
    id: 'uae',
    name: 'United Arab Emirates',
    isoCode: 'ARE',
    continent: 'Asia',
    lat: 23.42,
    lng: 53.85,
    baselineTempC: 27.2,
    warmingMultiplier: 1.75,
    historicalAnomaly2026C: 1.82,
    warmingRateDecadeC: 0.44,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Extreme wet-bulb temperatures approaching physiological limits of human endurance.',
    flagEmoji: '🇦🇪',
    famousLandmark: 'Burj Khalifa & Sheikh Zayed Mosque',
    landmarkIcon: '🏙️',
    temperatureChangeReasons: [
      'Arabian Gulf Marine Thermal Accumulation: Shallow hyper-saline sea surface temps reaching 36°C',
      'Rub al Khali Heat Engine: Expansive southern sand sea acting as a continental thermal generator',
      'Atmospheric Inversion Domes: Marine moisture trapped beneath dry descending upper-level air masses',
      'Urban Heat Concentration: Rapid high-density architectural glazing and air conditioning exhaust'
    ],
  },
  {
    id: 'sau',
    name: 'Saudi Arabia',
    isoCode: 'SAU',
    continent: 'Asia',
    lat: 23.89,
    lng: 45.08,
    baselineTempC: 25.4,
    warmingMultiplier: 1.7,
    historicalAnomaly2026C: 1.78,
    warmingRateDecadeC: 0.43,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Summertime peak temperatures exceeding 52°C, deep aquifer depletion, and sandstorms.',
    flagEmoji: '🇸🇦',
    famousLandmark: 'Al-Ula Old Town & Mecca Clock Tower',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Arabian Desert Solar Absorption: Vast red-gold sand fields reflecting infrared heat upward',
      'Persistent High-Pressure Domination: Upper-level tropospheric subsidence inhibiting cloud formation',
      'Red Sea Warming: Coastal waters reaching record anomalies reducing nocturnal relief in Jeddah',
      'Zero-Vegetation Buffer: Lack of evapotranspirative cooling causing purely sensible heat transfer'
    ],
  },
  {
    id: 'dza',
    name: 'Algeria',
    isoCode: 'DZA',
    continent: 'Africa',
    lat: 28.03,
    lng: 1.66,
    baselineTempC: 22.5,
    warmingMultiplier: 1.65,
    historicalAnomaly2026C: 1.74,
    warmingRateDecadeC: 0.41,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Deep Saharan thermal dome expansion and Tell Atlas oak forest wildfire destruction.',
    flagEmoji: '🇩🇿',
    famousLandmark: 'Tassili n\'Ajjer National Park & Casbah',
    landmarkIcon: '🏜️',
    temperatureChangeReasons: [
      'Central Saharan Thermal Core: Grand Erg Occidental generating persistent 50°C summer air masses',
      'Sirocco Heat Waves: Strong southerly winds transporting desert heat north into Mediterranean cities',
      'Atlas Mountain Rainshadow: Dry descending foehn winds heating coastal agricultural valleys',
      'Soil Moisture Deficit: Sub-surface moisture depletion intensifying daytime surface radiative flux'
    ],
  },

  // Additional Expanded Countries - Sub-Saharan Africa
  {
    id: 'zaf',
    name: 'South Africa',
    isoCode: 'ZAF',
    continent: 'Africa',
    lat: -30.56,
    lng: 22.94,
    baselineTempC: 17.5,
    warmingMultiplier: 1.45,
    historicalAnomaly2026C: 1.48,
    warmingRateDecadeC: 0.35,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Day Zero municipal water crises, Karoo desertification, and maize harvest failures.',
    flagEmoji: '🇿🇦',
    famousLandmark: 'Table Mountain & Cape of Good Hope',
    landmarkIcon: '🦁',
    temperatureChangeReasons: [
      'Subtropical High Ridge Migration: South Atlantic high pressure blocking winter cold fronts from Cape',
      'Kalahari Continental Heating: Semi-arid interior plateaus transferring heat to southern coastlines',
      'Agulhas Current Warming: Warm western boundary current warming south-east coastal atmospheric boundary',
      'Soil Moisture Evaporative Strain: High vapor pressure deficits drying crop soils across Highveld'
    ],
  },
  {
    id: 'eth',
    name: 'Ethiopia',
    isoCode: 'ETH',
    continent: 'Africa',
    lat: 9.15,
    lng: 40.49,
    baselineTempC: 22.2,
    warmingMultiplier: 1.35,
    historicalAnomaly2026C: 1.38,
    warmingRateDecadeC: 0.31,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Horn of Africa mega-droughts, coffee growing belt elevation shifts, and pastoralist crises.',
    flagEmoji: '🇪🇹',
    famousLandmark: 'Rock-Hewn Churches of Lalibela & Simien Mountains',
    landmarkIcon: '⛪',
    temperatureChangeReasons: [
      'Indian Ocean Dipole (IOD) Fluctuations: Positive phase suppressing essential spring Belg rains',
      'Highland Thermal Inversion: High-altitude plateau heating threatening delicate mountain coffee forests',
      'Danakil Depression Thermal Hearth: Lowest land depression concentrating extreme radiative heat',
      'Intertropical Convergence Zone Shift: Erratic monsoon boundary creating multi-year rain failures'
    ],
  },
  {
    id: 'gha',
    name: 'Ghana',
    isoCode: 'GHA',
    continent: 'Africa',
    lat: 7.95,
    lng: -1.02,
    baselineTempC: 27.2,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.3,
    warmingRateDecadeC: 0.28,
    vulnerabilityStatus: 'Elevated',
    keyClimateRisk: 'Guinea Current coastal storm erosion, cocoa production heat stress, and Volta basin evaporation.',
    flagEmoji: '🇬🇭',
    famousLandmark: 'Cape Coast Castle & Lake Volta',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'Gulf of Guinea Ocean Warming: Coastal sea surface temperatures elevating atmospheric humidity',
      'Harmattan Wind Alterations: Changing desert dust wind intensity from the northeast interior',
      'Deforestation Along Cocoa Belt: Agricultural clearance eliminating protective microclimatic forest canopy',
      'Volta Basin Evaporative Loss: Massive open water reservoirs losing billions of cubic meters to heating'
    ],
  },
  {
    id: 'tza',
    name: 'Tanzania',
    isoCode: 'TZA',
    continent: 'Africa',
    lat: -6.37,
    lng: 34.89,
    baselineTempC: 22.5,
    warmingMultiplier: 1.3,
    historicalAnomaly2026C: 1.34,
    warmingRateDecadeC: 0.29,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Vanishing glaciers of Mount Kilimanjaro, Great Rift Valley lake drying, and wildlife migration shifts.',
    flagEmoji: '🇹🇿',
    famousLandmark: 'Mount Kilimanjaro & Serengeti National Park',
    landmarkIcon: '🐘',
    temperatureChangeReasons: [
      'Kilimanjaro Summit Sublimation: Dry ascending air melting remaining equatorial ice caps since 1912',
      'Indian Ocean Sea Surface Warming: Supercharging regional cyclone intensity while shifting rain belts',
      'Rift Valley Lake Evaporative Stress: Rising temperatures accelerating water loss in shallow soda lakes',
      'Equatorial Savanna Dryout: Extended dry seasons shortening grazing cycles in the Serengeti ecosystem'
    ],
  },
  {
    id: 'mdg',
    name: 'Madagascar',
    isoCode: 'MDG',
    continent: 'Africa',
    lat: -18.77,
    lng: 46.87,
    baselineTempC: 22.8,
    warmingMultiplier: 1.32,
    historicalAnomaly2026C: 1.36,
    warmingRateDecadeC: 0.30,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Southern Grand Sud famine drought and category 4-5 Indian Ocean tropical cyclone strikes.',
    flagEmoji: '🇲🇬',
    famousLandmark: 'Avenue of the Baobabs & Tsingy de Bemaraha',
    landmarkIcon: '🌴',
    temperatureChangeReasons: [
      'Southern Aridity Expansion: Rain shadow behind eastern mountains drying southern spiny forests',
      'Mozambique Channel Marine Heatwaves: Record ocean heat amplifying cyclonic landfall energy',
      'Deforestation Albedo Shift: Massive slash-and-burn clearing exposing red laterite soils',
      'Indian Ocean Dipole Coupling: Disrupted easterly trade winds causing prolonged precipitation deficits'
    ],
  },
  {
    id: 'cod',
    name: 'DR Congo',
    isoCode: 'COD',
    continent: 'Africa',
    lat: -4.04,
    lng: 21.76,
    baselineTempC: 24.5,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.28,
    warmingRateDecadeC: 0.27,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Congo Basin peatland carbon release, forest canopy heat stress, and tropical disease expansion.',
    flagEmoji: '🇨🇩',
    famousLandmark: 'Virunga Volcanoes & Congo River Basin',
    landmarkIcon: '🦍',
    temperatureChangeReasons: [
      'Central African Peatland Drying: Cuvette Centrale peat deposits vulnerable to drying and carbon outgassing',
      'Forest Canopy Thermal Stress: Peak daytime temperatures approaching photosynthetic thermal thresholds',
      'Equatorial Convective Instability: Warmer boundary layer driving erratic mega-thunderstorms',
      'River Basin Discharge Volatility: Increased evaporative demand decreasing navigable river levels'
    ],
  },

  // Additional Expanded Countries - Asia
  {
    id: 'kor',
    name: 'South Korea',
    isoCode: 'KOR',
    continent: 'Asia',
    lat: 35.91,
    lng: 127.77,
    baselineTempC: 11.8,
    warmingMultiplier: 1.6,
    historicalAnomaly2026C: 1.68,
    warmingRateDecadeC: 0.40,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'East Sea marine heatwaves, supercharged summer monsoon downpours, and tropical night expansion.',
    flagEmoji: '🇰🇷',
    famousLandmark: 'Gyeongbokgung Palace & Jeju Hallasan',
    landmarkIcon: '🏯',
    temperatureChangeReasons: [
      'East Sea / Sea of Japan Marine Warming: Sea surface temperatures rising at 2.5x the global ocean average',
      'Subtropical High Expansion: North Pacific anticyclone pushing tropical air masses over the peninsula',
      'Urban Thermal Mass in Seoul: Dense concrete infrastructure creating chronic urban heat dome anomalies',
      'Weakened Siberian High in Winter: Diminished arctic cold surges producing unseasonably mild winter months'
    ],
  },
  {
    id: 'tha',
    name: 'Thailand',
    isoCode: 'THA',
    continent: 'Asia',
    lat: 15.87,
    lng: 100.99,
    baselineTempC: 27.5,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.32,
    warmingRateDecadeC: 0.28,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Bangkok urban subsidence, Chao Phraya flood/drought swings, and coral reef bleaching in Gulf.',
    flagEmoji: '🇹🇭',
    famousLandmark: 'Grand Palace Bangkok & Wat Arun',
    landmarkIcon: '🛕',
    temperatureChangeReasons: [
      'El Niño Teleconnection Forcing: Drought and delayed monsoon onsets during warm Pacific phases',
      'Gulf of Thailand Heat Stagnation: Shallow ocean basin accumulating record surface thermal energy',
      'Chao Phraya Floodplain Urbanization: Replacement of green agricultural sponges with heat-absorbing concrete',
      'Tropical Humidity Compounding: High dew points creating dangerous heat index levels exceeding 50°C'
    ],
  },
  {
    id: 'vnm',
    name: 'Vietnam',
    isoCode: 'VNM',
    continent: 'Asia',
    lat: 14.06,
    lng: 108.28,
    baselineTempC: 24.8,
    warmingMultiplier: 1.3,
    historicalAnomaly2026C: 1.35,
    warmingRateDecadeC: 0.30,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Mekong Delta seawater intrusion, typhoons hitting central coast, and rice bowl crop losses.',
    flagEmoji: '🇻🇳',
    famousLandmark: 'Ha Long Bay & Hoi An Ancient Town',
    landmarkIcon: '🏮',
    temperatureChangeReasons: [
      'East Sea / South China Sea Warming: Warm ocean temperatures fueling rapid typhoon intensification',
      'Mekong Hydrological Deficits: Reduced upstream glacier melt coupled with intense delta evaporation',
      'Southwest Monsoon Volatility: Delayed monsoon arrival leading to prolonged spring heatwaves',
      'Deltaic Low Elevation Vulnerability: Low-lying alluvial plains susceptible to marine thermal back-flooding'
    ],
  },
  {
    id: 'phl',
    name: 'Philippines',
    isoCode: 'PHL',
    continent: 'Asia',
    lat: 12.88,
    lng: 121.77,
    baselineTempC: 26.6,
    warmingMultiplier: 1.22,
    historicalAnomaly2026C: 1.26,
    warmingRateDecadeC: 0.26,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Super typhoons (Category 5), coral reef die-off, and coastal city storm surge inundation.',
    flagEmoji: '🇵🇭',
    famousLandmark: 'Chocolate Hills & Mayon Volcano',
    landmarkIcon: '🏝️',
    temperatureChangeReasons: [
      'Western Pacific Warm Pool: World\'s warmest ocean reservoir providing endless thermal energy for typhoons',
      'Archipelagic Marine Heatwaves: Prolonged sea surface anomalies triggering massive coral bleaching',
      'Urban Metro Manila Microclimate: Dense population center and heat-trapping low-altitude coastal basin',
      'ENSO Phase Oscillation: Severe droughts during El Niño alternating with catastrophic flood cyclones'
    ],
  },
  {
    id: 'pak',
    name: 'Pakistan',
    isoCode: 'PAK',
    continent: 'Asia',
    lat: 30.38,
    lng: 69.35,
    baselineTempC: 22.8,
    warmingMultiplier: 1.7,
    historicalAnomaly2026C: 1.82,
    warmingRateDecadeC: 0.44,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Himalayan-Karakoram glacial lake outburst floods (GLOFs) and historic Indus basin mega-floods.',
    flagEmoji: '🇵🇰',
    famousLandmark: 'Badshahi Mosque & K2 Mountain Crest',
    landmarkIcon: '🕌',
    temperatureChangeReasons: [
      'Karakoram / Himalayan Glacier Melt: Accelerated ice loss creating unstable proglacial moraine lakes',
      'Indus Basin Heat Furnace: Jacobabad and interior Sindh consistently recording world\'s highest wet-bulb heat',
      'Monsoon Depression Channeling: Saturated Arabian Sea moisture plumes interacting with mountain slopes',
      'Soil Moisture Evaporative Strain: Semi-arid agricultural zones drying and releasing sensible thermal radiation'
    ],
  },
  {
    id: 'irn',
    name: 'Iran',
    isoCode: 'IRN',
    continent: 'Asia',
    lat: 32.43,
    lng: 53.69,
    baselineTempC: 17.5,
    warmingMultiplier: 1.65,
    historicalAnomaly2026C: 1.76,
    warmingRateDecadeC: 0.42,
    vulnerabilityStatus: 'Critical',
    keyClimateRisk: 'Lake Urmia desiccation, Zagros mountain forest die-back, and Khuzestan dust storms.',
    flagEmoji: '🇮🇷',
    famousLandmark: 'Persepolis & Naqsh-e Jahan Square',
    landmarkIcon: '🏛️',
    temperatureChangeReasons: [
      'Central Iranian Plateau Thermal Dome: Arid high desert basins reflecting intense solar radiation',
      'Lake Urmia Saline Desiccation: Disappearance of massive salt lake eliminating local moderating humidity',
      'Zagros Mountain Snow Deficits: Earlier spring thaw depriving southwestern river basins of summer melt',
      'Persian Gulf Heat Intrusions: Southern coastal provinces experiencing extreme 50°C heat with high humidity'
    ],
  },

  // Additional Expanded Countries - Latin America & Caribbean
  {
    id: 'col',
    name: 'Colombia',
    isoCode: 'COL',
    continent: 'South America',
    lat: 4.57,
    lng: -74.30,
    baselineTempC: 24.2,
    warmingMultiplier: 1.25,
    historicalAnomaly2026C: 1.28,
    warmingRateDecadeC: 0.28,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Andean Páramo water sponge ecosystem retreat and tropical glacier vanishing (Nevado del Ruiz).',
    flagEmoji: '🇨🇴',
    famousLandmark: 'Cartagena Old Town & Sierra Nevada de Santa Marta',
    landmarkIcon: '🏰',
    temperatureChangeReasons: [
      'High-Altitude Páramo Warming: Unique alpine sponge wetlands losing cloud moisture retention',
      'Tropical Andean Glacier Loss: Glaciers losing over 80% of mass since 1950, disrupting drinking water',
      'Pacific / Caribbean Double Coast Warming: Marine heatwaves destabilizing coral reefs and coastal fisheries',
      'Amazonian Deforestation Teleconnections: Southern rainforest clearing altering regional atmospheric moisture'
    ],
  },
  {
    id: 'chl',
    name: 'Chile',
    isoCode: 'CHL',
    continent: 'South America',
    lat: -35.68,
    lng: -71.54,
    baselineTempC: 11.2,
    warmingMultiplier: 1.35,
    historicalAnomaly2026C: 1.38,
    warmingRateDecadeC: 0.32,
    vulnerabilityStatus: 'Severe',
    keyClimateRisk: 'Unprecedented 13-year central Chile mega-drought, Patagonian ice field retreat, and wildfires.',
    flagEmoji: '🇨🇱',
    famousLandmark: 'Torres del Paine & Atacama Desert',
    landmarkIcon: '🏔️',
    temperatureChangeReasons: [
      'South Pacific Anticyclone Expansion: Subtropical high blocking Pacific winter storms from reaching Santiago',
      'Southern Patagonian Icefield Melting: Rapid thinning of calving glaciers due to warmer ocean currents',
      'Central Valley Foehn Winds: Downslope winds over the Andes creating catastrophic fire-weather conditions',
      'Atacama Desert Thermal Expansion: Hyper-arid desert boundary expanding southward into fertile valleys'
    ],
  },
];

