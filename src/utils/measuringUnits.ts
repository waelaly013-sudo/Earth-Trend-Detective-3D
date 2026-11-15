/**
 * NASA Earth Trend Detective - Measuring Units Engine
 * 
 * Comprehensive unit conversions, formats, and descriptors for:
 * 1. Temperature: Celsius (°C), Fahrenheit (°F), Kelvin (K), Dual (°C & °F)
 * 2. Humidity: Relative Humidity (% RH), Dew Point (Td in °C/°F), Specific Humidity (g/kg),
 *              Absolute Humidity (g/m³), Vapor Pressure (kPa), Dual (% RH & Td)
 * 3. Wind Speed: km/h, m/s (SI), mph (Imperial), knots (Aviation/Nautical),
 *                Beaufort Wind Scale (Bft 0-12), Dual (km/h & mph)
 */

export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin' | 'dual_c_f';
export type HumidityUnit = 'rh_pct' | 'dew_point' | 'specific_humidity' | 'absolute_humidity' | 'vapor_pressure' | 'dual_rh_dew';
export type WindSpeedUnit = 'kmh' | 'ms' | 'mph' | 'knots' | 'beaufort' | 'dual_kmh_mph';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  humidity: HumidityUnit;
  windSpeed: WindSpeedUnit;
}

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  temperature: 'celsius',
  humidity: 'rh_pct',
  windSpeed: 'kmh',
};

// ============================================================================
// 1. TEMPERATURE CONVERSIONS
// ============================================================================

// What this does: Converts Celsius to Fahrenheit.
// On the website: Helps show °F numbers when the user wants Fahrenheit.
// Used as: Quick °C -> °F math helper.
export function celsiusToFahrenheit(c: number): number {
  return Number(((c * 9) / 5 + 32).toFixed(1));
}

// What this does: Converts Celsius to Kelvin (science scale).
// On the website: Displays Kelvin temperatures when K mode is selected.
// Used as: Quick °C -> K math helper.
export function celsiusToKelvin(c: number): number {
  return Number((c + 273.15).toFixed(2));
}

// What this does: Converts Fahrenheit back to Celsius.
// Used as: Reverse °F -> °C math helper.
export function fahrenheitToCelsius(f: number): number {
  return Number((((f - 32) * 5) / 9).toFixed(1));
}

// What this does: Converts Kelvin back to Celsius.
// Used as: Reverse K -> °C math helper.
export function kelvinToCelsius(k: number): number {
  return Number((k - 273.15).toFixed(1));
}

// What this does: Converts a temperature change (in °C) into the equivalent Fahrenheit change (1°C = 1.8°F).
// On the website: Keeps warming-rate numbers accurate in Fahrenheit.
// Used as: Warming-change delta helper.
export function celsiusDeltaToFahrenheit(deltaC: number): number {
  return Number((deltaC * 1.8).toFixed(2));
}

export interface FormatTempOptions {
  precision?: number;
  showSign?: boolean;
  compact?: boolean;
}

// What this does: Formats a temperature into a clean string like "25.0°C", "77.0°F", or "25.0°C (77.0°F)".
// On the website: Prints readable temperature labels inside unit-aware cards.
// Used as: Temperature text formatter for UnitPreferencesContext.
export function formatTemperature(
  tempC: number,
  unit: TemperatureUnit = 'celsius',
  options: FormatTempOptions = {}
): string {
  const { precision = 1, showSign = false } = options;
  const signStr = (val: number) => (showSign && val > 0 ? '+' : '');

  switch (unit) {
    case 'fahrenheit': {
      const f = (tempC * 9) / 5 + 32;
      return `${signStr(f)}${f.toFixed(precision)}°F`;
    }
    case 'kelvin': {
      const k = tempC + 273.15;
      return `${signStr(k)}${k.toFixed(precision)} K`;
    }
    case 'dual_c_f': {
      const f = (tempC * 9) / 5 + 32;
      return `${signStr(tempC)}${tempC.toFixed(precision)}°C (${signStr(f)}${f.toFixed(precision)}°F)`;
    }
    case 'celsius':
    default:
      return `${signStr(tempC)}${tempC.toFixed(precision)}°C`;
  }
}

