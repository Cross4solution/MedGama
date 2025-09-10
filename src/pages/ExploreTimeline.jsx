import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../components/layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import countryCities from '../data/countryCities';
import countryCodes from '../data/countryCodes';
import TimelineFilterSidebar from 'components/timeline/TimelineFilterSidebar';
import TimelineControls from 'components/timeline/TimelineControls';
import ActiveFilterChips from 'components/timeline/ActiveFilterChips';
import TimelineCard from 'components/timeline/TimelineCard';
import SkeletonCard from 'components/timeline/SkeletonCard';

// Basit mock feed üretici: guest için random, user için follow-first + location mix simülasyonu
// Kapsamlı uzmanlık listesi (örnek, gerektiğinde daha da genişletilebilir)
const SPECIALTIES = [
  'Cardiology','Cardiac Surgery','Pediatric Cardiology','Oncology','Medical Oncology','Radiation Oncology','Hematology',
  'Orthopedics','Sports Medicine','Rheumatology','Neurology','Neurosurgery','Psychiatry','Psychology','Dermatology',
  'Endocrinology','Gastroenterology','General Surgery','Plastic Surgery','Reconstructive Surgery','OB/GYN','Urology',
  'Nephrology','Pulmonology','Otolaryngology (ENT)','Ophthalmology','Dentistry','Oral and Maxillofacial Surgery',
  'Pediatrics','Geriatrics','Infectious Diseases','Allergy & Immunology','Anesthesiology','Emergency Medicine',
  'Radiology','Interventional Radiology','Pathology','Physiotherapy','Nutrition & Dietetics','Speech Therapy'
];

// Removed EN-only datasets for procedure/symptom autocomplete (panel dropped)

