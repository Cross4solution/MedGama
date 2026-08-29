'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';
import { UserCircle, LayoutDashboard, CalendarRange, TrendingUp } from 'lucide-react';
// SEO meta + canonical artık app/for-clinics/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).
//
// Sayfanın gövdesi sabit TÜRKÇE yazılmıştı: arayüz İngilizceyken başlık
// "For Clinics" çıkıyor, altındaki her paragraf Türkçe kalıyordu. Bu sayfa
// sağlık turizmi için klinik arayan yabancı ziyaretçinin okuduğu sayfa —
// yani en yanlış yerde Türkçeydi.

export default function ForClinicsPage() {
  const { t } = useTranslation();

  const nedenler = ['neden1', 'neden2', 'neden3', 'neden4', 'neden5'];

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('forClinics.title')}</h1>
        <p className="mt-4 text-lg text-gray-600">{t('forClinics.giris')}</p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forClinics.profilBaslik')}</h2>
        <p className="mt-3">{t('forClinics.profilMetin')}</p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forClinics.araclarBaslik')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 p-4">
            <CalendarRange className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">{t('forClinics.randevuBaslik')}</h3>
            <p className="mt-1 text-sm">{t('forClinics.randevuMetin')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <LayoutDashboard className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">{t('forClinics.crmBaslik')}</h3>
            <p className="mt-1 text-sm">{t('forClinics.crmMetin')}</p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forClinics.erisimBaslik')}</h2>
        <p className="mt-3 flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600 shrink-0 mt-1" />
          <span>{t('forClinics.erisimMetin')}</span>
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forClinics.nedenBaslik')}</h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          {nedenler.map((anahtar) => (
            <li key={anahtar}>{t(`forClinics.${anahtar}`)}</li>
          ))}
        </ul>

        <p className="mt-6 flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-teal-600" />
          {t('forClinics.baslamakIcin')}{' '}
          <Link to="/contact" className="text-teal-600 font-medium hover:underline">
            {t('forClinics.iletisimeGecin')}
          </Link>.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">{t('forClinics.sssBaslik')}</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">{t('forClinics.sss1Soru')}</h3>
            <p className="mt-1">{t('forClinics.sss1Cevap')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('forClinics.sss2Soru')}</h3>
            <p className="mt-1">{t('forClinics.sss2Cevap')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('forClinics.sss3Soru')}</h3>
            <p className="mt-1">
              {t('forClinics.sss3CevapBas')}{' '}
              <Link to="/for-patients" className="text-teal-600 hover:underline">
                {t('forClinics.hastalarIcinBag')}
              </Link>{' '}
              {t('forClinics.sss3CevapOrta')}{' '}
              <Link to="/search" className="text-teal-600 hover:underline">
                {t('forClinicsPage.arama', 'arama')}
              </Link>
              {t('forClinics.sss3CevapSon')}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