// What this does: Formats how many degrees warmer/cooler a place is compared to normal, with a + or - sign.
// On the website: Shows temperature anomaly badges in the user's chosen unit.
// Used as: Anomaly text formatter.
export function formatTemperatureAnomaly(
  anomalyC: number,
  unit: TemperatureUnit = 'celsius',
  precision = 2
): string {
  const sign = anomalyC >= 0 ? '+' : '';
  const fDiff = anomalyC * 1.8;
  const fSign = fDiff >= 0 ? '+' : '';

  switch (unit) {
    case 'fahrenheit':
      return `${fSign}${fDiff.toFixed(precision)}°F`;
    case 'kelvin':
      return `${sign}${anomalyC.toFixed(precision)} K`;
    case 'dual_c_f':
      return `${sign}${anomalyC.toFixed(precision)}°C (${fSign}${fDiff.toFixed(precision)}°F)`;
    case 'celsius':
    default:
      return `${sign}${anomalyC.toFixed(precision)}°C`;
  }
}

// What this does: Formats how fast a place is warming per 10 years (decade).
// On the website: Shows "Warming Rate / Decade" numbers on location cards.
// Used as: Decadal warming-rate text formatter.
export function formatWarmingRate(
  rateDecadeC: number,
  unit: TemperatureUnit = 'celsius',
  precision = 2
): string {
  const sign = rateDecadeC >= 0 ? '+' : '';
  const fDiff = rateDecadeC * 1.8;
  const fSign = fDiff >= 0 ? '+' : '';

  switch (unit) {
    case 'fahrenheit':
      return `${fSign}${fDiff.toFixed(precision)}°F/dec`;
    case 'kelvin':
      return `${sign}${rateDecadeC.toFixed(precision)} K/dec`;
    case 'dual_c_f':
      return `${sign}${rateDecadeC.toFixed(precision)}°C/dec (${fSign}${fDiff.toFixed(precision)}°F/dec)`;
    case 'celsius':
    default:
      return `${sign}${rateDecadeC.toFixed(precision)}°C/dec`;
  }
}

// ============================================================================
// 2. ATMOSPHERIC HUMIDITY CONVERSIONS
// ============================================================================

// What this does: Calculates the Dew Point temperature (the temperature where air moisture turns into dew/fog).
// On the website: Shows the Dew Point reading when inspecting humidity.
// Used as: Dew Point math formula.
export function calculateDewPoint(tempC: number, rhPct: number): number {
  const clampedRH = Math.max(0.5, Math.min(100, rhPct));
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(clampedRH / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Number(dewPoint.toFixed(1));
}

// What this does: Calculates how many grams of water are in each kilogram of air (Specific Humidity).
// On the website: Displays g/kg moisture numbers in detailed humidity mode.
// Used as: Specific humidity math helper.
export function calculateSpecificHumidity(tempC: number, rhPct: number, pressureHpa = 1013.25): number {
  const clampedRH = Math.max(0.5, Math.min(100, rhPct));
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  const e = es * (clampedRH / 100);
  const q = (622 * e) / (pressureHpa - 0.378 * e);
  return Number(Math.max(0.1, q).toFixed(1));
}

// What this does: Calculates how many grams of water vapor exist in one cubic meter of air (Absolute Humidity).
// On the website: Displays g/m³ moisture density.
// Used as: Absolute humidity math helper.
export function calculateAbsoluteHumidity(tempC: number, rhPct: number): number {
  const clampedRH = Math.max(0.5, Math.min(100, rhPct));
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  const pv = es * (clampedRH / 100);
  const ah = (216.7 * pv) / (tempC + 273.15);
  return Number(Math.max(0.1, ah).toFixed(1));
}

// What this does: Calculates actual water vapor pressure in kilopascals (kPa).
// On the website: Helps measure drying stress in the air.
// Used as: Vapor pressure math helper.
export function calculateVaporPressure(tempC: number, rhPct: number): number {
  const clampedRH = Math.max(0.5, Math.min(100, rhPct));
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5)); // hPa
  const pvHpa = es * (clampedRH / 100);
  const pvKpa = pvHpa / 10;
  return Number(Math.max(0.01, pvKpa).toFixed(2));
}

