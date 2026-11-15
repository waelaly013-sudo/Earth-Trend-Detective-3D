/**
 * NASA Earth Trend Detective - Bilingual Dictionary (English & Arabic)
 * Provides comprehensive translations for all UI features, telemetry,
 * navigation, units, and months with high-accuracy scientific Arabic terms.
 */

export type AppLanguage = 'en' | 'ar';

export interface Translations {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  explore: string;
  science: string;
  reports: string;
  mission: string;
  visualPlaces: string;
  farm: string;
  polar: string;
  temperature: string;
  humidity: string;
  windSpeed: string;
  units: string;
  language: string;
  switchLanguage: string;
  english: string;
  arabic: string;
  globalMean: string;
  global10mWind: string;
  landRH: string;
  findCountry: string;
  tour: string;
  timeline: string;
  filterDomains: string;
  missionGuide: string;
  audioEffects: string;
  hideTaskbar: string;
  openTaskbar: string;
  immersion: string;
  allHotspots: string;

  // Timeline Controls
  timelineTitle: string;
  play: string;
  pause: string;
  today: string;
  observedData: string;
  aiPredictionData: string;
  speed: string;
  rotate: string;
  resetCamera: string;
  layers: string;
  listenVoice: string;
  year: string;
  month: string;
  timelineCompact: string;
  timelinePlayback: string;
  timelinePlaybackDesc: string;

  // Months
  months: string[];
  shortMonths: string[];

  // Sidebar Data Panel
  overview: string;
  impacts: string;
  scienceTab: string;
  simulatorTab: string;
  allTab: string;
  keyPlanetaryFinding: string;
  landmark: string;
  coordinates: string;
  baselineMean: string;
  thermalAnomaly: string;
  decadalRate: string;
  pastEpoch: string;
  presentEpoch: string;
  predictionEpoch: string;
  confidenceInterval: string;
  reasonsOfChange: string;
  criticalAlerts: string;
  aiCopilot: string;
  measuringUnits: string;
  mannKendall: string;
  pValue: string;
  statSignificant: string;
  sensSlope: string;
  close: string;
  observed: string;
  projected: string;
  flyToLocation: string;
  prevLocation: string;
  nextLocation: string;

  // Measuring Units Modal
  unitsModalTitle: string;
  unitsModalSubtitle: string;
  quickPresets: string;
  presetMetric: string;
  presetImperial: string;
  presetDual: string;
  presetScientific: string;
  tempCategory: string;
  humidityCategory: string;
  windCategory: string;
  livePreviewSlider: string;
  resetDefaults: string;
  activePreferenceBadge: string;
  languagePreferenceTitle: string;
  languagePreferenceSubtitle: string;

  // Country & Search
  searchCountryPlaceholder: string;
  allContinents: string;
  continents: Record<string, string>;
  ambient: string;
  anomaly: string;
  rate: string;
  selectCountryTitle: string;
  countriesWorldwide: string;

  // Status & Badges
  laborSafe: string;
  laborLoss: string;
  gridSurge: string;
  optimalGrowth: string;
  abovePreIndustrial: string;
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  en: {
    appTitle: 'NASA Earth Trend Detective',
    appSubtitle: 'Space Apps Challenge',
    explore: 'Explore',
    science: 'Science',
    reports: 'Reports',
    mission: 'Mission',
    visualPlaces: 'Visual Places',
    farm: 'Farm',
    polar: 'Polar',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    units: 'Units',
    language: 'Language',
    switchLanguage: 'Switch to Arabic',
    english: 'English',
    arabic: 'العربية',
    globalMean: 'Global Mean',
    global10mWind: 'Global 10m Wind',
    landRH: 'Land RH',
    findCountry: 'Find Country',
    tour: 'Planetary Guided Tour',
    timeline: '4D Climate Timeline',
    filterDomains: 'Filter Earth Domains',
    missionGuide: 'Mission Guide',
    audioEffects: 'Audio Effects',
    hideTaskbar: 'Hide Taskbar for Fullscreen Globe',
    openTaskbar: 'Open Taskbar',
    immersion: 'Immersion',
    allHotspots: 'Hotspots',

    timelineTitle: '4D Climate Timeline',
    play: 'Play',
    pause: 'Pause',
    today: 'TODAY',
    observedData: 'Observed Data (2000–2026)',
    aiPredictionData: 'AI Climate Prediction (2026–2040)',
    speed: 'Speed',
    rotate: 'Auto-Rotate',
    resetCamera: 'Reset Camera',
    layers: 'Layers',
    listenVoice: 'Voice HUD',
    year: 'Year',
    month: 'Month',
    timelineCompact: 'Compact Mode',
    timelinePlayback: 'Timeline Playback',
    timelinePlaybackDesc: 'Planetary climate evolution in motion • Click pause anytime to inspect',

    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    shortMonths: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],

