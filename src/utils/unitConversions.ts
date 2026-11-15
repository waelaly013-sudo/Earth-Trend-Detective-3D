/**
 * NASA Earth Trend Detective - Unit Conversion Engine
 * Supports Temperature (°C, °F, K, °R), Wind Speed (m/s, km/h, mph, knots, Beaufort, ft/s),
 * and Humidity (% RH, Dew Point, Specific Humidity g/kg, VPD kPa, Absolute Humidity g/m³).
 */

import {
  TemperatureUnit,
  WindSpeedUnit,
  HumidityUnit,
  AppLanguage,
  UnitOption,
} from '../types/units';

export type {
  TemperatureUnit,
  WindSpeedUnit,
  HumidityUnit,
  AppLanguage,
  UnitOption,
};

// ============================================================================
// TEMPERATURE OPTIONS & CONVERSIONS
// ============================================================================

export const TEMPERATURE_UNITS: UnitOption<TemperatureUnit>[] = [
  {
    id: 'celsius',
    symbol: '°C',
    nameEn: 'Celsius',
    nameAr: 'سلسيوس',
    descriptionEn: 'Standard metric scale based on the freezing & boiling points of water',
    descriptionAr: 'المقياس المتري المعياري المعتمد على درجتي تجمد وغليان الماء',
    isSI: true,
  },
  {
    id: 'fahrenheit',
    symbol: '°F',
    nameEn: 'Fahrenheit',
    nameAr: 'فهرنهايت',
    descriptionEn: 'Imperial scale commonly used in the United States and meteorological reports',
    descriptionAr: 'المقياس الإمبراطوري الشائع استخدامه في الولايات المتحدة والتقارير الجوية',
  },
  {
    id: 'kelvin',
    symbol: 'K',
    nameEn: 'Kelvin',
    nameAr: 'كلفن',
    descriptionEn: 'SI thermodynamic absolute temperature scale starting at absolute zero',
    descriptionAr: 'مقياس درجة الحرارة المطلقة الديناميكي الحراري (SI) بدءاً من الصفر المطلق',
    isSI: true,
  },
  {
    id: 'rankine',
    symbol: '°R',
    nameEn: 'Rankine',
    nameAr: 'رانكين',
    descriptionEn: 'Absolute engineering scale proportional to Fahrenheit',
    descriptionAr: 'مقياس الحرارة المطلق الهندسي النسبي لمقياس فهرنهايت',
  },
];

// What this does: Converts a temperature from Celsius into Fahrenheit, Kelvin, or Rankine.
// On the website: Makes temperatures show up in whichever unit the user selected.
// Used as: The basic temperature math converter.
export function convertTemperature(celsius: number, toUnit: TemperatureUnit): number {
  switch (toUnit) {
    case 'fahrenheit':
      return Number(((celsius * 9) / 5 + 32).toFixed(2));
    case 'kelvin':
      return Number((celsius + 273.15).toFixed(2));
    case 'rankine':
      return Number(((celsius + 273.15) * 1.8).toFixed(2));
    case 'celsius':
    default:
      return Number(celsius.toFixed(2));
  }
}

// What this does: Converts a temperature CHANGE (like "+2°C warmer") without adding the +32°F or +273K offset.
// On the website: Keeps warming-amount badges accurate when reading in °F or Kelvin.
// Used as: The temperature-difference (delta/anomaly) converter.
export function convertTemperatureDelta(celsiusDelta: number, toUnit: TemperatureUnit): number {
  switch (toUnit) {
    case 'fahrenheit':
    case 'rankine':
      return Number(((celsiusDelta * 9) / 5).toFixed(2));
    case 'kelvin':
    case 'celsius':
    default:
      return Number(celsiusDelta.toFixed(2));
  }
}

