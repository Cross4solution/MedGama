'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';
import { CalendarCheck, Video, Plane } from 'lucide-react';
// SEO meta + canonical artık app/for-patients/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).
//
// Gövde sabit TÜRKÇE yazılmıştı; başlık çeviriden geliyordu. Sonuç: İngilizce
// arayüzde "For Patients" başlığının altında baştan sona Türkçe metin. Bu
// sayfa sağlık turizmi hastasının okuduğu sayfa — Türkçe kalması onu
// doğrudan kaybettiriyor.

export default function ForPatientsPage() {
  const { t } = useTranslation();

  const maddeler = ['madde1', 'madde2', 'madde3', 'madde4'];

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('forPatients.title')}</h1>
        <p className="mt-4 text-lg text-gray-600">{t('forPatients.giris')}</p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">
          {t('forPatientsPage.doktorVeKlinikBulun', 'Doktor ve klinik bulun')}
        </h2>
        <p className="mt-3">
          {t('forPatients.bulMetin')}{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">
            {t('forPatients.aramaYapin')}
          </Link>{' '}
          {t('forPatients.veya')}{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">
            {t('forPatients.branslariKesfedin')}
          </Link>.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">
          {t('forPatientsPage.randevuVeTelehealth', 'Randevu ve telehealth')}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 p-4">
            <CalendarCheck className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">
              {t('forPatientsPage.onlineRandevu', 'Online randevu')}
            </h3>
            <p className="mt-1 text-sm">{t('forPatients.onlineRandevuMetin')}</p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Video className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">{t('forPatients.telehealthBaslik')}</h3>
            <p className="mt-1 text-sm">{t('forPatients.telehealthMetin')}</p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forPatients.yorumBaslik')}</h2>
        <p className="mt-3">{t('forPatients.yorumMetin')}</p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          {maddeler.map((anahtar) => (
            <li key={anahtar}>{t(`forPatients.${anahtar}`)}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forPatients.turizmBaslik')}</h2>
        <p className="mt-3 flex items-start gap-2">
          <Plane className="h-5 w-5 text-teal-600 shrink-0 mt-1" />
          <span>
            {t('forPatients.turizmMetinBas')}{' '}
            <Link to="/tedaviler" className="text-teal-600 font-medium hover:underline">
              {t('forPatientsPage.tedavileriInceleyin', 'tedavileri inceleyin')}
            </Link>{' '}
            {t('forPatients.turizmMetinSon')}
          </span>
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('forPatients.nasilBaslik')}</h2>
        <ol className="mt-3 space-y-2 list-decimal pl-5">
          <li>
            {t('forPatients.adim1Bas')}{' '}
            <Link to="/search" className="text-teal-600 hover:underline">
              {t('forPatientsPage.arama', 'arama')}
            </Link>{' '}
            {t('forPatients.adim1Son')}
          </li>
          <li>{t('forPatients.adim2')}</li>
          <li>{t('forPatients.adim3')}</li>
        </ol>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">{t('forPatients.sssBaslik')}</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">{t('forPatients.sss1Soru')}</h3>
            <p className="mt-1">{t('forPatients.sss1Cevap')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('forPatients.sss2Soru')}</h3>
            <p className="mt-1">{t('forPatients.sss2Cevap')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {t('forPatientsPage.klinikMisiniz', 'Klinik misiniz?')}
            </h3>
            <p className="mt-1">
              {t('forPatients.sss3CevapBas')}{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">
                {t('forPatients.kliniklerIcinBag')}
              </Link>{' '}
              {t('forPatients.sss3CevapSon')}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