// What this does: Turns a relative humidity % into the user's chosen humidity label (% RH, Dew Point, g/kg, g/m³, or kPa).
// On the website: Prints readable humidity labels in unit-aware cards.
// Used as: Humidity text formatter.
export function formatHumidity(
  rhPct: number,
  tempC = 20,
  unit: HumidityUnit = 'rh_pct',
  tempUnit: TemperatureUnit = 'celsius'
): string {
  switch (unit) {
    case 'dew_point': {
      const dewC = calculateDewPoint(tempC, rhPct);
      if (tempUnit === 'fahrenheit') {
        const dewF = (dewC * 9) / 5 + 32;
        return `${dewF.toFixed(1)}°F Td`;
      } else if (tempUnit === 'kelvin') {
        return `${(dewC + 273.15).toFixed(1)} K Td`;
      }
      return `${dewC.toFixed(1)}°C Td`;
    }
    case 'specific_humidity': {
      const q = calculateSpecificHumidity(tempC, rhPct);
      return `${q} g/kg`;
    }
    case 'absolute_humidity': {
      const ah = calculateAbsoluteHumidity(tempC, rhPct);
      return `${ah} g/m³`;
    }
    case 'vapor_pressure': {
      const vp = calculateVaporPressure(tempC, rhPct);
      return `${vp} kPa`;
    }
    case 'dual_rh_dew': {
      const dewC = calculateDewPoint(tempC, rhPct);
      if (tempUnit === 'fahrenheit') {
        const dewF = (dewC * 9) / 5 + 32;
        return `${rhPct.toFixed(1)}% RH (Td ${dewF.toFixed(1)}°F)`;
      }
      return `${rhPct.toFixed(1)}% RH (Td ${dewC.toFixed(1)}°C)`;
    }
    case 'rh_pct':
    default:
      return `${rhPct.toFixed(1)}% RH`;
  }
}

// ============================================================================
// 3. SURFACE WIND SPEED CONVERSIONS
// ============================================================================

// What this does: Quick math helpers to convert wind speed between m/s, km/h, mph, and nautical knots.
// On the website: Powers wind speed conversions inside panels and simulators.
// Used as: Wind speed unit math helpers.
export function msToKmh(ms: number): number {
  return Number((ms * 3.6).toFixed(1));
}

export function msToMph(ms: number): number {
  return Number((ms * 2.23694).toFixed(1));
}

export function msToKnots(ms: number): number {
  return Number((ms * 1.94384).toFixed(1));
}

export function kmhToMs(kmh: number): number {
  return Number((kmh / 3.6).toFixed(1));
}

export function kmhToMph(kmh: number): number {
  return Number((kmh * 0.621371).toFixed(1));
}

export function kmhToKnots(kmh: number): number {
  return Number((kmh * 0.539957).toFixed(1));
}

export interface BeaufortInfo {
  force: number;
  label: string;
  description: string;
  seaConditions: string;
}

