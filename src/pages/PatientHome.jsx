import React, { useState } from 'react';
import TimelineFeed from '../components/TimelineFeed';
import Header from '../components/Header';
import TimelinePreview from '../components/TimelinePreview';

export default function PatientHome() {
  // Hızlı Arama alanları
  const [quickCountry, setQuickCountry] = useState('');
  const [quickCity, setQuickCity] = useState('');
  const [quickBranch, setQuickBranch] = useState('');
  const [quickName, setQuickName] = useState(''); // klinik/doktor adı

  const popularClinics = [
    { id: 1, name: 'SmileCare Clinic', city: 'İzmir', dept: 'Diş', rating: 4.8, price: '₺8.000+' },
    { id: 2, name: 'AestheticPlus', city: 'İstanbul', dept: 'Plastik Cerrahi', rating: 4.7, price: '₺25.000+' },
    { id: 3, name: 'Vision Center', city: 'Ankara', dept: 'Göz', rating: 4.6, price: '₺12.000+' },
  ];

  const onQuick = () => {
    // TODO: hook to clinics route with params
    // eslint-disable-next-line no-console
    console.log('quick', {
      country: quickCountry,
      city: quickCity,
      branch: quickBranch,
      name: quickName,
    });
  };

  // Detaylı Arama alanları
  const [advCountry, setAdvCountry] = useState('');
  const [advCity, setAdvCity] = useState('');
  const [advBranch, setAdvBranch] = useState('');
  const [advName, setAdvName] = useState('');

  const onAdvanced = () => {
    // TODO: hook to clinics route with params
    // eslint-disable-next-line no-console
    console.log('advanced', {
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

      {/* Toolbar directly under header - left aligned */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-3 text-sm">
          <a href="/timeline" className="px-3 py-1.5 rounded border border-gray-300 text-gray-800 hover:bg-gray-50">Timeline</a>
          <a href="#timeline" className="px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:bg-gray-50">Preview</a>
        </div>
      </div>

      {/* Timeline preview section with its own vertical scroll */}
      <section id="timeline" className="py-6 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-xl border bg-white p-4">
            {/* fixed height, inner scrollable area */}
            <div className="h-96 overflow-y-auto pr-2">
              <TimelineFeed />
            </div>
          </div>
        </div>
      </section>

      {/* Professional Timeline Cards Preview */}
      <TimelinePreview columns={3} />

      {/* Clinic Search */}
      <section className="py-8 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Clinic Search</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <input value={quickCountry} onChange={(e)=>setQuickCountry(e.target.value)} placeholder="Ülke" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={quickCity} onChange={(e)=>setQuickCity(e.target.value)} placeholder="Şehir" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={quickBranch} onChange={(e)=>setQuickBranch(e.target.value)} placeholder="Branş" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={quickName} onChange={(e)=>setQuickName(e.target.value)} placeholder="Klinik/Doktor adı" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={onQuick} className="bg-teal-600 text-white rounded-lg text-sm px-4 py-2 hover:bg-teal-700">Ara</button>
          </div>
        </div>
      </section>

      {/* Custom Search */}
      <section className="py-8 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Custom Search</h2>
          <div className="grid md:grid-cols-5 gap-3">
            <input value={advCountry} onChange={(e)=>setAdvCountry(e.target.value)} placeholder="Ülke" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={advCity} onChange={(e)=>setAdvCity(e.target.value)} placeholder="Şehir" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={advBranch} onChange={(e)=>setAdvBranch(e.target.value)} placeholder="Branş" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={advName} onChange={(e)=>setAdvName(e.target.value)} placeholder="Klinik/Doktor adı" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={onAdvanced} className="bg-gray-900 text-white rounded-lg text-sm px-4 py-2 hover:bg-black">Ara</button>
          </div>
        </div>
      </section>

      {/* Popular Clinics */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popüler Klinikler</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularClinics.map((c)=> (
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
          <div>{new Date().getFullYear()} MediTravel</div>
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
