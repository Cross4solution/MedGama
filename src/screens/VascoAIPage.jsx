'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';
import { Bot, ListChecks, Compass, Languages, Info } from 'lucide-react';
// SEO meta + canonical artık app/vasco-ai/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).

export default function VascoAIPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('vascoAI.title')}</h1>
        <p className="mt-4 text-lg text-gray-600">
          Vasco AI, MedaGama'nın yapay zekâ destekli yönlendirme asistanıdır.
          Belirttiğiniz şikâyet ve semptomları anlayarak sizi platformdaki uygun branş
          ve uzman doktorlara yönlendirir. Vasco AI bir tanı veya tedavi aracı
          değildir; amacı doğru doktora ulaşmanızı kolaylaştırmaktır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Vasco AI nedir?</h2>
        <p className="mt-3">
          Vasco AI, hastaların kendi cümleleriyle anlattığı şikâyetleri yorumlayarak,
          bu şikâyetlerin hangi tıbbi branşla ilgili olabileceğini değerlendiren bir
          yönlendirme aracıdır. Böylece "hangi doktora gitmeliyim?" sorusuna pratik bir
          başlangıç noktası sunar ve sizi platformdaki ilgili uzmanlara taşır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Nasıl çalışır?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-4">
            <ListChecks className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Semptom analizi</h3>
            <p className="mt-1 text-sm">
              Şikâyetlerinizi serbest metin olarak anlatırsınız; Vasco AI bunları
              değerlendirir.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Compass className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Branş yönlendirme</h3>
            <p className="mt-1 text-sm">
              İlgili olabilecek tıbbi branşları önerir ve sizi uygun uzmanlara
              yönlendirir.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Languages className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Çok dilli</h3>
            <p className="mt-1 text-sm">
              Farklı dillerde kullanılabilir; sağlık turizmi ziyaretçileri için
              elverişlidir.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Neler yapabilir, neler yapamaz?</h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Şikâyetlerinize göre olası branşları önerebilir.</li>
          <li>Sizi platformdaki uzman doktor ve kliniklere yönlendirebilir.</li>
          <li>Çok dilli destekle sağlık turizmi sürecini kolaylaştırabilir.</li>
          <li><strong>Yapamaz:</strong> tanı koymak, ilaç önermek veya tedavi planlamak.</li>
        </ul>

        <p className="mt-6 flex items-center gap-2">
          <Bot className="h-5 w-5 text-teal-600" />
          Yönlendirmenin ardından{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">doktor arayın</Link>{' '}
          ya da{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">branşları inceleyin</Link>.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">Vasco AI tanı koyar mı?</h3>
            <p className="mt-1">
              Hayır. Vasco AI tanı koymaz, tedavi önermez ve tıbbi tavsiye vermez.
              Yalnızca sizi uygun branş ve uzmanlara yönlendiren bir araçtır.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Yönlendirme sonrası ne yapmalıyım?</h3>
            <p className="mt-1">
              Önerilen branştaki uzmanları platformda inceleyebilir, profilleri ve
              hasta yorumlarını okuyup{' '}
              <Link to="/search" className="text-teal-600 hover:underline">randevu</Link> alabilirsiniz.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Farklı dillerde kullanabilir miyim?</h3>
            <p className="mt-1">
              Evet, Vasco AI çok dilli olarak tasarlanmıştır; sorularınız için{' '}
              <Link to="/contact" className="text-teal-600 hover:underline">bize ulaşın</Link>.
            </p>
          </div>
        </div>

        {/* Yasal uyarı — sayfa sonunda, göze batmadan */}
        <div className="mt-12 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <span>
            <strong>Önemli:</strong> Vasco AI tıbbi tavsiye, tanı veya tedavi sunmaz.
            Verdiği yanıtlar yalnızca yönlendirme amaçlıdır. Sağlığınızla ilgili tüm
            kararlar mutlaka bir hekimle birlikte alınmalıdır. Acil durumlarda en yakın
            sağlık kuruluşuna başvurun.
          </span>
        </div>
      </article>
    </div>
  );
}
