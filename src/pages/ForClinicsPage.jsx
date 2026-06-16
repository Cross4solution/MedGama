import React from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/seo/SEOHead';

export default function ForClinicsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={t('forClinics.title', 'Klinikler İçin')}
        description={t('forClinics.subtitle', 'Kliniğinizi MedaGama ile büyütün: hasta yönetimi, çevrim içi randevu, CRM ve dijital görünürlük tek platformda.')}
        canonical="/for-clinics"
        alternates
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('forClinics.title')}</h1>
        <p className="mt-3 text-gray-600">{t('forClinics.subtitle')}</p>
      </section>
    </div>
  );
}