    overview: 'Overview',
    impacts: 'Impacts',
    scienceTab: 'Science',
    simulatorTab: 'Simulator',
    allTab: 'All',
    keyPlanetaryFinding: 'Key Planetary Finding',
    landmark: 'Landmark',
    coordinates: 'Coordinates',
    baselineMean: 'Baseline (1951-1980)',
    thermalAnomaly: 'Thermal Anomaly',
    decadalRate: 'Decadal Trend',
    pastEpoch: 'Past (2000)',
    presentEpoch: 'Present (2026)',
    predictionEpoch: 'Prediction (2040)',
    confidenceInterval: '95% Confidence Interval',
    reasonsOfChange: 'Reasons of Change',
    criticalAlerts: 'Critical Alerts',
    aiCopilot: 'AI Copilot',
    measuringUnits: 'Units',
    mannKendall: 'Mann-Kendall Trend Statistics',
    pValue: 'p-value',
    statSignificant: 'Statistically Significant Trend',
    sensSlope: "Sen's Slope",
    close: 'Close',
    observed: 'Observed',
    projected: 'AI Projection',
    flyToLocation: 'Fly to Point',
    prevLocation: 'Previous Hotspot',
    nextLocation: 'Next Hotspot',

    unitsModalTitle: 'Climate Measuring Units & Preferences',
    unitsModalSubtitle: 'Select preferred measurement units across all three categories (Temperature, Humidity, Wind Speed)',
    quickPresets: 'Quick Presets',
    presetMetric: 'Metric (SI Standard)',
    presetImperial: 'Imperial (US / UK)',
    presetDual: 'Dual Simultaneous Display',
    presetScientific: 'Scientific & Aviation',
    tempCategory: 'Temperature Units',
    humidityCategory: 'Atmospheric Humidity',
    windCategory: 'Wind Speed Velocity',
    livePreviewSlider: 'Live Conversion Test Slider',
    resetDefaults: 'Reset to NASA Defaults',
    activePreferenceBadge: 'Active Preference',
    languagePreferenceTitle: 'Interface Language',
    languagePreferenceSubtitle: 'Choose between English and Arabic with automated right-to-left layout adaptation',

    searchCountryPlaceholder: 'Search country, territory, code, or continent...',
    allContinents: 'All Continents',
    continents: {
      'All': 'All Continents',
      'North America': 'North America',
      'South America': 'South America',
      'Europe': 'Europe',
      'Africa': 'Africa',
      'Asia': 'Asia',
      'Oceania': 'Oceania',
      'Polar': 'Polar Regions',
    },
    ambient: 'Ambient',
    anomaly: 'Anomaly',
    rate: 'Rate',
    selectCountryTitle: 'Select Country / Region',
    countriesWorldwide: '195+ Countries',

