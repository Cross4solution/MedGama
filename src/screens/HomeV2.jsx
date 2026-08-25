'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { SearchSections } from '../components/search';
import CoreBoxes from '../components/CoreBoxes';
import PopularClinicsShowcase from '../components/PopularClinicsShowcase';
import TimelinePreview from '../components/TimelinePreview';
import { clinicAPI, geoAPI } from '../lib/api';
import { resolveClinicRating, resolveClinicReviewCount } from '../utils/clinicMetrics';
// SEO meta + WebSite/Organization JSON-LD artık app/page.jsx (ve app/home-v2) generateMetadata + server script ile üretiliyor (Faz 3).

// Kart görselleri — kliniğin kendi fotoğrafı yoksa sırayla bunlar kullanılıyor.
//
// Burada eskiden UYDURMA bir klinik listesi duruyordu: gerçek hastane adları
// ("Memorial Hospital", "Ege University Hospital", "Acibadem Hospital") ile
// birlikte uydurulmuş şehir, puan ve yorum sayıları — 4.9 / 186 yorum gibi.
// Liste `useState`in başlangıç değeriydi, yani API cevap vermeden ÖNCE
// ekrandaydı ve sunucudan gelen HTML'e de giriyordu. Ölçüldü: arama motorunun
// gördüğü HTML bu adları içeriyordu, üstelik API sağlamken bile. API çökerse
// (`catch` sessizdi) ekranda kalıcı olarak duruyorlardı.
//
// Gerçek bir sağlık markasının adını, uydurulmuş bir puanla yan yana koymak
// yalnızca yanlış veri değil. Adlar ve puanlar gitti; yalnız görseller kaldı.
const KART_GORSELLERI = [
  '/images/petr-magera-huwm7malj18-unsplash_720.jpg',
  '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
  '/images/caroline-lm-uqved8dypum-unsplash_720.jpg',
  '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg',
];

export default function HomeV2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [klinikHatasi, setKlinikHatasi] = useState(false);
  // Yeniden deneme sayacı: aynı ülkeyi tekrar yazmak efekti tetiklemiyor.
  const [yenidenDene, setYenidenDene] = useState(0);
  // Konum akışı: ana sayfa önizleme + popüler klinikler ülkeye göre.
  // Giriş varsa kullanıcının ülkesi; yoksa (misafir) IP'den ülke.
  const [geoCountry, setGeoCountry] = useState(user?.country || null);

  useEffect(() => {
    if (user?.country) { setGeoCountry(user.country); return; }
    let alive = true;
    geoAPI.ipCountry()
      .then((res) => { if (alive && res?.data?.country) setGeoCountry(res.data.country); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.country]);

  useEffect(() => {
    const params = { per_page: 20 };
    // DİKKAT: `/api/clinics` `country` diye bir parametre TANIMIYOR — kabul
    // ettikleri `name`, `city`/`city_id`, `specialty`, `treatment_tag_id`.
    // Ölçüldü: `country=ZZ` bile tam listeyi döndürüyor, yani buradaki ülke
    // süzgeci hiçbir şey yapmıyor. Satır bilerek duruyor: niyeti silmek yerine
    // görünür kılmak istedik. Ülkeye göre süzme arka uçta yok ve konum akışı
    // zaten karara bağlanmayı bekliyor.
    if (geoCountry) params.country = geoCountry;
    clinicAPI.list(params).then((res) => {
      const list = res?.data || [];
      if (list.length) {
        setClinics(list.map((c, i) => ({
          id: c.id,
          name: c.fullname || c.name,
          city: c.address || '',
          dept: '',
          rating: resolveClinicRating(c),
          reviews: resolveClinicReviewCount(c),
          image: c.avatar || KART_GORSELLERI[i % KART_GORSELLERI.length],
          codename: c.codename,
        })));
        setKlinikHatasi(false);
      }
    }).catch(() => setKlinikHatasi(true));
  }, [geoCountry, yenidenDene]);

  // Popular vitrini artık reusable component ile render ediliyor

  // Eski çoklu arama kaldırıldı; GlobalSearch ve CustomSearch kullanılacak

  // Logged-in users can also view the landing page (removed auto-redirect)

  return (
    <div className="min-h-screen bg-white">
      {false ? (
        <></>
      ) : (
        <>
      {/* Hero / Slogan */}
      <section className="relative overflow-hidden">
          <div className="relative overflow-hidden">
            {/* Background layer */}
            <div
              className="kahraman-arka absolute inset-0 bg-cover bg-center brightness-95 md:brightness-100"
              aria-hidden="true"
            />
            {/* Subtle dark overlay */}
            <div
              className="pointer-events-none absolute inset-0 bg-black/25 md:bg-black/30"
              aria-hidden="true"
            />
            {/* py-14 md:py-16 = spacious symmetric padding */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
              <div className="flex flex-col items-start gap-2">
                  <h1
                    className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md antialiased"
                  >
                    {t('home.heroTitle')}
                  </h1>
                  <p
                    className="text-white md:text-lg font-medium drop-shadow-sm antialiased"
                  >
                    {t('home.heroSubtitle')}
                  </p>
                  <button
                    onClick={() => {
                      const target = document.getElementById('services-overview');
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/95 backdrop-blur-sm text-teal-600 rounded-full text-xs font-normal hover:bg-teal-50 transition-all border-[0.5px] border-teal-400/60 hover:border-teal-500 shadow-sm hover:shadow-md"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{t('home.explore')}</span>
                  </button>
              </div>
            </div>
          </div>
      </section>

      {/* Unified Search sections via component */}
      <SearchSections />

      {/* Core Boxes (6 items) */}
      <CoreBoxes />

      {/* Medstream timeline preview between CoreBoxes and Popular Treatments */}
      <TimelinePreview limit={10} country={geoCountry} onViewAll={() => navigate('/medstream')} />


      {/* Popular Clinics reusable showcase */}
      {klinikHatasi && clinics.length === 0 ? (
        /* Sunucuya ulaşılamadı. Eskiden burada uydurma klinikler duruyordu, yani
           kesinti kullanıcıya HİÇ belli olmuyordu — üstelik gördüğü şey yanlıştı.
           Boş bir vitrin de "hiç klinik yok" gibi okunurdu. */
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center">
          <h3 className="text-lg font-bold text-gray-700 mb-1">{t('common.loadFailedTitle')}</h3>
          <p className="text-sm text-gray-500 mb-3">{t('common.loadFailedHint')}</p>
          <button
            type="button"
            onClick={() => { setKlinikHatasi(false); setYenidenDene((n) => n + 1); }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
          >
            {t('common.retry')}
          </button>
        </section>
      ) : (
      <PopularClinicsShowcase
        items={clinics}
        title={t('home.popularTreatments')}
        midTitle={t('home.popularClinics')}
        onCardClick={(c) => navigate(c.codename ? `/clinic/${c.codename}` : '/clinic')}
        onViewClick={(c) => navigate(c.codename ? `/clinic/${c.codename}` : '/clinic')}
      />
      )}

      {/* Footer is rendered globally in App.js */}
      </>
      )}
    </div>
  );
}
