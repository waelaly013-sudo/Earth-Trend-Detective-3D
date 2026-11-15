/**
 * NASA Earth Trend Detective - Types
 * Built for NASA Space Apps Challenge
 */

// What this does: Lists the five main planetary systems studied in the app (ice, plants/land, water, air, and oceans).
// On the website: Appears as domain tags and badges on hotspot cards, charts, and alerts.
// Used as: Category labels for classifying climate hotspots and alerts.
export type EarthDomain = 'Cryosphere' | 'Biosphere' | 'Hydrosphere' | 'Atmosphere' | 'Ocean Heat';

// What this does: Names the three main atmospheric measurements users can switch between.
// On the website: Corresponds to the Temperature, Humidity, and Wind buttons in the top bar.
// Used as: The active data mode controlling pins, colors, and sidebar readouts.
export type DataBranch = 'temperature' | 'humidity' | 'wind';

// What this does: Lists the nine connected environmental measurements derived from Temperature, Humidity, or Wind.
// On the website: Identifies each coupled satellite metric card shown in the data panel.
// Used as: Unique IDs for looking up and rendering coupled NASA environmental effects.
export type CoupledEffectId =
  // Temperature effects:
  | 'surface-temp'         // AIRS, MODIS: Surface skin temperature
  | 'snow-ice'             // MODIS, NSIDC: Snow cover and sea ice
  | 'ozone'                // OMI: Ozone column
  // Humidity effects:
  | 'precipitation'        // GPM (IMERG): Precipitation
  | 'evapotranspiration'   // MERRA-2, GLDAS: Evaporation / evapotranspiration
  | 'soil-moisture'        // GLDAS: Soil moisture, runoff, streamflow-related fields
  // Wind Speed effects:
  | 'vegetation'           // MODIS: Vegetation greenness (NDVI/EVI)
  | 'aerosols'             // MODIS, MERRA-2: Aerosol optical depth
  | 'no2';                 // OMI: Nitrogen dioxide (air pollution)

// What this does: Defines the full details for one connected satellite effect (name, values, 2040 forecast, and explanation).
// On the website: Powers each coupled environmental effect card inside the location inspector panel.
// Used as: The data object returned by the coupled-effects calculator for any clicked location.
export interface NasaCoupledEffect {
  id: CoupledEffectId;
  name: string;
  driverBranch: DataBranch;
  sourceAndInstrument: string; // Exact match to user specification table
  nasaMission: string;
  leadProvider: string;
  satelliteOrModel: string;
  currentValue: number;
  unit: string;
  unitSymbol: string;
  baselineValue: number;
  anomalyFormatted: string;
  predicted2040Value: number;
  predictionAccuracyPct: number;
  confidenceLower2040: number;
  confidenceUpper2040: number;
  sensorPrecision: string;
  decadalRate: string;
  simpleExplanation: string; // Plain English beautiful summary
  physicalCouplingMechanism: string; // Physical link from primary branch
  color: string;
  iconName: string;
}

// What this does: Represents one yearly data point (year, value, and optional AI forecast confidence bounds).
// On the website: Plots individual historical and future points on the 2000-2040 trend charts.
// Used as: The building block array item for all time-series climate graphs.
export interface TimeSeriesPoint {
  year: number;
  value: number;
  isPrediction?: boolean;
  confidenceLower?: number;
  confidenceUpper?: number;
}

// What this does: Stores all calculated numbers from the Mann-Kendall statistical trend test.
// On the website: Displays whether a climate trend is statistically real, its direction, and its p-value score.
// Used as: The statistical analysis result attached to each climate hotspot region.
export interface MannKendallResult {
  s: number;                // Mann-Kendall S statistic
  tau: number;              // Kendall's Tau (-1 to +1)
  varianceS: number;        // Var(S) with tie adjustments
  zScore: number;           // Standard normal test statistic Z
  pValue: number;           // 2-tailed p-value
  sensSlope: number;        // Sen's slope estimator (rate of change / year)
  isSignificant: boolean;   // true if p < 0.05
  alpha: number;            // 0.05 significance threshold
  h0Rejected: boolean;      // Null hypothesis rejected (trend exists)
  trendDirection: 'decreasing' | 'increasing' | 'stable';
  sampleCount: number;
}

