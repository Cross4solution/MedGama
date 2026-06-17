'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';
import { Globe, ShieldCheck, Stethoscope, Users } from 'lucide-react';
// SEO meta + canonical artık app/about/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('about.title')}</h1>
        <p className="mt-4 text-lg text-gray-600">
          MedaGama, hastaları uzman doktorlar ve onaylı klinik/hastanelerle aynı
          dijital platformda buluşturan bir sağlık ve sağlık turizmi pazar yeridir.
          Amacımız, doğru sağlık hizmetine ulaşmayı şeffaf, anlaşılır ve erişilebilir
          kılmak; hastaların bilinçli karar vermesini sağlamaktır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">MedaGama nedir?</h2>
        <p className="mt-3">
          MedaGama; doktor ve klinik arama, online doktor randevusu, telehealth (uzaktan
          görüşme) ve sağlık turizmi süreçlerini tek bir yerde toplayan çok dilli bir
          platformdur. Kullanıcılar branşa, şehre ve uzmanlığa göre arama yaparak
          aradıkları sağlık profesyonelini bulabilir, profilleri inceleyebilir ve
          doğrudan iletişime geçebilir. Klinikler ve doktorlar ise profillerini
          yöneterek daha geniş bir hasta kitlesine ulaşır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Misyonumuz</h2>
        <p className="mt-3">
          Sağlık hizmetine erişimde en büyük engeller bilgi eksikliği ve belirsizliktir.
          Biz, uzman doktor ve klinikleri tek platformda toplayarak; hastaların
          karşılaştırma yapmasını, hasta yorumlarını okumasını ve ikinci görüş almasını
          kolaylaştırıyoruz. Hiçbir tıbbi tavsiye sunmayız; bunun yerine sizi doğru
          uzmana ulaştıracak araçlar sağlarız.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Nasıl çalışır?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 p-4">
            <Users className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Hastalar için</h3>
            <p className="mt-1 text-sm">
              Branş ve şehir filtreleriyle uzman doktor ve klinikleri bulun, randevu
              alın, telehealth görüşmesi planlayın ve onaylı hasta yorumlarını okuyun.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Stethoscope className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Klinikler için</h3>
            <p className="mt-1 text-sm">
              Profilinizi oluşturun, randevularınızı yönetin, hasta erişiminizi artırın
              ve CRM araçlarıyla iletişiminizi kolaylaştırın.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Neden güvenli?</h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li className="flex items-start gap-2 list-none -ml-5">
            <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <span>Verileriniz KVKK ve GDPR ilkelerine uygun şekilde işlenir.</span>
          </li>
          <li className="flex items-start gap-2 list-none -ml-5">
            <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <span>Klinik ve doktor profilleri platform tarafından doğrulanır.</span>
          </li>
          <li className="flex items-start gap-2 list-none -ml-5">
            <Globe className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <span>Çok dilli arayüz ile sağlık turizmi sürecini uçtan uca destekler.</span>
          </li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Kapsamımız</h2>
        <p className="mt-3">
          MedaGama yalnızca yerel hastalara değil, yurt dışından gelen sağlık turizmi
          ziyaretçilerine de hitap eder. Çok dilli yapısı sayesinde farklı ülkelerden
          kullanıcılar Türkiye'deki uzman doktor ve klinikleri inceleyebilir,
          karşılaştırabilir ve iletişime geçebilir. Hemen{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">doktor ve klinik arayın</Link>,
          ilgi alanınıza göre{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">branşları keşfedin</Link>{' '}
          ya da sunulan{' '}
          <Link to="/tedaviler" className="text-teal-600 font-medium hover:underline">tedavileri inceleyin</Link>.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">MedaGama tıbbi tavsiye veriyor mu?</h3>
            <p className="mt-1">
              Hayır. MedaGama bir sağlık pazar yeridir; tanı veya tedavi tavsiyesi
              sunmaz. Sizi uzman doktor ve kliniklere ulaştırır. Tüm tıbbi kararlar
              hekiminizle birlikte alınmalıdır.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Platformu kimler kullanabilir?</h3>
            <p className="mt-1">
              Doktor veya klinik arayan hastalar,{' '}
              <Link to="/for-patients" className="text-teal-600 hover:underline">hastalar</Link>{' '}
              ve platforma katılmak isteyen{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">klinikler/doktorlar</Link>{' '}
              MedaGama'yı kullanabilir.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Verilerim güvende mi?</h3>
            <p className="mt-1">
              Kişisel verileriniz KVKK ve GDPR ilkelerine uygun olarak işlenir.
              Sorularınız için{' '}
              <Link to="/contact" className="text-teal-600 hover:underline">bize ulaşabilirsiniz</Link>.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
