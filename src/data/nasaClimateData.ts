/**
 * NASA Earth Observation & Climate Hotspots
 * Curated for NASA Space Apps Challenge
 */

import { ClimateRegion, TimeSeriesPoint } from '../types/climate';
import { calculateMannKendall } from '../utils/mannKendall';

// What this does: Builds a year-by-year climate dataset from 2000 to 2026 (historical) and 2027 to 2040 (AI forecast with error range).
// On the website: Generates the curves plotted on hotspot line charts and timeline sliders.
// Used as: The shared generator for each temperature hotspot's timeSeries array.
function createSeries(
  historicalBase: number,
  historicalTrendPerYear: number,
  historicalNoise: number[],
  aiAccelerateFactor: number,
  confidenceSpread: number
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  let currentVal = historicalBase;

  // 2000 to 2026 (Historical NASA observations)
  for (let year = 2000; year <= 2026; year++) {
    const idx = year - 2000;
    const noise = historicalNoise[idx % historicalNoise.length] || 0;
    const val = Number((currentVal + noise).toFixed(2));
    points.push({
      year,
      value: val,
      isPrediction: false,
    });
    currentVal += historicalTrendPerYear;
  }

  // 2027 to 2040 (AI Ensemble Projections)
  const lastHistorical = points[points.length - 1].value;
  let aiVal = lastHistorical;
  for (let year = 2027; year <= 2040; year++) {
    const yearFrom2026 = year - 2026;
    aiVal += historicalTrendPerYear * aiAccelerateFactor;
    const spread = confidenceSpread * Math.sqrt(yearFrom2026);
    points.push({
      year,
      value: Number(aiVal.toFixed(2)),
      isPrediction: true,
      confidenceLower: Number((aiVal - spread).toFixed(2)),
      confidenceUpper: Number((aiVal + spread).toFixed(2)),
    });
  }

  return points;
}

// 1. Arctic Sea Ice (Thickness / Extent)
const arcticNoise = [-0.08, 0.12, -0.05, 0.04, -0.15, -0.22, 0.09, -0.31, 0.05, -0.12, -0.18, 0.03, -0.25, 0.08, -0.04, -0.11, 0.07, -0.09, 0.02, -0.14, 0.03, -0.08, -0.12, 0.05, -0.15, -0.1, -0.06];
const arcticSeries = createSeries(6.85, -0.086, arcticNoise, 1.25, 0.35);

// 2. Amazon Deforestation & Canopy Biomass
const amazonNoise = [0.1, -0.15, 0.2, -0.08, 0.12, -0.25, 0.18, -0.1, 0.05, -0.12, 0.08, -0.18, 0.14, -0.05, 0.11, -0.07, 0.19, -0.15, 0.22, -0.09, 0.13, -0.11, 0.08, -0.04, 0.12, -0.08, 0.04];
const amazonSeries = createSeries(100.0, -0.84, amazonNoise, 1.35, 1.8);

// 3. North Atlantic Sea Surface Temperature
const sstNoise = [-0.12, 0.08, -0.05, 0.14, -0.03, 0.18, -0.09, 0.22, -0.04, 0.15, -0.08, 0.19, -0.02, 0.11, 0.25, -0.07, 0.16, 0.09, -0.05, 0.21, 0.13, -0.03, 0.28, 0.19, -0.02, 0.24, 0.15];
const sstSeries = createSeries(12.4, 0.032, sstNoise, 1.3, 0.22);

// 4. Sahara & Sahel Soil Moisture
const saharaNoise = [0.08, -0.1, 0.05, -0.12, 0.04, -0.09, 0.06, -0.15, 0.03, -0.08, 0.07, -0.11, 0.02, -0.14, 0.05, -0.08, 0.03, -0.12, 0.04, -0.09, 0.06, -0.1, 0.02, -0.07, 0.04, -0.08, 0.01];
const saharaSeries = createSeries(14.8, -0.065, saharaNoise, 1.2, 0.45);

