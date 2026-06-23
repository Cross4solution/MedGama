'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';

// Short count-up animation for hero stats (e.g. "500+", "50K+", "%98")
function CountUp({ value }) {
  const parsed = String(value).match(/^(\D*)([\d.]+)(.*)$/);
  const target = parsed ? parseFloat(parsed[2]) : 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!parsed) return undefined;
    let raf;
    const dur = 900;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!parsed) return <>{value}</>;
  return <>{parsed[1]}{Math.round(n).toLocaleString('tr-TR')}{parsed[3]}</>;
}
import {
  Globe, ShieldCheck, Stethoscope, Users, Building2, HeartPulse,
  BadgeCheck, Languages, Target, Eye, ArrowRight, MapPin,
} from 'lucide-react';
// SEO meta + canonical app/about/page.jsx generateMetadata ile sunucuda üretiliyor.

const STATS = [
  { value: '500+', label: 'Onaylı Klinik' },
  { value: '50K+', label: 'Hasta' },
  { value: '9', label: 'Dil Desteği' },
  { value: '%98', label: 'Memnuniyet' },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Güven & Uyumluluk',
    desc: 'Tüm veriler KVKK, GDPR ve HIPAA ilkelerine uygun, şifreli şekilde işlenir.',
  },
  {
    icon: BadgeCheck,
    title: 'Doğrulanmış Profiller',
    desc: 'Klinik ve doktor profilleri platform tarafından kimlik ve yetki yönünden doğrulanır.',
  },
  {
    icon: Languages,
    title: 'Sınır Tanımayan Erişim',
    desc: '9 dilde arayüz ile sağlık turizmi sürecini dil ve lokasyon engeli olmadan destekler.',
  },
];

