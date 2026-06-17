import { NextResponse } from 'next/server';

// Locale routing middleware.
// - Locale-prefixsiz istekleri /<locale>/... 'e yönlendirir (Accept-Language'e göre, fallback tr).
// - Statik/asset/api/_next/sitemap/robots BYPASS.
// - x-locale response header set eder (root layout <html lang>/dir için okur).

const LOCALES = ['tr', 'en', 'de', 'ar', 'ru'];
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

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Bypass: sitemap/robots (route'lar app kökünde, locale yok)
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  const first = pathname.split('/').filter(Boolean)[0];

  // Zaten locale-prefixli → header set edip geç
  if (isLocale(first)) {
    const res = NextResponse.next();
    res.headers.set('x-locale', first);
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
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  const res = NextResponse.redirect(url); // default 307 (temporary) — intentional
  res.headers.set('x-locale', locale);
  return res;
}

export const config = {
  // _next, api, ve uzantılı dosyaları (.ico/.png/.xml/.txt vb.) hariç tut
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
