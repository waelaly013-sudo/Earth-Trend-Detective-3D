/**
 * NASA Earth Trend Detective - Biological & Social Action Indicators Card
 * Synthesizes abstract physical climate variables into concrete biological thresholds
 * (human thermal safety, crop pollen sterility, vector expansion) and municipal civic directives.
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  Sprout,
  Zap,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Droplets,
  Flame,
  Bug,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { ActiveInspectorItem } from '../types/climate';
import {
  synthesizeBioSocialIndicators,
  BioSocialSynthesis,
} from '../utils/bioSocialIndicators';
import { soundFx } from '../utils/audioSynth';
import { useAuth } from '../context/AuthContext';

interface BioSocialIndicatorsCardProps {
  item: ActiveInspectorItem;
  currentTempC: number;
  anomalyC: number;
  year: number;
  compact?: boolean;
}

// What this does: Takes the local temperature and weather numbers and turns them into easy-to-understand impacts on people, crops, power grids, and city water.
// On the website: Shows the "Biological & Social Indicators" card inside the country/hotspot details sidebar.
// Used as: A human-impact summary panel with Overview, Biological Shock, and Civic Directives tabs.
export const BioSocialIndicatorsCard: React.FC<BioSocialIndicatorsCardProps> = ({
  item,
  currentTempC,
  anomalyC,
  year,
  compact = false,
}) => {
  const { dataMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'biological' | 'civic'>('overview');
  const [showScientificBasis, setShowScientificBasis] = useState<boolean>(false);

  // What this does: Runs the bio-social calculator to get labor loss, crop risk, and safety tips for this location.
  // On the website: Provides all the numbers and warnings displayed inside the card.
  // Used as: The data source for all three tabs of the card.
  const synthesis: BioSocialSynthesis = synthesizeBioSocialIndicators(
    item,
    currentTempC,
    anomalyC,
    year
  );

  // What this does: Picks red, orange, amber, or green colors depending on how high the threat score is (0 to 100).
  // On the website: Colors the progress bar and warning badge so danger levels stand out right away.
  // Used as: A visual severity theme helper for the threat meter.
  const getScoreColor = (score: number) => {
    if (score >= 75) return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/50', bar: 'bg-rose-500' };
    if (score >= 50) return { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50', bar: 'bg-orange-500' };
    if (score >= 25) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', bar: 'bg-amber-500' };
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', bar: 'bg-emerald-500' };
  };

  const scoreTheme = getScoreColor(synthesis.overallThreatScore);

  return (
    <div className="p-2 md:p-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg md:rounded-xl border border-emerald-500/40 space-y-2 md:space-y-3 shadow-lg font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-1.5 md:gap-2 flex-wrap">
        <div className="flex items-center gap-1 md:gap-1.5">
          <HeartPulse className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
          <span className="text-[9.5px] md:text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Biological &amp; Social Indicators
          </span>
        </div>
        <span
          className={`text-[8px] md:text-[9px] uppercase px-1.5 md:px-2 py-0.2 md:py-0.5 rounded-full border font-bold ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}
        >
          {synthesis.overallThreatScore >= 60 ? '🚨 Elevated Human Impact' : '🌿 Resilience Envelope'}
        </span>
      </div>

      {/* Subtitle / Plain-Language Synthesis Translation (Adapts to Mode) */}
      <div className="p-1.5 md:p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[9.5px] md:text-[11px]">
        <div className="flex items-start gap-1.5 md:gap-2">
          <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[8px] md:text-[9px] uppercase tracking-wider font-bold block text-cyan-400">
              {dataMode === 'simple'
                ? 'Simple Words: Daily Life Impact (B1 English)'
                : dataMode === 'complicated'
                ? 'Biophysical Epidemiology & Sociotechnical Exposure Indices'
                : 'Plain-English Synthesis'}
            </span>
            <p className="text-slate-200 text-[10px] md:text-xs font-sans leading-relaxed font-medium">
              {dataMode === 'simple'
                ? `In simple terms: ${synthesis.headline} People working outside need shaded rest breaks, and farms need careful irrigation.`
                : dataMode === 'complicated'
                ? `Synthesis metric: ${synthesis.headline} Evaluated under ISO 7243 WBGT standards, agricultural reproductive thermal windows, and municipal power margin capacity.`
                : synthesis.headline}
            </p>
          </div>
        </div>
      </div>

      {/* What this does: Displays the three tab buttons (Overview, Biological Shock, Civic Directives) and switches the visible section. On the website: Lets users flip between quick scores, health/crop details, and city action plans. Used as: The navigation bar inside the card. */}
      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 md:p-1 rounded-lg border border-slate-800 text-[8.5px] md:text-[10px]">
        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('overview');
          }}
          className={`py-0.5 md:py-1 rounded text-center font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('biological');
          }}
          className={`py-0.5 md:py-1 rounded text-center font-bold transition-all cursor-pointer ${
            activeTab === 'biological'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Biological Shock
        </button>
        <button
          onClick={() => {
            soundFx.playTick();
            setActiveTab('civic');
          }}
          className={`py-0.5 md:py-1 rounded text-center font-bold transition-all cursor-pointer ${
            activeTab === 'civic'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Civic Directives
        </button>
      </div>

      {/* What this does: Shows the overall threat bar and 4 key cards (labor, crops, electricity grid, water). On the website: Gives an instant snapshot of daily life risks. Used as: The default Overview tab content. */}
      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-1.5 md:space-y-2.5">
          {/* Compound Threat Index Gauge */}
          <div className="p-1.5 md:p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1 md:space-y-1.5">
            <div className="flex items-center justify-between text-[9.5px] md:text-[11px]">
              <span className="text-slate-400">Biological &amp; Social Threat Index:</span>
              <strong className={`text-xs md:text-sm ${scoreTheme.text}`}>
                {synthesis.overallThreatScore}/100
              </strong>
            </div>
            <div className="w-full bg-slate-950 h-1.5 md:h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${scoreTheme.bar}`}
                style={{ width: `${synthesis.overallThreatScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] md:text-[9px] text-slate-500">
              <span>0 Safe</span>
              <span>25 Moderate</span>
              <span>50 High</span>
              <span>75+ Emergency</span>
            </div>
          </div>

          {/* Key 4 Metrics Summary Matrix */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-2 text-[8.5px] md:text-[10px]">
            {/* 1. Labor Loss */}
            <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[8px] md:text-[9px] block">Outdoor Labor Capacity</span>
              <div className="text-[10.5px] md:text-xs font-bold text-rose-300">
                {synthesis.outdoorLaborCapacityLossPct > 0
                  ? `-${synthesis.outdoorLaborCapacityLossPct}% Productivity`
                  : '100% Full Capacity'}
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-500 truncate block">
                WBGT: {synthesis.estimatedWbgtC}&deg;C
              </span>
            </div>

            {/* 2. Crop Pollen Threat */}
            <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[8px] md:text-[9px] block">Staple Crop Pollination</span>
              <div
                className={`text-[10.5px] md:text-xs font-bold ${
                  synthesis.cropStressTier === 'Optimal Growth' ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {synthesis.cropStressTier}
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-500 truncate block">
                {synthesis.estimatedCropYieldDeficitPct > 0
                  ? `-${synthesis.estimatedCropYieldDeficitPct}% yield impact`
                  : 'Nominal yield'}
              </span>
            </div>

            {/* 3. Grid AC Surge */}
            <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[8px] md:text-[9px] block">Peak Cooling Power Grid</span>
              <div className="text-[10.5px] md:text-xs font-bold text-cyan-300">
                +{synthesis.coolingElectricityDemandSurgePct}% Demand Surge
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-500 truncate block">
                {synthesis.gridStressLevel}
              </span>
            </div>

            {/* 4. Water Rationing */}
            <div className="p-1.5 md:p-2 bg-slate-900/90 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[8px] md:text-[9px] block">Municipal Water Reserves</span>
              <div className="text-[10.5px] md:text-xs font-bold text-sky-300 truncate">
                {synthesis.waterRationingTier.split(':')[0]}
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-500 truncate block">
                {synthesis.wildfireDroughtPressureIndex}x Evaporative draw
              </span>
            </div>
          </div>

          {/* COMPLICATED MODE: BIOPHYSICAL EPIDEMIOLOGY & MATHEMATICAL FORMULATIONS */}
          {dataMode === 'complicated' && (
            <div className="p-3 bg-purple-950/25 border border-purple-500/40 rounded-xl space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between text-purple-300 font-bold border-b border-purple-500/30 pb-1">
                <span>Biophysical Epidemiological Thermodynamics:</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 border border-purple-600/40">
                  ISO 7243 Standard
                </span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-cyan-300 overflow-x-auto">
                  <code>WBGT = 0.7 &middot; T_w + 0.2 &middot; T_g + 0.1 &middot; T_d</code>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                  <div>&bull; Metabolic Rate M: 300 W&middot;m&sup-2; (moderate field labor)</div>
                  <div>&bull; Max Skin Dissipation E_max: 380 W&middot;m&sup-2;</div>
                  <div>&bull; Anthesis Sterility: P(sterile) = 1 / (1 + e^[-0.85(T - 34.5)])</div>
                  <div>&bull; Grid Heat Spike: +5.8% / &deg;C &gt; 22&deg;C CDD base</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BIOLOGICAL SHOCK */}
      {activeTab === 'biological' && (
        <div className="space-y-2.5 text-[11px]">
          {/* Human Heat Stress & Wet-Bulb */}
          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-rose-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Human Physiological Heat Stress</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                {synthesis.heatIllnessAlert}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400">Shaded Wet-Bulb Globe Temp (WBGT): </span>
                <strong className="text-white">{synthesis.estimatedWbgtC}&deg;C</strong>
                <span className="text-slate-500 text-[9px]"> (35°C is human lethal limit)</span>
              </div>
              <div>
                <span className="text-slate-400">Occupational Work/Rest Mandate: </span>
                <strong className="text-amber-200">{synthesis.recommendedWorkRestCycle}</strong>
              </div>
              <p className="text-[10px] text-slate-400 italic pt-0.5 border-t border-slate-800/80">
                {synthesis.vulnerablePopulationsAdvisory}
              </p>
            </div>
          </div>

          {/* Flora, Agriculture & Pollen Sterility */}
          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px] uppercase">
                <Sprout className="w-3.5 h-3.5" />
                <span>Crop Pollination &amp; Food Security</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {synthesis.cropStressTier}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400">Harvest Yield Penalty: </span>
                <strong className="text-rose-400">
                  {synthesis.estimatedCropYieldDeficitPct > 0
                    ? `-${synthesis.estimatedCropYieldDeficitPct}%`
                    : '0% (Nominal)'}
                </strong>
                <span className="text-slate-500 text-[9px]"> for maize, wheat, rice anthesis</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                {synthesis.cropRiskDescription}
              </p>
            </div>
          </div>

          {/* Biome Disruption: Mosquito Vectors & Wildfire Drought */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-1 text-sky-400 font-bold text-[9px] uppercase">
                <Bug className="w-3 h-3" />
                <span>Vector Habitat</span>
              </div>
              <div className="text-white font-bold">
                +{synthesis.vectorDiseaseDaysExpansion} days/yr
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">
                Dengue/Malaria mosquito breeding expansion window.
              </span>
            </div>

            <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center gap-1 text-orange-400 font-bold text-[9px] uppercase">
                <Flame className="w-3 h-3" />
                <span>Wildfire Aridity</span>
              </div>
              <div className="text-white font-bold">
                {synthesis.wildfireDroughtPressureIndex}x Baseline
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">
                Atmospheric vapor pressure deficit &amp; fuel dry-down rate.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CIVIC DIRECTIVES & SOCIAL ACTIONS */}
      {activeTab === 'civic' && (
        <div className="space-y-2.5 text-[11px]">
          {/* Action Directives Checklist */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
              Immediate Municipal &amp; Community Directives:
            </span>
            <div className="space-y-1.5">
              {synthesis.actionDirectives.map((directive, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-[10px] space-y-1 ${
                    directive.urgency === 'immediate'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                      : directive.urgency === 'advisory'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-sm">{directive.icon}</span>
                      <span>{directive.title}</span>
                    </div>
                    <span
                      className={`text-[8px] uppercase px-1.5 py-0.2 rounded font-bold ${
                        directive.urgency === 'immediate'
                          ? 'bg-rose-500 text-slate-950 font-extrabold'
                          : directive.urgency === 'advisory'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {directive.urgency}
                    </span>
                  </div>
                  <p className="text-[10px] font-sans leading-relaxed text-slate-300">
                    {directive.action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure & Rail Thermal Expansion */}
          <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between text-[10px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Civilian Infrastructure</span>
              <strong className={synthesis.railSpeedRestrictionAdvised ? 'text-rose-400' : 'text-slate-200'}>
                {synthesis.infrastructureRisk}
              </strong>
            </div>
            {synthesis.railSpeedRestrictionAdvised && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                ⚠️ Rail Speed Cap &lt;60km/h
              </span>
            )}
          </div>
        </div>
      )}

      {/* What this does: Lets the user expand or collapse a short explanation of the science behind the numbers. On the website: Shows a clickable "How Raw Numbers Are Synthesized" drawer at the bottom of the card. Used as: An educational footnote for curious users. */}
      {/* Scientific Explanation Toggle */}
      <div className="pt-1 border-t border-slate-800">
        <button
          onClick={() => {
            soundFx.playTick();
            setShowScientificBasis(!showScientificBasis);
          }}
          className="w-full flex items-center justify-between text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer py-0.5"
        >
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>How Raw Numbers Are Synthesized (Scientific Formulae)</span>
          </span>
          {showScientificBasis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showScientificBasis && (
          <div className="mt-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-sans space-y-1.5 leading-relaxed">
            <p>
              • <strong>Wet-Bulb Globe Temperature (WBGT)</strong> approximates evaporative cooling limits of the human skin per ISO 7243. Above 32°C WBGT, metabolic heat cannot dissipate, causing heat stroke within 30 minutes of heavy physical labor.
            </p>
            <p>
              • <strong>Crop Anthesis Shock</strong> tracks critical temperatures where corn, rice, and wheat pollen enzymes denature (&gt;33&deg;C), dropping grain yield by 4% to 10% per additional degree of warming.
            </p>
            <p>
              • <strong>Cooling Degree Days (CDD)</strong> surge compounds municipal electric distribution loads by ~5.8% per °C over 22°C baseline, risking distribution transformer trip-outs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
