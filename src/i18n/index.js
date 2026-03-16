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
// countryCode = ISO 3166-1 alpha-2 for https://flagcdn.com/{w}x{h}/{code}.png
export const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', countryCode: 'tr', dir: 'ltr' },
  { code: 'en', label: 'English', countryCode: 'gb', dir: 'ltr' },
  { code: 'ar', label: 'العربية', countryCode: 'sa', dir: 'rtl' },
  { code: 'ru', label: 'Русский', countryCode: 'ru', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', countryCode: 'de', dir: 'ltr' },
  { code: 'fr', label: 'Français', countryCode: 'fr', dir: 'ltr' },
  { code: 'es', label: 'Español', countryCode: 'es', dir: 'ltr' },
  { code: 'it', label: 'Italiano', countryCode: 'it', dir: 'ltr' },
  { code: 'az', label: 'Azərbaycanca', countryCode: 'az', dir: 'ltr' },
  { code: 'uz', label: 'Oʻzbekcha', countryCode: 'uz', dir: 'ltr' },
  // Additional languages
  { code: 'zh', label: '中文', countryCode: 'cn', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', countryCode: 'in', dir: 'ltr' },
  { code: 'bn', label: 'বাংলা', countryCode: 'bd', dir: 'ltr' },
  { code: 'pt', label: 'Português', countryCode: 'br', dir: 'ltr' },
  { code: 'ja', label: '日本語', countryCode: 'jp', dir: 'ltr' },
  { code: 'ko', label: '한국어', countryCode: 'kr', dir: 'ltr' },
  { code: 'vi', label: 'Tiếng Việt', countryCode: 'vn', dir: 'ltr' },
  { code: 'th', label: 'ไทย', countryCode: 'th', dir: 'ltr' },
  { code: 'pl', label: 'Polski', countryCode: 'pl', dir: 'ltr' },
  { code: 'uk', label: 'Українська', countryCode: 'ua', dir: 'ltr' },
  { code: 'ro', label: 'Română', countryCode: 'ro', dir: 'ltr' },
  { code: 'nl', label: 'Nederlands', countryCode: 'nl', dir: 'ltr' },
];

/**
 * Get FlagCDN URL for a language object or country code string.
 * Usage: getFlagUrl('tr') or getFlagUrl(langObj)
 * Returns: "https://flagcdn.com/24x18/tr.png"
 */
export function getFlagUrl(langOrCode, width = 24, height = 18) {
  const cc = typeof langOrCode === 'string'
    ? (LANGUAGES.find(l => l.code === langOrCode)?.countryCode || langOrCode)
    : langOrCode?.countryCode;
  if (!cc) return null;
  return `https://flagcdn.com/${width}x${height}/${cc}.png`;
}
