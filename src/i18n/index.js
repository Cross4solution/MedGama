import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import tr from './locales/tr.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import nl from './locales/nl.json';
import it from './locales/it.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
  fr: { translation: fr },
  ar: { translation: ar },
  ru: { translation: ru },
  es: { translation: es },
  nl: { translation: nl },
  it: { translation: it },
  pt: { translation: pt },
};

const manualPreferenceDetector = {
  name: 'manualPreference',
  lookup() {
    try {
      const lang = localStorage.getItem('preferred_language');
      const isManual = localStorage.getItem('preferred_language_manual') === '1';
      return isManual && lang ? lang : 'en';
    } catch {
      return 'en';
    }
  },
};

const customDetector = new LanguageDetector();
customDetector.addDetector(manualPreferenceDetector);

i18n
  .use(customDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Keep platform default in English.
      // Only honor stored language when user selected it manually.
      order: ['manualPreference'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'pt', label: 'Português', flag: '🇵🇹', dir: 'ltr' },
];
