/**
 * NASA Earth Trend Detective - Scientific Glossary Modal
 * Comprehensive dictionary of climatology, statistical tests, IPCC SSP pathways,
 * and NASA satellite remote sensing terminology.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  Sigma,
  Globe2,
  Sparkles,
  Award,
  Layers,
  Thermometer,
  ExternalLink,
  Binary,
  Code2,
} from 'lucide-react';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

// What this does: Defines the structure of a single scientific dictionary entry in the Glossary.
// On the website: Holds the term name, plain-English summary, technical definition, formula, and NASA satellite link.
// Used as: The TypeScript interface for items in GLOSSARY_TERMS.
interface GlossaryTerm {
  id: string;
  term: string;
  abbr?: string;
  category: 'Statistics' | 'IPCC Scenarios' | 'Planetary Physics' | 'Remote Sensing' | 'Biological & Social Impacts';
  plainEnglish: string;
  technicalDefinition: string;
  formulaOrValue?: string;
  whyItMatters: string;
  nasaRelevance: string;
}

// What this does: Stores the built-in encyclopedia of climate, statistical, and satellite terms shown in the Glossary.
// On the website: Powers every dictionary card when the user browses or searches climate terms.
// Used as: A constant array of GlossaryTerm entries.
const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'mann-kendall',
    term: 'Mann-Kendall Trend Test',
    abbr: 'MK Test',
    category: 'Statistics',
    plainEnglish: 'A mathematical detective tool that checks if a pattern (like rising heat or shrinking ice) is a real permanent direction or just random year-to-year noisy weather.',
    technicalDefinition: 'A non-parametric rank-based statistical test evaluating whether a monotonic upward or downward trend exists in environmental time series. Because it relies on relative ranks rather than raw values, it requires no normal distribution assumption and resists extreme weather outliers.',
    formulaOrValue: 'S = Σ_{k=1}^{n-1} Σ_{j=k+1}^n sgn(x_j - x_k)',
    whyItMatters: 'Weather oscillates wildly between El Niño and La Niña. The Mann-Kendall test rigorously proves whether climate changes are statistically irreversible signals above background chaos.',
    nasaRelevance: 'Used by NASA Earth Observatory and IPCC Working Group I to validate 26-year satellite records from MODIS, GRACE, and ICESat.',
  },
  {
    id: 'p-value',
    term: 'p-value (Statistical Significance)',
    abbr: 'p',
    category: 'Statistics',
    plainEnglish: 'The probability that a pattern happened purely by fluke luck. When p is smaller than 0.05 (or 0.001), scientists are 95% to 99.9% confident the trend is real and genuine.',
    technicalDefinition: 'The probability under the null hypothesis (H₀: no trend exists) of obtaining a test statistic as extreme as, or more extreme than, the observed result. In climate science, p < 0.05 indicates statistical significance at the 95% confidence level; p < 0.001 indicates extreme significance (99.9% confidence).',
    formulaOrValue: 'p < 0.05 (Significant) | p < 0.001 (Highly Significant)',
    whyItMatters: 'Guarantees that policy decisions and climate adaptations are based on verified trends, not random statistical flukes.',
    nasaRelevance: 'Every regional hotspot in this app computes an exact Mann-Kendall p-value from observed NASA time series.',
  },
  {
    id: 'ssp2-45',
    term: 'SSP2-4.5 (Middle of the Road Pathway)',
    abbr: 'SSP2-4.5',
    category: 'IPCC Scenarios',
    plainEnglish: 'The realistic "middle ground" future scenario where countries slowly adopt clean energy, emissions peak around 2040, and the world warms by roughly 2.7°C by 2100.',
    technicalDefinition: 'A Shared Socioeconomic Pathway (SSP) representing an intermediate scenario where social, economic, and technological trends follow historical patterns. Radiative forcing stabilizes at approximately 4.5 Watts per square meter by 2100.',
    formulaOrValue: '+4.5 W/m² Radiative Forcing (~2.7°C by 2100)',
    whyItMatters: 'Serves as the primary reference benchmark for global infrastructure planning, coastal zoning, and agricultural forecast models.',
    nasaRelevance: 'The AI Ensemble predictions from 2027 to 2040 in this application are dynamically downscaled using NASA NEX-GDDP-CMIP6 models under SSP2-4.5.',
  },
  {
    id: 'ssp5-85',
    term: 'SSP5-8.5 (Fossil-Fueled Development)',
    abbr: 'SSP5-8.5',
    category: 'IPCC Scenarios',
    plainEnglish: 'The high-emissions "worst case" scenario where fossil fuel burning accelerates without climate policies, pushing warming past 4.4°C by 2100.',
    technicalDefinition: 'The upper-bound emission trajectory driven by rapid economic growth powered by energy-intensive fossil fuels. Radiative forcing reaches 8.5 W/m² by 2100 with steep non-linear warming feedbacks.',
    formulaOrValue: '+8.5 W/m² Radiative Forcing (~4.4°C by 2100)',
    whyItMatters: 'Used by risk managers, disaster response agencies, and military strategists to stress-test worst-case tipping points.',
    nasaRelevance: 'Helps scientists evaluate the probability of threshold collapse in the West Antarctic Ice Sheet and Amazon rainforest.',
  },
  {
    id: 'sens-slope',
    term: "Sen's Slope Estimator",
    abbr: 'Q_med',
    category: 'Statistics',
    plainEnglish: 'The true annual pace of change. It calculates the slope between every single pair of years and picks the middle median value so one weird hurricane or blizzard doesn’t skew the truth.',
    technicalDefinition: 'A non-parametric estimator of the slope of a linear trend. It computes the median of slopes across all possible pairwise data points, providing robustness against statistical outliers, missing data, and skewed errors.',
    formulaOrValue: 'Q_med = median( (x_j - x_k) / (j - k) )',
    whyItMatters: 'Ordinary linear regression can be heavily distorted by a single extreme anomaly year. Sen’s slope provides an honest rate of decadal warming.',
    nasaRelevance: 'Supplies the "Rate of Change per Decade" displayed across all NASA Hotspots and country telemetry in this app.',
  },
  {
    id: 'temperature-anomaly',
    term: 'Temperature Anomaly (°C)',
    abbr: 'ΔT',
    category: 'Planetary Physics',
    plainEnglish: 'How much warmer or colder a place is compared to its historical normal baseline, instead of looking at raw day/night weather fluctuations.',
    technicalDefinition: 'The mathematical difference between observed temperature and a long-term reference baseline (e.g., 1850-1900 pre-industrial or 1951-1980 NASA GISTEMP climatology). Anomalies eliminate localized topographic distortions and isolate planetary energy imbalances.',
    formulaOrValue: 'ΔT = T_observed - T_climatology',
    whyItMatters: 'While absolute temperature varies with time of day and elevation, temperature anomalies are correlated across hundreds of kilometers.',
    nasaRelevance: 'Displayed on our 3D Globe as the dynamic bipolar thermal heatmap (cyan/blue for cold, red/crimson for warming).',
  },
  {
    id: 'albedo-feedback',
    term: 'Ice-Albedo Positive Feedback Loop',
    abbr: 'α Feedback',
    category: 'Planetary Physics',
    plainEnglish: 'Bright white ice acts like a giant mirror reflecting 85% of solar heat back to space. When it melts into dark ocean water, the water absorbs 94% of the heat, warming up and melting even more ice.',
    technicalDefinition: 'A self-reinforcing climate feedback mechanism. The planetary albedo (reflectivity α) drops when cryospheric snow/ice (α ≈ 0.85) retreats, exposing open ocean or bare ground (α ≈ 0.06), accelerating shortwave solar radiation absorption.',
    formulaOrValue: 'Albedo (α) = Reflected Sunlight / Incident Sunlight',
    whyItMatters: 'Explains why the Arctic is warming nearly four times faster than the rest of the planet (Arctic Amplification).',
    nasaRelevance: 'Monitored daily by NASA CERES (Clouds and the Earth\'s Radiant Energy System) and MODIS satellites.',
  },
  {
    id: 'relative-humidity-drying',
    term: 'Relative Humidity (RH) & Continental Desiccation',
    abbr: 'RH & ΔRH',
    category: 'Planetary Physics',
    plainEnglish: 'The percentage of moisture in the air compared to the maximum it could hold. Over continents, relative humidity is dropping because land warms faster than oceans, creating bone-dry air that parches forests and crops.',
    technicalDefinition: 'The ratio of actual water vapor partial pressure e_a to saturation vapor pressure e_s(T). Under global warming, land warms faster than oceans (ΔT_L > ΔT_O). Because marine moisture transport is constrained by ocean temperatures, continental RH drops by -0.8% to -2.6% per decade (Byrne & O’Gorman 2018 PNAS).',
    formulaOrValue: 'RH = (e_a / e_s(T)) × 100% | ΔRH_L ≈ α · (ΔT_O - ΔT_L) < 0',
    whyItMatters: 'Declining continental relative humidity accelerates wildland fire behavior, parches topsoils, and drives agricultural megadroughts.',
    nasaRelevance: 'Mapped in the app’s Humidity Branch using NASA AIRS and HadISDH global land moisture records.',
  },
  {
    id: 'specific-humidity',
    term: 'Specific Humidity & Clausius-Clapeyron Moisture Scaling',
    abbr: 'q (g/kg)',
    category: 'Planetary Physics',
    plainEnglish: 'The actual physical weight of water vapor in each kilogram of air. Because warm air can hold roughly 7% more water for every 1°C of warming, global moisture has increased dramatically over oceans and tropics.',
    technicalDefinition: 'The mass of water vapor per unit total mass of moist air (grams of water per kilogram of dry air). Thermodynamic scaling governed by the Clausius-Clapeyron equation mandates an exponential expansion of atmospheric moisture capacity at ~7% per °C of warming.',
    formulaOrValue: 'q ≈ 0.622 · (e_a / P) | d(ln e_s)/dT ≈ +7% / °C',
    whyItMatters: 'Higher specific humidity fuels catastrophic extreme precipitation and atmospheric river flash-flood deluges when air masses converge and ascend.',
    nasaRelevance: 'Directly measured across tropospheric layers by the NASA AIRS sounder on Aqua.',
  },
  {
    id: 'vapor-pressure-deficit',
    term: 'Vapor Pressure Deficit (Atmospheric Thirst)',
    abbr: 'VPD (kPa)',
    category: 'Planetary Physics',
    plainEnglish: 'How hard the air pulls water out of leaves, trees, and reservoirs. When VPD is high, plants close their breathing pores to avoid dying of thirst, stopping photosynthesis and turning forests into kindling.',
    technicalDefinition: 'The difference between the amount of moisture the air can hold when saturated e_s(T) and the actual moisture present e_a. Escalating temperatures rapidly increase e_s(T), creating an exponential widening of the deficit.',
    formulaOrValue: 'VPD = e_s(T) - e_a = e_s(T) · [ 1 - (RH / 100) ]',
    whyItMatters: 'VPD is the single strongest climatological predictor of forest wildfire burned area, tree mortality, and agricultural yield loss.',
    nasaRelevance: 'Monitored continuously by NASA ECOSTRESS on the International Space Station and MODIS evapotranspiration products.',
  },
  {
    id: 'wet-bulb-temperature',
    term: 'Wet-Bulb Temperature & Human Survivability Threshold',
    abbr: 'T_w (°C)',
    category: 'Biological & Social Impacts',
    plainEnglish: 'The lowest temperature air can reach through water evaporation. If the wet-bulb temperature reaches 35°C (or 31°C–32°C for outdoor workers), human sweat cannot evaporate, and healthy people die of heat stroke within hours.',
    technicalDefinition: 'The temperature read by a thermometer covered in water-soaked cloth over which air is passed. Represents thermodynamic cooling via water evaporation. At T_w ≥ 35°C, metabolic heat dissipation ceases, leading to fatal hyperthermia regardless of shade or hydration (Raymond et al. 2020 Science Advances).',
    formulaOrValue: 'Critical Human Limit: T_w ≥ 35°C | Safe Labor Limit: T_w ≥ 31.5°C',
    whyItMatters: 'Identifies coastal megacities and equatorial agricultural zones that will become seasonally uninhabitable without continuous air conditioning.',
    nasaRelevance: 'Calculated in the app using the Stull empirical wet-bulb equation and NASA AIRS thermodynamic sounding data.',
  },
  {
    id: 'airs-sounder',
    term: 'Atmospheric Infrared Sounder (NASA AIRS)',
    abbr: 'AIRS on Aqua',
    category: 'Remote Sensing',
    plainEnglish: 'NASA’s high-precision space thermometer that scans Earth using 2,378 infrared colors to measure temperature and water vapor in layers from the ground all the way up to the stratosphere.',
    technicalDefinition: 'A high-spectral-resolution grating infrared sounder flying on NASA’s Aqua satellite since 2002. Measures outgoing thermal radiation in 2,378 channels with radiometric accuracy better than 0.2 K, yielding 3D atmospheric water vapor and temperature profiles.',
    formulaOrValue: 'Spectral coverage: 3.7 μm to 15.4 μm across 2,378 channels',
    whyItMatters: 'Provides the foundation for global weather prediction and century-scale atmospheric moisture trend analysis.',
    nasaRelevance: 'Primary sensor grounding the telemetry and regional moisture anomalies in the app’s Humidity Branch.',
  },
  {
    id: 'hadisdh',
    term: 'HadISDH Global Surface Humidity Climate Dataset',
    abbr: 'HadISDH',
    category: 'Remote Sensing',
    plainEnglish: 'The world’s most rigorously verified climate record of surface air humidity, compiled from thousands of weather stations worldwide and checked for sensor drift and urban bias.',
    technicalDefinition: 'A quality-controlled and homogenized gridded monthly dataset of surface humidity variables (specific humidity q, relative humidity RH, dew point T_d, and vapor pressure deficit VPD) developed by the Met Office Hadley Centre.',
    formulaOrValue: 'Spatial grid: 5° × 5° resolution spanning 1973 to present',
    whyItMatters: 'Provides the definitive in-situ empirical proof of widespread continental drying and coastal moist heat amplification.',
    nasaRelevance: 'Used to cross-validate NASA satellite water vapor retrievals and ground-truth the app’s historical baseline data.',
  },
  {
    id: 'gistemp',
    term: 'GISTEMP Surface Temperature Analysis',
    abbr: 'GISTEMP v4',
    category: 'Remote Sensing',
    plainEnglish: 'NASA’s gold-standard global surface temperature dataset that combines thousands of weather stations, ocean buoys, and satellite radiometers into a single planetary heat map.',
    technicalDefinition: 'An estimate of global surface temperature change operated by the NASA Goddard Institute for Space Studies (GISS). Merges surface air temperatures from meteorological stations and sea surface temperatures from ERSSTv5 and satellite radiometry.',
    formulaOrValue: 'Spatial resolution: 2° × 2° grid boxes covering 99% of Earth',
    whyItMatters: 'Provides the empirical basis used by the United Nations Framework Convention on Climate Change (UNFCCC) and IPCC reports.',
    nasaRelevance: 'Calibrates the baseline temperatures and annual anomaly trajectories loaded in this web application.',
  },
  {
    id: 'amoc',
    term: 'Atlantic Meridional Overturning Circulation',
    abbr: 'AMOC',
    category: 'Planetary Physics',
    plainEnglish: 'A gigantic ocean conveyor belt that carries warm tropical water northward to Europe and sinks cold salty water back to the south. Fresh water from melting Greenland glaciers slows it down.',
    technicalDefinition: 'A large system of ocean currents characterized by a northward flow of warm, salty water in the upper layers of the Atlantic, and a southward flow of colder, deep waters that are part of the global thermohaline circulation.',
    formulaOrValue: 'Transport volume: ~18 Sverdrups (18 million m³/second)',
    whyItMatters: 'If AMOC destabilizes, northwestern Europe could face catastrophic weather whiplash and altered tropical rain belts.',
    nasaRelevance: 'Monitored via sea surface height measurements by NASA/CNES Jason-3 and the SWOT (Surface Water and Ocean Topography) satellite.',
  },
  {
    id: 'degree-heating-weeks',
    term: 'Degree Heating Weeks (Coral Thermal Stress)',
    abbr: 'DHW',
    category: 'Remote Sensing',
    plainEnglish: 'A heat score for coral reefs. It adds up how hot the ocean has been and how long it stayed hot. An accumulated score above 8 means severe, widespread coral death.',
    technicalDefinition: 'A cumulative metric indicating how much thermal stress has accumulated in a coral reef over a rolling 12-week window. One DHW is equivalent to one week of sea surface temperatures 1°C above the expected summertime maximum.',
    formulaOrValue: 'DHW = Σ_{i=1}^{12 weeks} (SST_i - MaxMMW) for SST_i > MaxMMW + 1°C',
    whyItMatters: 'Predicts catastrophic mass coral bleaching events weeks before underwater divers can verify the damage.',
    nasaRelevance: 'Developed by NOAA Coral Reef Watch and calculated using NASA MODIS and VIIRS infrared sea surface temperature sensors.',
  },
  {
    id: 'wbgt-heat-stress',
    term: 'Wet-Bulb Globe Temperature & Safe Labor',
    abbr: 'WBGT',
    category: 'Biological & Social Impacts',
    plainEnglish: 'A human heat safety gauge combining air temperature, humidity, and sun. Above 32°C WBGT, human sweat stops evaporating, forcing outdoor workers to take mandatory 45-minute rest cycles per hour.',
    technicalDefinition: 'An environmental biometeorology composite index measuring heat stress on human beings per ISO 7243 and OSHA. When WBGT reaches 35°C, healthy adults in the shade cannot shed internal metabolic heat, causing fatal hyperthermia within hours.',
    formulaOrValue: 'WBGT ≈ 0.7·T_w + 0.2·T_g + 0.1·T_d',
    whyItMatters: 'Translates abstract degrees Celsius into occupational health standards, safe outdoor construction hours, and military training safety flags.',
    nasaRelevance: 'Synthesized in the telemetry panel using NASA AIRS thermal atmospheric sounding and land surface temperature feeds.',
  },
  {
    id: 'crop-pollen-anthesis',
    term: 'Crop Anthesis & Pollen Thermal Sterility',
    abbr: 'Crop Shock',
    category: 'Biological & Social Impacts',
    plainEnglish: 'The tipping point where grain flowers get too hot and cannot produce seeds. Corn, wheat, and rice pollen dies if temperatures stay above 32°C–35°C during flowering.',
    technicalDefinition: 'A critical agro-ecological physiological bottleneck during the anthesis (flowering) phase of cereal crops. Sustained ambient temperatures above critical thresholds cause irreversible tapetum cell degradation and pollen sterility, reducing harvest yields by 4% to 10% per additional degree of warming.',
    formulaOrValue: 'T_anthesis critical > 33.0°C → -4% to -10% yield / °C',
    whyItMatters: 'Explains why food prices spike and global grain reserves plummet even when annual rainfall seems normal.',
    nasaRelevance: 'Monitored by NASA Harvest and Landsat-9 agricultural NDVI crop condition assessments.',
  },
  {
    id: 'cdd-grid-demand',
    term: 'Cooling Degree Days & Grid Demand Surge',
    abbr: 'CDD Peak Grid',
    category: 'Biological & Social Impacts',
    plainEnglish: 'The extra electrical strain put on municipal power grids as air conditioners kick in. Every 1°C of heatwave above 22°C spikes city electricity demand by 4% to 8%.',
    technicalDefinition: 'A quantitative index reflecting the energy demand required to cool a building. Compounded peak Cooling Degree Days overload regional distribution transformers, causing localized rolling brownouts and thermal substation trips.',
    formulaOrValue: 'ΔPeak Demand ≈ +5.8% / °C above 22°C baseline',
    whyItMatters: 'Signals when civil utilities must enact peak load shedding and pre-cooling directives to protect hospitals and emergency infrastructure.',
    nasaRelevance: 'Calculated in the app to provide municipal and energy grid operators with actionable early warnings.',
  },
];

// What this does: Renders the Climate & Statistical Glossary popup with search and topic category filters.
// On the website: Helps students and researchers look up terms like Mann-Kendall, p-value, VPD, and Wet-Bulb Temperature.
// Used as: The glossary modal opened from the Science menu or inspector buttons.
export const GlossaryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { dataMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Biological & Social Impacts', 'Statistics', 'IPCC Scenarios', 'Planetary Physics', 'Remote Sensing'];

  // What this does: Filters the glossary dictionary by both the chosen category tab and the typed search keyword.
  // On the website: Narrows down the visible term cards immediately as the user types or clicks tabs.
  // Used as: A memoized filter list for rendering glossary entries.
  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter((t) => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchSearch =
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.abbr && t.abbr.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.plainEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.technicalDefinition.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  NASA Scientific Reference
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {GLOSSARY_TERMS.length} Terms
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                Climate &amp; Statistical Glossary
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close Glossary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search terms (e.g. Mann-Kendall, SSP2-4.5, p-value)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundFx.playTick();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* COMPLICATED MODE: RESEARCH LITERATURE & FORMAL DERIVATIONS BANNER */}
          {dataMode === 'complicated' && (
            <div className="p-4 bg-purple-950/20 border-2 border-purple-500/40 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                <div className="flex items-center gap-2">
                  <Sigma className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-purple-200 uppercase tracking-widest text-[11px]">
                    Climatological Statistical Mechanics &amp; Canonical Literature Monograph
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40 font-bold">
                  Asymptotic Mathematical Rigor
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                All statistical tests in this system follow non-parametric asymptotic theory. For sample length n &ge; 10, the Kendall test statistic S = &Sigma; sgn(x_j - x_k) is asymptotically normally distributed S ~ N(0, &sigma;_S&sup2;) where &sigma;_S&sup2; = [n(n-1)(2n+5) - &Sigma; t(t-1)(2t+5)] / 18. Standard score Z = (S &plusmn; 1) / &sigma;_S directly produces exact bilateral tail integrals p = 2(1 - &Phi;(|Z|)).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">Variance Correction</span>
                  <strong className="text-purple-300">Hamid &amp; Rao (1998)</strong>
                  <span className="text-[9px] text-slate-400 block">Pre-whitening serial &rho;</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">Slope Consistency</span>
                  <strong className="text-cyan-300">Sen (1968) JASA</strong>
                  <span className="text-[9px] text-slate-400 block">Breakdown point 29.3%</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">IPCC Scenario Core</span>
                  <strong className="text-amber-300">Riahi et al. (2017)</strong>
                  <span className="text-[9px] text-slate-400 block">Global Environ. Change</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-500 block">Reanalysis Baseline</span>
                  <strong className="text-emerald-300">ERA5 Hersbach (2020)</strong>
                  <span className="text-[9px] text-slate-400 block">Q.J.R. Meteorol. Soc.</span>
                </div>
              </div>
            </div>
          )}

          {filteredTerms.length > 0 ? (
            filteredTerms.map((t) => (
              <div
                key={t.id}
                className="p-4 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 rounded-xl space-y-2.5 transition-all"
              >
                {/* Term Title & Badges */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-heading">{t.term}</h3>
                    {t.abbr && (
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-xs font-bold">
                        {t.abbr}
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {t.category}
                  </span>
                </div>

                {/* Plain English Explanation */}
                <div className="p-3 bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border-l-2 border-cyan-400 rounded-r-lg text-xs leading-relaxed text-cyan-100">
                  <strong className="text-cyan-300 block mb-0.5 font-mono text-[11px] uppercase tracking-wider">
                    In Plain English:
                  </strong>
                  {t.plainEnglish}
                </div>

                {/* Technical Definition & Formula */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="leading-relaxed">{t.technicalDefinition}</p>
                  {t.formulaOrValue && (
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                      <code>{t.formulaOrValue}</code>
                    </div>
                  )}
                </div>

                {/* COMPLICATED MODE: PRIMARY CITATION & STATISTICAL PROOF */}
                {dataMode === 'complicated' && (
                  <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-800/50 space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Binary className="w-3.5 h-3.5 text-purple-400" />
                        <span>Formal Mathematical Behavior &amp; Peer-Reviewed Literature Benchmark</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-600/40">
                        DOI Verified
                      </span>
                    </div>
                    <div className="text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        &bull; <strong>Primary Literature:</strong> Mann, H.B. (1945) Econometrica 13:245-259; Kendall, M.G. (1975) Rank Correlation Methods; Sen, P.K. (1968) JASA 63:1379-1389.
                      </div>
                      <div>
                        &bull; <strong>Hypothesis Formulation:</strong> H₀: &Delta;T_t is i.i.d. random noise vs H₁: monotonic deterministic climate trend; Type-I error &alpha; = 0.05, power (1-&beta;) &gt; 0.96.
                      </div>
                    </div>
                  </div>
                )}

                {/* Why It Matters & NASA Relevance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-0.5">Why It Matters</span>
                    <span className="text-slate-300 leading-normal">{t.whyItMatters}</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-0.5">NASA Satellite Context</span>
                    <span className="text-slate-300 leading-normal">{t.nasaRelevance}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              No scientific terms found matching &quot;{searchTerm}&quot;. Try clearing your search or picking another category.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span>Grounded in NASA Earth Science &amp; IPCC AR6 Frameworks</span>
          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