const FAQS = [
  {
    q: 'MedaGama tıbbi tavsiye veriyor mu?',
    a: (
      <>Hayır. MedaGama bir sağlık pazar yeridir; tanı veya tedavi tavsiyesi sunmaz.
      Sizi uzman doktor ve kliniklere ulaştırır. Tüm tıbbi kararlar hekiminizle birlikte alınmalıdır.</>
    ),
  },
  {
    q: 'Platformu kimler kullanabilir?',
    a: (
      <>Doktor veya klinik arayan{' '}
      <Link to="/for-patients" className="text-teal-700 font-medium hover:underline">hastalar</Link>{' '}
      ve platforma katılmak isteyen{' '}
      <Link to="/for-clinics" className="text-teal-700 font-medium hover:underline">klinik/doktorlar</Link>{' '}
      MedaGama'yı kullanabilir.</>
    ),
  },
  {
    q: 'Verilerim güvende mi?',
    a: (
      <>Kişisel verileriniz KVKK ve GDPR ilkelerine uygun, şifreli olarak işlenir ve üçüncü
      taraflarla paylaşılmaz. Sorularınız için{' '}
      <Link to="/contact" className="text-teal-700 font-medium hover:underline">bize ulaşabilirsiniz</Link>.</>
    ),
  },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0e7c7b] via-[#0d9488] to-[#0f766e]">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <img src="/images/logo/logo.svg" alt="MedaGama" className="h-12 sm:h-14 w-auto object-contain mx-auto" />
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white tracking-tight">{t('nav.about', 'Hakkımızda')}</h1>
          <p className="mt-3 max-w-2xl mx-auto text-[15px] text-teal-50/90 leading-relaxed">
            Hastaları uzman doktorlar ve onaylı klinik/hastanelerle aynı dijital platformda buluşturan,
            dil ve lokasyon bağımsız sağlık ve sağlık turizmi pazar yeri.
          </p>
        </div>
        {/* Stats band */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden bg-white/15 shadow-lg">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/95 px-4 py-4 text-center">
                <div className="text-2xl font-bold text-[#0f766e]"><CountUp value={s.value} /></div>
                <div className="mt-0.5 text-[11px] font-medium text-gray-500 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-gray-700 leading-relaxed">
        {/* Intro */}
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">MedaGama nedir?</h2>
          <p className="mt-4 text-lg text-gray-600">
            MedaGama; doktor ve klinik arama, online randevu, telehealth (uzaktan görüşme) ve sağlık
            turizmi süreçlerini tek bir yerde toplayan çok dilli bir platformdur. Kullanıcılar branşa,
            şehre ve uzmanlığa göre arama yaparak aradıkları sağlık profesyonelini bulur, profilleri
            inceler ve doğrudan iletişime geçer. Klinik ve doktorlar ise profillerini yöneterek daha
            geniş bir hasta kitlesine ulaşır.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-7">
            <div className="w-11 h-11 rounded-xl bg-teal-600/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Misyonumuz</h3>
            <p className="mt-2 text-[15px]">
              Sağlık hizmetine erişimdeki bilgi eksikliğini ve belirsizliği ortadan kaldırmak. Uzman
              doktor ve klinikleri tek platformda toplayarak karşılaştırma, hasta yorumu ve ikinci görüş
              almayı kolaylaştırırız.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-7">
            <div className="w-11 h-11 rounded-xl bg-teal-600/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Vizyonumuz</h3>
            <p className="mt-2 text-[15px]">
              Doğru sağlık hizmetine ulaşmayı dünya çapında şeffaf, anlaşılır ve erişilebilir kılmak;
              sağlık turizminde güvenilir dijital köprü olmak.
            </p>
          </div>
        </div>

        {/* How it works */}
        <h2 className="mt-16 text-2xl font-bold text-gray-900">Nasıl çalışır?</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 p-7 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-teal-600/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-700" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 text-lg">Hastalar için</h3>
            <p className="mt-2 text-[15px]">
              Branş ve şehir filtreleriyle uzman doktor ve klinikleri bulun, randevu alın, telehealth
              görüşmesi planlayın ve onaylı hasta yorumlarını okuyun.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 p-7 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-teal-600/10 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-teal-700" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 text-lg">Klinikler için</h3>
            <p className="mt-2 text-[15px]">
              Profilinizi oluşturun, randevularınızı yönetin, hasta erişiminizi artırın ve entegre CRM
              araçlarıyla operasyonunuzu tek panelden yönetin.
            </p>
          </div>
        </div>

        {/* Values */}
        <h2 className="mt-16 text-2xl font-bold text-gray-900">Değerlerimiz</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-2xl border border-gray-100 p-6">
                <div className="w-10 h-10 rounded-lg bg-teal-600/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-teal-700" />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{v.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{v.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Scope */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-8">
          <div className="flex items-center gap-2 text-teal-700">
            <MapPin className="w-5 h-5" />
            <h2 className="text-2xl font-bold text-gray-900">Kapsamımız</h2>
          </div>
          <p className="mt-3 max-w-3xl">
            MedaGama yalnızca yerel hastalara değil, yurt dışından gelen sağlık turizmi ziyaretçilerine
            de hitap eder. Çok dilli yapısı sayesinde farklı ülkelerden kullanıcılar Türkiye'deki uzman
            doktor ve klinikleri inceleyebilir, karşılaştırabilir ve iletişime geçebilir.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/search" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
              Doktor & klinik ara <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/doctors-departments" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Branşları keşfet
            </Link>
            <Link to="/tedaviler" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Tedavileri incele
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="mt-16 text-2xl font-bold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {FAQS.map((f, i) => (
            <div key={i} className="p-6">
              <h3 className="font-semibold text-gray-900">{f.q}</h3>
              <p className="mt-2 text-[15px] text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-[#0e7c7b] to-[#0f766e] px-8 py-12 text-center">
          <Building2 className="w-9 h-9 text-white/90 mx-auto" />
          <h2 className="mt-3 text-2xl font-bold text-white">Sağlık yolculuğunuza bugün başlayın</h2>
          <p className="mt-2 text-teal-50/90 max-w-xl mx-auto">
            Uzman doktorları keşfedin veya kliniğinizi MedaGama'da binlerce hastayla buluşturun.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/search" className="px-5 py-2.5 rounded-lg bg-white text-teal-700 text-sm font-semibold hover:bg-teal-50 transition-colors">
              Hemen ara
            </Link>
            <Link to="/for-clinics" className="px-5 py-2.5 rounded-lg bg-white/15 text-white text-sm font-semibold border border-white/30 hover:bg-white/25 transition-colors backdrop-blur">
              Klinik olarak katıl
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