// What this does: Maps a wind speed in m/s to a Beaufort wind force level (0 = Calm up to 12 = Hurricane) and describes sea/land conditions.
// On the website: Shows friendly descriptions like "Moderate Breeze" next to raw wind speeds.
// Used as: The Beaufort wind description lookup.
export function msToBeaufort(ms: number): BeaufortInfo {
  if (ms < 0.3) {
    return { force: 0, label: 'Calm', description: 'Smoke rises vertically', seaConditions: 'Mirror flat' };
  } else if (ms <= 1.5) {
    return { force: 1, label: 'Light Air', description: 'Smoke drift indicates wind direction', seaConditions: 'Ripples with appearance of scales' };
  } else if (ms <= 3.3) {
    return { force: 2, label: 'Light Breeze', description: 'Wind felt on face; leaves rustle', seaConditions: 'Small wavelets; crests have glassy appearance' };
  } else if (ms <= 5.4) {
    return { force: 3, label: 'Gentle Breeze', description: 'Leaves in constant motion; light flags extend', seaConditions: 'Large wavelets; scattered whitecaps' };
  } else if (ms <= 7.9) {
    return { force: 4, label: 'Moderate Breeze', description: 'Raises dust and loose paper; small branches move', seaConditions: 'Small waves becoming longer; fairly frequent white horses' };
  } else if (ms <= 10.7) {
    return { force: 5, label: 'Fresh Breeze', description: 'Small trees in leaf begin to sway', seaConditions: 'Moderate waves; many white horses; some spray' };
  } else if (ms <= 13.8) {
    return { force: 6, label: 'Strong Breeze', description: 'Large branches in motion; whistling in telephone wires', seaConditions: 'Large waves begin to form; extensive white foam crests' };
  } else if (ms <= 17.1) {
    return { force: 7, label: 'Near Gale', description: 'Whole trees in motion; inconvenience walking against wind', seaConditions: 'Sea heaps up; white foam from breaking waves blows in streaks' };
  } else if (ms <= 20.7) {
    return { force: 8, label: 'Gale', description: 'Twigs break off trees; generally impedes progress', seaConditions: 'Moderately high waves of greater length; crests break into spindrift' };
  } else if (ms <= 24.4) {
    return { force: 9, label: 'Strong Gale', description: 'Slight structural damage occurs (chimney pots and slates removed)', seaConditions: 'High waves; dense streaks of foam; wave crests tumble and roll' };
  } else if (ms <= 28.4) {
    return { force: 10, label: 'Storm', description: 'Seldom experienced inland; trees uprooted', seaConditions: 'Very high waves with long overhanging crests' };
  } else if (ms <= 32.6) {
    return { force: 11, label: 'Violent Storm', description: 'Widespread structural damage', seaConditions: 'Exceptionally high waves; small-medium ships lost to view behind waves' };
  } else {
    return { force: 12, label: 'Hurricane Force', description: 'Devastating destruction', seaConditions: 'Air filled with foam and spray; sea completely white with driving spray' };
  }
}

// What this does: Turns a wind speed into a readable label using the selected unit (m/s, km/h, mph, knots, or Beaufort).
// On the website: Prints readable wind labels across unit-aware panels.
// Used as: Wind speed text formatter.
export function formatWindSpeed(
  speedMs: number,
  unit: WindSpeedUnit = 'kmh',
  options: { includeBeaufortDescription?: boolean; compact?: boolean } = {}
): string {
  const { includeBeaufortDescription = false } = options;

  switch (unit) {
    case 'ms':
      return `${speedMs.toFixed(1)} m/s`;
    case 'mph': {
      const mph = msToMph(speedMs);
      return `${mph.toFixed(1)} mph`;
    }
    case 'knots': {
      const kn = msToKnots(speedMs);
      return `${kn.toFixed(1)} kn`;
    }
    case 'beaufort': {
      const b = msToBeaufort(speedMs);
      return includeBeaufortDescription
        ? `Force ${b.force} (${b.label})`
        : `Bft ${b.force}`;
    }
    case 'dual_kmh_mph': {
      const kmh = msToKmh(speedMs);
      const mph = msToMph(speedMs);
      return `${kmh.toFixed(1)} km/h (${mph.toFixed(1)} mph)`;
    }
    case 'kmh':
    default: {
      const kmh = msToKmh(speedMs);
      return `${kmh.toFixed(1)} km/h`;
    }
  }
}

// ============================================================================
// UNIT SELECTOR LABELS & DESCRIPTIONS
// ============================================================================

export interface UnitOption<T> {
  id: T;
  label: string;
  shortLabel: string;
  badge: string;
  system: string;
  description: string;
}

export const TEMPERATURE_UNIT_OPTIONS: UnitOption<TemperatureUnit>[] = [
  {
    id: 'celsius',
    label: 'Celsius (°C)',
    shortLabel: '°C',
    badge: 'Metric / SI',
    system: 'International Metric Standard',
    description: 'Freezing point of water at 0°C, boiling at 100°C. Standard for scientific IPCC reports.',
  },
  {
    id: 'fahrenheit',
    label: 'Fahrenheit (°F)',
    shortLabel: '°F',
    badge: 'Imperial / US',
    system: 'US Customary & UK Imperial',
    description: 'Freezing point of water at 32°F, boiling at 212°F. High human-perceptual resolution.',
  },
  {
    id: 'kelvin',
    label: 'Kelvin (K)',
    shortLabel: 'K',
    badge: 'Thermodynamic SI',
    system: 'SI Base Physical Unit',
    description: 'Absolute temperature scale starting at absolute zero (0 K = -273.15°C). Used in radiative transfer physics.',
  },
  {
    id: 'dual_c_f',
    label: 'Dual Display (°C & °F)',
    shortLabel: '°C & °F',
    badge: 'Side-by-Side',
    system: 'Comprehensive Dual View',
    description: 'Shows both Celsius and Fahrenheit side-by-side (e.g., 24.5°C / 76.1°F) for instant cross-reference.',
  },
];

