import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import countryCities from '../data/countryCities';
import countryCodes from '../data/countryCodes';
import TimelineFilterSidebar from 'components/timeline/TimelineFilterSidebar';
import TimelineControls from 'components/timeline/TimelineControls';
import ActiveFilterChips from 'components/timeline/ActiveFilterChips';
import TimelineCard from 'components/timeline/TimelineCard';
import SkeletonCard from 'components/timeline/SkeletonCard';
import SPECIALTIES from '../data/specialties';

// Basit mock feed üretici: guest için random, user için follow-first + location mix simülasyonu

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
      // Tüm içerikleri doktor veya klinik güncellemesi yapıyoruz
      const isDoctor = i % 2 === 0; // Yarısı doktor, yarısı klinik güncellemesi
      const isClinic = !isDoctor;
      
      const doctorUpdates = [
        'We are pleased to announce that our clinic has successfully performed over 500 minimally invasive cardiac procedures this year with a 99% success rate.',
        'Our research team has published a new study on advanced treatment methods in the Journal of Medical Innovation.',
        'We are proud to introduce our new state-of-the-art cardiac catheterization lab for more accurate diagnoses.'
      ];
      
      const clinicUpdates = [
        'We are excited to announce the opening of our new cardiology wing with cutting-edge technology.',
        'Our hospital has been recognized as a Center of Excellence for Cardiac Care.',
        'We are proud to introduce our new patient-centered care program for personalized treatment plans.'
      ];
      
      const updateText = isDoctor 
        ? doctorUpdates[i % doctorUpdates.length]
        : clinicUpdates[i % clinicUpdates.length];
      // build media list (1-4 images) for LinkedIn-like grid
      const mediaPool = [
        { url: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
        { url: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
        { url: '/images/care-team-with-patient_720.jpg' },
        { url: '/images/doctor-explaining_720.jpg' },
      ];
      const mediaCount = 1 + (i % 4); // 1..4
      const media = mediaPool.slice(0, mediaCount);

      items.push({
        id: `it-${i+1}`,
        type: isDoctor ? 'doctor_update' : 'clinic_update',
        title: isDoctor ? `Dr. ${['Ahmet','Ayşe','Mehmet','Elif','Can'][i%5]}` : `${cl}`,
        subtitle: sp,
        city: ct,
        img: i % 2 === 0 ? '/images/petr-magera-huwm7malj18-unsplash_720.jpg' : '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
        text: updateText,
        likes: 20 + (i % 100),
        comments: 2 + (i % 15),
        specialty: sp,
        countryCode: ct.split(', ')[1],
        // LinkedIn-like additions
        actor: {
          id: isDoctor ? `doc-${(i%20)+1}` : `clinic-${(i%20)+1}`,
          role: isDoctor ? 'doctor' : 'clinic',
          name: isDoctor ? ("Dr. " + ['Ahmet','Ayşe','Mehmet','Elif','Can'][i%5]) : cl,
          title: sp,
          avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
        },
        socialContext: i % 5 === 0 ? 'MedGama bunu beğendi' : (i % 7 === 0 ? 'Bir bağlantın bunu beğendi' : ''),
        timeAgo: (1 + (i % 6)) + ' gün',
        visibility: 'public',
        media,
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

  // Konum izni (opsiyonel) - tek seferlik izin akışı ve localStorage ile kalıcılık
  const [geo, setGeo] = useState(null);
  const GEO_KEY = 'explore_geo_consent'; // 'granted' | 'denied'
  const GEO_POS_KEY = 'explore_geo_pos'; // JSON: { lat, lon }

  const askGeo = () => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setGeo(g);
        try {
          localStorage.setItem(GEO_KEY, 'granted');
          localStorage.setItem(GEO_POS_KEY, JSON.stringify(g));
        } catch {}
      },
      () => {
        setGeo({ error: true });
        try { localStorage.setItem(GEO_KEY, 'denied'); } catch {}
      }
    );
  };

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

  // Görünüm sabit: LinkedIn benzeri tek sütun liste

  // Sayfa yüklenince: daha önceki kararı oku; yalnızca kararsızsa sor
  useEffect(() => {
    try {
      const consent = localStorage.getItem(GEO_KEY);
      if (consent === 'granted') {
        const raw = localStorage.getItem(GEO_POS_KEY);
        if (raw) {
          try { setGeo(JSON.parse(raw)); } catch { askGeo(); }
        } else {
          // izin verilmiş ama konum yoksa sessizce yeniden almayı dene (tarayıcı tekrar sormaz)
          askGeo();
        }
      } else if (consent === 'denied') {
        // kullanıcı reddetmiş, otomatik tekrar sorma
      } else {
        // hiç karar yoksa bir kez sor
        askGeo();
      }
    } catch {
      // storage erişimi yoksa varsayılan davranış: bir kez sor
      askGeo();
    }
  }, []);

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
    <div className="min-h-screen bg-[#EEF7F6] pt-0">
      <div className="min-h-screen w-full bg-[#EEF7F6] fixed top-0 left-0 -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-8 relative">
        {/* Başlık + Sekmeler + Sıralama */}
        <div className="mb-1">
          <TimelineControls
            user={user}
            sort={sort}
            onSortChange={setSort}
            onUseLocation={askGeo}
            geo={geo}
            showSort={true}
          />
        </div>

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
            <div className="max-w-[46rem] mx-auto">
              {/* Aktif filtre chipleri */}
              <ActiveFilterChips
                items={[
                  countryName && { label: `Country: ${countryName}`, onClear: () => setCountryName('') },
                  specialty && { label: `Specialization: ${specialty}`, onClear: () => setSpecialty('') },
                  query && { label: `Search: “${query}”`, onClear: () => setQuery('') },
                ].filter(Boolean)}
              />
              <div className={`space-y-3`}>
                {items.map((it) => (
                  <TimelineCard key={it.id} item={it} disabledActions={disabledActions} view={'list'} onOpen={() => navigate(`/post/${encodeURIComponent(it.id)}`, { state: { item: it } })} />
                ))}
                {isLoadingMore && [1,2,3].map((i)=>(<SkeletonCard key={`sk-${i}`} />))}
              </div>
              <div className="flex items-center justify-between mt-5">
                <p className="text-xs text-gray-500">Showing {items.length} of {total}</p>
                {hasMore && (
                  <>
                    <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm">Load more</button>
                    <span ref={loadMoreRef} className="sr-only">Observer</span>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Popup modal kaldırıldı; detaylar /post/:id sayfasında açılıyor */}
      </div>
    </div>
  );
}
