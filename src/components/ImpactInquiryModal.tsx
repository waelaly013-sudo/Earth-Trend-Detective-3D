/**
 * NASA Earth Trend Detective - What Would Happen Impact Modal
 * Allows users to search and discover scientifically grounded consequences
 * of planetary warming and trigger simulations on the 3D globe.
 */

import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  X,
  Search,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Globe2,
  Sliders,
  BookOpen,
  Sigma,
  Scale,
  Binary,
} from 'lucide-react';
import { IMPACT_SCENARIOS, ImpactScenario } from '../data/impactScenarios';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

// What this does: Lists the props needed by the "What Would Happen?" climate impact inquiry popup.
// On the website: Lets the popup know whether it is open, the current year, and how to trigger a 3D Earth simulation.
// Used as: The TypeScript props contract for ImpactInquiryModal.
interface ImpactInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateScenario: (scenario: ImpactScenario) => void;
  currentYear: number;
}

// What this does: Displays a searchable explorer of future climate "what if" scenarios and lets users simulate them on the 3D globe.
// On the website: Shows categories, impact numbers, cascading consequences, and a "Simulate on 3D Earth" button.
// Used as: The scenario impact explorer modal opened from the Science/Reports menu.
export const ImpactInquiryModal: React.FC<ImpactInquiryModalProps> = ({
  isOpen,
  onClose,
  onSimulateScenario,
  currentYear,
}) => {
  const { dataMode, dataBranch } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // What this does: Picks the right category filter buttons depending on whether the user is viewing Temperature, Humidity, or Wind.
  // On the website: Updates the category pills below the search bar so they match the active climate branch.
  // Used as: A memoized category tab list.
  const categories = useMemo(() => {
    if (dataBranch === 'humidity') {
      return [
        'All',
        'Humidity & Wet-Bulb Limits',
        'Continental Desiccation',
        'Extreme Weather',
        'Biosphere & Forests',
      ];
    }
    if (dataBranch === 'wind') {
      return [
        'All',
        'Wind & Jet Stream Stalls',
        'Wind Energy Stilling',
        'Cyclonic Gale Surges',
        'Oceanic Wind Acceleration',
      ];
    }
    return [
      'All',
      'Temperature Thresholds',
      'Sea Level & Coasts',
      'Biosphere & Forests',
      'Food & Agriculture',
      'Water & Glaciers',
      'Extreme Weather',
    ];
  }, [dataBranch]);

  // What this does: Filters the master list of scenarios to only the ones belonging to the active climate branch.
  // On the website: Shows humidity scenarios in Humidity mode, wind scenarios in Wind mode, and warming scenarios in Temp mode.
  // Used as: The base scenario pool before search and category filtering.
  const branchScenarios = useMemo(() => {
    if (dataBranch === 'humidity') {
      const humOnly = IMPACT_SCENARIOS.filter((s) => s.branch === 'humidity');
      return humOnly.length > 0 ? humOnly : IMPACT_SCENARIOS;
    }
    if (dataBranch === 'wind') {
      const windOnly = IMPACT_SCENARIOS.filter((s) => s.branch === 'wind');
      return windOnly.length > 0 ? windOnly : IMPACT_SCENARIOS;
    }
    return IMPACT_SCENARIOS.filter((s) => s.branch === 'temperature' || !s.branch);
  }, [dataBranch]);

  const [activeScenario, setActiveScenario] = useState<ImpactScenario>(() => branchScenarios[0] || IMPACT_SCENARIOS[0]);

  // What this does: Resets the selected scenario and category filter to the first match whenever the user switches climate branch.
  // On the website: Prevents showing a temperature scenario card when the user switches to Wind or Humidity mode.
  // Used as: A branch-sync React effect.
  React.useEffect(() => {
    if (branchScenarios.length > 0) {
      setActiveScenario(branchScenarios[0]);
      setSelectedCategory('All');
    }
  }, [dataBranch, branchScenarios]);

  // What this does: Filters the branch's scenarios by the search box text and the active category pill.
  // On the website: Updates the left-side list of clickable scenario cards as the user types or picks a category.
  // Used as: A memoized filtered array for rendering the scenarios list.
  const filteredScenarios = useMemo(() => {
    return branchScenarios.filter((sc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sc.title.toLowerCase().includes(q) ||
        sc.headline.toLowerCase().includes(q) ||
        sc.summary.toLowerCase().includes(q) ||
        sc.questionPrompts.some((p) => p.toLowerCase().includes(q));

      const matchesCat = selectedCategory === 'All' || sc.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory, branchScenarios]);

  if (!isOpen) return null;

  // What this does: Highlights the clicked scenario card and loads its full details in the right panel.
  // On the website: Runs when the user clicks any scenario in the left column.
  // Used as: The scenario selection click handler.
  const handleSelectScenario = (sc: ImpactScenario) => {
    soundFx.playTick();
    setActiveScenario(sc);
  };

  // What this does: Plays a chime, triggers the chosen scenario on the 3D Earth globe, and closes this popup.
  // On the website: Powers the big "Simulate This Consequence on 3D Earth" button at the bottom right.
  // Used as: The simulation launch handler.
  const handleSimulate = (sc: ImpactScenario) => {
    soundFx.playTourChime();
    onSimulateScenario(sc);
    onClose();
  };

  // Branch thematic styling
  const branchAccent = dataBranch === 'wind' ? 'teal' : dataBranch === 'humidity' ? 'cyan' : 'purple';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 select-none">
      <div className={`relative w-full max-w-5xl max-h-[88vh] bg-slate-900 border rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden ${
        dataBranch === 'wind'
          ? 'border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.2)]'
          : dataBranch === 'humidity'
          ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
          : 'border-purple-500/40'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              dataBranch === 'wind'
                ? 'bg-teal-950/80 border-teal-500/50 text-teal-300'
                : dataBranch === 'humidity'
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : 'bg-purple-950/80 border-purple-500/40 text-purple-400'
            }`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                  NASA Impact Detective: &quot;What Would Happen?&quot;
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                  dataBranch === 'wind'
                    ? 'bg-teal-950 text-teal-300 border-teal-500/60'
                    : dataBranch === 'humidity'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                    : 'bg-purple-950 text-purple-300 border-purple-500/60'
                }`}>
                  {dataBranch === 'wind' ? 'Wind Dynamics' : dataBranch === 'humidity' ? 'Atmospheric Moisture' : 'Planetary Thermal'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                {dataBranch === 'wind'
                  ? 'Explore polar jet stream stalls, wind turbine stilling, and cyclonic wind surge simulations grounded in NASA CYGNSS'
                  : dataBranch === 'humidity'
                  ? 'Explore cascading atmospheric moisture, vapor pressure deficit, and wet-bulb tipping points grounded in NASA AIRS & HadISDH'
                  : 'Explore cascading Earth-system thermal consequences and tipping elements grounded in NASA NEX-GDDP projections'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                dataBranch === 'wind'
                  ? "Ask a wind question (e.g. 'Jet stream stall', 'Wind turbine stilling', 'Category 6 typhoon', 'Roaring Forties')..."
                  : dataBranch === 'humidity'
                  ? "Ask a humidity question (e.g. 'Wet-bulb 35 degrees', 'Vapor pressure deficit', 'Continental drying', 'Atmospheric river')..."
                  : "Ask a question (e.g. 'What happens if sea level rises?', 'Food supply', '1.5 vs 2 degrees', 'Amazon', 'Heatwave')..."
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              autoFocus
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundFx.playTick();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? dataBranch === 'wind'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold'
                      : dataBranch === 'humidity'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Split Layout: Scenario List (Left) and Detail Inspector (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Scenarios List */}
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 max-h-[60vh] md:max-h-none">
            {filteredScenarios.length > 0 ? (
              filteredScenarios.map((sc) => {
                const isSelected = activeScenario?.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                          {sc.category}
                        </span>
                        <span className="text-[10px] font-mono text-rose-400 font-bold">
                          +{sc.temperatureTriggerC}&deg;C
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs font-heading truncate">
                        {sc.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 font-sans">
                        {sc.headline}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-purple-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                No impact scenarios matching &quot;{searchQuery}&quot;. Try terms like &quot;sea level&quot;, &quot;heat&quot;, or &quot;food&quot;.
              </div>
            )}
          </div>

          {/* Right Column: Deep-Dive Quantified Consequences */}
          <div className="md:col-span-7 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[60vh] md:max-h-none">
            {activeScenario && (
              <>
                {/* Scenario Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold font-mono tracking-widest px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {activeScenario.category}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Trigger: +{activeScenario.temperatureTriggerC}&deg;C Anomaly (~{activeScenario.approximateYearSSP245})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white leading-tight">
                    {activeScenario.title}
                  </h3>
                  <p className="text-sm text-cyan-300 font-medium mt-1 leading-snug">
                    {activeScenario.headline}
                  </p>
                </div>

                {/* Detailed Narrative */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  {activeScenario.summary}
                </div>

                {/* Quantified Metrics Grid with Exact Numbers */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold font-mono mb-2">
                    NASA Quantified Projections &amp; Numerical Impacts
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {activeScenario.quantifiedMetrics.map((qm, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1"
                      >
                        <span className="text-[10px] text-slate-400 block truncate">
                          {qm.label}
                        </span>
                        <div className="text-base font-extrabold text-white">
                          {qm.value} <span className="text-[10px] text-slate-400 font-normal">{qm.unit}</span>
                        </div>
                        <div className="text-[10px] text-rose-400 font-bold">{qm.delta}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cascading Systemic Consequences */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono uppercase font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Cascading Planetary Impacts</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeScenario.cascadingConsequences.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1 font-bold">&bull;</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* COMPLICATED MODE: ECONOMETRIC DAMAGE FUNCTIONS & ENSEMBLE COVARIANCE */}
                {dataMode === 'complicated' && (
                  <div className="p-4 bg-purple-950/25 border-2 border-purple-500/40 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-purple-200 uppercase tracking-wider text-[11px]">
                          Econometric Damage Functions · Burke-Hsiang-Miguel Empirical Specification
                        </span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40 font-bold">
                        BHM (Nature 2015)
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      Microeconomic output growth &Delta;ln(Y) exhibits a global quadratic response to temperature with an optimum productivity vertex T* = 13.05&deg;C (p &lt; 0.001):
                    </p>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-amber-300 font-mono text-xs overflow-x-auto">
                      <code>
                        &Delta;ln(Y_&#123;it&#125;) = &beta;_1 T_&#123;it&#125; + &beta;_2 T_&#123;it&#125;&sup2; + &gamma; P_&#123;it&#125; + &delta; P_&#123;it&#125;&sup2; + &mu;_i + &theta;_t
                      </code>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">Linear Slope &beta;_1</span>
                        <strong className="text-emerald-300">+0.0127 &plusmn; 0.003</strong>
                        <span className="text-[9px] text-slate-400 block">Growth below 13&deg;C</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">Quadratic Decay &beta;_2</span>
                        <strong className="text-rose-400">-0.000487 &plusmn; 0.0001</strong>
                        <span className="text-[9px] text-slate-400 block">Curvature penalty</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">Optimum Vertex T*</span>
                        <strong className="text-cyan-300">13.05&deg;C (55.5&deg;F)</strong>
                        <span className="text-[9px] text-slate-400 block">Peak GDP per capita</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">Extreme Degree Days</span>
                        <strong className="text-amber-300">EDD_30 &gt; 180 d&middot;&deg;C</strong>
                        <span className="text-[9px] text-slate-400 block">-1.32% crop yield / 100</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 block">CMIP6 Spread (95% CI)</span>
                        <strong className="text-purple-300">&plusmn;1.96 &sigma;_ens (0.42&deg;C)</strong>
                        <span className="text-[9px] text-slate-400 block">Inter-model variance</span>
                      </div>
                      <div className="p-2 bg-purple-950/60 rounded border border-purple-500/40">
                        <span className="text-purple-300 block">SPEI-12 Deficit</span>
                        <strong className="text-rose-300">-1.84 &sigma; Severe</strong>
                        <span className="text-[9px] text-purple-200 block">GRACE-FO depletion</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Trigger Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleSimulate(activeScenario)}
                    className="w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>
                      Simulate This Consequence on 3D Earth (Jump to Year {activeScenario.approximateYearSSP245})
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] font-mono text-slate-500 text-center mt-1.5">
                    Engages 3-second revolving animation, shifts global temperature in &deg;C, and centers camera.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
