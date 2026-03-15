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
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';
import ro from './locales/ro.json';
import bn from './locales/bn.json';
import vi from './locales/vi.json';
import th from './locales/th.json';
import az from './locales/az.json';
import uz from './locales/uz.json';

const SUPPORTED_LANGS = [
  'en', 'tr', 'ar', 'ru', 'de', 'fr', 'es', 'it', 'az', 'uz',
  'zh', 'hi', 'bn', 'pt', 'ja', 'ko', 'vi', 'th', 'pl', 'uk', 'ro', 'nl',
];

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
  zh: { translation: zh },
  hi: { translation: hi },
  ja: { translation: ja },
  ko: { translation: ko },
  pl: { translation: pl },
  uk: { translation: uk },
  ro: { translation: ro },
  bn: { translation: bn },
  vi: { translation: vi },
  th: { translation: th },
  az: { translation: az },
  uz: { translation: uz },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'preferred_language',
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 525600, // 1 year
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Primary 10 languages (Doc §11.1) listed first, then extras
export const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'ru', label: 'Русский', flag: '🇺', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '��', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '��', dir: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'it', label: 'Italiano', flag: '��', dir: 'ltr' },
  { code: 'az', label: 'Azərbaycanca', flag: '🇦🇿', dir: 'ltr' },
  { code: 'uz', label: 'Oʻzbekcha', flag: '��', dir: 'ltr' },
  // Additional languages
  { code: 'zh', label: '中文', flag: '��', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', flag: '��', dir: 'ltr' },
  { code: 'bn', label: 'বাংলা', flag: '��', dir: 'ltr' },
  { code: 'pt', label: 'Português', flag: '��', dir: 'ltr' },
  { code: 'ja', label: '日本語', flag: '��', dir: 'ltr' },
  { code: 'ko', label: '한국어', flag: '��', dir: 'ltr' },
  { code: 'vi', label: 'Tiếng Việt', flag: '��', dir: 'ltr' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'ro', label: 'Română', flag: '🇷🇴', dir: 'ltr' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
];
