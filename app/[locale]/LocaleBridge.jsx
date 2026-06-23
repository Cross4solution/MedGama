'use client';

// URL'deki locale değiştiğinde react-i18next dilini senkron tutar.
// de/ar/ru için çeviri yoksa i18n fallbackLng (en) devreye girer — UI kırılmaz.
import { useEffect } from 'react';
import i18n from '@/i18n';
import { isLocale, DEFAULT_LOCALE, isRtl } from '@/lib/locales';

export default function LocaleBridge({ locale }) {
  const target = isLocale(locale) ? locale : DEFAULT_LOCALE;

  // Senkron set: LocaleBridge ağaçta SiteChrome'dan ÖNCE render olduğundan, dili
  // burada render anında değiştirmek aynı render geçişinde alt bileşenlerin doğru
  // dille çizilmesini sağlar → useEffect'e bırakılan dil geçişi flash'ı kalkar.
  // Kaynaklar bundle'da gömülü olduğu için changeLanguage senkron çözülür.
  if (typeof window !== 'undefined' && i18n.language !== target) {
    i18n.changeLanguage(target);
  }

  useEffect(() => {
    // Client-side navigasyonda root layout yeniden çalışmaz → <html lang/dir>'i
    // burada güncelle (özellikle Arapça RTL reload beklemeden uygulanır).
    if (typeof document !== 'undefined') {
      document.documentElement.lang = target;
      document.documentElement.dir = isRtl(target) ? 'rtl' : 'ltr';
    }
  }, [target]);
  return null;
}