// What this does: Describes a major climate hotspot on Earth along with its coordinates, trend series, and NASA sensor details.
// On the website: Drives the glowing hotspot pins on the 3D globe and all information shown when a hotspot is clicked.
// Used as: The main data model for Temperature, Humidity, and Wind hotspot regions.
export interface ClimateRegion {
  id: string;
  name: string;
  domain: EarthDomain;
  lat: number;
  lng: number;
  variableName: string;
  variableUnit: string;
  rateOfChangeDecade: string;
  headlineSummary: string;
  detailedAnalysis: string;
  nasaInstruments: string[];
  historicalRange: [number, number];
  currentAnomaly: string;
  aiPredictionImpact: string;
  color: string;
  timeSeries: TimeSeriesPoint[];
  mannKendall: MannKendallResult;
  urgencyLevel: 'Critical' | 'Severe' | 'Elevated' | 'Monitoring';
  flagEmoji?: string;
  famousLandmark?: string;
  landmarkIcon?: string;
  temperatureChangeReasons?: string[];
  humidityChangeReasons?: string[];
  windChangeReasons?: string[];
  variableChangeReasons?: string[];
  dataBranch?: DataBranch;
  sourceAndInstrument?: string;
  predictionAccuracyPct?: number;
  sensorErrorMargin?: string;
  humidityMetrics?: {
    relativeHumidityPct?: number;
    relativeHumidityAnomalyPct?: number;
    specificHumidityGKg?: number;
    vaporPressureDeficitKPa?: number;
    dewPointC?: number;
    wetBulbC?: number;
    satelliteSensor?: string;
  };
  windMetrics?: {
    meanWindSpeedMs?: number;        // Surface 10m wind speed in m/s
    windSpeedKmh?: number;           // km/h
    gustSpeedMs?: number;            // Gust velocity in m/s
    gustSpeedKmh?: number;           // km/h
    beaufortScale?: number;          // 0-12
    beaufortDescription?: string;    // "Moderate Breeze", "Gale", "Hurricane Force"
    windPowerDensityWm2?: number;    // W/m^2
    prevailingDirection?: string;    // "WNW (290°)", "ENE Trade Winds"
    satelliteSensor?: string;        // "NASA CYGNSS & RapidScat", "ASCAT-B"
    decadalTrendPct?: number;        // % change per decade (+4.2% oceanic acceleration, etc.)
  };
  surfaceTempMetrics?: {
    skinTempC?: number;
    skinTempK?: number;
    dayNightDeltaC?: number;
    emissivity?: number;
    satelliteSensor?: string;
  };
  precipitationMetrics?: {
    precipitationMmMonth?: number;
    precipitationRateMmDay?: number;
    convectiveFractionPct?: number;
    rainSnowPartitionPct?: number;
    satelliteSensor?: string;
  };
  evapotranspirationMetrics?: {
    actualETMmDay?: number;
    potentialETMmDay?: number;
    latentHeatFluxWm2?: number;
    evaporativeStressIndex?: number;
    satelliteSensor?: string;
  };
  soilMoistureMetrics?: {
    volumetricWaterContentM3M3?: number;
    rootZoneSoilMoisturePct?: number;
    surfaceRunoffMmDay?: number;
    streamflowAnomPct?: number;
    satelliteSensor?: string;
  };
  snowIceMetrics?: {
    seaIceExtentMillionKm2?: number;
    snowCoverFractionPct?: number;
    snowWaterEquivalentMm?: number;
    surfaceAlbedo?: number;
    satelliteSensor?: string;
  };
  vegetationMetrics?: {
    ndvi?: number;
    evi?: number;
    fapar?: number;
    canopyStressLevel?: string;
    satelliteSensor?: string;
  };
  aerosolMetrics?: {
    aod550nm?: number;
    fineModeFraction?: number;
    absorbingAerosolIndex?: number;
    airborneHazeClassification?: string;
    satelliteSensor?: string;
  };
  no2Metrics?: {
    troposphericColumn10e15MolecCm2?: number;
    groundLevelEstimatePpb?: number;
    anthropogenicFractionPct?: number;
    airQualityIndexCategory?: string;
    satelliteSensor?: string;
  };
  ozoneMetrics?: {
    totalColumnDobsonUnits?: number;
    stratosphericFractionPct?: number;
    ozoneHoleSeverityIndex?: string;
    uvIndexMultiplier?: number;
    satelliteSensor?: string;
  };
}

// What this does: Describes a country's baseline climate stats, risk levels, landmark, and reasons for local climate changes.
// On the website: Supplies the data shown when a user searches for or clicks a country on the globe.
// Used as: The data model for every nation in the country directory.
export interface CountryLocation {
  type: 'country';
  id: string;
  name: string;
  isoCode: string;
  continent: string;
  lat: number;
  lng: number;
  baselineTempC: number;
  warmingMultiplier: number;
  historicalAnomaly2026C: number;
  warmingRateDecadeC: number;
  vulnerabilityStatus: 'Critical' | 'Severe' | 'Elevated' | 'Moderate';
  keyClimateRisk: string;
  color: string;
  flagEmoji: string;
  famousLandmark: string;
  landmarkIcon: string;
  temperatureChangeReasons: string[];
  baselineRelativeHumidityPct?: number;
  humidityAnomaly2026Pct?: number;
  specificHumidityGKg?: number;
  dewPointC?: number;
  vaporPressureDeficitKPa?: number;
  humidityRiskStatus?: 'Extreme Moist Heat' | 'Severe Aridity / Drying' | 'Elevated Desiccation' | 'Moisture Surplus';
  humidityChangeReasons?: string[];
  meanWindSpeedMs?: number;
  meanWindSpeedKmh?: number;
  gustSpeedKmh?: number;
  beaufortScale?: number;
  beaufortDescription?: string;
  windPowerDensityWm2?: number;
  prevailingWindDirection?: string;
  windHazardStatus?: string;
  windChangeReasons?: string[];
}

