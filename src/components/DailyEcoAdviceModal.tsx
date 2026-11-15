/**
 * NASA Earth Trend Detective - Daily Eco-Advice Modal
 * Delivers a simple, real, bite-sized everyday eco tip for every country on Earth.
 * Grounded in local climate, culture, and weather.com meteorological feeds.
 * Bilingual: English and Arabic (العربية) with RTL support.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Globe,
  Sun,
  Droplets,
  Wind,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Leaf,
  ExternalLink,
  Check,
  CheckSquare,
  Square,
  Thermometer,
  Zap,
} from 'lucide-react';
import {
  CountryClimateData,
  COUNTRIES_DATABASE,
  getCountryHumidity,
  getCountryWind,
} from '../data/countriesData';
import { getRealCountryEcoTip, CountryRealTip } from '../data/countryEcoTips';
import { DataBranch } from '../types/climate';
import { soundFx } from '../utils/audioSynth';
import { speakUtterance, stopSpeaking } from '../utils/speechAnnouncer';
import { useUnitsAndLanguage } from '../context/UnitAndLanguageContext';

// What this does: Lists the props passed into the Daily Eco-Advice popup.
// On the website: Gives the popup the currently chosen country, climate branch, and year.
// Used as: The TypeScript props contract for DailyEcoAdviceModal.
interface DailyEcoAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: CountryClimateData | null;
  onSelectCountry?: (country: CountryClimateData) => void;
  dataBranch: DataBranch;
  currentYear: number;
}

// What this does: Describes the data structure returned by the daily eco-advice API or fallback.
// On the website: Holds today's eco tip text, date, and weather.com source links.
// Used as: The TypeScript type for the advice state inside the modal.
interface AdviceResponse {
  advice: string;
  country: string;
  date: string;
  source: string;
  webSources: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
}

// What this does: Lists popular countries with their flag emojis and English/Arabic names.
// On the website: Creates the row of quick-pick country buttons at the top of the advice popup.
// Used as: A shortcut list so users can switch countries with one click.
const POPULAR_COUNTRY_SHORTCUTS = [
  { id: 'egy', flag: '🇪🇬', nameEn: 'Egypt', nameAr: 'مصر' },
  { id: 'sau', flag: '🇸🇦', nameEn: 'Saudi Arabia', nameAr: 'السعودية' },
  { id: 'are', flag: '🇦🇪', nameEn: 'UAE', nameAr: 'الإمارات' },
  { id: 'usa', flag: '🇺🇸', nameEn: 'USA', nameAr: 'أمريكا' },
  { id: 'jpn', flag: '🇯🇵', nameEn: 'Japan', nameAr: 'اليابان' },
  { id: 'deu', flag: '🇩🇪', nameEn: 'Germany', nameAr: 'ألمانيا' },
  { id: 'bra', flag: '🇧🇷', nameEn: 'Brazil', nameAr: 'البرازيل' },
  { id: 'ind', flag: '🇮🇳', nameEn: 'India', nameAr: 'الهند' },
  { id: 'gbr', flag: '🇬🇧', nameEn: 'UK', nameAr: 'بريطانيا' },
  { id: 'fra', flag: '🇫🇷', nameEn: 'France', nameAr: 'فرنسا' },
  { id: 'esp', flag: '🇪🇸', nameEn: 'Spain', nameAr: 'إسبانيا' },
  { id: 'ita', flag: '🇮🇹', nameEn: 'Italy', nameAr: 'إيطاليا' },
  { id: 'can', flag: '🇨🇦', nameEn: 'Canada', nameAr: 'كندا' },
  { id: 'mar', flag: '🇲🇦', nameEn: 'Morocco', nameAr: 'المغرب' },
  { id: 'aus', flag: '🇦🇺', nameEn: 'Australia', nameAr: 'أستراليا' },
];

// What this does: Renders the Daily Eco-Advice modal with country switching, weather snapshot, and voice readout.
// On the website: Shows one practical everyday climate action tip tailored to the selected country in English or Arabic.
// Used as: A modal component opened from the header action bar.
export const DailyEcoAdviceModal: React.FC<DailyEcoAdviceModalProps> = ({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry,
  dataBranch,
  currentYear,
}) => {
  const { language, isRTL, formatTemp, formatWind, formatHum, formatTempDelta } = useUnitsAndLanguage();
  const isAr = language === 'ar';

  const [activeCountry, setActiveCountry] = useState<CountryClimateData>(() => {
    return selectedCountry || COUNTRIES_DATABASE[0];
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [adviceData, setAdviceData] = useState<AdviceResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedAction, setCompletedAction] = useState<boolean>(false);

  // What this does: Looks up the built-in country-specific eco tip for the active country and branch.
  // On the website: Fills the main green advice card, "Why It Matters" box, and 10-second action button.
  // Used as: A memoized lookup so the tip updates smoothly whenever the user changes country or branch.
  const currentTip: CountryRealTip = useMemo(() => {
    return getRealCountryEcoTip(
      activeCountry.name,
      activeCountry.isoCode,
      activeCountry.lat,
      dataBranch as any
    );
  }, [activeCountry, dataBranch]);

  // What this does: Syncs the modal's active country when the user picks a new country on the 3D Earth.
  // On the website: Keeps the advice popup matched to whatever country the user clicked on the globe.
  // Used as: A React effect listening to the selectedCountry prop.
  useEffect(() => {
    if (selectedCountry) {
      setActiveCountry(selectedCountry);
      setCompletedAction(false);
    }
  }, [selectedCountry]);

  // What this does: Requests live eco-advice from the server for the chosen country, or falls back to the built-in tip offline.
  // On the website: Updates the today's-date badge and weather source links when the modal opens or refreshes.
  // Used as: An async data loader triggered on modal open and refresh button clicks.
  const fetchAdvice = useCallback(async (countryToFetch: CountryClimateData) => {
    setLoading(true);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const hum = getCountryHumidity(countryToFetch, currentYear);
      const wnd = getCountryWind(countryToFetch, currentYear);
      const res = await fetch('/api/daily-eco-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: countryToFetch.name,
          isoCode: countryToFetch.isoCode,
          continent: countryToFetch.continent,
          lat: countryToFetch.lat,
          lng: countryToFetch.lng,
          currentTempC: Number((countryToFetch.baselineTempC + countryToFetch.historicalAnomaly2026C).toFixed(1)),
          currentRelativeHumidityPct: hum.currentRelativeHumidityPct,
          meanWindSpeedMs: wnd.meanWindSpeedMs,
          gustSpeedKmh: wnd.gustSpeedKmh,
          beaufortScale: wnd.beaufortScale,
          beaufortDesc: wnd.beaufortDescription,
          windPowerDensityWm2: wnd.windPowerDensityWm2,
          prevailingWind: wnd.prevailingWindDirection,
          anomalyC: countryToFetch.historicalAnomaly2026C,
          dataBranch,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: AdviceResponse = await res.json();
      setAdviceData(data);
    } catch {
      // Offline fallback: Use the curated real tip
      const today = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const fallbackText = isAr
        ? `### النصيحة اليومية البسيطة لدولة ${countryToFetch.name} ${currentTip.categoryIcon}\n${currentTip.tipAr}\n\n### لماذا هي مهمة؟\n${currentTip.whyItMattersAr}\n\n### خطوة سريعة لـ 10 ثوانٍ\n${currentTip.actionItemAr}`
        : `### Today's Small Real Tip for ${countryToFetch.name} ${currentTip.categoryIcon}\n${currentTip.tipEn}\n\n### Why It Matters\n${currentTip.whyItMattersEn}\n\n### Quick 10-Second Action\n${currentTip.actionItemEn}`;

      setAdviceData({
        advice: fallbackText,
        country: countryToFetch.name,
        date: today,
        source: isAr ? 'نصائح بيئية معتمدة وبيانات الطقس المحلية' : 'weather.com & Verified Country Environmental Directives',
        webSources: [
          {
            title: `Weather.com - ${countryToFetch.name} Daily Forecast`,
            uri: `https://weather.com/weather/today/l/${encodeURIComponent(countryToFetch.name)}`,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [currentYear, dataBranch, currentTip, isAr]);

  // What this does: Automatically fetches advice when the popup opens and stops speech when it closes.
  // On the website: Ensures fresh country advice loads on open and voice reading never keeps playing in the background.
  // Used as: A lifecycle effect tied to isOpen and activeCountry.
  useEffect(() => {
    if (isOpen) {
      fetchAdvice(activeCountry);
    } else {
      stopSpeaking();
      setIsSpeaking(false);
    }
  }, [isOpen, activeCountry, fetchAdvice]);

  // What this does: Starts or stops reading today's eco-advice aloud using text-to-speech.
  // On the website: Powers the "Listen to Today's Small Real Tip" button in both English and Arabic.
  // Used as: The voice narration toggle handler.
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      soundFx.playTick();
    } else {
      soundFx.playChime();
      setIsSpeaking(true);

      const spokenText = isAr
        ? `النصيحة البيئية اليومية لدولة ${activeCountry.name}. ${currentTip.titleAr}. ${currentTip.tipAr}. لماذا هي مهمة؟ ${currentTip.whyItMattersAr}. خطوة سريعة: ${currentTip.actionItemAr}.`
        : `Daily Eco-Advice for ${activeCountry.name}. ${currentTip.titleEn}. ${currentTip.tipEn}. Why it matters: ${currentTip.whyItMattersEn}. Quick ten second action: ${currentTip.actionItemEn}.`;

      speakUtterance(spokenText, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  // What this does: Switches the modal to a newly picked country and informs the parent app.
  // On the website: Updates the advice card, weather metrics, and globe selection when a user picks a country chip or search result.
  // Used as: The selection callback for country search results and shortcut pills.
  const handleSelectCountry = (country: CountryClimateData) => {
    soundFx.playTick();
    setActiveCountry(country);
    setCompletedAction(false);
    if (onSelectCountry) onSelectCountry(country);
    setSearchQuery('');
  };

  if (!isOpen) return null;

  const filteredCountries = searchQuery.trim()
    ? COUNTRIES_DATABASE.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.isoCode.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const hum = getCountryHumidity(activeCountry, currentYear);
  const wnd = getCountryWind(activeCountry, currentYear);
  const countryTemp = activeCountry.baselineTempC + activeCountry.historicalAnomaly2026C;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/40 flex flex-col text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-lg shadow-emerald-950/50 flex items-center justify-center text-white shrink-0">
              <Leaf className="w-5 h-5 text-emerald-100 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold uppercase tracking-wider">
                  {isAr ? 'نصائح حقيقية وبسيطة' : 'Small Real Eco Tip'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {adviceData?.date || (isAr ? 'اليوم' : 'Today')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2 truncate mt-0.5">
                <span>{isAr ? `نصيحة اليوم: ${activeCountry.name}` : `Daily Eco Advice: ${activeCountry.name}`}</span>
                <span className="text-xl shrink-0" role="img" aria-label="Flag">
                  {activeCountry.flagEmoji || '🌍'}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                soundFx.playTick();
                fetchAdvice(activeCountry);
              }}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title={isAr ? 'تحديث النصيحة' : "Refresh today's advice"}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundFx.playTick();
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Country Switcher & Search Bar */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن أي دولة (مثلاً: مصر، السعودية، اليابان، كندا)...' : 'Search any country (e.g., Egypt, Japan, Brazil, Canada)...'}
                className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {filteredCountries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto">
                {filteredCountries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCountry(c)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 flex items-center justify-between cursor-pointer border-b border-slate-800/60 last:border-b-0"
                  >
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span>{c.flagEmoji}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{c.continent}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-Pick Popular Country Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-700">
            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
              {isAr ? 'اختر دولة:' : 'Quick Pick:'}
            </span>
            {POPULAR_COUNTRY_SHORTCUTS.map((item) => {
              const isSelected =
                activeCountry.isoCode.toLowerCase() === item.id ||
                activeCountry.name.toLowerCase().includes(item.nameEn.toLowerCase());

              const matchCountry = COUNTRIES_DATABASE.find(
                (c) =>
                  c.isoCode.toLowerCase() === item.id ||
                  c.name.toLowerCase().includes(item.nameEn.toLowerCase())
              );

              return (
                <button
                  key={item.id}
                  onClick={() => matchCountry && handleSelectCountry(matchCountry)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono shrink-0 flex items-center gap-1 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{item.flag}</span>
                  <span>{isAr ? item.nameAr : item.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-xs font-mono">
          
          {/* PROMINENT HERO CARD: The Small Real Tip for the Selected Country */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-teal-950/60 border border-emerald-500/40 shadow-xl space-y-3 relative overflow-hidden">
            {/* Top Badge & Category */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="Category Icon">
                  {currentTip.categoryIcon}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isAr ? currentTip.categoryTitleAr : currentTip.categoryTitleEn}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 font-semibold">
                <span>{activeCountry.flagEmoji}</span>
                <span>{activeCountry.name}</span>
              </span>
            </div>

            {/* Tip Title */}
            <h3 className="text-base sm:text-lg font-bold font-heading text-white leading-snug">
              {isAr ? currentTip.titleAr : currentTip.titleEn}
            </h3>

            {/* The Main Real Tip (Large, Simple, Readable) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-emerald-100 font-sans text-sm sm:text-[15px] leading-relaxed">
              <p className="font-medium">
                {isAr ? currentTip.tipAr : currentTip.tipEn}
              </p>
            </div>

            {/* Why It Matters Callout */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="font-sans text-xs text-slate-300 space-y-0.5">
                <strong className="text-cyan-300 block font-semibold">
                  {isAr ? 'لماذا هذه الخطوة مهمة؟' : 'Why It Matters:'}
                </strong>
                <p>{isAr ? currentTip.whyItMattersAr : currentTip.whyItMattersEn}</p>
              </div>
            </div>

            {/* Interactive 10-Second Action Button */}
            <button
              onClick={() => {
                const next = !completedAction;
                setCompletedAction(next);
                if (next) soundFx.playTourChime();
                else soundFx.playTick();
              }}
              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                completedAction
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-slate-950 hover:bg-slate-900 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {completedAction ? (
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                ) : (
                  <Zap className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-semibold text-left">
                  {completedAction
                    ? (isAr ? '✓ قمت بهذا اليوم! أحسنت عملاً 🎉' : '✓ I completed this today! Great work 🎉')
                    : (isAr ? `خطوة سريعة: ${currentTip.actionItemAr}` : `Quick Action: ${currentTip.actionItemEn}`)}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                completedAction ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-950 text-emerald-200'
              }`}>
                {completedAction ? (isAr ? 'تم' : 'Done') : (isAr ? '10 ثوانٍ' : '10 Seconds')}
              </span>
            </button>
          </div>

          {/* Active Category Micro-Tip (Temperature / Humidity / Wind) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                {dataBranch === 'wind' ? (
                  <>
                    <Wind className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isAr ? 'نصيحة الرياح والتهوية' : 'Wind & Ventilation Tip'}</span>
                  </>
                ) : dataBranch === 'humidity' ? (
                  <>
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'نصيحة الرطوبة والماء' : 'Moisture & Water Tip'}</span>
                  </>
                ) : (
                  <>
                    <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isAr ? 'نصيحة الحرارة والتبريد' : 'Thermal & Cooling Tip'}</span>
                  </>
                )}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                {dataBranch.toUpperCase()}
              </span>
            </div>
            <p className="font-sans text-xs text-slate-200 leading-relaxed">
              {dataBranch === 'wind'
                ? (isAr ? currentTip.branchTips.windAr : currentTip.branchTips.windEn)
                : dataBranch === 'humidity'
                ? (isAr ? currentTip.branchTips.humidityAr : currentTip.branchTips.humidityEn)
                : (isAr ? currentTip.branchTips.temperatureAr : currentTip.branchTips.temperatureEn)}
            </p>
          </div>

          {/* Live Atmospheric Conditions Snapshot */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-rose-400" />
                <span>{isAr ? 'درجة الحرارة' : 'Temperature'}</span>
              </span>
              <div className="text-sm font-extrabold text-cyan-300 mt-1">
                {formatTemp(countryTemp)}
              </div>
              <span className="text-[9px] text-slate-400 truncate">
                {formatTempDelta(activeCountry.historicalAnomaly2026C)} {isAr ? 'شذوذ' : 'anomaly'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>{isAr ? 'الرطوبة' : 'Humidity'}</span>
              </span>
              <div className="text-sm font-extrabold text-cyan-300 mt-1">
                {formatHum({ relativeHumidityPct: hum.currentRelativeHumidityPct, dewPointC: hum.dewPointC }).formatted}
              </div>
              <span className="text-[9px] text-slate-400 truncate">
                {hum.humidityRiskStatus}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>{isAr ? 'الرياح السطحية' : 'Wind Speed'}</span>
              </span>
              <div className="text-sm font-extrabold text-teal-300 mt-1">
                {formatWind(wnd.meanWindSpeedMs)}
              </div>
              <span className="text-[9px] text-slate-400 truncate">
                {wnd.beaufortDescription}
              </span>
            </div>
          </div>

          {/* Voice Narration Button */}
          <button
            onClick={handleToggleVoice}
            className={`w-full py-2 px-3 rounded-xl border font-mono text-xs flex items-center justify-between transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
                : 'bg-slate-950/80 hover:bg-slate-850 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
            }`}
            title={isAr ? 'الاستماع للنصيحة بصوت واضح' : "Listen to today's spoken advice"}
          >
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-slate-950 animate-bounce" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="font-semibold">
                {isSpeaking
                  ? (isAr ? '⏹ إيقاف القراءة الصوتية (جاري الاستماع...)' : '⏹ Stop Spoken Advice (Playing...)')
                  : (isAr ? `🔊 استمع لنصيحة اليوم لدولة ${activeCountry.name}` : `🔊 Listen to Today's Small Real Tip for ${activeCountry.name}`)}
              </span>
            </div>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-200">
              {isAr ? 'صوت واضح' : 'Text-to-Speech'}
            </span>
          </button>

          {/* Weather.com Verification Link */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px] font-sans">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? `بيانات الطقس الحية من Weather.com:` : `Live Weather.com Forecast:`}</span>
            </span>
            <a
              href={`https://weather.com/weather/today/l/${encodeURIComponent(activeCountry.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-white font-semibold underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{activeCountry.name} Forecast</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between shrink-0">
          <span>{isAr ? 'مستندة إلى الواقع وعادات المناخ اليومية' : 'Real everyday action grounded in local climate realities'}</span>
          <button
            onClick={() => {
              soundFx.playTick();
              stopSpeaking();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'حسناً' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
