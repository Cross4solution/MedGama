import { SITE_URL } from '@/lib/seo-server';
import { LOCALES } from '@/lib/locales';

// Locale-siz private path'ler. Her dil prefix'i için ayrıca üretilir
// (/crm/ → /tr/crm/, /en/crm/ …). /api/ locale'siz kalır.
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
  '/medstream',
  '/telehealth',
  '/doctor-chat',
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
