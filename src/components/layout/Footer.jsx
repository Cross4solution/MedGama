import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const quickLinks = [
    { label: 'About MedaGama', href: '/about' },
    { label: 'For Patients', href: '/for-patients' },
    { label: 'For Clinics', href: '/for-clinics' },
    { label: 'Vasco AI', href: '/vasco-ai' },
  ];


  // Popüler programatik SEO landing linkleri (crawl giriş noktası).
  const popularTreatments = [
    { label: 'İstanbul Kardiyoloji', href: '/tedaviler/kardiyoloji/istanbul' },
    { label: 'Ankara Ortopedi', href: '/tedaviler/ortopedi/ankara' },
    { label: 'İstanbul Dermatoloji', href: '/tedaviler/dermatoloji/istanbul' },
    { label: 'Tüm Tedaviler', href: '/tedaviler' },
  ];

  const legalLinks = [
    { label: t('footer.privacyPolicy'), href: '/privacy-policy' },
    { label: t('footer.cookiePolicy'), href: '/cookie-policy' },
    { label: t('footer.termsOfService'), href: '/terms-of-service' },
    { label: 'KVKK', href: '/kvkk' },
    { label: t('footer.dataRights') + ' (GDPR)', href: '/data-rights' },
  ];

  return (
    <footer className="bg-[#1C6A83] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/images/logo/favicon-icon-white.png" alt="MedaGama" width={31} height={32} className="h-8 w-auto object-contain" />
              <span className="text-white text-2xl font-semibold tracking-tight">MedaGama</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              A global, end-to-end health portal for patients, doctors and clinics.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t('footer.services')}</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Popüler Tedaviler — programatik SEO crawl giriş noktası */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Popüler Tedaviler</h3>
            <ul className="space-y-2.5">
              {popularTreatments.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t('footer.legal')}</h3>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t('footer.contact')}</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="/contact" className="text-sm text-white/70 hover:text-white transition-colors">Contact Us</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-white/50">© {year} MedaGama. {t('footer.allRightsReserved')}</span>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy</a>
            <span className="text-white/30">·</span>
            <a href="/terms-of-service" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
