import { NextResponse } from 'next/server';

// Locale routing middleware.
// - Locale-prefixsiz istekleri /<locale>/... 'e yönlendirir (Accept-Language'e göre, fallback tr).
// - Statik/asset/api/_next/sitemap/robots BYPASS.
// - x-locale response header set eder (root layout <html lang>/dir için okur).

const LOCALES = ['tr', 'en', 'de', 'ar', 'ru', 'fr', 'es', 'it', 'az'];
const DEFAULT_LOCALE = 'tr';

function isLocale(x) {
  return LOCALES.includes(x);
}

function pickLocale(req) {
  // 1) i18next çerezi (kullanıcı tercihi)
  const cookieLang = req.cookies.get('i18next')?.value;
  if (isLocale(cookieLang)) return cookieLang;
  // 2) Accept-Language
  const al = req.headers.get('accept-language') || '';
  for (const part of al.split(',')) {
    const code = part.trim().split(';')[0].split('-')[0].toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

// medstream.co (ve www) → MedStream feed odaklı domain.
// Kök adres feed'i gösterir (rewrite — URL medstream.co'da kalır); profiller
// (/@handle), post detayı vb. aynı route'larla bu domainde de çalışır.
function isMedstreamHost(req) {
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  return host === 'medstream.co' || host === 'www.medstream.co';
}

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Bypass: sitemap/robots (route'lar app kökünde, locale yok)
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  const medstreamHost = isMedstreamHost(req);
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Zaten locale-prefixli
  if (isLocale(first)) {
    // medstream.co/<locale> (kök) → feed'i göster (rewrite)
    if (medstreamHost && segments.length === 1) {
      const url = req.nextUrl.clone();
      url.pathname = `/${first}/medstream`;
      const res = NextResponse.rewrite(url);
      res.headers.set('x-locale', first);
      res.headers.set('x-brand', 'medstream');
      return res;
    }
    const res = NextResponse.next();
    res.headers.set('x-locale', first);
    if (medstreamHost) res.headers.set('x-brand', 'medstream');
    return res;
  }

  // Locale-prefixsiz → /<locale><path> 'e yönlendir.
  // 307 (temporary) KALMALI — 308/301 DEĞİL. Hedef locale, kullanıcının
  // i18next çerezine ve Accept-Language başlığına göre DEĞİŞKEN
  // (pickLocale). Kalıcı redirect tarayıcı/CDN tarafından cache'lenir;
  // /en tercih eden bir kullanıcıyı kalıcı olarak /tr'ye kilitler.
  // Deterministik olmayan redirect için 307 doğru olandır.
  const locale = pickLocale(req);
  const url = req.nextUrl.clone();

  // medstream.co/ (kök) → feed'i doğrudan göster (rewrite, redirect değil)
  if (medstreamHost && pathname === '/') {
    url.pathname = `/${locale}/medstream`;
    const res = NextResponse.rewrite(url);
    res.headers.set('x-locale', locale);
    res.headers.set('x-brand', 'medstream');
    return res;
  }

  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  const res = NextResponse.redirect(url); // default 307 (temporary) — intentional
  res.headers.set('x-locale', locale);
  return res;
}

export const config = {
  // _next, api, ve uzantılı dosyaları (.ico/.png/.xml/.txt vb.) hariç tut
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
