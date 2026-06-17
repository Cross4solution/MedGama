'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';
import { Search, CalendarCheck, Video, Star, Plane } from 'lucide-react';
// SEO meta + canonical artık app/for-patients/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).

export default function ForPatientsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('forPatients.title')}</h1>
        <p className="mt-4 text-lg text-gray-600">
          MedaGama ile uzman doktor ve klinikleri tek platformda bulun, online doktor
          randevusu alın, telehealth görüşmesi planlayın ve onaylı hasta yorumlarını
          okuyarak bilinçli bir karar verin. İster yerelde ister sağlık turizmi için
          olsun, doğru sağlık profesyoneline ulaşmanız kolaylaşır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Doktor ve klinik bulun</h2>
        <p className="mt-3">
          Branşa, şehre ve uzmanlığa göre arama yaparak ihtiyacınıza uygun doktor ve
          klinikleri listeleyin. Her profilde uzmanlık alanları, hizmetler ve hasta
          yorumları yer alır; böylece karşılaştırma yapıp size en uygun olanı
          seçebilirsiniz. Hemen{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">arama yapın</Link>{' '}
          veya{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">branşları keşfedin</Link>.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Randevu ve telehealth</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 p-4">
            <CalendarCheck className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Online randevu</h3>
            <p className="mt-1 text-sm">
              Uygun zaman dilimini seçerek doktorunuzla yüz yüze görüşme için randevu
              oluşturun. Süreç şeffaf ve birkaç adımda tamamlanır.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Video className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Telehealth görüşmesi</h3>
            <p className="mt-1 text-sm">
              Uzaktan görüşme imkânı sunan doktorlarla, bulunduğunuz yerden bağlantı
              kurarak görüşme planlayın.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Onaylı yorumlar ve ikinci görüş</h2>
        <p className="mt-3">
          Karar vermeden önce diğer hastaların deneyimlerini okuyabilirsiniz. Onaylı
          hasta yorumları, doktor ve klinikleri daha iyi değerlendirmenize yardımcı
          olur. Farklı uzmanlardan ikinci görüş almak isterseniz, platform üzerinden
          birden çok profesyonele kolayca ulaşabilirsiniz.
        </p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Branş ve şehir filtreleriyle hızlı arama</li>
          <li>Şeffaf profiller ve onaylı hasta yorumları</li>
          <li>Online randevu ve telehealth seçenekleri</li>
          <li>Çok dilli destek ile sağlık turizmi kolaylığı</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Sağlık turizmi</h2>
        <p className="mt-3 flex items-start gap-2">
          <Plane className="h-5 w-5 text-teal-600 shrink-0 mt-1" />
          <span>
            Yurt dışından geliyorsanız, çok dilli arayüz sayesinde tedavi öncesi
            araştırmanızı, doktor seçiminizi ve iletişiminizi tek platformda
            yürütebilirsiniz. Sunulan{' '}
            <Link to="/tedaviler" className="text-teal-600 font-medium hover:underline">tedavileri inceleyin</Link>{' '}
            ve uygun klinikleri karşılaştırın.
          </span>
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Nasıl başlanır?</h2>
        <ol className="mt-3 space-y-2 list-decimal pl-5">
          <li>İhtiyacınıza göre branş veya şehir seçerek <Link to="/search" className="text-teal-600 hover:underline">arama</Link> yapın.</li>
          <li>Profilleri ve hasta yorumlarını inceleyin, karşılaştırın.</li>
          <li>Randevu alın ya da telehealth görüşmesi planlayın.</li>
        </ol>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">MedaGama'yı kullanmak ücretli mi?</h3>
            <p className="mt-1">
              Doktor ve klinik aramak, profilleri ve yorumları incelemek hastalar için
              ücretsizdir. Randevu ve hizmet ücretleri ilgili doktor veya klinik
              tarafından belirlenir.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Telehealth görüşmesi nasıl yapılır?</h3>
            <p className="mt-1">
              Uzaktan görüşme sunan bir doktor seçip uygun zaman dilimini belirleyerek
              telehealth görüşmesi planlayabilirsiniz.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Klinik misiniz?</h3>
            <p className="mt-1">
              Platforma katılmak isteyen klinik ve doktorlar{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">Klinikler için</Link>{' '}
              sayfasını inceleyebilir.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