    laborSafe: 'Labor Safe',
    laborLoss: 'Labor Cap Loss',
    gridSurge: 'Grid AC Demand',
    optimalGrowth: 'Optimal Growth',
    abovePreIndustrial: 'Above Pre-Industrial',
  },

  ar: {
    appTitle: 'محقق اتجاهات كوكب الأرض - ناسا',
    appSubtitle: 'تحدي تطبيقات الفضاء',
    explore: 'استكشاف',
    science: 'العلوم',
    reports: 'التقارير',
    mission: 'المهمة',
    visualPlaces: 'الأماكن الافتراضية',
    farm: 'المزرعة',
    polar: 'القطب',
    temperature: 'درجة الحرارة',
    humidity: 'الرطوبة',
    windSpeed: 'سرعة الرياح',
    units: 'الوحدات',
    language: 'اللغة',
    switchLanguage: 'التبديل إلى الإنجليزية',
    english: 'English',
    arabic: 'العربية',
    globalMean: 'المتوسط العالمي',
    global10mWind: 'رياح السطح العالمية',
    landRH: 'رطوبة اليابسة',
    findCountry: 'بحث عن دولة',
    tour: 'جولة كوكبية إرشادية',
    timeline: 'الخط الزمني المناخي 4D',
    filterDomains: 'تصفية نطاقات الأرض',
    missionGuide: 'دليل المهمة',
    audioEffects: 'المؤثرات الصوتية',
    hideTaskbar: 'إخفاء الشريط للشاشة الكاملة',
    openTaskbar: 'فتح شريط المهام',
    immersion: 'شاشة كاملة',
    allHotspots: 'نقاط ساخنة',

    timelineTitle: 'الخط الزمني المناخي 4D',
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    today: 'اليوم',
    observedData: 'بيانات مرصودة (2000–2026)',
    aiPredictionData: 'تنبؤ المناخ بالذكاء الاصطناعي (2026–2040)',
    speed: 'السرعة',
    rotate: 'دوران تلقائي',
    resetCamera: 'إعادة ضبط الكاميرا',
    layers: 'الطبقات',
    listenVoice: 'النطق الصوتي',
    year: 'السنة',
    month: 'الشهر',
    timelineCompact: 'الوضع المصغر',
    timelinePlayback: 'تشغيل الخط الزمني',
    timelinePlaybackDesc: 'تطور المناخ الكوكبي عبر الزمن • انقر إيقاف مؤقت في أي وقت للمعاينة',

    months: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],
    shortMonths: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],

    overview: 'نظرة عامة',
    impacts: 'التأثيرات',
    scienceTab: 'العلوم',
    simulatorTab: 'المحاكي',
    allTab: 'الكل',
    keyPlanetaryFinding: 'النتيجة الكوكبية البارزة',
    landmark: 'المعلم الشهير',
    coordinates: 'الإحداثيات',
    baselineMean: 'متوسط خط الأساس (1951-1980)',
    thermalAnomaly: 'التباين الحراري',
    decadalRate: 'الاتجاه لكل عقد',
    pastEpoch: 'الماضي (2000)',
    presentEpoch: 'الحاضر (2026)',
    predictionEpoch: 'التنبؤ (2040)',
    confidenceInterval: 'مجال ثقة 95%',
    reasonsOfChange: 'أسباب التغير المناخي',
    criticalAlerts: 'تنبيهات حرجة',
    aiCopilot: 'المساعد الذكي',
    measuringUnits: 'الوحدات',
    mannKendall: 'إحصائيات اتجاه مان-كندال',
    pValue: 'القيمة الاحتمالية p',
    statSignificant: 'اتجاه ذو دلالة إحصائية مؤكدة',
    sensSlope: 'ميل سين',
    close: 'إغلاق',
    observed: 'بيانات مرصودة',
    projected: 'تنبؤ الذكاء الاصطناعي',
    flyToLocation: 'الانتقال إلى النقطة',
    prevLocation: 'النقطة السابقة',
    nextLocation: 'النقطة التالية',

    unitsModalTitle: 'وحدات القياس المناخية والتفضيلات',
    unitsModalSubtitle: 'اختر وحدات القياس المفضلة عبر جميع الفئات (درجة الحرارة، الرطوبة، سرعة الرياح)',
    quickPresets: 'إعدادات مسبقة جاهزة',
    presetMetric: 'متري (النظام الدولي SI)',
    presetImperial: 'إمبراطوري (أمريكي / بريطاني)',
    presetDual: 'عرض مزدوج متزامن',
    presetScientific: 'علمي وتطبيقات الطيران',
    tempCategory: 'وحدات درجة الحرارة',
    humidityCategory: 'الرطوبة الجوية',
    windCategory: 'سرعة الرياح',
    livePreviewSlider: 'شريط اختبار التحويل المباشر',
    resetDefaults: 'استعادة الإعدادات الافتراضية',
    activePreferenceBadge: 'الوحدة المفعلة',
    languagePreferenceTitle: 'لغة الواجهة',
    languagePreferenceSubtitle: 'التبديل بين اللغتين العربية والإنجليزية مع دعم كامل للكتابة والاتجاه من اليمين لليسار (RTL)',

    searchCountryPlaceholder: 'ابحث عن دولة، إقليم، رمز، أو قارة...',
    allContinents: 'جميع القارات',
    continents: {
      'All': 'جميع القارات',
      'North America': 'أمريكا الشمالية',
      'South America': 'أمريكا الجنوبية',
      'Europe': 'أوروبا',
      'Africa': 'أفريقيا',
      'Asia': 'آسيا',
      'Oceania': 'أوقيانوسيا',
      'Polar': 'المناطق القطبية',
    },
    ambient: 'المحيط',
    anomaly: 'التباين',
    rate: 'المعدل',
    selectCountryTitle: 'اختر دولة أو إقليم',
    countriesWorldwide: '+195 دولة حول العالم',

    laborSafe: 'العمل في الهواء الطلق آمن',
    laborLoss: 'انخفاض سعة العمل البشري',
    gridSurge: 'زيادة الطلب على شبكة التكييف',
    optimalGrowth: 'نمو زراعي مثالي',
    abovePreIndustrial: 'فوق مستويات ما قبل الصناعة',
  },
};
