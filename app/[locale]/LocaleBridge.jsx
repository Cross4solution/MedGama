'use client';

// URL'deki locale değiştiğinde react-i18next dilini senkron tutar.
// de/ar/ru için çeviri yoksa i18n fallbackLng (en) devreye girer — UI kırılmaz.
import { useEffect } from 'react';
import i18n from '@/i18n';
import { isLocale, DEFAULT_LOCALE } from '@/lib/locales';

export default function LocaleBridge({ locale }) {
  useEffect(() => {
    const target = isLocale(locale) ? locale : DEFAULT_LOCALE;
    if (i18n.language !== target) {
      i18n.changeLanguage(target);
    }
  }, [locale]);
  return null;
}
