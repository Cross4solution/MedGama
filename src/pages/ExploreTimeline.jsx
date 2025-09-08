import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import CountryCombobox from '../components/CountryCombobox';
import SelectCombobox from '../components/SelectCombobox';
import { Heart, MessageCircle, Search, MapPin, ArrowDownWideNarrow, Share2, Bookmark } from 'lucide-react';
import countryCities from '../data/countryCities';
import countryCodes from '../data/countryCodes';

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

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="h-40 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mt-3" />
        <div className="h-8 bg-gray-100 rounded w-1/2 ml-auto" />
      </div>
    </div>
  );
}

function Card({ item, disabledActions, view = 'grid', onOpen }) {
  const avatarUrl = item.avatar || '/images/portrait-candid-male-doctor_720.jpg';
  return (
    <article className={`group rounded-2xl border border-gray-100 bg-white shadow-md hover:shadow-xl transition overflow-hidden`}>
      {/* Büyük görsel */}
      <div className={`relative h-60 overflow-hidden`}>
        <img src={item.img} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {item.specialty}
          </span>
        </div>
      </div>

      {/* Başlık satırı (avatar + başlık + konum) */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <img src={avatarUrl} alt={item.title} className="w-12 h-12 rounded-full object-cover border" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate" title={item.title}>{item.title}</h3>
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" /> {item.city}
            </p>
          </div>
        </div>

        {/* İçerik metni daha görünür */}
        <p className="mt-3 text-[15px] leading-6 text-gray-800 line-clamp-3">{item.text}</p>

        {/* Aksiyon barı */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span className="inline-flex items-center gap-1" aria-label="likes"><Heart className="w-4 h-4" />{item.likes}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-gray-300" />
            <span className="inline-flex items-center gap-1" aria-label="comments"><MessageCircle className="w-4 h-4" />{item.comments}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 shadow-sm">
            <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to like' : 'Like'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`}>
              <Heart className="w-4 h-4" />
            </button>
            <button type="button" disabled={disabledActions} aria-label={disabledActions ? 'Login to comment' : 'Comment'} className={`p-1.5 rounded-full transition ${disabledActions ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-teal-700'}`}>
              <MessageCircle className="w-4 h-4" />
            </button>
            <button type="button" aria-label="Share" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700">
              <Share2 className="w-4 h-4" />
            </button>
            <button type="button" aria-label="Save" className="p-1.5 rounded-full transition text-gray-600 hover:bg-gray-100 hover:text-teal-700">
              <Bookmark className="w-4 h-4" />
            </button>
            <button type="button" onClick={onOpen} className="ml-0.5 px-2.5 py-1.5 rounded-full text-xs text-gray-700 hover:bg-gray-100">
              Read more
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ExploreTimeline() {
  const { user, country } = useAuth();
  const disabledActions = !user; // guest ise aksiyonlar kapalı

  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [countryName, setCountryName] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('top'); // top | recent
  const [tab, setTab] = useState('for-you'); // for-you | latest
  const [view, setView] = useState('grid'); // grid | list
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const loadMoreRef = useRef(null);

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
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Explore Timeline</h1>
              <p className="text-sm text-gray-600">{user ? 'Takip ettiklerin öncelikli, lokasyon önerileri karışık.' : 'Login olmadan rastgele içerikleri keşfet.'}</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <ArrowDownWideNarrow className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select value={sort} onChange={(e)=>setSort(e.target.value)} className="pl-9 pr-3 py-2 text-sm border rounded-lg bg-white">
                  <option value="top">Top</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 overflow-hidden">
                <button onClick={()=>setView('list')} className={`px-2 py-1 text-sm ${view==='list' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>List</button>
                <button onClick={()=>setView('grid')} className={`px-2 py-1 text-sm ${view==='grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>Grid</button>
              </div>
              <button onClick={askGeo} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">Use my location</button>
              {geo?.lat && <span className="text-xs text-gray-500">{geo.lat.toFixed(2)},{geo.lon.toFixed(2)}</span>}
            </div>
          </div>
          {/* Sekmeler */}
          <div className="mt-4 border-b">
            <nav className="flex gap-2">
              <button onClick={()=>setTab('for-you')} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab==='for-you' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>For You</button>
              <button onClick={()=>setTab('latest')} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab==='latest' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Latest</button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Feed */}
          <section>
            {/* Aktif filtre chipleri */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {countryName && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border text-gray-700">Country: {countryName}<button onClick={()=>setCountryName('')} className="ml-1 text-gray-500 hover:text-gray-700">✕</button></span>}
              {specialty && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border text-gray-700">Specialization: {specialty}<button onClick={()=>setSpecialty('')} className="ml-1 text-gray-500 hover:text-gray-700">✕</button></span>}
              {query && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border text-gray-700">Search: “{query}”<button onClick={()=>setQuery('')} className="ml-1 text-gray-500 hover:text-gray-700">✕</button></span>}
            </div>
            <div className={`${view==='grid' ? 'grid md:grid-cols-2 gap-6' : 'space-y-4'}`}>
              {items.map((it) => (
                <Card key={it.id} item={it} disabledActions={disabledActions} view={view} onOpen={() => setActivePost(it)} />
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

          {/* Filters */}
          <aside className="space-y-4 lg:sticky lg:top-24 h-max">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search in timeline..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Country</h3>
              <CountryCombobox
                options={countryOptions}
                value={countryName}
                onChange={setCountryName}
                placeholder="All countries"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Specialization</h3>
              <SelectCombobox
                options={specialtyOptions}
                value={specialty}
                onChange={setSpecialty}
                placeholder="All"
                hideChevron
                triggerClassName={`w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left`}
              />
            </div>

            {!user && (
              <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-xl p-4 text-sm">
                Login yaparsan like/comment/follow aktif olur ve takip ettiklerin öncelikli görünür.
              </div>
            )}
          </aside>
        </div>

        {/* Full content modal */}
        {activePost && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setActivePost(null)} />
            <div role="dialog" aria-modal="true" className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b flex items-center gap-3">
                  <img src={activePost.avatar || '/images/portrait-candid-male-doctor_720.jpg'} alt={activePost.title} className="w-10 h-10 rounded-full object-cover border" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate" title={activePost.title}>{activePost.title}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {activePost.city}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">{activePost.specialty}</span>
                  <button onClick={() => setActivePost(null)} aria-label="Close" className="ml-2 p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50">✕</button>
                </div>
                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto">
                  {activePost.img && (
                    <div className="h-64 bg-gray-50 overflow-hidden">
                      <img src={activePost.img} alt={activePost.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-base leading-7 text-gray-800 whitespace-pre-wrap">{activePost.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
