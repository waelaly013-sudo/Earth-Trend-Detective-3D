/**
 * NASA Earth Trend Detective - Speech Announcer
 * Generates spoken narrations and manages Web Speech API for month-to-month
 * and epochal (Past, Present, Prediction) climate temperature changes.
 */

import { ActiveInspectorItem, ClimateRegion } from '../types/climate';
import { MONTH_NAMES, calculateMonthlyTemperature, getGlobalMeanAnomaly } from '../data/countriesData';
import { SpokenAnnouncement } from '../components/VoiceAnnouncementHUD';

// What this does: Writes a short, natural spoken sentence comparing this month's weather to last month, plus Past (2000), Present (2026), and Future (2040).
// On the website: Fills the text and audio script shown in the Voice Announcement banner when you pick a month or click Listen.
// Used as: The script writer for the website's voice narrator.
export function generateMonthChangeAnnouncement(
  item: ActiveInspectorItem | null,
  year: number,
  prevMonth: number,
  newMonth: number
): SpokenAnnouncement {
  const monthName = MONTH_NAMES[newMonth - 1];
  const prevMonthName = MONTH_NAMES[prevMonth - 1];

  if (item) {
    // Determine baseline and rate profile
    let base = 20.0;
    let rate = 0.35;
    let multiplier = 1.3;

    if ('type' in item && item.type === 'country') {
      base = item.baselineTempC;
      rate = item.warmingRateDecadeC;
      multiplier = item.warmingMultiplier;
    } else if ('type' in item && item.type === 'custom') {
      const latAbs = Math.abs(item.lat);
      base = Number((28 - 45 * Math.pow(Math.sin((latAbs * Math.PI) / 180), 1.8)).toFixed(1));
      rate = Number((0.26 * (1.0 + 1.4 * (latAbs / 90))).toFixed(2));
      multiplier = 1.0 + 1.2 * (latAbs / 90);
    } else {
      const hotspot = item as ClimateRegion;
      if (hotspot.id === 'arctic-sea-ice') { base = -16.5; rate = 0.78; multiplier = 2.8; }
      else if (hotspot.id === 'greenland-ice-sheet') { base = -18.2; rate = 0.81; multiplier = 2.9; }
      else if (hotspot.id === 'antarctic-pine-island') { base = -24.8; rate = 0.64; multiplier = 2.3; }
      else if (hotspot.id === 'tibetan-plateau') { base = 1.5; rate = 0.53; multiplier = 1.9; }
      else if (hotspot.id === 'sahara-sahel') { base = 28.5; rate = 0.45; multiplier = 1.6; }
      else if (hotspot.id === 'amazon-basin') { base = 26.2; rate = 0.38; multiplier = 1.35; }
      else if (hotspot.id === 'great-barrier-reef') { base = 26.8; rate = 0.36; multiplier = 1.3; }
      else if (hotspot.id === 'north-atlantic-sst') { base = 12.4; rate = 0.39; multiplier = 1.4; }
      else if (hotspot.id === 'california-sierra') { base = 14.8; rate = 0.42; multiplier = 1.5; }
      else if (hotspot.id === 'lake-chad-basin') { base = 28.0; rate = 0.39; multiplier = 1.4; }
      else {
        const latAbs = Math.abs(hotspot.lat);
        base = Number((27 - 44 * Math.pow(Math.sin((latAbs * Math.PI) / 180), 1.8)).toFixed(1));
        rate = Number((0.28 * (1.0 + 1.3 * (latAbs / 90))).toFixed(2));
      }
    }

    const locProfile = { lat: item.lat, baselineTempC: base, warmingRateDecadeC: rate, warmingMultiplier: multiplier };

    const prevData = calculateMonthlyTemperature(locProfile, year, prevMonth);
    const newData = calculateMonthlyTemperature(locProfile, year, newMonth);
    const pastData = calculateMonthlyTemperature(locProfile, 2000, newMonth);
    const presentData = calculateMonthlyTemperature(locProfile, 2026, newMonth);
    const predData = calculateMonthlyTemperature(locProfile, 2040, newMonth);

    const diffC = Number((newData.monthlyTempC - prevData.monthlyTempC).toFixed(1));
    const flagEmoji = (item as { flagEmoji?: string }).flagEmoji;

    let diffText = '';
    if (diffC > 0) {
      diffText = `${diffC} degrees warmer than ${prevMonthName}`;
    } else if (diffC < 0) {
      diffText = `${Math.abs(diffC)} degrees cooler than ${prevMonthName}`;
    } else {
      diffText = `identical to ${prevMonthName}`;
    }

    const spokenText = `In ${item.name}, for ${monthName}: the average temperature is ${newData.monthlyTempC} degrees Celsius, which is ${diffText}. In the past in the year 2000, it was ${pastData.monthlyTempC} degrees. In the present in 2026, it is ${presentData.monthlyTempC} degrees. And the AI prediction for 2040 reaches ${predData.monthlyTempC} degrees Celsius.`;

    return {
      text: spokenText,
      locationName: item.name,
      flagEmoji,
      month: newMonth,
      prevMonth,
      tempC: newData.monthlyTempC,
      diffC,
      pastTempC: pastData.monthlyTempC,
      presentTempC: presentData.monthlyTempC,
      predTempC: predData.monthlyTempC,
      isSpeaking: false,
    };
  }

  // Fallback: Global Earth Telemetry
  const globalAnomaly = getGlobalMeanAnomaly(year);
  const globalBase = 14.0;
  // Global seasonal swing: Northern hemisphere dominant landmass creates peak in July (+3.2°C) vs Jan (-3.2°C)
  const monthAngle = ((newMonth - 7) / 12) * 2 * Math.PI;
  const prevMonthAngle = ((prevMonth - 7) / 12) * 2 * Math.PI;
  const seasonalSwing = Number((3.2 * Math.cos(monthAngle)).toFixed(1));
  const prevSeasonalSwing = Number((3.2 * Math.cos(prevMonthAngle)).toFixed(1));

  const newTempC = Number((globalBase + seasonalSwing + globalAnomaly).toFixed(1));
  const prevTempC = Number((globalBase + prevSeasonalSwing + globalAnomaly).toFixed(1));
  const diffC = Number((newTempC - prevTempC).toFixed(1));

  const pastAnomaly = getGlobalMeanAnomaly(2000);
  const presentAnomaly = getGlobalMeanAnomaly(2026);
  const predAnomaly = getGlobalMeanAnomaly(2040);

  const pastTempC = Number((globalBase + seasonalSwing + pastAnomaly).toFixed(1));
  const presentTempC = Number((globalBase + seasonalSwing + presentAnomaly).toFixed(1));
  const predTempC = Number((globalBase + seasonalSwing + predAnomaly).toFixed(1));

  let diffText = '';
  if (diffC > 0) {
    diffText = `${diffC} degrees warmer than ${prevMonthName}`;
  } else if (diffC < 0) {
    diffText = `${Math.abs(diffC)} degrees cooler than ${prevMonthName}`;
  } else {
    diffText = `the same as ${prevMonthName}`;
  }

  const spokenText = `Planetary Earth average, for ${monthName}: temperature is ${newTempC} degrees Celsius, which is ${diffText}. In the past in 2000 it was ${pastTempC} degrees. In the present in 2026 it is ${presentTempC} degrees. And the 2040 AI prediction reaches ${predTempC} degrees Celsius.`;

  return {
    text: spokenText,
    locationName: 'Global Earth Atmosphere',
    flagEmoji: '🌐',
    month: newMonth,
    prevMonth,
    tempC: newTempC,
    diffC,
    pastTempC,
    presentTempC,
    predTempC,
    isSpeaking: false,
  };
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

// What this does: Uses the browser's built-in speaking voice to read our weather summary out loud when the user presses Listen.
// On the website: Makes the website actually speak the temperature report through the user's speakers.
// Used as: The Play button engine for spoken telemetry.
export function speakUtterance(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (callbacks?.onError) callbacks.onError();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
        v.lang === 'en-US'
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      if (callbacks?.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (callbacks?.onEnd) callbacks.onEnd();
    };

    utterance.onerror = () => {
      activeUtterance = null;
      if (callbacks?.onError) callbacks.onError();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
    if (callbacks?.onError) callbacks.onError();
  }
}

// What this does: Immediately stops the browser's voice from talking.
// On the website: Runs when the user clicks Stop, closes the voice box, or switches to a different month.
// Used as: The mute/stop button engine for spoken voice narration.
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}
