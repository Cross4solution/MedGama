import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ForClinicsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('forClinics.title')}</h1>
        <p className="mt-3 text-gray-600">{t('forClinics.subtitle')}</p>
      </section>
    </div>
  );
}
