import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// YALNIZ İngilizce burada duruyor, çünkü `fallbackLng` o: bir anahtar aktif
// dilde eksikse i18next İngilizceye düşüyor ve o an sözlüğün yüklenmiş olması
// gerekiyor. Kalan sekiz dil `paketler/` altında, her biri kendi dosyasında.
import en from './locales/en.json';

// Yalnızca dil seçicide gösterilen diller.
//
// Daha önce 22 dil kayıtlıydı ama seçici yalnızca 9'unu sunuyor (lib/locales.js
// içindeki LOCALES). Kalan 13'ü hiçbir kullanıcı seçemiyordu; yine de her
// ziyaretçinin tarayıcısına indiriliyorlardı — 523 KB, paketin dörtte biri,
// hiç görüntülenmeyen metin.
//
// Dosyaları silmedik: locales/ altında duruyorlar. Bir dil %100'e tamamlanıp
// LOCALES'e eklendiğinde buraya iki satırla geri döner.
const SUPPORTED_LANGS = ['en', 'tr', 'ar', 'ru', 'de', 'fr', 'es', 'it', 'az'];

// Dokuz dilin sözlüğü tek pakette duruyordu ve `app/[locale]/layout` her
// sayfada onu çekiyordu. Ölçüldü: Türkçe ana sayfa 723 KB JavaScript indiriyor,
// 462 KB'si bu paket. Yani ziyaretçi, okumayacağı sekiz dilin tam sözlüğünü —
// gzip'li 432 KB, sayfanın JavaScript'inin yaklaşık altmışta üçü — indiriyordu.
//
// Diller artık `paketler/` altında ayrı ayrı duruyor. Sunucu, rotadaki dile
// karşılık gelen TEK paketi render ediyor (`app/[locale]/layout.jsx`); Next
// yalnız onun yığınını gönderiyor. Paket kendi JSON'unu statik içe aktardığı
// için sözlük render anında hazır: ne bekleme var, ne çevrilmemiş metin
// parlaması, ne de hidrasyon uyuşmazlığı.
//
// `partialBundledLanguages`, i18next'e "kaynaklar sonradan eklenecek, eksik
// dili yükleme hatası sayma" diyor.
const resources = {
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    partialBundledLanguages: true,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // 'path' first → on a /{locale}/... URL the correct language is picked at
      // init (before first render), avoiding the post-hydration language flash.
      order: ['path', 'querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
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

// ── Sunucu tarafı: dokuz dil de burada ──
//
// Bölme YALNIZ tarayıcı için anlamlı. Sunucuda sözlükler diskten bir kez
// okunuyor, indirme yok — ama SSR'nin doğru dilde HTML üretebilmesi için render
// ANINDA ellerinde olmaları gerekiyor.
//
// Ölçüldü: yalnız istemci paketlerine bırakıldığında `/de`, `/ar` ve `/ru`
// sunucudan İngilizce geliyordu; `next/dynamic` sınırı o istek render olurken
// henüz çözülmemiş oluyor. Görünürde bir hata yok, sadece yanlış dilde HTML —
// ve arama motorlarının gördüğü tam olarak o HTML.
//
// `typeof window` istemci derlemesinde sabit olduğundan bu blok oradan tümüyle
// eleniyor; JSON'lar tarayıcı paketine girmiyor (ölçüm: `SozlukPaketi.jsx`).
if (typeof window === 'undefined') {
  for (const dil of SUPPORTED_LANGS) {
    if (dil === 'en') continue;
    // eslint-disable-next-line global-require
    i18n.addResourceBundle(dil, 'translation', require(`./locales/${dil}.json`), true, true);
  }
}

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
