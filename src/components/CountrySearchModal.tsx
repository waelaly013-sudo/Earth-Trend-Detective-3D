/**
 * NASA Earth Trend Detective - Country & Place Selector
 * Enables searching and selecting any country or territory worldwide
 * to view real-time Celsius temperature changes.
 */

import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Globe, Thermometer, ChevronRight, HeartPulse, Sprout, Zap, Droplets, Wind, ShieldAlert, Compass, Gauge } from 'lucide-react';
import { COUNTRIES_DATABASE, CountryClimateData, getCountryTemperature, getCountryHumidity, getCountryWind } from '../data/countriesData';
import { soundFx } from '../utils/audioSynth';
import { synthesizeBioSocialIndicators } from '../utils/bioSocialIndicators';
import { useAuth } from '../context/AuthContext';
import { useMeasuringUnits } from '../context/UnitPreferencesContext';

// What this does: Defines the props needed by the Country & Place Selector popup.
// On the website: Lets the popup know whether it is open, which year is active, and what to do when a country is picked.
// Used as: The TypeScript props interface for CountrySearchModal.
interface CountrySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry: (country: CountryClimateData) => void;
  currentYear: number;
}

// What this does: Displays a searchable, continent-filtered grid of countries with live climate stats.
// On the website: Lets the user type a country name or pick a continent to jump the 3D globe straight to that country.
// Used as: The country search and directory modal in the Explorer menu.
export const CountrySearchModal: React.FC<CountrySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCountry,
  currentYear,
}) => {
  const { dataBranch } = useAuth();
  const { formatTemp, formatTempDiff, formatTempRate, formatHum, formatWind } = useMeasuringUnits();
  const isHumidity = dataBranch === 'humidity';
  const isWind = dataBranch === 'wind';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('All');

  const continents = ['All', 'North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania', 'Polar'];

  // What this does: Filters the full countries database by the typed search text and chosen continent tab.
  // On the website: Updates the country cards in real time as the user types or clicks a continent button.
  // Used as: A memoized filter list for rendering the country cards grid.
  const filteredCountries = useMemo(() => {
    return COUNTRIES_DATABASE.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.isoCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContinent = selectedContinent === 'All' || c.continent === selectedContinent;
      return matchesSearch && matchesContinent;
    });
  }, [searchQuery, selectedContinent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-950/80 select-none">
      <div className={`relative w-full max-w-2xl max-h-[84dvh] md:max-h-[82vh] bg-slate-900 border rounded-xl md:rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden ${
        isWind
          ? 'border-teal-500/50 shadow-[0_0_25px_rgba(20,184,166,0.25)]'
          : isHumidity
          ? 'border-cyan-500/40'
          : 'border-amber-500/30'
      }`}>
        {/* Header */}
        <div className="p-2.5 md:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
            <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl border shrink-0 ${
              isWind
                ? 'bg-teal-950 border-teal-500/40 text-teal-300'
                : isHumidity
                ? 'bg-cyan-950 border-cyan-500/30 text-cyan-400'
                : 'bg-amber-950 border-amber-500/30 text-amber-400'
            }`}>
              {isWind ? (
                <Wind className="w-4 h-4 md:w-5 md:h-5 text-teal-300 animate-pulse" />
              ) : isHumidity ? (
                <Droplets className="w-4 h-4 md:w-5 md:h-5 text-cyan-300 animate-pulse" />
              ) : (
                <Globe className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <h2 className="text-sm md:text-base font-bold font-heading text-white truncate">
                  Select Country or Region
                </h2>
                <span className={`text-[8.5px] md:text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                  isWind
                    ? 'bg-teal-950 text-teal-300 border-teal-700/60'
                    : isHumidity
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                    : 'bg-amber-950 text-amber-300 border-amber-700/60'
                }`}>
                  {isWind ? 'WIND SPEED BRANCH' : isHumidity ? 'HUMIDITY BRANCH' : 'AIR TEMP BRANCH'}
                </span>
              </div>
              <p className="text-[10px] md:text-xs font-mono text-slate-400 truncate">
                {isWind
                  ? 'Explore 10m surface wind velocity, Beaufort force & kinetic power'
                  : isHumidity
                  ? 'Explore relative humidity (RH%), moisture anomalies & VPD'
                  : 'Explore surface temperature trends & warming numbers in °C'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playTick();
              onClose();
            }}
            className="p-1 md:p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-2.5 md:p-4 bg-slate-950/60 border-b border-slate-800 space-y-2 md:space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code (e.g., France, Egypt)..."
              className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 bg-slate-900 border border-slate-700 rounded-lg md:rounded-xl text-[11px] md:text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              autoFocus
            />
          </div>

          {/* Continent Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
            {continents.map((cont) => (
              <button
                key={cont}
                onClick={() => {
                  soundFx.playTick();
                  setSelectedContinent(cont);
                }}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedContinent === cont
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cont}
              </button>
            ))}
          </div>
        </div>

        {/* Countries Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {filteredCountries.map((country) => {
            const stats = getCountryTemperature(country, currentYear);
            const hum = getCountryHumidity(country, currentYear);
            const wind = getCountryWind(country, currentYear);
            const bioSocial = synthesizeBioSocialIndicators(
              country,
              stats.currentTempC,
              stats.anomalyC,
              currentYear
            );
            return (
              <button
                key={country.id}
                onClick={() => {
                  soundFx.playBlip(920);
                  onSelectCountry(country);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  isWind
                    ? 'bg-slate-950/70 border-slate-800 hover:border-teal-400 hover:bg-slate-900/80'
                    : isHumidity
                    ? 'bg-slate-950/70 border-slate-800 hover:border-cyan-400 hover:bg-slate-900/80'
                    : 'bg-slate-950/70 border-slate-800 hover:border-amber-400 hover:bg-slate-900/80'
                }`}
              >
                <div className="min-w-0 pr-2 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors truncate">
                      {country.name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                      {country.isoCode}
                    </span>
                    <span className="text-sm shrink-0" role="img" aria-label="Flag">
                      {country.flagEmoji}
                    </span>
                  </div>

                  {isWind ? (
                    /* WIND SPEED BRANCH TELEMETRY (10m Wind, Beaufort, WPD, Gusts) */
                    <div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                          <strong className="text-white text-xs font-extrabold">{formatWind(wind.meanWindSpeedMs)}</strong>
                        </span>
                      </div>

                      {/* Wind Dynamic Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                          wind.beaufortScale >= 7
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                            : wind.beaufortScale >= 5
                            ? 'bg-teal-950/80 text-teal-300 border-teal-500/50'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}>
                          <Gauge className="w-2.5 h-2.5 text-teal-400" />
                          <span>F{wind.beaufortScale} • {wind.beaufortDescription}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
                          <span>{wind.windPowerDensityWm2} W/m² WPD</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-violet-950/80 text-violet-300 border border-violet-700/60 font-semibold">
                          <span>Gust: {formatWind(wind.gustSpeedKmh / 3.6)}</span>
                        </span>
                      </div>

                      {/* Subtle ambient subtext, keeping temperature strictly minimal */}
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 font-mono">
                        <span className="text-teal-400/80 font-semibold truncate max-w-[180px]">{wind.prevailingWindDirection}</span>
                        <span>Ambient: {formatTemp(stats.currentTempC)}</span>
                      </div>
                    </div>
                  ) : isHumidity ? (
                    /* HUMIDITY BRANCH TELEMETRY (RH%, delta RH, VPD, Td) */
                    <div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          <strong className="text-white text-xs font-extrabold">{formatHum(hum.currentRelativeHumidityPct, stats.currentTempC)}</strong>
                        </span>
                        <span className={`font-bold text-xs ${
                          hum.relativeHumidityAnomalyPct <= 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {hum.relativeHumidityAnomalyPct > 0 ? '+' : ''}{hum.relativeHumidityAnomalyPct}% Anomaly
                        </span>
                      </div>

                      {/* Hydroclimate Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
                          <Wind className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{hum.vaporPressureDeficitKPa} kPa VPD</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-teal-950/80 text-teal-300 border border-teal-700/60 font-semibold">
                          <span>q: {hum.specificHumidityGKg} g/kg</span>
                        </span>

                        <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                          hum.wetBulbC >= 30
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}>
                          <span>Tw: {formatTemp(hum.wetBulbC)}</span>
                        </span>
                      </div>

                      {/* Subtle ambient subtext, keeping temperature minimal as requested */}
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 font-mono">
                        <span className="text-cyan-400/80 font-semibold">{hum.humidityRiskStatus}</span>
                        <span>Ambient: {formatTemp(stats.currentTempC)}</span>
                      </div>
                    </div>
                  ) : (
                    /* AIR TEMPERATURE BRANCH TELEMETRY */
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-400" />
                          <strong className="text-white text-xs">{formatTemp(stats.currentTempC)}</strong>
                        </span>
                        <span className="text-rose-400 font-bold text-xs">
                          {formatTempDiff(stats.anomalyC)}
                        </span>
                      </div>

                      {/* Synthesized Biological & Social Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {bioSocial.outdoorLaborCapacityLossPct > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-500/40 font-semibold">
                            <HeartPulse className="w-2.5 h-2.5 text-rose-400" />
                            <span>-{bioSocial.outdoorLaborCapacityLossPct}% Labor Cap</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold">
                            <HeartPulse className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Labor Safe</span>
                          </span>
                        )}

                        {bioSocial.cropStressTier !== 'Optimal Growth' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 font-semibold truncate max-w-[130px]">
                            <Sprout className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span className="truncate">{bioSocial.cropStressTier}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-300 border border-sky-500/40 font-semibold">
                            <Zap className="w-2.5 h-2.5 text-sky-400" />
                            <span>+{bioSocial.coolingElectricityDemandSurgePct}% Grid AC</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 truncate mt-1">
                        {country.continent} &bull; Rate: {formatTempRate(country.warmingRateDecadeC)}
                      </p>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>
            Showing {filteredCountries.length} countries &bull; Year <strong>{currentYear}</strong>
          </span>
          <span className="text-cyan-400">
            Tip: You can also click directly on any continent on the 3D Earth!
          </span>
        </div>
      </div>
    </div>
  );
};
