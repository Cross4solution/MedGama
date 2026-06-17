'use client';

// GA4 — consent-aware (KVKK/GDPR).
// - NEXT_PUBLIC_GA_ID yoksa: hiçbir şey render edilmez (null), gtag.js yüklenmez.
// - Çerez onayı: SADECE analytics izni verilince yüklenir. İzin sonradan verilince
//   (banner'dan "Kabul Et") component re-render olur ve script o an yüklenir.
// - Pageview: usePathname + useSearchParams değişiminde gtag('config') ile gönderilir.
//   Locale routing (/tr, /en, ...) URL prefix'leri de pathname'e dahil olduğu için
//   ayrı bir locale ele alması gerekmez — tam URL gönderilir.

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useCookieConsent } from '@/context/CookieConsentContext';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// KVKK/HIPAA/GDPR — PHI içeren dinamik path'leri maskele.
// GA'ya sağlık bağlamlı tekil URL (hasta/doktor/post id, tedavi+şehir) GÖNDERİLMEZ;
// yalnızca sayfa TİPİ gönderilir. Örn: /tr/doctor/123 → /doctor/[id]
const LOCALE_PREFIX = /^\/(tr|en|de|ar|ru)(?=\/|$)/;

export function redactPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return pathname;

  // 1) Locale prefix'i ayır (maskelemeyi locale'den bağımsız uygula).
  const localeMatch = pathname.match(LOCALE_PREFIX);
  const locale = localeMatch ? localeMatch[0] : '';
  let p = locale ? pathname.slice(locale.length) || '/' : pathname;

  // 2) Bilinen dinamik route'ların id/segmentlerini placeholder ile değiştir.
  const rules = [
    [/^\/doctor\/[^/]+/, '/doctor/[id]'],
    [/^\/clinic\/[^/]+/, '/clinic/[id]'],
    [/^\/post\/[^/]+/, '/post/[id]'],
    // /tedaviler/[specialty]/[city]
    [/^\/tedaviler\/[^/]+\/[^/]+/, '/tedaviler/[specialty]/[city]'],
    [/^\/tedaviler\/[^/]+/, '/tedaviler/[specialty]'],
    // CRM hasta detay path'leri (patient-360 vb.)
    [/^\/crm\/patient-360\/[^/]+/, '/crm/patient-360/[id]'],
    [/^\/crm\/patients?\/[^/]+/, '/crm/patient/[id]'],
    [/^\/appointment\/[^/]+/, '/appointment/[id]'],
    [/^\/telehealth\/[^/]+/, '/telehealth/[id]'],
  ];

  for (const [re, replacement] of rules) {
    if (re.test(p)) {
      p = p.replace(re, replacement);
      break;
    }
  }

  return locale ? `${locale}${p === '/' ? '' : p}` : p;
}

export default function Analytics() {
  const { hasConsent } = useCookieConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const analyticsAllowed = hasConsent('analytics');
  const enabled = Boolean(GA_ID) && analyticsAllowed;

  // Sayfa değişiminde pageview gönder (yalnızca GA aktif + onaylıysa).
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    // PHI içeren dinamik segment'leri maskele; sadece sayfa tipini GA'ya gönder.
    const safePath = redactPath(pathname);
    const query = searchParams?.toString();
    const url = query ? `${safePath}?${query}` : safePath;
    window.gtag('config', GA_ID, { page_path: url });
  }, [enabled, pathname, searchParams]);

  // Env yoksa veya analytics onayı yoksa: hiçbir script yüklenmez.
  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
