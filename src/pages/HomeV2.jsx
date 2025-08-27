import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import TimelinePreview from '../components/TimelinePreview';

export default function HomeV2() {
  // Hızlı arama alanları
  const [quickCountry, setQuickCountry] = useState('');
  const [quickCity, setQuickCity] = useState('');
  const [quickBranch, setQuickBranch] = useState('');
  const [quickName, setQuickName] = useState('');

  // Detaylı arama alanları
  const [advCountry, setAdvCountry] = useState('');
  const [advCity, setAdvCity] = useState('');
  const [advBranch, setAdvBranch] = useState('');
  const [advName, setAdvName] = useState('');

  // Login dropdown state + outside click close
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const departments = ['Diş', 'Plastik Cerrahi', 'Göz', 'Ortopedi', 'Dermatoloji', 'Kardiyoloji'];

  const features = [
    { title: 'Onaylı Klinikler', desc: 'Güvenilir ve denetlenmiş sağlık kurumları.' },
    { title: 'Şeffaf Fiyat', desc: 'Net fiyatlandırma ve sürpriz yok.' },
    { title: '24/7 Destek', desc: 'Soru ve ihtiyaçlara anında destek.' },
    { title: 'Telehealth', desc: 'Online görüşmelerle ön değerlendirme.' },
  ];

  const popularClinics = [
    { id: 1, name: 'SmileCare Clinic', city: 'İzmir', dept: 'Diş', rating: 4.8, price: '₺8.000+' },
    { id: 2, name: 'AestheticPlus', city: 'İstanbul', dept: 'Plastik Cerrahi', rating: 4.7, price: '₺25.000+' },
    { id: 3, name: 'Vision Center', city: 'Ankara', dept: 'Göz', rating: 4.6, price: '₺12.000+' },
    { id: 4, name: 'OrthoLife', city: 'Bursa', dept: 'Ortopedi', rating: 4.5, price: '₺18.000+' },
  ];

  const onQuickSearch = () => {
    // Not: Şimdilik sadece console. Sonraki sprintte /search rotasına yönlendiririz.
    // eslint-disable-next-line no-console
    console.log('Quick search:', {
      country: quickCountry,
      city: quickCity,
      branch: quickBranch,
      name: quickName,
    });
  };

  const onAdvancedSearch = () => {
    // eslint-disable-next-line no-console
    console.log('Advanced search:', {
      country: advCountry,
      city: advCity,
      branch: advBranch,
      name: advName,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Global Header */}
      <Header />

      {/* Hero / Slogan */}
      <section className="bg-gradient-to-br from-teal-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Sağlık seyahatini kolaylaştır.
              </h1>
              <p className="mt-4 text-gray-600 md:text-lg">Onaylı kliniklerle hızlıca eşleş, fiyat ve uygunlukları kıyasla, online randevunu ayarla.</p>
              <div className="mt-6 flex gap-3">
                <a href="#search" className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 text-sm">Hızlı Arama</a>
                <a href="#features" className="px-4 py-2 rounded border text-sm">Özelliklere Bak</a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="aspect-video rounded-xl bg-white shadow-inner border border-gray-100"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="features" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded bg-teal-100 mb-3" />
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hızlı Arama (çoklu textbox) */}
      <section id="search" className="py-10 bg-gray-50 border-y">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Arama</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <input value={quickCountry} onChange={(e)=>setQuickCountry(e.target.value)} placeholder="Ülke" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={quickCity} onChange={(e)=>setQuickCity(e.target.value)} placeholder="Şehir" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={quickBranch} onChange={(e)=>setQuickBranch(e.target.value)} placeholder="Branş" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={quickName} onChange={(e)=>setQuickName(e.target.value)} placeholder="Klinik/Doktor adı" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={onQuickSearch} className="bg-teal-600 text-white rounded-lg text-sm px-4 py-2 hover:bg-teal-700">Ara</button>
          </div>
        </div>
      </section>

      {/* Detaylı Arama (çoklu textbox) */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaylı Arama</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <input value={advCountry} onChange={(e)=>setAdvCountry(e.target.value)} placeholder="Ülke" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={advCity} onChange={(e)=>setAdvCity(e.target.value)} placeholder="Şehir" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={advBranch} onChange={(e)=>setAdvBranch(e.target.value)} placeholder="Branş" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={advName} onChange={(e)=>setAdvName(e.target.value)} placeholder="Klinik/Doktor adı" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={onAdvancedSearch} className="bg-gray-900 text-white rounded-lg text-sm px-4 py-2 hover:bg-black">Ara</button>
          </div>
        </div>
      </section>

      {/* Timeline Önizleme */}
      <TimelinePreview columns={3} />

      {/* Popüler Klinikler */}
      <section id="popular" className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Popüler Klinikler</h2>
            <a href="#" className="text-sm text-teal-700 hover:underline">Tümünü Gör</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularClinics.map((c) => (
              <div key={c.id} className="rounded-xl border bg-white p-4 hover:shadow-md transition">
                <div className="h-28 rounded-lg bg-gray-100 mb-3" />
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-600">{c.city} • {c.dept}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-amber-600">★ {c.rating}</span>
                  <span className="text-gray-700">{c.price}</span>
                </div>
                <button className="mt-3 w-full text-sm bg-teal-600 text-white py-1.5 rounded hover:bg-teal-700">Detay</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-3">
          <div> {new Date().getFullYear()} MediTravel</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-gray-900" href="#">KVKK</a>
            <a className="hover:text-gray-900" href="#">Gizlilik</a>
            <a className="hover:text-gray-900" href="#">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
