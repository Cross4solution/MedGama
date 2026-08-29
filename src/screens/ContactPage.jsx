'use client';
import React from 'react';
import { Link } from '@/compat/router';
import { Mail, Users, Stethoscope, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// SEO meta + canonical artık app/contact/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).
//
// Kart başlıkları çeviriden geliyordu ama gövde metinleri, başlık ve SSS
// sabit Türkçeydi: İngilizce arayüzde yarı Türkçe bir iletişim sayfası
// çıkıyordu — hem de tam olarak yabancı ziyaretçinin soru sormak için
// açtığı sayfada.

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('contact.baslik')}</h1>
        <p className="mt-4 text-lg text-gray-600">{t('contact.giris')}</p>

        <p className="mt-6 flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-teal-600" />
          <a href="mailto:info@medagama.com" className="text-teal-600 font-medium hover:underline">
            info@medagama.com
          </a>
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('contact.konuBaslik')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-4">
            <Users className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">{t('contactPage.hastalar', 'Hastalar')}</h3>
            <p className="mt-1 text-sm">
              {t('contact.hastalarMetin')}{' '}
              <Link to="/for-patients" className="text-teal-600 hover:underline">
                {t('contact.hastalarIcinBag')}
              </Link>{' '}
              {t('contact.sayfayaBakin')}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Stethoscope className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">{t('contactPage.klinikler', 'Klinikler')}</h3>
            <p className="mt-1 text-sm">
              {t('contact.kliniklerMetin')}{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">
                {t('contact.kliniklerIcinBag')}
              </Link>{' '}
              {t('contact.sayfayiInceleyin')}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">
              {t('contactPage.gizlilikVeVeri', 'Gizlilik ve veri')}
            </h3>
            <p className="mt-1 text-sm">{t('contact.gizlilikMetin')}</p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">{t('contact.nasilBaslik')}</h2>
        <p className="mt-3">
          {t('contact.nasilMetin')}{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">
            {t('contact.aramaYapin')}
          </Link>,{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">
            {t('contact.branslariKesfedin')}
          </Link>{' '}
          {t('contact.veya')}{' '}
          <Link to="/tedaviler" className="text-teal-600 font-medium hover:underline">
            {t('contactPage.tedavileriInceleyin', 'tedavileri inceleyin')}
          </Link>.{' '}
          {t('contact.dahaFazlaBilgi')}{' '}
          <Link to="/about" className="text-teal-600 font-medium hover:underline">
            {t('contact.hakkimizdaBag')}
          </Link>{' '}
          {t('contact.ziyaretEdin')}
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">{t('contact.sssBaslik')}</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">{t('contact.sss1Soru')}</h3>
            <p className="mt-1">{t('contact.sss1Cevap')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('contact.sss2Soru')}</h3>
            <p className="mt-1">
              {t('contact.sss2CevapBas')}{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">
                {t('contact.kliniklerIcinBag')}
              </Link>{' '}
              {t('contact.sayfayiInceleyin')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {t('contactPage.verilerimleIlgiliTalebimVar', 'Verilerimle ilgili talebim var.')}
            </h3>
            <p className="mt-1">
              {t('contact.sss3CevapBas')}{' '}
              <a href="mailto:info@medagama.com" className="text-teal-600 hover:underline">
                {t('contactPage.infoMedagamaCom', 'info@medagama.com')}
              </a>{' '}
              {t('contact.sss3CevapSon')}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
