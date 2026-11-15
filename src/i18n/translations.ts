/**
 * NASA Earth Trend Detective - Bilingual Localization Dictionary (English & Arabic)
 * Provides comprehensive translations for scientific climate terminology, telemetry,
 * UI navigation, units of measurement, and interactive controls.
 */

import { AppLanguage } from '../types/units';

export const TRANSLATIONS = {
  en: {
    // App Branding & Header
    appTitle: 'Earth Trend Detective',
    appSubtitle: '3D Space Apps Challenge',
    nasaEarthApps: 'NASA Earth Apps',
    languageName: 'English',
    languageToggle: 'العربية',
    unitsButton: 'Units',
    unitsModalTitle: 'Measuring Units & Display Options',
    unitsModalSubtitle: 'Customize physical measurement units for temperature, humidity, and wind speed.',

    // Primary Categories
    explore: 'Explore',
    science: 'Science',
    reports: 'Reports',
    mission: 'Mission',
    visualPlaces: 'Visual Places',
    farmPlace: 'Farm',
    polarPlace: 'Polar',

    // Data Branches
    temperatureBranch: 'Temperature',
    humidityBranch: 'Humidity',
    windBranch: 'Wind Speed',
    temperatureDesc: 'Air Temperature (°C / °F / K) • NASA GISTEMP v4',
    humidityDesc: 'Atmospheric Humidity (% RH / Dew Pt / g/kg) • NASA AIRS',
    windDesc: 'Surface Wind Speed (m/s / km/h / mph / Knots) • NASA CYGNSS',

    // Telemetry Top Bar
    globalMeanTemp: 'Global Mean Temp',
    globalAnomaly: 'Anomaly',
    globalLandRH: 'Land Relative Humidity',
    global10mWind: 'Global 10m Wind Speed',
    today: 'Today',
    historical: 'Historical',
    aiPrediction: 'AI Prediction',
    confidenceInterval: '95% Confidence Interval',

    // Unit Categories
    tempUnitsTitle: 'Temperature Units',
    tempUnitsSubtitle: 'Switch between Celsius, Fahrenheit, Kelvin, and Rankine',
    windUnitsTitle: 'Wind Speed Units',
    windUnitsSubtitle: 'Switch between m/s, km/h, mph, knots, Beaufort, and ft/s',
    humidityUnitsTitle: 'Humidity Units',
    humidityUnitsSubtitle: 'Switch between % RH, Dew Point, Specific Humidity, and VPD',
    dualUnitsToggle: 'Dual Unit Display (Show Secondary Converted Values)',
    dualUnitsDesc: 'Displays converted secondary units simultaneously (e.g., Celsius + Fahrenheit, or m/s + km/h)',

    // Sidebar Data Panel
    sidebarTitle: 'Planetary Telemetry & Trend Analysis',
    overviewTab: 'Overview',
    impactsTab: 'Impacts & Risks',
    scienceTab: 'Science & Stats',
    simulatorTab: 'Simulation',
    allTab: 'All Data',
    currentMeasurement: 'Current Measurement',
    baselineAverage: 'Historical Baseline (2000)',
    rateOfChange: 'Rate of Change / Decade',
    projected2040: 'Projected AI Metric (2040)',
    mannKendallHeader: 'Mann-Kendall Trend Statistics',
    tauKendall: "Kendall's Tau (τ)",
    pValue: 'p-Value (Significance)',
    statisticallySignificant: 'Statistically Significant (p < 0.05)',
    noSignificantTrend: 'No Statistically Significant Trend',
    reasonsForChange: 'Physical Drivers & Causes of Change',
    whyIsItChanging: 'Why is it changing?',
    bioSocialIndicators: 'Vulnerability & Bio-Social Indicators',
    criticalAlertsButton: 'Critical Alerts',
    scenarioSimButton: 'Scenario Simulation',
    speakTelemetryButton: 'Listen to Spoken Telemetry',
    stopSpeakingButton: 'Stop Voice Narration',
    selectMonthPrompt: 'Select Month to Observe Trend',
    monthComparison: 'Monthly Cycle Analysis',
    pastYear2000: 'Year 2000 (Past)',
    presentYear2026: 'Year 2026 (Present)',
    futureYear2040: 'Year 2040 (AI Projection)',
    overallShift: 'Overall Climatic Shift',

    // 4D Timeline
    timelineTitle: '4D Planetary Climate Time Machine',
    timelineEraTitle: 'Epoch',
    play: 'Play',
    pause: 'Pause',
    stepForward: 'Next Month',
    stepBack: 'Previous Month',
    timelineRange: '2000 – 2040 Timeline',
    recordedData: 'Recorded Observation (NASA POWER & MERRA-2)',
    projectedData: 'CMIP6 Shared Socioeconomic Pathway (SSP2-4.5)',

    // Months
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    monthsShort: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],

    // Common Actions
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    reset: 'Reset',
    export: 'Export',
    apply: 'Apply',
    details: 'Details',
    countrySearch: 'Country Search',
    guidedTour: 'Guided Tour',
    glossary: 'Glossary',
    missionGuide: 'Mission Guide',
    saveAccount: 'Account & Bookmarks',
    feedback: 'Feedback',
    audioEffects: 'Audio FX',
    fullscreen: 'Fullscreen',
    showLayers: 'Globe Layers',

    // Units labels
    celsius: 'Celsius (°C)',
    fahrenheit: 'Fahrenheit (°F)',
    kelvin: 'Kelvin (K)',
    rankine: 'Rankine (°R)',
    metersPerSecond: 'm/s (Meters/sec)',
    kmPerHour: 'km/h (Kilometers/hr)',
    milesPerHour: 'mph (Miles/hr)',
    knots: 'kn (Knots)',
    beaufortScale: 'Beaufort Scale',
    relativeHumidity: 'Relative Humidity (% RH)',
    dewPoint: 'Dew Point',
    specificHumidity: 'Specific Humidity (g/kg)',
    vaporPressureDeficit: 'Vapor Pressure Deficit (kPa)',
    absoluteHumidity: 'Absolute Humidity (g/m³)',

    // Voice HUD
    voiceHudPlaying: 'Playing voice narration...',
    voiceHudPrompt: 'Click "Listen" to hear climate telemetry aloud',
    listen: 'Listen',
    stop: 'Stop',
  },

  ar: {
    // App Branding & Header
    appTitle: 'محقق اتجاهات كوكب الأرض',
    appSubtitle: 'ثلاثي الأبعاد • تحدي تطبيقات الفضاء ناسا',
    nasaEarthApps: 'تطبيقات ناسا لعلوم الأرض',
    languageName: 'العربية',
    languageToggle: 'English',
    unitsButton: 'وحدات القياس',
    unitsModalTitle: 'خيارات وحدات القياس والعرض',
    unitsModalSubtitle: 'تخصيص وحدات القياس الفيزيائية لدرجات الحرارة والرطوبة الجوية وسرعة الرياح.',

    // Primary Categories
    explore: 'استكشاف',
    science: 'علوم ومحاكاة',
    reports: 'تقارير ومجتمع',
    mission: 'مهمة ودليل',
    visualPlaces: 'الأماكن البصرية',
    farmPlace: 'المزرعة',
    polarPlace: 'القطب',

    // Data Branches
    temperatureBranch: 'درجة الحرارة',
    humidityBranch: 'الرطوبة الجوية',
    windBranch: 'سرعة الرياح',
    temperatureDesc: 'درجة حرارة الهواء (°C / °F / K) • ناسا GISTEMP v4',
    humidityDesc: 'رطوبة الغلاف الجوي (% RH / نقطة الندى / غم/كغم) • ناسا AIRS',
    windDesc: 'سرعة الرياح السطحية (م/ث / كم/س / ميل/س / عقدة) • ناسا CYGNSS',

    // Telemetry Top Bar
    globalMeanTemp: 'متوسط حرارة الكوكب',
    globalAnomaly: 'الشذوذ الحراري',
    globalLandRH: 'رطوبة اليابسة النسبية',
    global10mWind: 'متوسط سرعة الرياح (10م)',
    today: 'اليوم',
    historical: 'تاريخي',
    aiPrediction: 'تنبؤ الذكاء الاصطناعي',
    confidenceInterval: 'فاصل ثقة 95%',

    // Unit Categories
    tempUnitsTitle: 'وحدات قياس درجة الحرارة',
    tempUnitsSubtitle: 'التبديل بين سلسيوس (°C)، فهرنهايت (°F)، كلفن (K)، ورانكين (°R)',
    windUnitsTitle: 'وحدات قياس سرعة الرياح',
    windUnitsSubtitle: 'التبديل بين م/ث، كم/س، ميل/س، عقدة بحرية، مقياس بوفورت، وقدم/ث',
    humidityUnitsTitle: 'وحدات قياس الرطوبة الجوية',
    humidityUnitsSubtitle: 'التبديل بين الرطوبة النسبية (% RH)، نقطة الندى، الرطوبة النوعية، وعجز ضغط البخار',
    dualUnitsToggle: 'عرض مزدوج للوحدات (إظهار القياس المعياري والتحويل معاً)',
    dualUnitsDesc: 'يعرض الوحدة الأساسية مع القيمة المحولة تلقائياً (مثال: سلسيوس وفهرنهايت معاً، أو م/ث و كم/س)',

    // Sidebar Data Panel
    sidebarTitle: 'القياسات المناخية وتحليل الاتجاهات',
    overviewTab: 'نظرة عامة',
    impactsTab: 'الآثار والمخاطر',
    scienceTab: 'التحليل العلمي والإحصائي',
    simulatorTab: 'المحاكاة',
    allTab: 'كافة البيانات',
    currentMeasurement: 'القياس الحالي',
    baselineAverage: 'المعدل المرجعي التاريخي (عام 2000)',
    rateOfChange: 'معدل التغير لكل عقد (10 سنوات)',
    projected2040: 'التوقع بالذكاء الاصطناعي لعام 2040',
    mannKendallHeader: 'إحصائيات اتجاه مان-كيندال (Mann-Kendall)',
    tauKendall: 'معامل تاو لكيندال (τ)',
    pValue: 'القيمة الاحتمالية p (الدلالة الإحصائية)',
    statisticallySignificant: 'دلالة إحصائية مؤكدة (p < 0.05)',
    noSignificantTrend: 'لا يوجد اتجاه ذو دلالة إحصائية كافية',
    reasonsForChange: 'الأسباب الفيزيائية ومحركات التغير',
    whyIsItChanging: 'لماذا يحدث هذا التغير؟',
    bioSocialIndicators: 'المؤشرات الحيوية والاجتماعية ومستوى الخطر',
    criticalAlertsButton: 'تنبيهات العتبات الحرجة',
    scenarioSimButton: 'محاكاة السيناريوهات الفيزيائية',
    speakTelemetryButton: 'استماع إلى القراءة الصوتية',
    stopSpeakingButton: 'إيقاف التعليق الصوتي',
    selectMonthPrompt: 'حدد الشهر لمراقبة الدورة الموسمية',
    monthComparison: 'تحليل الدورة الشهرية',
    pastYear2000: 'عام 2000 (الماضي)',
    presentYear2026: 'عام 2026 (الحاضر)',
    futureYear2040: 'عام 2040 (توقع الذكاء الاصطناعي)',
    overallShift: 'إجمالي التحول المناخي',

    // 4D Timeline
    timelineTitle: 'آلة الزمن المناخية رباعية الأبعاد',
    timelineEraTitle: 'الحقبة الزمنية',
    play: 'تشغيل المحاكاة',
    pause: 'إيقاف مؤقت',
    stepForward: 'الشهر التالي',
    stepBack: 'الشهر السابق',
    timelineRange: 'الخط الزمني: 2000 – 2040',
    recordedData: 'أرصاد مسجلة حقيقية (ناسا POWER و MERRA-2)',
    projectedData: 'سيناريو النمذجة المناخية العالمية CMIP6 (SSP2-4.5)',

    // Months in Arabic
    months: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],
    monthsShort: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],

    // Common Actions
    close: 'إغلاق',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    reset: 'إعادة ضبط',
    export: 'تصدير التقرير',
    apply: 'تطبيق',
    details: 'التفاصيل',
    countrySearch: 'بحث الدول والمناطق',
    guidedTour: 'جولة إرشادية كوكبية',
    glossary: 'المعجم والمصطلحات العلمية',
    missionGuide: 'دليل تشغيل التطبيق',
    saveAccount: 'حساب المستخدم والإشارات',
    feedback: 'إرسال ملاحظات وملاحظات علمية',
    audioEffects: 'المؤثرات الصوتية',
    fullscreen: 'وضع ملء الشاشة',
    showLayers: 'طبقات الكرة الأرضية',

    // Units labels
    celsius: 'سلسيوس (°C)',
    fahrenheit: 'فهرنهايت (°F)',
    kelvin: 'كلفن (K)',
    rankine: 'رانكين (°R)',
    metersPerSecond: 'م/ث (متر في الثانية)',
    kmPerHour: 'كم/س (كيلومتر في الساعة)',
    milesPerHour: 'ميل/س (ميل في الساعة)',
    knots: 'عقدة (عقدة بحرية)',
    beaufortScale: 'مقياس بوفورت',
    relativeHumidity: 'الرطوبة النسبية (% RH)',
    dewPoint: 'نقطة الندى',
    specificHumidity: 'الرطوبة النوعية (غم/كغم)',
    vaporPressureDeficit: 'عجز ضغط البخار (كيلوباسكال)',
    absoluteHumidity: 'الرطوبة المطلقة (غم/م³)',

    // Voice HUD
    voiceHudPlaying: 'جاري تشغيل التعليق الصوتي...',
    voiceHudPrompt: 'انقر "استماع" لسماع تقرير القياسات المناخية',
    listen: 'استماع',
    stop: 'إيقاف',
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function getTranslation(lang: AppLanguage, key: TranslationKey): any {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] ?? TRANSLATIONS.en[key] ?? key;
}
