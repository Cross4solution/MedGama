'use client';
import React from 'react';
import { Link } from '@/compat/router';
import { Mail, Users, Stethoscope, ShieldCheck } from 'lucide-react';
// SEO meta + canonical artık app/contact/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">İletişim</h1>
        <p className="mt-4 text-lg text-gray-600">
          MedaGama ile ilgili sorularınız, önerileriniz veya iş birliği talepleriniz için
          bize ulaşabilirsiniz. Hasta, doktor veya klinik olun; ekibimiz size yardımcı
          olmaktan memnuniyet duyar.
        </p>

        <p className="mt-6 flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-teal-600" />
          <a href="mailto:info@medagama.com" className="text-teal-600 font-medium hover:underline">
            info@medagama.com
          </a>
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Hangi konuda yardım gerekiyor?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-4">
            <Users className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Hastalar</h3>
            <p className="mt-1 text-sm">
              Doktor/klinik bulma, randevu ve telehealth hakkında destek için{' '}
              <Link to="/for-patients" className="text-teal-600 hover:underline">Hastalar için</Link>{' '}
              sayfasına bakın.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Stethoscope className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Klinikler</h3>
            <p className="mt-1 text-sm">
              Platforma katılım ve profil yönetimi için{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">Klinikler için</Link>{' '}
              sayfasını inceleyin.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Gizlilik ve veri</h3>
            <p className="mt-1 text-sm">
              Verileriniz KVKK ve GDPR ilkelerine uygun işlenir; talepleriniz için bize
              yazın.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">MedaGama nasıl yardımcı olur?</h2>
        <p className="mt-3">
          MedaGama, uzman doktor ve klinikleri tek platformda bulmanızı, online doktor
          randevusu almanızı ve telehealth görüşmesi planlamanızı sağlar. Çok dilli
          yapısıyla sağlık turizmi süreçlerini de destekler. Aradığınız hizmete hızlıca
          ulaşmak için{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">arama yapın</Link>,{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">branşları keşfedin</Link>{' '}
          veya{' '}
          <Link to="/tedaviler" className="text-teal-600 font-medium hover:underline">tedavileri inceleyin</Link>.
          Platform hakkında daha fazla bilgi için{' '}
          <Link to="/about" className="text-teal-600 font-medium hover:underline">Hakkımızda</Link>{' '}
          sayfasını ziyaret edebilirsiniz.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">Ne kadar sürede dönüş alırım?</h3>
            <p className="mt-1">
              E-posta ile gelen talepleri en kısa sürede yanıtlamaya çalışıyoruz. Lütfen
              talebinizi mümkün olduğunca ayrıntılı iletin.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Klinik olarak nasıl katılırım?</h3>
            <p className="mt-1">
              Katılım sürecini başlatmak için bize yazın veya{' '}
              <Link to="/for-clinics" className="text-teal-600 hover:underline">Klinikler için</Link>{' '}
              sayfasını inceleyin.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Verilerimle ilgili talebim var.</h3>
            <p className="mt-1">
              Kişisel verilerinizle ilgili talepleriniz için{' '}
              <a href="mailto:info@medagama.com" className="text-teal-600 hover:underline">info@medagama.com</a>{' '}
              adresinden bize ulaşabilirsiniz.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