// What this does: Turns a Celsius value into a clean text label with its unit symbol (and optional second unit in brackets).
// On the website: Displays labels like "24.5 °C (76.1 °F)" in headers, cards, and modals.
// Used as: The main temperature display formatter.
export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit = 'celsius',
  options: {
    showUnit?: boolean;
    showDual?: boolean;
    decimals?: number;
    showSign?: boolean;
    isDelta?: boolean;
    lang?: AppLanguage;
  } = {}
): string {
  const {
    showUnit = true,
    showDual = false,
    decimals = 1,
    showSign = false,
    isDelta = false,
  } = options;

  const value = isDelta
    ? convertTemperatureDelta(celsius, unit)
    : convertTemperature(celsius, unit);

  const opt = TEMPERATURE_UNITS.find((u) => u.id === unit) || TEMPERATURE_UNITS[0];
  const sign = showSign && value > 0 ? '+' : '';
  const formattedPrimary = `${sign}${value.toFixed(decimals)}${showUnit ? ` ${opt.symbol}` : ''}`;

  if (showDual) {
    // Show secondary: If active is Celsius, show Fahrenheit; if active is Fahrenheit, show Celsius; etc.
    const secondaryUnit: TemperatureUnit = unit === 'celsius' ? 'fahrenheit' : 'celsius';
    const secondaryVal = isDelta
      ? convertTemperatureDelta(celsius, secondaryUnit)
      : convertTemperature(celsius, secondaryUnit);
    const secOpt = TEMPERATURE_UNITS.find((u) => u.id === secondaryUnit)!;
    const secSign = showSign && secondaryVal > 0 ? '+' : '';
    return `${formattedPrimary} (${secSign}${secondaryVal.toFixed(decimals)} ${secOpt.symbol})`;
  }

  return formattedPrimary;
}

// What this does: Shortcut formatter for temperature differences (always includes a + or - sign).
// On the website: Prints warming values like "+1.5 °C" on badges and trend headers.
// Used as: The anomaly-text formatter.
export function formatTempDelta(
  celsiusDelta: number,
  unit: TemperatureUnit = 'celsius',
  options: {
    showUnit?: boolean;
    showDual?: boolean;
    decimals?: number;
    lang?: AppLanguage;
  } = {}
): string {
  return formatTemperature(celsiusDelta, unit, { ...options, showSign: true, isDelta: true });
}

export const formatTemperatureDelta = formatTempDelta;

// ============================================================================
// WIND SPEED OPTIONS & CONVERSIONS
// ============================================================================

export const WIND_SPEED_UNITS: UnitOption<WindSpeedUnit>[] = [
  {
    id: 'ms',
    symbol: 'm/s',
    nameEn: 'Meters per second',
    nameAr: 'متر في الثانية (م/ث)',
    descriptionEn: 'SI standard metric unit for surface 10m wind velocity',
    descriptionAr: 'الوحدة المترية المعيارية الدولية (SI) لسرعة الرياح السطحية عند ارتفاع 10م',
    isSI: true,
  },
  {
    id: 'kmh',
    symbol: 'km/h',
    nameEn: 'Kilometers per hour',
    nameAr: 'كيلومتر في الساعة (كم/س)',
    descriptionEn: 'Everyday metric velocity used in global road & weather forecasting',
    descriptionAr: 'الوحدة اليومية الشائعة عالمياً في الأرصاد الجوية وسرعات الطرق',
  },
  {
    id: 'mph',
    symbol: 'mph',
    nameEn: 'Miles per hour',
    nameAr: 'ميل في الساعة (ميل/س)',
    descriptionEn: 'Imperial velocity standard used in the US and UK navigation',
    descriptionAr: 'المقياس الإمبراطوري المعياري المستخدم في الولايات المتحدة والمملكة المتحدة',
  },
  {
    id: 'knots',
    symbol: 'kn',
    nameEn: 'Knots',
    nameAr: 'عقدة بحرية (عقدة)',
    descriptionEn: 'Nautical miles per hour used in marine navigation and aviation',
    descriptionAr: 'ميل بحري في الساعة، الوحدة المعتمدة عالمياً في الملاحة البحرية والجوية',
  },
  {
    id: 'beaufort',
    symbol: 'Bft',
    nameEn: 'Beaufort Scale',
    nameAr: 'مقياس بوفورت',
    descriptionEn: 'Empirical measure that relates wind speed to observed sea/land conditions (0–12)',
    descriptionAr: 'مقياس تجريبي يربط سرعة الرياح بالحالة المرئية للأمواج والأشجار (0–12)',
  },
  {
    id: 'fts',
    symbol: 'ft/s',
    nameEn: 'Feet per second',
    nameAr: 'قدم في الثانية (قدم/ث)',
    descriptionEn: 'Engineering unit for airflow and aerodynamic modeling',
    descriptionAr: 'وحدة هندسية شائعة في نمذجة تدفق الهواء والديناميكا الهوائية',
  },
];

