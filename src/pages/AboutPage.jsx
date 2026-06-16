import React from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/seo/SEOHead';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={t('about.title', 'Hakkımızda')}
        description={t('about.subtitle', 'MedaGama — uzman doktorları, klinikleri ve sağlık hizmetlerini tek platformda buluşturan dijital sağlık ekosistemi.')}
        canonical="/about"
        alternates
      />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('about.title')}</h1>
        <p className="mt-3 text-gray-600">{t('about.subtitle')}</p>
      </section>
    </div>
  );
}
