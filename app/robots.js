import { SITE_URL } from '@/lib/seo-server';
import { LOCALES } from '@/lib/locales';

// Locale-siz private path'ler. Her dil prefix'i için ayrıca üretilir
// (/crm/ → /tr/crm/, /en/crm/ …). /api/ locale'siz kalır.
//
// Eşleşme ÖN EK üzerinden: '/telehealth' hem '/telehealth' hem
// '/telehealth-appointment' adresini kapatıyor. Bu yüzden '/doctor/' ya da
// '/clinic/' yazmak yanlış olurdu — '/clinic/{codename}' ve '/doctor/{id}'
// sayfaları herkese açık ve indekslenmeleri gerekiyor. İç içe korumalı
// rotalar tek tek yazılıyor.
const PRIVATE = [
  '/crm/',
  '/admin/',
  '/dashboard',
  '/patient-dashboard',
  '/medical-archive',
  '/clinic-edit',
  '/settings',
  '/profile',
  '/notifications',
  '/saved',
  '/saved-clinics',
  '/onboarding',
  '/telehealth',
  '/doctor-chat',
  // Bunlar `PrivateRoute` ile korunuyordu ama listede yoktu; üst seviye
  // '/dashboard' kaydı '/doctor/dashboard' adresine ulaşmıyor.
  '/doctor/dashboard',
  '/doctor/billing',
  '/doctor/appointments',
  '/clinic/dashboard',
  '/clinic/team',
  '/clinic/onboarding',
  '/patient/invoices',
  '/patient/appointments',
];

export default function robots() {
  const localized = PRIVATE.flatMap((p) => LOCALES.map((loc) => `/${loc}${p}`));
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', ...localized],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