export interface BeaufortInfo {
  scale: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

// What this does: Looks up the 0–12 Beaufort wind scale level and everyday description (like "Gentle Breeze") from a wind speed in m/s.
// On the website: Shows users what a wind speed actually feels like outdoors in English or Arabic.
// Used as: The wind-intensity lookup helper.
export function getBeaufortInfo(ms: number): BeaufortInfo {
  if (ms < 0.3) {
    return {
      scale: 0,
      nameEn: 'Calm',
      nameAr: 'هدوء تام',
      descriptionEn: 'Smoke rises vertically, sea like a mirror',
      descriptionAr: 'الدخان يتصاعد رأسياً، سطح البحر هادئ كمرآة',
    };
  }
  if (ms < 1.6) {
    return {
      scale: 1,
      nameEn: 'Light Air',
      nameAr: 'هواء خفيف',
      descriptionEn: 'Direction shown by smoke drift, not wind vanes',
      descriptionAr: 'حركة الدخان تدل على اتجاه الريح دون تحريك دوارة الرياح',
    };
  }
  if (ms < 3.4) {
    return {
      scale: 2,
      nameEn: 'Light Breeze',
      nameAr: 'نسيم لطيف',
      descriptionEn: 'Wind felt on exposed skin, leaves rustle slightly',
      descriptionAr: 'تحس به البشرة، حفيف أوراق الشجر، تتحرك دوارة الرياح',
    };
  }
  if (ms < 5.5) {
    return {
      scale: 3,
      nameEn: 'Gentle Breeze',
      nameAr: 'نسيم خفيف',
      descriptionEn: 'Leaves and small twigs constantly in motion',
      descriptionAr: 'حركة مستمرة لأوراق وأغصان الشجر الصغيرة، ترفرف الأعلام',
    };
  }
  if (ms < 8.0) {
    return {
      scale: 4,
      nameEn: 'Moderate Breeze',
      nameAr: 'نسيم معتدل',
      descriptionEn: 'Raises dust and loose paper, small branches move',
      descriptionAr: 'يثير الغبار والأوراق الساقطة، يحرك الأغصان المتوسطة',
    };
  }
  if (ms < 10.8) {
    return {
      scale: 5,
      nameEn: 'Fresh Breeze',
      nameAr: 'نسيم عليل نشط',
      descriptionEn: 'Small trees in leaf begin to sway, crested wavelets form',
      descriptionAr: 'تمايل الأشجار الصغيرة المورقة، تشكل قمم بيضاء في البحيرات',
    };
  }
  if (ms < 13.9) {
    return {
      scale: 6,
      nameEn: 'Strong Breeze',
      nameAr: 'رياح قوية نسيمية',
      descriptionEn: 'Large branches in motion, whistling heard in telegraph wires',
      descriptionAr: 'حركة الأغصان الكبيرة، صفير في أسلاك الكهرباء، صعوبة فتح المظلات',
    };
  }
  if (ms < 17.2) {
    return {
      scale: 7,
      nameEn: 'Near Gale',
      nameAr: 'شبه عاصفة',
      descriptionEn: 'Whole trees in motion, inconvenience felt walking against wind',
      descriptionAr: 'تمايل الأشجار بأكملها، مقاومة وصعوبة ملحوظة عند المشي ضد الريح',
    };
  }
  if (ms < 20.8) {
    return {
      scale: 8,
      nameEn: 'Gale',
      nameAr: 'عاصفة شديدة',
      descriptionEn: 'Breaks twigs off trees, generally impedes progress',
      descriptionAr: 'تكسر أغصان الأشجار، تعيق حركة المشاة بشدة في الهواء الطلق',
    };
  }
  if (ms < 24.5) {
    return {
      scale: 9,
      nameEn: 'Strong Gale',
      nameAr: 'عاصفة عاتية',
      descriptionEn: 'Slight structural damage, chimney pots and slates removed',
      descriptionAr: 'أضرار طفيفة في المباني وقرميد الأسطح، تطاير الألواح',
    };
  }
  if (ms < 28.5) {
    return {
      scale: 10,
      nameEn: 'Storm',
      nameAr: 'عاصفة هوجاء',
      descriptionEn: 'Seldom experienced inland, trees uprooted, considerable damage',
      descriptionAr: 'اقتلاع الأشجار وأضرار إنشائية جسيمة، نادرة الحدوث في اليابسة',
    };
  }
  if (ms < 32.7) {
    return {
      scale: 11,
      nameEn: 'Violent Storm',
      nameAr: 'عاصفة عنيفة',
      descriptionEn: 'Very rarely experienced, accompanied by widespread devastation',
      descriptionAr: 'نادرة جداً وترافقها خسائر فادحة ودمار واسع النطاق',
    };
  }
  return {
    scale: 12,
    nameEn: 'Hurricane Force',
    nameAr: 'إعصار استوائي مدمر',
    descriptionEn: 'Devastation, air filled with foam and spray, extreme peril',
    descriptionAr: 'دمار شامل، رذاذ البحر يحجب الرؤية، خطر شديد على الأرواح',
  };
}

// What this does: Converts wind speed from meters per second (m/s) into km/h, mph, knots, ft/s, or Beaufort number.
// On the website: Lets the website display wind numbers in any speed scale the user prefers.
// Used as: The wind math converter.
export function convertWindSpeed(ms: number, toUnit: WindSpeedUnit): number {
  switch (toUnit) {
    case 'kmh':
      return Number((ms * 3.6).toFixed(1));
    case 'mph':
      return Number((ms * 2.23694).toFixed(1));
    case 'knots':
      return Number((ms * 1.94384).toFixed(1));
    case 'fts':
      return Number((ms * 3.28084).toFixed(1));
    case 'beaufort':
      return getBeaufortInfo(ms).scale;
    case 'ms':
    default:
      return Number(ms.toFixed(1));
  }
}

// What this does: Turns a wind speed in m/s into a formatted text label (like "18.0 km/h (5.0 m/s)").
// On the website: Displays clean wind readings in the header, country card, and visual simulators.
// Used as: The main wind display formatter.
export function formatWindSpeed(
  ms: number,
  unit: WindSpeedUnit = 'ms',
  options: {
    showUnit?: boolean;
    showDual?: boolean;
    decimals?: number;
    lang?: AppLanguage;
  } = {}
): string {
  const { showUnit = true, showDual = false, decimals = 1, lang = 'en' } = options;
  const isAr = lang === 'ar';

  if (unit === 'beaufort') {
    const bft = getBeaufortInfo(ms);
    const label = isAr ? bft.nameAr : bft.nameEn;
    const formattedPrimary = `F${bft.scale} • ${label}`;
    if (showDual) {
      return `${formattedPrimary} (${ms.toFixed(1)} m/s)`;
    }
    return formattedPrimary;
  }

  const value = convertWindSpeed(ms, unit);
  const opt = WIND_SPEED_UNITS.find((u) => u.id === unit) || WIND_SPEED_UNITS[0];
  const unitLabel = isAr && opt.id === 'ms' ? 'م/ث' : isAr && opt.id === 'kmh' ? 'كم/س' : isAr && opt.id === 'mph' ? 'ميل/س' : opt.symbol;
  const formattedPrimary = `${value.toFixed(decimals)}${showUnit ? ` ${unitLabel}` : ''}`;

  if (showDual) {
    // Secondary display: if m/s -> show km/h; if km/h -> show mph; if mph -> show m/s
    const secUnit: WindSpeedUnit = unit === 'ms' ? 'kmh' : 'ms';
    const secVal = convertWindSpeed(ms, secUnit);
    const secOpt = WIND_SPEED_UNITS.find((u) => u.id === secUnit)!;
    const secLabel = isAr && secOpt.id === 'ms' ? 'م/ث' : isAr && secOpt.id === 'kmh' ? 'كم/س' : secOpt.symbol;
    return `${formattedPrimary} (${secVal.toFixed(decimals)} ${secLabel})`;
  }

  return formattedPrimary;
}

// ============================================================================
// HUMIDITY OPTIONS & CONVERSIONS
// ============================================================================

export const HUMIDITY_UNITS: UnitOption<HumidityUnit>[] = [
  {
    id: 'relative_humidity',
    symbol: '% RH',
    nameEn: 'Relative Humidity',
    nameAr: 'الرطوبة النسبية',
    descriptionEn: 'Ratio of current water vapor pressure to saturation vapor pressure (0–100%)',
    descriptionAr: 'نسبة ضغط بخار الماء الحالي إلى ضغط التشبع عند نفس درجة الحرارة (0–100%)',
    isSI: true,
  },
  {
    id: 'dew_point',
    symbol: 'Dew Pt',
    nameEn: 'Dew Point Temperature',
    nameAr: 'درجة حرارة نقطة الندى',
    descriptionEn: 'The temperature to which air must be cooled to become saturated with water vapor',
    descriptionAr: 'درجة الحرارة التي يجب أن يبرد إليها الهواء حتى يتشبع تماماً ببخار الماء وتتشكل قطرات الندى',
  },
  {
    id: 'specific_humidity',
    symbol: 'g/kg',
    nameEn: 'Specific Humidity',
    nameAr: 'الرطوبة النوعية',
    descriptionEn: 'Mass of water vapor per unit mass of moist air in grams per kilogram',
    descriptionAr: 'كتلة بخار الماء لكل وحدة كتلة من الهواء الرطب بالغرام لكل كيلوغرام',
    isSI: true,
  },
  {
    id: 'vpd',
    symbol: 'kPa VPD',
    nameEn: 'Vapor Pressure Deficit',
    nameAr: 'عجز ضغط البخار (VPD)',
    descriptionEn: 'Difference between saturation and actual vapor pressure; critical for plant transpiration',
    descriptionAr: 'الفرق بين ضغط بخار التشبع والضغط الفعلي؛ مقياس حاسم لجفاف الهواء ونتح النباتات',
  },
  {
    id: 'absolute_humidity',
    symbol: 'g/m³',
    nameEn: 'Absolute Humidity',
    nameAr: 'الرطوبة المطلقة',
    descriptionEn: 'Total mass of water vapor present in a given volume of air in grams per cubic meter',
    descriptionAr: 'الكتلة الكلية لبخار الماء الموجود في حجم معين من الهواء بالغرام لكل متر مكعب',
    isSI: true,
  },
];

export interface HumidityMetricsInput {
  relativeHumidityPct?: number;
  dewPointC?: number;
  specificHumidityGKg?: number;
  vaporPressureDeficitKPa?: number;
  tempC?: number;
}

// What this does: Calculates how many grams of water vapor are floating in one cubic meter of air using temperature and humidity %.
// On the website: Shows Absolute Humidity (g/m³) when the user picks that unit.
// Used as: The humidity-density math helper.
export function calculateAbsoluteHumidity(tempC: number, rhPct: number): number {
  const safeRH = Math.max(0, Math.min(100, rhPct));
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5)); // hPa
  const e = (es * safeRH) / 100; // actual vapor pressure in hPa
  const ah = (e * 216.74) / (273.15 + tempC); // g/m³
  return Number(ah.toFixed(1));
}

