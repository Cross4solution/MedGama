import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const quickLinks = [
    { label: t('footer.aboutMedaGama'), href: '/about' },
    { label: t('footer.forPatients'), href: '/for-patients' },
    { label: t('footer.forClinics'), href: '/for-clinics' },
    { label: 'Vasco AI', href: '/vasco-ai' },
  ];


  // Popüler programatik SEO landing linkleri (crawl giriş noktası) — seçili dile göre.
  const popularTreatments = [
    { label: t('footer.popCardiologyIstanbul', 'Istanbul Cardiology'), href: '/tedaviler/kardiyoloji/istanbul' },
    { label: t('footer.popOrthopedicsAnkara', 'Ankara Orthopedics'), href: '/tedaviler/ortopedi/ankara' },
    { label: t('footer.popDermatologyIstanbul', 'Istanbul Dermatology'), href: '/tedaviler/dermatoloji/istanbul' },
    { label: t('footer.allTreatments', 'All Treatments'), href: '/tedaviler' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-5 lg:gap-x-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              {/* Negatif (beyaz) logo — koyu teal footer üstünde temiz görünsün */}
              <Image src="/images/logo/logo.svg" alt="Medagama Logo" width={176} height={40} className="h-9 w-auto object-contain brightness-0 invert opacity-90" />
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              {t('footer.brandTagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t('footer.services')}</h3>
            <ul className="space-y-1.5">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Popüler Tedaviler — programatik SEO crawl giriş noktası */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t('footer.popularTreatments')}</h3>
            <ul className="space-y-1.5">
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
            <ul className="space-y-1.5">
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
            <ul className="space-y-1.5">
              <li>
                <a href="/contact" className="text-sm text-white/70 hover:text-white transition-colors">{t('footer.contactUs')}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-5 pt-3 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4">
            <span className="text-xs text-white/50">© {year} Medagama. {t('footer.allRightsReserved')}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/60">
              <svg className="w-3 h-3 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {t('footer.compliantWith', 'Compliant with')} KVKK · GDPR · HIPAA
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <a href="/privacy-policy" className="hover:text-white transition-colors">{t('footer.privacyShort')}</a>
            <span className="text-white/30">·</span>
            <a href="/terms-of-service" className="hover:text-white transition-colors">{t('footer.termsShort')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
