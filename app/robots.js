import { SITE_URL } from '@/lib/seo-server';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
