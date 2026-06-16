import React from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/seo/SEOHead';

export default function ForPatientsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={t('forPatients.title', 'Hastalar İçin')}
        description={t('forPatients.subtitle', 'Güvenilir doktor ve klinikleri keşfedin, randevu alın, yorumları okuyun ve telehealth hizmetlerine MedaGama ile ulaşın.')}
        canonical="/for-patients"
        alternates
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('forPatients.title')}</h1>
        <p className="mt-3 text-gray-600">{t('forPatients.subtitle')}</p>
      </section>
    </div>
  );
}