// What this does: Holds calculated climate estimates for any arbitrary point clicked anywhere on the 3D globe.
// On the website: Displays temperature, humidity, and wind estimates when clicking open ocean or unpinned land.
// Used as: The data structure for free-click coordinates on Earth.
export interface CustomLocation {
  type: 'custom';
  id: string;
  name: string;
  lat: number;
  lng: number;
  calculatedTempC: number;
  anomalyC: number;
  baselineTempC: number;
  warmingRateDecadeC: number;
  color: string;
  flagEmoji?: string;
  famousLandmark?: string;
  landmarkIcon?: string;
  temperatureChangeReasons?: string[];
  calculatedHumidityPct?: number;
  humidityAnomalyPct?: number;
  specificHumidityGKg?: number;
  dewPointC?: number;
  humidityChangeReasons?: string[];
  calculatedWindSpeedMs?: number;
  calculatedWindSpeedKmh?: number;
  calculatedGustKmh?: number;
  beaufortScale?: number;
  windChangeReasons?: string[];
}

// What this does: Combines hotspots, countries, and custom clicked spots into a single union type.
// On the website: Allows the side panel to show details seamlessly no matter what kind of place the user selects.
// Used as: The type of the currently inspected location across the app.
export type ActiveInspectorItem = 
  | ({ type: 'hotspot' } & ClimateRegion)
  | CountryLocation
  | CustomLocation;

// What this does: Lists the four visual appearance themes available for the 3D Earth globe.
// On the website: Determines whether the globe looks like Blue Marble, Night Lights, Topographic Map, or Thermal Radar.
// Used as: The style key inside GlobeSettings.
export type GlobeStyle = 'blue-marble' | 'night-lights' | 'topographic' | 'thermal-radar';

// What this does: Stores all visual appearance preferences for the 3D globe and space backdrop.
// On the website: Controls cloud visibility, glow color, star count, sunlight brightness, and grid lines.
// Used as: The settings object managed by GlobeBackgroundModal and EarthGlobe.
export interface GlobeSettings {
  style: GlobeStyle;
  cloudOpacity: number;
  atmosphereGlowColor: string;
  atmosphereGlowIntensity: number;
  starDensity: 'low' | 'medium' | 'high';
  sunIntensity: number;
  showGraticule: boolean;
}

// What this does: Tracks which overlay layers (pins, heatmaps, clouds, night lights, AI vectors) are toggled on or off.
// On the website: Shows or hides each visual layer on the 3D Earth when users toggle layer switches.
// Used as: The layer visibility state shared between controls and the 3D globe.
export interface GlobeLayers {
  pins: boolean;
  heatmaps: boolean;
  thermalHeatmap: boolean; // Global temperature anomaly heatmap in Celsius
  globalTempHeatmap: boolean; // Global Temperature Heatmap translucent anomaly gradient overlay
  clouds: boolean;
  nightLights: boolean;
  aiVectors: boolean;
  atmosphereGlow: boolean;
}

// What this does: Defines the structure of a user feedback submission with rating, category, comment, and active year/region.
// On the website: Saves what the user submits in the Feedback modal.
// Used as: The payload format for user feedback entries.
export interface UserFeedbackPayload {
  id: string;
  timestamp: string;
  region: {
    id: string;
    name: string;
    coordinates?: string;
  } | null;
  year: number;
  isAiPrediction: boolean;
  category: 'visualization' | 'data' | 'predictions' | 'general';
  rating: number; // 1 to 5
  comment: string;
}

// What this does: Describes a critical climate milestone or tipping-point warning tied to a specific year and place.
// On the website: Powers the popup alert toast and the Climate Alerts feed modal.
// Used as: The data structure for critical anomaly notifications triggered as the timeline advances.
export interface CriticalAnomalyAlert {
  id: string;
  year: number;
  month?: number;
  title: string;
  locationName: string;
  domain: EarthDomain;
  severity: 'critical' | 'extreme' | 'tipping-point';
  metricName: string;
  metricValue: string;
  baselineComparison: string;
  thresholdBreached: string;
  summary: string;
  physicalDriver: string;
  lat: number;
  lng: number;
  regionId?: string;
  countryId?: string;
  isAiPrediction: boolean;
  categoryIcon: 'ice' | 'heat' | 'ocean' | 'forest' | 'storm';
}
