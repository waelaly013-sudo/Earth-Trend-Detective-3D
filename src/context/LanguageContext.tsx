/**
 * NASA Earth Trend Detective - Language Context & Provider
 * Supports real-time switching between English and Arabic with
 * automated RTL layout adaptation, localStorage persistence, and typed translations.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppLanguage, Translations, TRANSLATIONS } from '../translations/translations';
import { soundFx } from '../utils/audioSynth';

const STORAGE_KEY = 'nasa_earth_language_v1';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
  t: (key: keyof Translations, fallback?: string) => string;
  translations: Translations;
  formatMonthName: (monthNumber: number, short?: boolean) => string; // 1 to 12
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// What this does: Keeps track of whether the user wants English or Arabic, and flips the page layout for right-to-left reading when Arabic is on.
// On the website: Translates labels, month names, and page alignment when switching languages.
// Used as: The dedicated language and RTL layout provider.
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // What this does: Picks the starting language from saved memory or the user's browser language.
  // On the website: Remembers if the visitor used Arabic or English last time.
  // Used as: Initial language detector.
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
      // Also check browser navigator language
      if (navigator.language && navigator.language.startsWith('ar')) {
        return 'ar';
      }
    } catch (e) {
      console.warn('Failed to read language preference from localStorage', e);
    }
    return 'en';
  });

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  // What this does: Changes the active language and saves it in browser storage.
  // On the website: Switches UI text between English and Arabic.
  // Used as: Language setter function.
  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language preference to localStorage', e);
    }
  }, []);

  // What this does: Flips English <-> Arabic with a gentle click sound.
  // On the website: Runs when clicking the language button.
  // Used as: Language toggle shortcut.
  const toggleLanguage = useCallback(() => {
    soundFx.playTick();
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  // What this does: Updates the browser HTML tags and CSS font classes whenever the language changes.
  // On the website: Makes Arabic text look clean and right-aligned across the screen.
  // Used as: HTML document language & direction sync.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
      if (isRTL) {
        document.documentElement.classList.add('rtl-arabic');
        document.body.classList.add('font-arabic');
      } else {
        document.documentElement.classList.remove('rtl-arabic');
        document.body.classList.remove('font-arabic');
      }
    }
  }, [language, dir, isRTL]);

  const translations = useMemo(() => {
    return TRANSLATIONS[language] || TRANSLATIONS.en;
  }, [language]);

  // What this does: Looks up the translated text for a specific word or button key.
  // On the website: Prints the right English or Arabic word on buttons and headers.
  // Used as: The `t(...)` translation lookup function.
  const t = useCallback(
    (key: keyof Translations, fallback?: string): string => {
      const val = translations[key];
      if (typeof val === 'string') {
        return val;
      }
      return fallback || (TRANSLATIONS.en[key] as string) || String(key);
    },
    [translations]
  );

  // What this does: Turns a month number (1 to 12) into its month name in the chosen language (like "July" or "يوليو").
  // On the website: Shows readable month names in timelines, cards, and charts.
  // Used as: Month name formatter.
  const formatMonthName = useCallback(
    (monthNumber: number, short = false): string => {
      // monthNumber 1-12
      const idx = Math.max(0, Math.min(11, monthNumber - 1));
      const list = short ? translations.shortMonths : translations.months;
      return list[idx] || TRANSLATIONS.en.months[idx] || `Month ${monthNumber}`;
    },
    [translations]
  );

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage,
    isRTL,
    dir,
    t,
    translations,
    formatMonthName,
  }), [language, setLanguage, toggleLanguage, isRTL, dir, t, translations, formatMonthName]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// What this does: Lets any component easily read the active language and translation helper `t`.
// On the website: Used by translated UI panels.
// Used as: The shortcut hook for LanguageContext.
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
