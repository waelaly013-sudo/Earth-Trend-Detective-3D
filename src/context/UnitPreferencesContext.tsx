/**
 * NASA Earth Trend Detective - Measuring Units Context & Provider
 * Manages user selections for measuring units across Temperature, Humidity, and Wind Speed,
 * with persistence in localStorage and live formatting helpers.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  TemperatureUnit,
  HumidityUnit,
  WindSpeedUnit,
  UnitPreferences,
  DEFAULT_UNIT_PREFERENCES,
  formatTemperature,
  formatTemperatureAnomaly,
  formatWarmingRate,
  formatHumidity,
  formatWindSpeed,
  FormatTempOptions,
} from '../utils/measuringUnits';
import { soundFx } from '../utils/audioSynth';

const STORAGE_KEY = 'nasa_earth_measuring_units_v1';

interface UnitPreferencesContextValue {
  preferences: UnitPreferences;
  temperatureUnit: TemperatureUnit;
  humidityUnit: HumidityUnit;
  windSpeedUnit: WindSpeedUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setHumidityUnit: (unit: HumidityUnit) => void;
  setWindSpeedUnit: (unit: WindSpeedUnit) => void;
  resetToDefaults: () => void;
  // Pre-bound formatters
  formatTemp: (tempC: number, options?: FormatTempOptions) => string;
  formatTempDiff: (anomalyC: number, precision?: number) => string;
  formatTempRate: (rateDecadeC: number, precision?: number) => string;
  formatHum: (rhPct: number, tempC?: number) => string;
  formatWind: (speedMs: number, options?: { includeBeaufortDescription?: boolean; compact?: boolean }) => string;
}

const UnitPreferencesContext = createContext<UnitPreferencesContextValue | null>(null);

// What this does: Remembers which measurement units the user likes (Celsius/Fahrenheit, RH%/Dew Point, m/s/mph) and shares them with components.
// On the website: Powers the unit switcher so weather numbers show in the unit the user understands best.
// Used as: The backup/extended measurement-unit state manager.
export const UnitPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // What this does: Loads the user's saved unit choices from browser storage when the page opens.
  // On the website: Keeps your preferred units even if you refresh the page.
  // Used as: Initializer for unit preferences state.
  const [preferences, setPreferences] = useState<UnitPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_UNIT_PREFERENCES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          temperature: parsed.temperature || DEFAULT_UNIT_PREFERENCES.temperature,
          humidity: parsed.humidity || DEFAULT_UNIT_PREFERENCES.humidity,
          windSpeed: parsed.windSpeed || DEFAULT_UNIT_PREFERENCES.windSpeed,
        };
      }
    } catch (e) {
      console.warn('Failed to load measuring units from localStorage', e);
    }
    return DEFAULT_UNIT_PREFERENCES;
  });

  // What this does: Automatically saves the unit settings to browser storage whenever they change.
  // On the website: Makes sure your chosen units stick around next time you visit.
  // Used as: LocalStorage auto-saver.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save measuring units to localStorage', e);
    }
  }, [preferences]);

  // What this does: Plays a click sound and changes the active temperature unit.
  // On the website: Triggered when picking a temperature unit button.
  // Used as: Temperature unit setter.
  const setTemperatureUnit = useCallback((unit: TemperatureUnit) => {
    soundFx.playTick();
    setPreferences((prev) => ({ ...prev, temperature: unit }));
  }, []);

  // What this does: Plays a click sound and changes the active humidity unit.
  // On the website: Triggered when picking a humidity metric.
  // Used as: Humidity unit setter.
  const setHumidityUnit = useCallback((unit: HumidityUnit) => {
    soundFx.playTick();
    setPreferences((prev) => ({ ...prev, humidity: unit }));
  }, []);

  // What this does: Plays a click sound and changes the active wind speed unit.
  // On the website: Triggered when picking a wind unit.
  // Used as: Wind speed unit setter.
  const setWindSpeedUnit = useCallback((unit: WindSpeedUnit) => {
    soundFx.playTick();
    setPreferences((prev) => ({ ...prev, windSpeed: unit }));
  }, []);

  // What this does: Resets all three unit settings back to Celsius, RH%, and m/s.
  // On the website: Triggered by the "Reset Defaults" button.
  // Used as: The default unit reset helper.
  const resetToDefaults = useCallback(() => {
    soundFx.playTick();
    setPreferences(DEFAULT_UNIT_PREFERENCES);
  }, []);

  // What this does: Formats a raw temperature value into text using the saved unit.
  // On the website: Prints readable temperatures inside panels and cards.
  // Used as: Ready-to-use temperature formatter.
  const formatTemp = useCallback(
    (tempC: number, options?: FormatTempOptions) => {
      return formatTemperature(tempC, preferences.temperature, options);
    },
    [preferences.temperature]
  );

  const formatTempDiff = useCallback(
    (anomalyC: number, precision = 2) => {
      return formatTemperatureAnomaly(anomalyC, preferences.temperature, precision);
    },
    [preferences.temperature]
  );

  const formatTempRate = useCallback(
    (rateDecadeC: number, precision = 2) => {
      return formatWarmingRate(rateDecadeC, preferences.temperature, precision);
    },
    [preferences.temperature]
  );

  const formatHum = useCallback(
    (rhPct: number, tempC = 20) => {
      return formatHumidity(rhPct, tempC, preferences.humidity, preferences.temperature);
    },
    [preferences.humidity, preferences.temperature]
  );

  const formatWind = useCallback(
    (speedMs: number, options?: { includeBeaufortDescription?: boolean; compact?: boolean }) => {
      return formatWindSpeed(speedMs, preferences.windSpeed, options);
    },
    [preferences.windSpeed]
  );

  const value = useMemo(
    () => ({
      preferences,
      temperatureUnit: preferences.temperature,
      humidityUnit: preferences.humidity,
      windSpeedUnit: preferences.windSpeed,
      setTemperatureUnit,
      setHumidityUnit,
      setWindSpeedUnit,
      resetToDefaults,
      formatTemp,
      formatTempDiff,
      formatTempRate,
      formatHum,
      formatWind,
    }),
    [
      preferences,
      setTemperatureUnit,
      setHumidityUnit,
      setWindSpeedUnit,
      resetToDefaults,
      formatTemp,
      formatTempDiff,
      formatTempRate,
      formatHum,
      formatWind,
    ]
  );

  return (
    <UnitPreferencesContext.Provider value={value}>
      {children}
    </UnitPreferencesContext.Provider>
  );
};

const DEFAULT_FALLBACK_VALUE: UnitPreferencesContextValue = {
  preferences: DEFAULT_UNIT_PREFERENCES,
  temperatureUnit: 'celsius',
  humidityUnit: 'rh_pct',
  windSpeedUnit: 'ms',
  setTemperatureUnit: () => {},
  setHumidityUnit: () => {},
  setWindSpeedUnit: () => {},
  resetToDefaults: () => {},
  formatTemp: (tempC: number, options?: FormatTempOptions) =>
    formatTemperature(tempC, 'celsius', options),
  formatTempDiff: (anomalyC: number, precision = 1) =>
    formatTemperatureAnomaly(anomalyC, 'celsius', precision),
  formatTempRate: (rateDecadeC: number, precision = 2) =>
    formatWarmingRate(rateDecadeC, 'celsius', precision),
  formatHum: (rhPct: number, tempC = 20) =>
    formatHumidity(rhPct, tempC, 'rh_pct'),
  formatWind: (speedMs: number, options) =>
    formatWindSpeed(speedMs, 'ms', options),
};

// What this does: A simple hook that lets any component read the user's measuring units, or safely fall back to defaults if none are set.
// On the website: Keeps unit formatting working reliably everywhere without crashing.
// Used as: The shortcut hook for UnitPreferencesContext.
export function useMeasuringUnits(): UnitPreferencesContextValue {
  const context = useContext(UnitPreferencesContext);
  return context || DEFAULT_FALLBACK_VALUE;
}

