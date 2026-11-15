/**
 * NASA Earth Trend Detective - Measuring Units & Internationalization Types
 */

// What this does: Lists the supported temperature scales (Celsius, Fahrenheit, Kelvin, Rankine).
// On the website: Controls how temperature numbers and symbols are shown across cards and headers.
// Used as: The allowed values for the user's temperature unit setting.
export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin' | 'rankine';

// What this does: Lists the supported wind speed measurement scales.
// On the website: Controls whether wind speeds appear in m/s, km/h, mph, knots, Beaufort scale, or ft/s.
// Used as: The allowed values for the user's wind speed unit setting.
export type WindSpeedUnit = 'ms' | 'kmh' | 'mph' | 'knots' | 'beaufort' | 'fts';

// What this does: Lists the five supported ways to express atmospheric moisture/humidity.
// On the website: Switches humidity displays between % RH, Dew Point, Specific Humidity, VPD, and Absolute Humidity.
// Used as: The allowed values for the user's humidity unit setting.
export type HumidityUnit =
  | 'relative_humidity' // % RH
  | 'dew_point'          // Dew Point in active temp unit
  | 'specific_humidity'  // g/kg
  | 'vpd'                // Vapor Pressure Deficit in kPa
  | 'absolute_humidity'; // g/m³

// What this does: Lists the supported interface languages (English and Arabic).
// On the website: Switches UI text and layout direction between English and Arabic.
// Used as: The language code in unit and language preferences.
export type AppLanguage = 'en' | 'ar';

// What this does: Describes a single unit option card with English/Arabic names, symbol, and explanation.
// On the website: Renders each selectable unit button inside unit selector dialogs.
// Used as: A generic template for temperature, wind, and humidity option lists.
export interface UnitOption<T extends string> {
  id: T;
  symbol: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isSI?: boolean;
}

// What this does: Bundles the user's chosen temperature, wind, humidity, dual-display, and language preferences.
// On the website: Keeps every number and label across the app formatted in the user's preferred units.
// Used as: The state shape stored by the UnitAndLanguageContext provider.
export interface UnitPreferences {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  humidity: HumidityUnit;
  showDualUnits: boolean; // E.g., show Celsius AND Fahrenheit simultaneously
  language: AppLanguage;
}