function useExploreFeed({ mode = 'guest', countryName = '', specialtyFilter = '', textQuery = '', page = 1, pageSize = 12, sort = 'top', tab = 'for-you' }) {
  // Kaynak data
  const base = useMemo(() => {
    const specialties = SPECIALTIES;
    const clinics = ['Anadolu Health Center','Memorial','Ege University','Acibadem','Medicana','Florence Nightingale'];
    const cities = ['Istanbul, TR','Ankara, TR','Izmir, TR','Berlin, DE','Munich, DE','London, GB','New York, US'];
    const items = [];
    for (let i = 0; i < 120; i++) {
      const sp = specialties[i % specialties.length];
      const cl = clinics[i % clinics.length];
      const ct = cities[i % cities.length];
      items.push({
        id: `it-${i+1}`,
        type: i % 3 === 0 ? 'clinic_update' : 'patient_review',
        title: i % 3 === 0 ? `${cl}` : `Patient Review` ,
        subtitle: i % 3 === 0 ? sp : `${(4 + (i % 2)).toFixed(1)} ★`,
        city: ct,
        img: i % 2 === 0 ? '/images/petr-magera-huwm7malj18-unsplash_720.jpg' : '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
        text: i % 3 === 0
          ? 'New minimally invasive techniques improved recovery times.'
          : 'Very satisfied with the treatment. Staff was kind and professional.',
        likes: 20 + (i % 100),
        comments: 2 + (i % 15),
        specialty: sp,
        countryCode: ct.split(', ')[1],
      });
    }
    return items;
  }, []);

  const filtered = useMemo(() => {
    let list = base;
    // Ülke adı -> ülke koduna çeviri (countryCodes)
    const codeLower = countryName ? (countryCodes[countryName] || '').toLowerCase() : '';
    if (codeLower) list = list.filter(x => (x.countryCode || '').toLowerCase() === codeLower);
    if (specialtyFilter) list = list.filter(x => x.specialty === specialtyFilter);
    if (textQuery) {
      const q = textQuery.toLowerCase();
      list = list.filter(x => (x.title + ' ' + x.subtitle + ' ' + x.text).toLowerCase().includes(q));
    }
    // Tab ve mode etkisi
    if (tab === 'for-you') {
      if (mode === 'user') {
        const followed = list.filter((_, idx) => idx % 3 !== 0);
        const others = list.filter((_, idx) => idx % 3 === 0);
        list = [...followed, ...others];
      }
    } else if (tab === 'latest') {
      // basitçe diziyi tersle (yeni içerik üstte)
      list = [...list].reverse();
    }
    // Sıralama
    if (sort === 'top') {
      list = [...list].sort((a,b) => (b.likes + b.comments) - (a.likes + a.comments));
    } else if (sort === 'recent') {
      list = [...list]; // latest tab zaten reverse ediyor
    }
    return list;
  }, [base, countryName, specialtyFilter, textQuery, mode, sort, tab]);

  const paged = useMemo(() => {
    const start = 0;
    const end = page * pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  const hasMore = paged.length < filtered.length;

  return { items: paged, hasMore, total: filtered.length };
}

// Card ve Skeleton bileşenleri ayrı dosyalara taşındı

export default function ExploreTimeline() {
  const { user, country } = useAuth();
  const disabledActions = !user; // guest ise aksiyonlar kapalı
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [countryName, setCountryName] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('top'); // top | recent
  const [tab, setTab] = useState('for-you'); // for-you | latest
  const [view, setView] = useState('grid'); // grid | list
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  // Removed: EN-only Procedure/Symptom state and helpers (panel dropped)

  const { items, hasMore, total } = useExploreFeed({
    mode: user ? 'user' : 'guest',
    countryName,
    specialtyFilter: specialty,
    textQuery: query,
    page,
    pageSize: 12,
    sort,
    tab,
  });

  // seçenekler
  const countryOptions = Object.keys(countryCities || {});
  const specialtyOptions = SPECIALTIES;

  // Konum izni (opsiyonel)
  const [geo, setGeo] = useState(null);
  const askGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeo({ error: true })
    );
  };
  const [askedGeo, setAskedGeo] = useState(false);

  useEffect(() => {
    // Filtre değişince sayfayı başa al
    setPage(1);
  }, [query, specialty, countryName, sort, tab]);

  // Girişliyse, AuthContext.country (örn. 'TR') değerine göre ülke adını otomatik ön seç
  useEffect(() => {
    if (!country || countryName) return;
    const entry = Object.entries(countryCodes).find(([, code]) => (code || '').toLowerCase() === String(country).toLowerCase());
    if (entry) setCountryName(entry[0]);
  }, [country, countryName]);

  // Logged-in users: default to list view (LinkedIn-like)
  useEffect(() => {
    if (user) setView('list');
  }, [user]);

  // Ask for geolocation once on page load
  useEffect(() => {
    if (!askedGeo) {
      setAskedGeo(true);
      askGeo();
    }
  }, [askedGeo]);

  // Sonsuz kaydırma: IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsLoadingMore(true);
        // küçük bir gecikme ile daha akıcı his
        setTimeout(() => {
          setPage((p) => p + 1);
          setIsLoadingMore(false);
        }, 300);
      }
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, items.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başlık + Sekmeler + Sıralama */}
        <TimelineControls
          user={user}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={setView}
          tab={tab}
          onTabChange={setTab}
          onUseLocation={askGeo}
          geo={geo}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Filters (LEFT) */}
          <TimelineFilterSidebar
            query={query}
            onQueryChange={setQuery}
            countryName={countryName}
            onCountryChange={(val)=>{
              if (val === 'Andorra') {
                const ok = window.confirm('Are you there now? Press OK to set Turkey.');
                if (ok) return setCountryName('Turkey');
              }
              setCountryName(val);
            }}
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            countryOptions={countryOptions}
            specialtyOptions={specialtyOptions}
            user={user}
          />

          {/* Feed (RIGHT) */}
          <section className="order-1 lg:order-2">
            {/* Aktif filtre chipleri */}
            <ActiveFilterChips
              items={[
                countryName && { label: `Country: ${countryName}`, onClear: () => setCountryName('') },
                specialty && { label: `Specialization: ${specialty}`, onClear: () => setSpecialty('') },
                query && { label: `Search: “${query}”`, onClear: () => setQuery('') },
              ].filter(Boolean)}
            />
            <div className={`${view==='grid' ? 'grid md:grid-cols-2 gap-6' : 'space-y-4'}`}>
              {items.map((it) => (
                <TimelineCard key={it.id} item={it} disabledActions={disabledActions} view={view} onOpen={() => navigate(`/post/${encodeURIComponent(it.id)}`, { state: { item: it } })} />
              ))}
              {isLoadingMore && [1,2,3].map((i)=>(<SkeletonCard key={`sk-${i}`} />))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-gray-500">Showing {items.length} of {total}</p>
              {hasMore && (
                <>
                  <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm">Load more</button>
                  <span ref={loadMoreRef} className="sr-only">Observer</span>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Popup modal kaldırıldı; detaylar /post/:id sayfasında açılıyor */}
      </div>
    </div>
  );
}
