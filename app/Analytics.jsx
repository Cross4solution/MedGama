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
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
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