export const HUMIDITY_UNIT_OPTIONS: UnitOption<HumidityUnit>[] = [
  {
    id: 'rh_pct',
    label: 'Relative Humidity (% RH)',
    shortLabel: '% RH',
    badge: 'Meteorological',
    system: 'Saturation Fraction',
    description: 'Ratio of water vapor pressure to equilibrium saturation vapor pressure at current ambient temperature.',
  },
  {
    id: 'dew_point',
    label: 'Dew Point Temperature (Td)',
    shortLabel: 'Dew Point',
    badge: 'Condensation',
    system: 'Thermal Saturation Datum',
    description: 'Temperature to which air must be cooled to become fully saturated with water vapor. Absolute indicator of human mugginess.',
  },
  {
    id: 'specific_humidity',
    label: 'Specific Humidity (g/kg)',
    shortLabel: 'g/kg',
    badge: 'Mass Ratio',
    system: 'Clausius-Clapeyron Mass',
    description: 'Grams of pure water vapor per kilogram of moist air. Conserved during vertical convective air parcels.',
  },
  {
    id: 'absolute_humidity',
    label: 'Absolute Humidity (g/m³)',
    shortLabel: 'g/m³',
    badge: 'Vapor Density',
    system: 'Volumetric Density',
    description: 'Total mass of water vapor present in a given volume of atmospheric air.',
  },
  {
    id: 'vapor_pressure',
    label: 'Vapor Pressure (kPa)',
    shortLabel: 'kPa',
    badge: 'Partial Pressure',
    system: 'Atmospheric Physics',
    description: 'Partial barometric pressure exerted by water vapor molecules in atmospheric air columns.',
  },
  {
    id: 'dual_rh_dew',
    label: 'Dual Display (% RH & Dew Point)',
    shortLabel: '% RH & Td',
    badge: 'Side-by-Side',
    system: 'Dual Moisture View',
    description: 'Shows Relative Humidity together with Dew Point saturation temperature.',
  },
];

export const WIND_SPEED_UNIT_OPTIONS: UnitOption<WindSpeedUnit>[] = [
  {
    id: 'kmh',
    label: 'Kilometers per Hour (km/h)',
    shortLabel: 'km/h',
    badge: 'Metric Civil',
    system: 'Civil Highway & Weather',
    description: 'Standard civil metric speed unit used worldwide for weather bulletins, storms, and cyclone tracking.',
  },
  {
    id: 'ms',
    label: 'Meters per Second (m/s)',
    shortLabel: 'm/s',
    badge: 'SI Scientific',
    system: 'International SI Physics',
    description: 'Standard base unit for geophysical atmospheric circulation models, anemometers, and NASA satellites.',
  },
  {
    id: 'mph',
    label: 'Miles per Hour (mph)',
    shortLabel: 'mph',
    badge: 'Imperial / US',
    system: 'US & UK Common',
    description: 'Standard imperial velocity unit used in the United States and United Kingdom.',
  },
  {
    id: 'knots',
    label: 'Knots (kn / kt)',
    shortLabel: 'kn',
    badge: 'Nautical & Aviation',
    system: 'International Maritime & Air',
    description: 'One nautical mile per hour (1.852 km/h). Universal standard for maritime navigation and flight safety.',
  },
  {
    id: 'beaufort',
    label: 'Beaufort Wind Scale (0–12 Bft)',
    shortLabel: 'Beaufort',
    badge: 'Empirical Scale',
    system: 'Admiral Beaufort Marine Scale',
    description: 'Empirical measure relating wind velocity to observed conditions on land and at sea (Calm to Hurricane Force).',
  },
  {
    id: 'dual_kmh_mph',
    label: 'Dual Display (km/h & mph)',
    shortLabel: 'km/h & mph',
    badge: 'Side-by-Side',
    system: 'Dual Velocity View',
    description: 'Shows both metric km/h and imperial mph simultaneously for global cross-understanding.',
  },
];