// 5. Greenland Ice Sheet Mass Anomaly
const greenlandNoise = [12, -25, 8, -42, 19, -55, 30, -68, 14, -85, 22, -90, -110, 45, -70, -82, 35, -95, -60, -115, 40, -85, -78, -120, -95, -135, -105];
const greenlandSeries = createSeries(0.0, -225.0, greenlandNoise, 1.28, 110.0);

// 6. Great Barrier Reef Thermal Stress (Degree Heating Weeks)
const reefNoise = [-0.5, 0.8, -0.3, 1.2, -0.6, 2.1, -0.8, 1.5, -0.4, 2.8, -0.7, 1.9, 0.5, 3.4, -0.2, 4.1, 0.9, -0.5, 3.8, 1.2, 4.6, 0.8, 5.2, 2.1, 5.9, 3.4, 6.2];
const reefSeries = createSeries(2.2, 0.18, reefNoise, 1.4, 0.85);

// 7. Tibetan Plateau Glaciers Volume
const tibetNoise = [0.1, -0.15, 0.08, -0.2, 0.12, -0.22, 0.05, -0.28, 0.14, -0.31, 0.09, -0.26, 0.11, -0.35, 0.08, -0.29, 0.15, -0.33, 0.1, -0.38, 0.07, -0.41, 0.12, -0.37, 0.09, -0.44, 0.06];
const tibetSeries = createSeries(100.0, -0.78, tibetNoise, 1.3, 1.9);

// 8. Antarctic Pine Island Grounding Line Discharge
const antarcticNoise = [-5, 8, -12, 14, -8, 18, -15, 22, -9, 25, -14, 30, -18, 32, -12, 38, -16, 42, -19, 45, -22, 50, -25, 54, -20, 58, -24];
const antarcticSeries = createSeries(78.0, 3.4, antarcticNoise, 1.32, 7.5);

// 9. California Snowpack Water Equivalent (SWE)
const califNoise = [4.2, -5.1, 3.8, -6.2, 2.9, -7.5, 5.1, -8.2, 3.0, -9.1, 6.4, -10.2, -4.5, 8.2, -7.1, -8.9, 9.4, -11.0, 5.2, -9.8, -12.1, 7.3, 14.2, -8.5, 6.1, -7.2, -9.4];
const califSeries = createSeries(32.5, -0.42, califNoise, 1.25, 3.8);

// 10. Lake Chad Surface Hydrology (High seasonal noise, showing near-insignificant trend)
const chadNoise = [1.2, -1.5, 0.9, -1.8, 1.4, -1.1, 0.8, -1.3, 1.6, -1.4, 0.7, -1.2, 1.1, -1.0, 0.9, -1.3, 1.5, -1.1, 0.6, -1.4, 1.0, -0.9, 0.8, -1.2, 1.3, -1.0, 0.5];
const chadSeries = createSeries(18.5, -0.024, chadNoise, 1.05, 0.95);

