'use client';

// URL'deki locale değiştiğinde react-i18next dilini senkron tutar.
// de/ar/ru için çeviri yoksa i18n fallbackLng (en) devreye girer — UI kırılmaz.
import { useEffect } from 'react';
import i18n from '@/i18n';
import { isLocale, DEFAULT_LOCALE, isRtl } from '@/lib/locales';

export default function LocaleBridge({ locale }) {
  const target = isLocale(locale) ? locale : DEFAULT_LOCALE;

  // Dili render anında set et — LocaleBridge ağaçta SiteChrome'dan ÖNCE render
  // olduğundan alt bileşenler aynı render geçişinde doğru dille çizilir.
  // Guard YOK: bu satır SUNUCUDA (SSR/SSG) da çalışır → ilk HTML route diliyle
  // üretilir (çok-dilli SEO doğru; /en sayfası sunucuda da İngilizce gelir).
  // 'use client' bileşeni olduğu için i18n (react-i18next) güvenle import edilir;
  // kaynaklar bundle'da olduğundan changeLanguage senkron çözülür.
  if (i18n.language !== target) {
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
