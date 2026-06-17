'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/compat/router';
import { UserCircle, LayoutDashboard, CalendarRange, TrendingUp } from 'lucide-react';
// SEO meta + canonical artık app/for-clinics/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).

export default function ForClinicsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('forClinics.title')}</h1>
        <p className="mt-4 text-lg text-gray-600">
          Klinikler, hastaneler ve bağımsız doktorlar için MedaGama; daha geniş bir
          hasta kitlesine ulaşmanın, randevuları tek yerden yönetmenin ve dijital
          görünürlüğü artırmanın yoludur. Profilinizi oluşturun, hizmetlerinizi tanıtın
          ve hasta erişiminizi büyütün.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Profilinizi oluşturun</h2>
        <p className="mt-3">
          Uzmanlık alanlarınızı, sunduğunuz hizmetleri ve iletişim bilgilerinizi içeren
          bir profil oluşturarak, branş ve şehre göre arama yapan hastalar tarafından
          bulunun. Şeffaf ve eksiksiz profiller, hastaların güvenle karar vermesini
          sağlar ve sizi öne çıkarır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Yönetim araçları</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 p-4">
            <CalendarRange className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Randevu yönetimi</h3>
            <p className="mt-1 text-sm">
              Gelen randevu taleplerini tek panelden takip edin, takviminizi düzenleyin
              ve hastalarınızla iletişimi kolaylaştırın.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <LayoutDashboard className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">CRM araçları</h3>
            <p className="mt-1 text-sm">
              Hasta ilişkilerinizi yönetin, etkileşimleri izleyin ve iletişim
              süreçlerinizi merkezi bir yerden yürütün.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Hasta erişimini artırın</h2>
        <p className="mt-3 flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-teal-600 shrink-0 mt-1" />
          <span>
            MedaGama'nın çok dilli yapısı, yalnızca yerel hastalara değil sağlık
            turizmi için Türkiye'yi araştıran uluslararası ziyaretçilere de
            erişmenizi sağlar. Onaylı hasta yorumları güveninizi pekiştirir ve daha
            fazla randevu talebi almanıza yardımcı olur.
          </span>
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Neden katılmalısınız?</h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Branş ve şehir aramalarında görünür olun</li>
          <li>Randevuları ve hasta iletişimini tek panelden yönetin</li>
          <li>CRM araçlarıyla hasta ilişkilerinizi güçlendirin</li>
          <li>Çok dilli platformla sağlık turizmi hastalarına ulaşın</li>
          <li>KVKK/GDPR uyumlu, güvenli bir altyapı kullanın</li>
        </ul>

        <p className="mt-6 flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-teal-600" />
          Başlamak için{' '}
          <Link to="/contact" className="text-teal-600 font-medium hover:underline">bizimle iletişime geçin</Link>.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">Platforma kimler katılabilir?</h3>
            <p className="mt-1">
              Klinikler, hastaneler ve bağımsız doktorlar profil oluşturarak MedaGama'ya
              katılabilir ve hasta erişimini artırabilir.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Randevuları nasıl yönetiyorum?</h3>
            <p className="mt-1">
              Gelen randevu talepleri yönetim panelinizde toplanır; takviminizi
              düzenleyebilir ve hasta iletişimini buradan yürütebilirsiniz.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Hasta olarak mı geldiniz?</h3>
            <p className="mt-1">
              Doktor veya klinik arıyorsanız{' '}
              <Link to="/for-patients" className="text-teal-600 hover:underline">Hastalar için</Link>{' '}
              sayfasını inceleyin veya doğrudan{' '}
              <Link to="/search" className="text-teal-600 hover:underline">arama</Link> yapın.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