// What this does: Formats humidity data into the user's chosen unit (% RH, Dew Point, Specific Humidity g/kg, VPD kPa, or g/m³).
// On the website: Displays readable moisture numbers and unit labels in the Humidity branch.
// Used as: The main humidity display formatter.
export function formatHumidityMetric(
  metrics: HumidityMetricsInput,
  unit: HumidityUnit = 'relative_humidity',
  tempUnit: TemperatureUnit = 'celsius',
  options: {
    showUnit?: boolean;
    showDual?: boolean;
    decimals?: number;
    lang?: AppLanguage;
  } = {}
): {
  value: string;
  unitSymbol: string;
  formatted: string;
  secondaryFormatted?: string;
} {
  const { showUnit = true, showDual = false, decimals = 1, lang = 'en' } = options;
  const isAr = lang === 'ar';

  const rh = metrics.relativeHumidityPct ?? 65.0;
  const temp = metrics.tempC ?? 20.0;
  const dewC = metrics.dewPointC ?? Number((temp - (100 - rh) / 5).toFixed(1));
  const specific = metrics.specificHumidityGKg ?? 12.4;
  const vpd = metrics.vaporPressureDeficitKPa ?? 1.15;
  const absHum = calculateAbsoluteHumidity(temp, rh);

  switch (unit) {
    case 'dew_point': {
      const convertedDew = convertTemperature(dewC, tempUnit);
      const tempOpt = TEMPERATURE_UNITS.find((u) => u.id === tempUnit) || TEMPERATURE_UNITS[0];
      const symbol = tempOpt.symbol;
      const formatted = `${convertedDew.toFixed(decimals)}${showUnit ? ` ${symbol}` : ''}`;
      const secFormatted = showDual ? ` (${rh.toFixed(0)}% RH)` : undefined;
      return {
        value: convertedDew.toFixed(decimals),
        unitSymbol: symbol,
        formatted,
        secondaryFormatted: secFormatted,
      };
    }
    case 'specific_humidity': {
      const symbol = isAr ? 'غم/كغم' : 'g/kg';
      const formatted = `${specific.toFixed(decimals)}${showUnit ? ` ${symbol}` : ''}`;
      const secFormatted = showDual ? ` (${rh.toFixed(0)}% RH)` : undefined;
      return {
        value: specific.toFixed(decimals),
        unitSymbol: symbol,
        formatted,
        secondaryFormatted: secFormatted,
      };
    }
    case 'vpd': {
      const symbol = isAr ? 'كيلوباسكال' : 'kPa';
      const formatted = `${vpd.toFixed(2)}${showUnit ? ` ${symbol}` : ''}`;
      const secFormatted = showDual ? ` (${rh.toFixed(0)}% RH)` : undefined;
      return {
        value: vpd.toFixed(2),
        unitSymbol: symbol,
        formatted,
        secondaryFormatted: secFormatted,
      };
    }
    case 'absolute_humidity': {
      const symbol = isAr ? 'غم/م³' : 'g/m³';
      const formatted = `${absHum.toFixed(decimals)}${showUnit ? ` ${symbol}` : ''}`;
      const secFormatted = showDual ? ` (${rh.toFixed(0)}% RH)` : undefined;
      return {
        value: absHum.toFixed(decimals),
        unitSymbol: symbol,
        formatted,
        secondaryFormatted: secFormatted,
      };
    }
    case 'relative_humidity':
    default: {
      const symbol = '% RH';
      const formatted = `${rh.toFixed(decimals)}${showUnit ? ` ${symbol}` : ''}`;
      // Dual display: show Dew Point
      const convertedDew = convertTemperature(dewC, tempUnit);
      const tempOpt = TEMPERATURE_UNITS.find((u) => u.id === tempUnit) || TEMPERATURE_UNITS[0];
      const secFormatted = showDual
        ? ` (${isAr ? 'نقطة الندى' : 'Dew'}: ${convertedDew.toFixed(1)} ${tempOpt.symbol})`
        : undefined;
      return {
        value: rh.toFixed(decimals),
        unitSymbol: symbol,
        formatted,
        secondaryFormatted: secFormatted,
      };
    }
  }
}
