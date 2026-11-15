/**
 * NASA Earth Trend Detective - Units & Language Context
 * Provides reactive measuring unit selection for Temperature, Wind Speed, and Humidity,
 * bilingual internationalization (English & Arabic), RTL styling synchronization,
 * and high-level conversion helpers.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  TemperatureUnit,
  WindSpeedUnit,
  HumidityUnit,
  AppLanguage,
  UnitPreferences,
} from '../types/units';
import {
  formatTemperature,
  formatTemperatureDelta,
  formatWindSpeed,
  formatHumidityMetric,
  convertTemperature,
  convertTemperatureDelta,
  convertWindSpeed,
  HumidityMetricsInput,
  TEMPERATURE_UNITS,
  WIND_SPEED_UNITS,
  HUMIDITY_UNITS,
} from '../utils/unitConversions';
import { TRANSLATIONS, TranslationKey, getTranslation } from '../i18n/translations';

interface UnitAndLanguageContextType {
  // Language & RTL
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: TranslationKey, fallback?: string) => any;

  // Measuring Units
  tempUnit: TemperatureUnit;
  setTempUnit: (unit: TemperatureUnit) => void;
  windUnit: WindSpeedUnit;
  setWindUnit: (unit: WindSpeedUnit) => void;
  humidityUnit: HumidityUnit;
  setHumidityUnit: (unit: HumidityUnit) => void;
  showDualUnits: boolean;
  setShowDualUnits: (show: boolean) => void;
  toggleDualUnits: () => void;

  // Formatters
  formatTemp: (celsius: number, options?: { showUnit?: boolean; showDual?: boolean; decimals?: number; showSign?: boolean; isDelta?: boolean }) => string;
  formatTempDelta: (celsiusDelta: number, options?: { showUnit?: boolean; showDual?: boolean; decimals?: number; showSign?: boolean }) => string;
  formatWind: (ms: number, options?: { showUnit?: boolean; showDual?: boolean; decimals?: number }) => string;
  formatHum: (metrics: HumidityMetricsInput, options?: { showUnit?: boolean; showDual?: boolean; decimals?: number; customUnit?: HumidityUnit }) => { value: string; unitSymbol: string; formatted: string; secondaryFormatted?: string };

  // Raw Converters
  convertTemp: (celsius: number, targetUnit?: TemperatureUnit) => number;
  convertTempDelta: (celsiusDelta: number, targetUnit?: TemperatureUnit) => number;
  convertWind: (ms: number, targetUnit?: WindSpeedUnit) => number;

  // Active Symbol Getters
  tempSymbol: string;
  windSymbol: string;
  humiditySymbol: string;
}

const STORAGE_KEY_UNITS = 'nasa_earth_unit_prefs_v2';
const STORAGE_KEY_LANG = 'nasa_earth_lang_v2';

const UnitAndLanguageContext = createContext<UnitAndLanguageContextType | undefined>(undefined);

// What this does: Shares the current language (English or Arabic) and chosen measurement units (°C/°F, m/s/mph, RH%) with the entire app.
// On the website: Makes every number and word update instantly when you change the unit or switch between English and Arabic.
// Used as: The global translator and unit converter brain.
export const UnitAndLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // What this does: Loads the user's saved language ('en' or 'ar') from browser memory, defaulting to English.
  // On the website: Decides if menus and buttons appear in English or Arabic.
  // Used as: The active language state.
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'en' || saved === 'ar') return saved;
    }
    return 'en';
  });

  // What this does: Loads the saved temperature unit (Celsius, Fahrenheit, Kelvin, or Rankine).
  // On the website: Controls how temperatures are displayed in the header, charts, and country cards.
  // Used as: The temperature unit state.
  const [tempUnit, setTempUnitState] = useState<TemperatureUnit>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_UNITS}_temp`);
      if (saved === 'celsius' || saved === 'fahrenheit' || saved === 'kelvin' || saved === 'rankine') {
        return saved;
      }
    }
    return 'celsius';
  });

  // What this does: Loads the saved wind speed unit (m/s, km/h, mph, knots, Beaufort, or ft/s).
  // On the website: Controls how wind numbers appear on the site.
  // Used as: The wind unit state.
  const [windUnit, setWindUnitState] = useState<WindSpeedUnit>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_UNITS}_wind`);
      if (saved === 'ms' || saved === 'kmh' || saved === 'mph' || saved === 'knots' || saved === 'beaufort' || saved === 'fts') {
        return saved;
      }
    }
    return 'ms';
  });

  // What this does: Loads the saved humidity unit (Relative Humidity %, Dew Point, Specific Humidity, VPD, or Absolute Humidity).
  // On the website: Controls which moisture unit is shown when looking at humidity data.
  // Used as: The humidity unit state.
  const [humidityUnit, setHumidityUnitState] = useState<HumidityUnit>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_UNITS}_humidity`);
      if (saved === 'relative_humidity' || saved === 'dew_point' || saved === 'specific_humidity' || saved === 'vpd' || saved === 'absolute_humidity') {
        return saved;
      }
    }
    return 'relative_humidity';
  });

  // What this does: Remembers if the user wants to see two units side-by-side (like 20°C / 68°F).
  // On the website: Shows a helpful second unit right next to the primary number so everyone understands it.
  // Used as: The dual-unit display switch.
  const [showDualUnits, setShowDualUnitsState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_UNITS}_dual`);
      if (saved !== null) return saved === 'true';
    }
    return true; // Default to true so user immediately sees both units (e.g. Celsius & Fahrenheit) as requested!
  });

  const isRTL = language === 'ar';

  // What this does: Flips the browser page direction between left-to-right (English) and right-to-left (Arabic).
  // On the website: Makes Arabic text flow properly from right to left across screens and menus.
  // Used as: The HTML page direction synchronizer.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, isRTL]);

  // What this does: Sets a specific language and saves it to browser storage.
  // On the website: Changes the interface language to English or Arabic.
  // Used as: Direct language setter.
  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LANG, newLang);
    }
  }, []);

  // What this does: Swaps between English and Arabic in one click.
  // On the website: Triggered by the Language button (globe/translate logo) in the top bar.
  // Used as: The quick language toggle button handler.
  const toggleLanguage = useCallback(() => {
    setLanguageState((prev: AppLanguage) => {
      const next: AppLanguage = prev === 'en' ? 'ar' : 'en';
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LANG, next);
      }
      return next;
    });
  }, []);

  // What this does: Saves the user's chosen temperature unit (°C, °F, K, °R).
  // On the website: Updates temperature readings everywhere after choosing in the Units modal.
  // Used as: Temperature unit setter.
  const setTempUnit = useCallback((u: TemperatureUnit) => {
    setTempUnitState(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_UNITS}_temp`, u);
    }
  }, []);

  // What this does: Saves the user's chosen wind speed unit.
  // On the website: Updates wind speeds everywhere after choosing in the Units modal.
  // Used as: Wind unit setter.
  const setWindUnit = useCallback((u: WindSpeedUnit) => {
    setWindUnitState(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_UNITS}_wind`, u);
    }
  }, []);

  // What this does: Saves the user's chosen humidity unit.
  // On the website: Updates humidity values everywhere after choosing in the Units modal.
  // Used as: Humidity unit setter.
  const setHumidityUnit = useCallback((u: HumidityUnit) => {
    setHumidityUnitState(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_UNITS}_humidity`, u);
    }
  }, []);

  // What this does: Turns dual-unit display on or off and saves it.
  // On the website: Shows or hides the extra converted unit next to numbers.
  // Used as: Dual-unit setter.
  const setShowDualUnits = useCallback((show: boolean) => {
    setShowDualUnitsState(show);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_UNITS}_dual`, String(show));
    }
  }, []);

  // What this does: Flips dual-unit mode on or off in one click.
  // On the website: Triggered by the "Show Dual Units" switch inside the Units modal.
  // Used as: Dual-unit toggle button handler.
  const toggleDualUnits = useCallback(() => {
    setShowDualUnitsState((prev: boolean) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_UNITS}_dual`, String(next));
      }
      return next;
    });
  }, []);

  // What this does: Looks up the English or Arabic word/sentence for a given label key.
  // On the website: Shows translated button labels and titles in the user's chosen language.
  // Used as: The `t('...')` translation helper across components.
  const t = useCallback(
    (key: TranslationKey, fallback?: string): any => {
      const res = getTranslation(language, key);
      return res !== undefined ? res : fallback ?? key;
    },
    [language]
  );

  // What this does: Turns a raw Celsius temperature into a pretty text string in the user's chosen unit (like "75.2°F").
  // On the website: Used for every temperature badge and chart label on screen.
  // Used as: The global temperature text formatter.
  const formatTemp = useCallback(
    (
      celsius: number,
      options: {
        showUnit?: boolean;
        showDual?: boolean;
        decimals?: number;
        showSign?: boolean;
        isDelta?: boolean;
      } = {}
    ) => {
      return formatTemperature(celsius, tempUnit, {
        showUnit: options.showUnit ?? true,
        showDual: options.showDual ?? showDualUnits,
        decimals: options.decimals ?? 1,
        showSign: options.showSign ?? false,
        isDelta: options.isDelta ?? false,
        lang: language,
      });
    },
    [tempUnit, showDualUnits, language]
  );

  // What this does: Formats a temperature CHANGE (like "+1.4°C warming") cleanly without shifting Kelvin/Fahrenheit zero points.
  // On the website: Displays how much hotter or cooler a place became compared to historical baselines.
  // Used as: The anomaly/change formatter.
  const formatTempDelta = useCallback(
    (
      celsiusDelta: number,
      options: {
        showUnit?: boolean;
        showDual?: boolean;
        decimals?: number;
        showSign?: boolean;
      } = {}
    ) => {
      return formatTemperature(celsiusDelta, tempUnit, {
        showUnit: options.showUnit ?? true,
        showDual: options.showDual ?? showDualUnits,
        decimals: options.decimals ?? 1,
        showSign: options.showSign ?? true,
        isDelta: true,
        lang: language,
      });
    },
    [tempUnit, showDualUnits, language]
  );

  // What this does: Formats a wind speed (from m/s) into the user's chosen unit like km/h, mph, or knots.
  // On the website: Displays readable wind speeds in the top bar, globe, and country details.
  // Used as: The global wind speed formatter.
  const formatWind = useCallback(
    (
      ms: number,
      options: {
        showUnit?: boolean;
        showDual?: boolean;
        decimals?: number;
      } = {}
    ) => {
      return formatWindSpeed(ms, windUnit, {
        showUnit: options.showUnit ?? true,
        showDual: options.showDual ?? showDualUnits,
        decimals: options.decimals ?? 1,
        lang: language,
      });
    },
    [windUnit, showDualUnits, language]
  );

  // What this does: Formats humidity numbers into RH%, Dew Point, Specific Humidity, or Vapor Pressure Deficit.
  // On the website: Shows readable moisture numbers in the sidebar and header when Humidity mode is active.
  // Used as: The global humidity formatter.
  const formatHum = useCallback(
    (
      metrics: HumidityMetricsInput,
      options: {
        showUnit?: boolean;
        showDual?: boolean;
        decimals?: number;
        customUnit?: HumidityUnit;
      } = {}
    ) => {
      return formatHumidityMetric(metrics, options.customUnit || humidityUnit, tempUnit, {
        showUnit: options.showUnit ?? true,
        showDual: options.showDual ?? showDualUnits,
        decimals: options.decimals ?? 1,
        lang: language,
      });
    },
    [humidityUnit, tempUnit, showDualUnits, language]
  );

  // What this does: Converts a Celsius number into a plain numeric value in the target unit (good for charts).
  // On the website: Feeds converted numbers directly into graph lines and axes.
  // Used as: Raw numeric temperature converter.
  const convertTemp = useCallback(
    (celsius: number, targetUnit?: TemperatureUnit) => {
      return convertTemperature(celsius, targetUnit || tempUnit);
    },
    [tempUnit]
  );

  // What this does: Converts a Celsius difference (delta) into a plain number in the target unit.
  // On the website: Keeps chart y-axes accurate when viewing warming trends in °F or K.
  // Used as: Raw numeric temperature-change converter.
  const convertTempDelta = useCallback(
    (celsiusDelta: number, targetUnit?: TemperatureUnit) => {
      return convertTemperatureDelta(celsiusDelta, targetUnit || tempUnit);
    },
    [tempUnit]
  );

  // What this does: Converts wind speed from m/s into a plain number in the user's chosen wind unit.
  // On the website: Used by wind speed graphs so curves match the selected unit.
  // Used as: Raw numeric wind converter.
  const convertWind = useCallback(
    (ms: number, targetUnit?: WindSpeedUnit) => {
      return convertWindSpeed(ms, targetUnit || windUnit);
    },
    [windUnit]
  );

  const tempSymbol = (TEMPERATURE_UNITS.find((u) => u.id === tempUnit) || TEMPERATURE_UNITS[0]).symbol;
  const windSymbol = (WIND_SPEED_UNITS.find((u) => u.id === windUnit) || WIND_SPEED_UNITS[0]).symbol;
  const humiditySymbol = (HUMIDITY_UNITS.find((u) => u.id === humidityUnit) || HUMIDITY_UNITS[0]).symbol;

  return (
    <UnitAndLanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isRTL,
        t,
        tempUnit,
        setTempUnit,
        windUnit,
        setWindUnit,
        humidityUnit,
        setHumidityUnit,
        showDualUnits,
        setShowDualUnits,
        toggleDualUnits,
        formatTemp,
        formatTempDelta,
        formatWind,
        formatHum,
        convertTemp,
        convertTempDelta,
        convertWind,
        tempSymbol,
        windSymbol,
        humiditySymbol,
      }}
    >
      {children}
    </UnitAndLanguageContext.Provider>
  );
};

// What this does: A quick hook that lets any component grab the current language, translation helper, and unit formatters.
// On the website: Keeps all visible labels and weather numbers synchronized across every open window.
// Used as: The easy hook to read UnitAndLanguageContext.
export const useUnitsAndLanguage = () => {
  const context = useContext(UnitAndLanguageContext);
  if (!context) {
    throw new Error('useUnitsAndLanguage must be used within a UnitAndLanguageProvider');
  }
  return context;
};
