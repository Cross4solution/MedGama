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
import { isLocale } from '@/lib/locales';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// KVKK/HIPAA/GDPR — PHI içeren dinamik path'leri maskele.
// GA'ya sağlık bağlamlı tekil URL (hasta/doktor/post id, tedavi+şehir) GÖNDERİLMEZ;
// yalnızca sayfa TİPİ gönderilir. Örn: /tr/doctor/123 → /doctor/[id]
//
// Dil öneki BURADA LİSTELENMİYOR. Eskiden `/^\/(tr|en|de|ar|ru)/` yazıyordu ve
// uygulamaya dört dil daha eklendiğinde güncellenmedi: /fr, /es, /it ve /az
// yollarında önek soyulmuyor, dolayısıyla aşağıdaki kuralların hiçbiri eşleşmiyor
// ve TAM URL — doktor, gönderi, randevu, telesağlık, CRM hasta kimlikleriyle —
// Google Analytics'e gidiyordu. Tek doğru kaynak `lib/locales`.
const DINAMIK_ROTALAR = [
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

/**
 * Kimlik gibi duran segment.
 *
 * Yukarıdaki liste TANIDIĞI rotaları maskeliyor; tanımadığında eski davranış
 * tam yolu göndermekti. Yani yeni bir dinamik rota eklemek — kimsenin aklına
 * analitik gelmeden — sessizce yeni bir sızıntı açıyordu. Bu ağ, kuralı tersine
 * çeviriyor: tanınmayan kimlik maskeleniyor, tanınan metin geçiyor.
 */
function kimlikMi(segment) {
  if (/^\d{2,}$/.test(segment)) return true;              // 123, 9001
  if (/^[0-9a-f]{16,}$/i.test(segment)) return true;        // hash
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment)) return true; // uuid

  return false;
}

export function redactPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return pathname;

  // 1) Dil önekini ayır (maskelemeyi dilden bağımsız uygula).
  const parcalar = pathname.split('/').filter(Boolean);
  const locale = parcalar.length && isLocale(parcalar[0]) ? `/${parcalar[0]}` : '';
  let p = locale ? pathname.slice(locale.length) || '/' : pathname;

  // 2) Bilinen dinamik route'ların id/segmentlerini placeholder ile değiştir.
  for (const [re, replacement] of DINAMIK_ROTALAR) {
    if (re.test(p)) {
      p = p.replace(re, replacement);
      break;
    }
  }

  // 3) Geriye kalan kimlik benzeri segmentler — bilinmeyen rotalar için ağ.
  p = p
    .split('/')
    .map((segment) => (kimlikMi(segment) ? '[id]' : segment))
    .join('/');

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