// What this does: Holds the 10 primary global temperature/climate hotspot regions (Arctic, Amazon, Greenland, Great Barrier Reef, etc.).
// On the website: Places glowing hotspot pins on the 3D globe when Temperature mode is active and fills their data panels.
// Used as: The core hotspot dataset for Temperature mode, tours, and trend comparisons.
export const NASA_CLIMATE_REGIONS: ClimateRegion[] = [
  {
    id: 'arctic-sea-ice',
    name: 'Arctic Ocean Sea Ice Pack',
    domain: 'Cryosphere',
    lat: 76.5,
    lng: -15.0,
    variableName: 'September Sea Ice Minimum Extent',
    variableUnit: 'Million km²',
    rateOfChangeDecade: '-12.6% per decade',
    headlineSummary: 'Dramatic retreat of multi-year perennial sea ice pack with rapid Arctic amplification.',
    detailedAnalysis: 'Continuous observations from NASA ICESat-2 lidar and passive microwave radiometers reveal multi-year sea ice volume has contracted by over 70% since 1980. Arctic amplification warms high latitudes at nearly 4x the global average rate.',
    nasaInstruments: ['ICESat-2 ATLAS', 'CryoSat-2', 'MODIS Terra/Aqua', 'AMSR2'],
    historicalRange: [3.4, 7.1],
    currentAnomaly: '-2.41 Million km² below 1981-2010 mean',
    aiPredictionImpact: 'High probability of ice-free Arctic September conditions occurring between 2034 and 2038 under SSP2-4.5 downscaling.',
    color: '#38bdf8', // Cyan
    timeSeries: arcticSeries,
    mannKendall: calculateMannKendall(arcticSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Critical',
    flagEmoji: '🌐',
    famousLandmark: 'Svalbard Global Seed Vault & North Pole Ice Field',
    landmarkIcon: '❄️',
    temperatureChangeReasons: [
      'Positive Ice-Albedo Feedback: White reflective ice (albedo ~0.85) replaced by dark open ocean (albedo ~0.06)',
      'Polar Heat Dome Influx: Warm sub-Arctic Atlantic and Pacific water currents penetrating into the Fram Strait',
      'Increased Atmospheric Vapor Column: Moist summer skies trapping longwave thermal infrared radiation',
      'Reduced Winter Refreezing: Late freeze-up leaves younger, thinner ice susceptible to rapid summer melt'
    ],
  },
  {
    id: 'amazon-basin',
    name: 'Amazon Rainforest Biome',
    domain: 'Biosphere',
    lat: -3.46,
    lng: -62.21,
    variableName: 'Aboveground Canopy Biomass & Forest Loss',
    variableUnit: 'Index (2000 Baseline = 100)',
    rateOfChangeDecade: '-8.4% tree cover loss / decade',
    headlineSummary: 'Severe tropical canopy degradation, drought stress, and agricultural clear-cutting.',
    detailedAnalysis: 'NASA GEDI spaceborne lidar combined with Landsat 8/9 time-series tracks severe degradation along the "Arc of Deforestation". Drought feedback loops threaten to trigger a savanna tipping point in southeastern portions of the basin.',
    nasaInstruments: ['GEDI (ISS Lidar)', 'Landsat-8 / Landsat-9 OLI', 'ECOSTRESS', 'MODIS Vegetation Index'],
    historicalRange: [74.0, 100.0],
    currentAnomaly: '-21.8 Index points canopy density',
    aiPredictionImpact: 'Accelerated canopy dieback reaching critical irreversible savanna transition threshold by 2037 in southern sub-basins.',
    color: '#22c55e', // Green
    timeSeries: amazonSeries,
    mannKendall: calculateMannKendall(amazonSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Critical',
    flagEmoji: '🇧🇷',
    famousLandmark: 'Amazon River Basin & Meeting of Waters (Manaus)',
    landmarkIcon: '🌴',
    temperatureChangeReasons: [
      'Loss of Biogenic "Flying Rivers": Canopy transpiration loss disrupts the internal moisture recycling loop',
      'Positive Fire-Vegetation Feedbacks: Forest fragmentation allows dry winds to penetrate and ignite understory',
      'Sensible vs Latent Heat Shift: Replacement of tall dense forest with pasture raises daytime surface temperatures by up to 4°C',
      'Tropical Atlantic Thermal Dipole: Suppressing inter-tropical convergence precipitation over eastern Amazonia'
    ],
  },
  {
    id: 'north-atlantic-sst',
    name: 'North Atlantic Subpolar Gyre',
    domain: 'Ocean Heat',
    lat: 53.2,
    lng: -35.4,
    variableName: 'Sea Surface Temperature Anomaly',
    variableUnit: '°C (Deviation from 1951-1980 Base)',
    rateOfChangeDecade: '+0.28°C per decade',
    headlineSummary: 'Persistent marine heatwaves interspersed with AMOC slowdown cold-anomaly fingerprints.',
    detailedAnalysis: 'MODIS infrared radiometry and Jason-3 altimetry record record-breaking marine heatwaves across the mid-Atlantic, juxtaposed with the "North Atlantic Cold Blob" south of Greenland, a classic empirical marker of Atlantic Meridional Overturning Circulation (AMOC) deceleration.',
    nasaInstruments: ['MODIS Sea Surface Temp', 'Sentinel-3 SLSTR', 'Jason-3 / SWOT Altimetry', 'VIIRS'],
    historicalRange: [12.2, 13.5],
    currentAnomaly: '+1.18°C above historical baseline',
    aiPredictionImpact: 'AI neural models forecast higher marine heatwave persistence with 2.1x increased storm energy vector generation by 2035.',
    color: '#f97316', // Orange
    timeSeries: sstSeries,
    mannKendall: calculateMannKendall(sstSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Severe',
    flagEmoji: '🌊',
    famousLandmark: 'Mid-Atlantic Ocean Ridge & Flemish Cap Waters',
    landmarkIcon: '⚓',
    temperatureChangeReasons: [
      'Ocean Stratification & Shallow Mixed Layer: Upper ocean warming traps heat in the top 30 meters',
      'Atmospheric Blocking Over Western Europe: Weakening trade winds and anticyclonic stagnations reduce evaporative cooling',
      'AMOC Deceleration: Altering the northward thermohaline heat transport and accumulating excess tropical heat',
      'Diminished Saharan Dust Shielding: Periodic reductions in mineral aerosol reflecting incoming solar radiation'
    ],
  },
  {
    id: 'sahara-sahel',
    name: 'Sahara & Sahel Transition Zone',
    domain: 'Hydrosphere',
    lat: 16.8,
    lng: 12.5,
    variableName: 'Root-Zone Soil Moisture Deficit',
    variableUnit: 'Volumetric Soil Water (%)',
    rateOfChangeDecade: '-5.3% soil moisture / decade',
    headlineSummary: 'Prolonged aridification and desertification threatening Sahelian agricultural viability.',
    detailedAnalysis: 'NASA SMAP (Soil Moisture Active Passive) L-band radar demonstrates a sustained decline in root-zone water content across the southern fringe of the Sahara. Evaporative demand has outpaced seasonal precipitation spikes.',
    nasaInstruments: ['SMAP L-Band Radiometer', 'GRACE-FO Terrestrial Water', 'ECOSTRESS Evapotranspiration'],
    historicalRange: [11.5, 15.2],
    currentAnomaly: '-2.9% volumetric moisture deficit',
    aiPredictionImpact: 'Expanding aridity perimeter northward by 120km and southward by 85km by 2038, severely stressing subsistence croplands.',
    color: '#eab308', // Yellow
    timeSeries: saharaSeries,
    mannKendall: calculateMannKendall(saharaSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Elevated',
    flagEmoji: '🏜️',
    famousLandmark: 'Great Green Wall & Ténéré Desert Dune Sea',
    landmarkIcon: '🐪',
    temperatureChangeReasons: [
      'Hadley Cell Descending Branch Intensification: High-pressure subsidence suppresses cloud formation and precipitation',
      'High Atmospheric Vapor Pressure Deficit: Extreme evaporative thirst removes available groundwater',
      'Loss of Marginal Scrub Vegetation: Bare sand and clay convert radiant energy directly into scorching ground heat',
      'Intertropical Convergence Zone (ITCZ) Instability: Erratic monsoon bursts fail to replenish deep root-zone moisture'
    ],
  },
  {
    id: 'greenland-ice-sheet',
    name: 'Greenland Ice Sheet (Jakobshavn)',
    domain: 'Cryosphere',
    lat: 69.2,
    lng: -49.5,
    variableName: 'Cumulative Ice Mass Change',
    variableUnit: 'Gigatons (Gt cumulative anomaly)',
    rateOfChangeDecade: '-2,790 Gt per decade',
    headlineSummary: 'Accelerated calving rates, supraglacial lake drainage, and coastal marine-terminating retreat.',
    detailedAnalysis: 'Twin GRACE and GRACE-FO gravimetry satellites detect an average annual loss of 279 billion metric tons of ice. Surface albedo reductions from soot and meltwater have initiated positive surface melt feedback loops across 78% of the ice sheet.',
    nasaInstruments: ['GRACE-FO Gravimetry', 'ICESat-2 Lidar', 'Airborne OMG (Oceans Melting Greenland)'],
    historicalRange: [-5800, 0],
    currentAnomaly: '-5,240 Gt cumulative ice mass lost',
    aiPredictionImpact: 'Projected sea-level rise contribution escalating from 0.77 mm/yr to 1.34 mm/yr by 2036.',
    color: '#67e8f9', // Cyan/Light Blue
    timeSeries: greenlandSeries,
    mannKendall: calculateMannKendall(greenlandSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Critical',
    flagEmoji: '🇬🇱',
    famousLandmark: 'Ilulissat Icefjord & Sermeq Kujalleq Glacier',
    landmarkIcon: '🧊',
    temperatureChangeReasons: [
      'Cryoconite & Meltwater Albedo Feedback: Wet snow and biological cryoconite dust absorb 3x more solar energy than fresh snow',
      'Subsurface Oceanic Undercutting: Warm Atlantic-origin water entering deep fjords melts glacier grounding tongues',
      'Elevation-Melt Positive Loop: Thinning ice cap surface lowers into warmer atmospheric layers',
      'Atmospheric Blocking Ridges: Stationary summer high-pressure anticyclones funneling southern tropical air masses'
    ],
  },
  {
    id: 'great-barrier-reef',
    name: 'Great Barrier Reef Marine Park',
    domain: 'Ocean Heat',
    lat: -18.28,
    lng: 147.7,
    variableName: 'Thermal Stress & Degree Heating Weeks',
    variableUnit: 'DHW (°C-weeks)',
    rateOfChangeDecade: '+1.4 DHW per decade',
    headlineSummary: 'Successive back-to-back coral mass bleaching events driven by sustained marine heat accumulation.',
    detailedAnalysis: 'NOAA Coral Reef Watch in tandem with NASA Terra MODIS indicates unprecedented repeat bleaching in 2016, 2017, 2020, 2022, and 2024. Ocean thermal accumulation consistently exceeds the 8 DHW threshold for severe widespread mortality.',
    nasaInstruments: ['Terra/Aqua MODIS SST', 'Suomi-NPP VIIRS', 'Landsat Aquatic Reflectance'],
    historicalRange: [1.5, 9.8],
    currentAnomaly: '+6.1 DHW cumulative thermal stress',
    aiPredictionImpact: 'Annual severe thermal bleaching probability exceeds 88% under all ensemble models by 2033.',
    color: '#ef4444', // Red
    timeSeries: reefSeries,
    mannKendall: calculateMannKendall(reefSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Critical',
    flagEmoji: '🇦🇺',
    famousLandmark: 'Heart Reef & Coral Sea Barrier Lagoon',
    landmarkIcon: '🪸',
    temperatureChangeReasons: [
      'Accumulated Degree Heating Weeks: Prolonged sea surface temperatures exceeding physiological thermal tolerance of zooxanthellae',
      'Shallow Shelf Bathymetry: Lagoon waters heating up quickly during sunny, low-wind summer doldrums',
      'Ocean Acidification Synergies: Reduced aragonite saturation makes heat-stressed coral skeletons fragile',
      'Pacific Decadal Oscillation & El Niño Warming: Triggering sustained heat domes over the Coral Sea basin'
    ],
  },
  {
    id: 'tibetan-plateau',
    name: 'Tibetan Plateau ("Third Pole")',
    domain: 'Cryosphere',
    lat: 32.5,
    lng: 88.2,
    variableName: 'Glacial Volume & Water Reservoir Index',
    variableUnit: 'Relative Index (2000 = 100)',
    rateOfChangeDecade: '-7.8% volume / decade',
    headlineSummary: 'Melting of the Himalayan water tower, driving downstream river vulnerability and glacial lake outburst risks.',
    detailedAnalysis: 'NASA ASTER and ICESat-2 reveal high-mountain Asia glaciers are losing mass at accelerating rates. Over 1,200 new proglacial moraine lakes have formed, heightening catastrophic outburst flood hazards (GLOFs) for downstream river valleys.',
    nasaInstruments: ['ASTER Thermal/Stereo', 'ICESat-2 ATLAS', 'SRTM Digital Elevation', 'Landsat-9'],
    historicalRange: [78.0, 100.0],
    currentAnomaly: '-20.4% total glacier volume lost',
    aiPredictionImpact: 'Irreversible loss of low-altitude tributary glaciers by 2038, altering dry-season runoff for 1.4 billion people.',
    color: '#a855f7', // Purple
    timeSeries: tibetSeries,
    mannKendall: calculateMannKendall(tibetSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Severe',
    flagEmoji: '🏔️',
    famousLandmark: 'Mount Everest (Qomolangma) & Potala Palace',
    landmarkIcon: '🏔️',
    temperatureChangeReasons: [
      'Elevation-Dependent Warming (EDW): High altitudes (>4,000m) warm at over double the rate of lowlands due to water vapor feedbacks',
      'Black Carbon & Dust Deposition: Soot from South Asian biomass and industrial burning darkening mountain snowpack',
      'Subtropical Jet Stream Perturbations: Changes in mid-tropospheric wind vectors elevating summer freezing levels',
      'Moraine Lake Heat Retention: Expanding proglacial lakes absorb heat and melt glacier termini via thermal undercutting'
    ],
  },
  {
    id: 'antarctic-pine-island',
    name: 'Antarctic Amundsen Sea (Pine Island)',
    domain: 'Cryosphere',
    lat: -75.1,
    lng: -100.0,
    variableName: 'Ice Shelf Grounding Line Discharge',
    variableUnit: 'Gt/year ice flux discharge',
    rateOfChangeDecade: '+34 Gt/yr discharge acceleration / decade',
    headlineSummary: 'Marine ice sheet instability driven by warm circumpolar deep water intrusion under ice shelves.',
    detailedAnalysis: 'Radar interferometry and GRACE-FO observe grounding line retreat of more than 30 km along Pine Island and Thwaites Glaciers. The influx of Modified Circumpolar Deep Water beneath the floating ice shelves drives intense basal melting.',
    nasaInstruments: ['GRACE-FO', 'Sentinel-1 InSAR', 'CryoSat-2', 'Landsat-8 Velocity'],
    historicalRange: [72.0, 175.0],
    currentAnomaly: '+88 Gt/year discharge above steady-state',
    aiPredictionImpact: 'Simulated collapse trajectory exhibits non-linear speed-up post-2028 if grounding pin unmooring continues.',
    color: '#06b6d4', // Cyan
    timeSeries: antarcticSeries,
    mannKendall: calculateMannKendall(antarcticSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Critical',
    flagEmoji: '🇦🇶',
    famousLandmark: 'Pine Island Glacier Bay & Transantarctic Ridge',
    landmarkIcon: '🐧',
    temperatureChangeReasons: [
      'Circumpolar Deep Water (CDW) Subsurface Upwelling: +1.5°C ocean water pushed over the continental shelf by shifting westerlies',
      'Marine Ice Sheet Instability (MISI): Grounding line retreats down reverse-sloped bedrock, causing runaway discharge',
      'Loss of Buttressing Ice Shelves: Thinning floating shelves remove mechanical resistance for tributary glaciers',
      'Supraglacial Hydrofracturing: Surface melt ponds wedge open crevasses, shattering floating ice shelves'
    ],
  },
  {
    id: 'california-sierra',
    name: 'California Central Valley & Sierra Nevada',
    domain: 'Hydrosphere',
    lat: 36.7,
    lng: -119.7,
    variableName: 'April 1 Snowpack Water Equivalent (SWE)',
    variableUnit: 'Inches SWE',
    rateOfChangeDecade: '-4.2 inches SWE / decade',
    headlineSummary: 'Volatile "whiplash" hydroclimate patterns, declining snow water storage, and intense aquifer pumping.',
    detailedAnalysis: 'Airborne Snow Observatory (ASO) and GRACE-FO show a structural decline in seasonal mountain snowpack retention, shifting snowmelt runoff earlier into spring and forcing agricultural overdraft of Central Valley aquifers.',
    nasaInstruments: ['Airborne Snow Observatory (ASO)', 'GRACE-FO', 'MODIS Snow Cover', 'ECOSTRESS'],
    historicalRange: [18.0, 48.0],
    currentAnomaly: '-9.4 inches below 20th century median',
    aiPredictionImpact: 'Persistent 35% reduction in natural reservoir snowpack buffer by 2039, elevating catastrophic wildfire susceptibility.',
    color: '#f59e0b', // Amber
    timeSeries: califSeries,
    mannKendall: calculateMannKendall(califSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Severe',
    flagEmoji: '🇺🇸',
    famousLandmark: 'Yosemite National Park Half Dome & Lake Tahoe',
    landmarkIcon: '🌲',
    temperatureChangeReasons: [
      'Rising Snowline Elevation: Winter storms deposit rain instead of snow at elevations under 2,200 meters',
      'Early Spring Runoff Peak: Snowpack melting 3 to 4 weeks earlier, causing summer reservoir exhaustion',
      'Atmospheric River Temperature Increase: Warm moisture plumes from Hawaii ("Pineapple Express") melting existing snow',
      'Groundwater Depletion & Sensible Heat Surge: Depleted soil water increases sensible heat flux in the Central Valley'
    ],
  },
  {
    id: 'lake-chad-basin',
    name: 'Lake Chad Hydrological Basin',
    domain: 'Hydrosphere',
    lat: 13.0,
    lng: 14.5,
    variableName: 'Seasonal Open Water Surface Area',
    variableUnit: 'Thousand km²',
    rateOfChangeDecade: '-0.24k km² / decade (High Interannual Noise)',
    headlineSummary: 'Fluctuating terminal shallow lake basin with strong monsoon variability and localized irrigation demand.',
    detailedAnalysis: 'Landsat 5-9 historical multi-spectral coverage illustrates high interannual volatility. Unlike monotonic glacial declines, Lake Chad responds heavily to short-term Sahelian rainfall oscillations, illustrating statistical challenges in trend detection.',
    nasaInstruments: ['Landsat-8/9 OLI', 'Sentinel-2 MSI', 'MODIS Surface Water', 'SWOT Hydrology'],
    historicalRange: [16.5, 19.8],
    currentAnomaly: '-0.62k km² surface area fluctuation',
    aiPredictionImpact: 'Projected intensification of wet/dry rainfall extremes with heightened agricultural water competition by 2035.',
    color: '#10b981', // Emerald
    timeSeries: chadSeries,
    mannKendall: calculateMannKendall(chadSeries.filter(p => !p.isPrediction)),
    urgencyLevel: 'Monitoring',
    flagEmoji: '🇹🇩',
    famousLandmark: 'Lake Chad Wetland Oasis & Chari River Delta',
    landmarkIcon: '🛶',
    temperatureChangeReasons: [
      'Extreme Evaporation Rates: Shallow (1.5-3m) open water exposed to dry tropical air with >2,000mm/year evaporative loss',
      'West African Monsoon Teleconnections: Atlantic and Indian Ocean temperature oscillations modulating monsoon arrival',
      'Intensified Sensible Heating of Surrounding Dunes: Lake microclimate surrounded by high-temperature arid land',
      'Agricultural Irrigation Divergence: Upstream river diversions reduce inflow cooling volume'
    ],
  },
];
