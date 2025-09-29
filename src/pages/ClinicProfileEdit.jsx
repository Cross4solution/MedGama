import React, { useRef, useState } from 'react';
import { Save, Building2, MapPin, Info, Image as ImageIcon, Upload, Plus, X, DollarSign, Images, Package, Star, Stethoscope, Activity, Brain, Scissors, Link as LinkIcon } from 'lucide-react';

export default function ClinicProfileEdit() {
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({
    // Hero & basics
    heroImage: '/images/petr-magera-huwm7malj18-unsplash_720.jpg',
    name: 'Anadolu Health Center',
    location: 'Istanbul, Turkey',
    // About
    aboutTitle: 'About Us',
    aboutP1: "Anadolu Health Center is one of Turkey's leading healthcare institutions with 15 years of experience. Our JCI-accredited hospital provides healthcare services at international standards.",
    aboutP2: 'With over 50 specialist doctors and state-of-the-art medical equipment, we offer services in cardiac surgery, oncology, neurology, and plastic surgery.',
    // Optional brand visuals
    logo: '',
  });
  const [services, setServices] = useState([
    { id: 's1', name: 'Cardiac Surgery', icon: 'Activity', description: 'Bypass, valve replacement, arrhythmia surgery' },
    { id: 's2', name: 'Oncology', icon: 'Stethoscope', description: 'Cancer diagnosis, chemotherapy, radiotherapy' },
    { id: 's3', name: 'Neurology', icon: 'Brain', description: 'Neurosurgery, epilepsy treatment' },
    { id: 's4', name: 'Plastic Surgery', icon: 'Scissors', description: 'Aesthetic and reconstructive surgery' },
  ]);
  const [doctorsText, setDoctorsText] = useState('Our expert doctors provide comprehensive care across multiple specialties, focusing on patient safety and outcomes.');
  const [gallery, setGallery] = useState([]); // {url,name}
  const [address, setAddress] = useState('Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul');
  const [mapUrl, setMapUrl] = useState('https://maps.google.com/?q=Istanbul+Turkey');
  const [pricing, setPricing] = useState([
    { id: 'pr1', service: 'Consultation', range: '₺200 - ₺500' },
    { id: 'pr2', service: 'Cardiac Surgery', range: '₺50K - ₺150K' },
    { id: 'pr3', service: 'Oncology Treatment', range: '₺30K - ₺200K' },
  ]);
  const [packages, setPackages] = useState([
    { id: 'p1', name: 'Basic Package', treatment: 'Dental Implant', accommodation: '3 nights hotel', transfer: 'Airport pickup', price: 1500 },
  ]);
  const [saving, setSaving] = useState(false);
  const [heroPreview, setHeroPreview] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const heroInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSelectFile = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (key === 'hero') setHeroPreview(url);
    if (key === 'logo') setLogoUrl(url);
  };

  // services are managed inline in the Services tab (objects with id, name, icon, description)

  const addGalleryImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setGallery((prev) => [...prev, ...items]);
  };
  const removeGalleryImage = (idx) => setGallery((prev) => prev.filter((_, i) => i !== idx));

  const addPackage = () => {
    const name = window.prompt('Package Name');
    if (!name) return;
    setPackages((prev) => ([...prev, { id: `p${Date.now()}`, name, treatment: '', accommodation: '', transfer: '', price: 0 }]));
  };
  const updatePackage = (id, patch) => setPackages((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
  const removePackage = (id) => setPackages((prev) => prev.filter((p) => p.id !== id));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // TODO: API entegrasyonu
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1C6A83]" /> Edit Clinic Profile
        </h1>

        {/* Tabs */}
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'services', label: 'Services' },
            { id: 'doctors', label: 'Doctors' },
            { id: 'reviews', label: 'Reviews' },
            { id: 'gallery', label: 'Gallery' },
            { id: 'location', label: 'Location' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'packages', label: 'Packages' },
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} type="button" className={`px-3 py-1.5 text-sm border-b-2 transition-colors ${tab===t.id ? 'text-[#1C6A83] border-[#1C6A83]' : 'text-gray-700 border-transparent hover:text-[#1C6A83] hover:border-[#1C6A83]'}`}>{t.label}</button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Overview */}
            {tab === 'overview' && (
            <>
            {/* Hero & Branding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-24 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden">
                    {(heroPreview || form.heroImage) ? (
                      <img src={heroPreview || form.heroImage} alt="hero" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={heroInputRef} onChange={(e)=>onSelectFile(e,'hero')} type="file" accept="image/*" className="hidden" />
                    <button type="button" onClick={()=>heroInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"><Upload className="w-4 h-4"/> Upload</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden">
                    {(logoUrl || form.logo) ? (
                      <img src={logoUrl || form.logo} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={logoInputRef} onChange={(e)=>onSelectFile(e,'logo')} type="file" accept="image/*" className="hidden" />
                    <button type="button" onClick={()=>logoInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"><Upload className="w-4 h-4"/> Upload</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Basics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className="w-full h-11 pl-9 pr-3 border rounded-xl text-sm"
                    placeholder="e.g., MedGama Clinic"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={form.location} onChange={onChange} className="w-full h-11 px-3 border rounded-xl text-sm" placeholder="City, Country" />
              </div>
            </div>

            {/* About */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Paragraph 1</label>
                <textarea value={form.aboutP1} name="aboutP1" onChange={onChange} rows={3} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Intro paragraph" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Paragraph 2</label>
                <textarea value={form.aboutP2} name="aboutP2" onChange={onChange} rows={3} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Details paragraph" />
              </div>
            </div>
            </>) }

            {/* Services Tab */}
            {tab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Services</h2>
                  <button type="button" onClick={()=> setServices((p)=> [...p, { id: `s${Date.now()}`, name: '', icon: 'Activity', description: '' }]) } className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus className="w-4 h-4"/> Add Service</button>
                </div>
                <div className="space-y-3">
                  {services.map((s, idx) => (
                    <div key={s.id} className="p-3 rounded-xl border bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <input value={s.name} onChange={(e)=> setServices((arr)=> arr.map((it,i)=> i===idx ? { ...it, name: e.target.value } : it))} className="md:col-span-2 h-10 px-3 border rounded-lg text-sm" placeholder="Service name" />
                        <select value={s.icon} onChange={(e)=> setServices((arr)=> arr.map((it,i)=> i===idx ? { ...it, icon: e.target.value } : it))} className="h-10 px-3 border rounded-lg text-sm">
                          <option value="Activity">Activity</option>
                          <option value="Stethoscope">Stethoscope</option>
                          <option value="Brain">Brain</option>
                          <option value="Scissors">Scissors</option>
                        </select>
                        <input value={s.description} onChange={(e)=> setServices((arr)=> arr.map((it,i)=> i===idx ? { ...it, description: e.target.value } : it))} className="md:col-span-2 h-10 px-3 border rounded-lg text-sm" placeholder="Short description" />
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <button type="button" onClick={()=> setServices((arr)=> arr.filter((_,i)=> i!==idx))} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Remove</button>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && <div className="text-sm text-gray-500">No services yet.</div>}
                </div>
              </div>
            )}

            {/* Doctors Tab */}
            {tab === 'doctors' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctors Intro Text</label>
                <textarea value={doctorsText} onChange={(e)=> setDoctorsText(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Introductory text for the doctors section" />
                <p className="text-sm text-gray-600">Manage your doctors and departments from the <a className="text-[#1C6A83] underline" href="/doctors-departments">Doctors & Departments</a> page.</p>
              </div>
            )}

            {/* Reviews Tab */}
            {tab === 'reviews' && (
              <p className="text-sm text-gray-600">Reviews are user-generated. Moderation tools can be integrated here.</p>
            )}

            {/* Gallery Tab */}
            {tab === 'gallery' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Gallery</h2>
                  <div>
                    <input ref={galleryInputRef} onChange={addGalleryImages} type="file" accept="image/*" multiple className="hidden" />
                    <button type="button" onClick={()=>galleryInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Images className="w-4 h-4"/> Add Images</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map((g, idx) => (
                    <div key={`${g.url}-${idx}`} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                      <img src={g.url} alt={g.name||'image'} className="w-full h-28 object-cover" />
                      <button type="button" onClick={()=>removeGalleryImage(idx)} className="absolute top-2 right-2 bg-white/90 hover:bg-white border rounded-full p-1 shadow"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {gallery.length === 0 && <div className="text-sm text-gray-500">No images yet.</div>}
                </div>
              </div>
            )}

            {/* Location Tab */}
            {tab === 'location' && (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={address} onChange={(e)=> setAddress(e.target.value)} className="w-full h-11 pl-9 pr-3 border rounded-xl text-sm" placeholder="Full address" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Map URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" value={mapUrl} onChange={(e)=> setMapUrl(e.target.value)} className="w-full h-11 pl-9 pr-3 border rounded-xl text-sm" placeholder="https://maps.google.com/?q=..." />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {tab === 'pricing' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Price Ranges</h2>
                  <button type="button" onClick={()=> setPricing((p)=> [...p, { id: `pr${Date.now()}`, service: '', range: '' }]) } className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus className="w-4 h-4"/> Add Item</button>
                </div>
                <div className="space-y-3">
                  {pricing.map((it, idx) => (
                    <div key={it.id} className="p-3 rounded-xl border bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input value={it.service} onChange={(e)=> setPricing((arr)=> arr.map((x,i)=> i===idx ? { ...x, service: e.target.value } : x))} className="h-10 px-3 border rounded-lg text-sm" placeholder="Service" />
                        <input value={it.range} onChange={(e)=> setPricing((arr)=> arr.map((x,i)=> i===idx ? { ...x, range: e.target.value } : x))} className="md:col-span-2 h-10 px-3 border rounded-lg text-sm" placeholder="₺min - ₺max" />
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <button type="button" onClick={()=> setPricing((arr)=> arr.filter((_,i)=> i!==idx))} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Remove</button>
                      </div>
                    </div>
                  ))}
                  {pricing.length === 0 && <div className="text-sm text-gray-500">No price items yet.</div>}
                </div>
              </div>
            )}

            {/* Packages Tab */}
            {tab === 'packages' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Health Tourism Packages</h2>
                  <button type="button" onClick={addPackage} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><img src="/images/icon/archive-up-minimlistic-svgrepo-com.svg" alt="Archive" className="w-4 h-4"/> Create Package</button>
                </div>
                <div className="space-y-3">
                  {packages.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl border bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        <input value={p.name} onChange={(e)=>updatePackage(p.id,{ name: e.target.value })} className="md:col-span-2 h-10 px-3 border rounded-lg text-sm" placeholder="Package Name" />
                        <input value={p.treatment} onChange={(e)=>updatePackage(p.id,{ treatment: e.target.value })} className="h-10 px-3 border rounded-lg text-sm" placeholder="Treatment" />
                        <input value={p.accommodation} onChange={(e)=>updatePackage(p.id,{ accommodation: e.target.value })} className="h-10 px-3 border rounded-lg text-sm" placeholder="Accommodation" />
                        <input value={p.transfer} onChange={(e)=>updatePackage(p.id,{ transfer: e.target.value })} className="h-10 px-3 border rounded-lg text-sm" placeholder="Transfer" />
                        <input value={p.price} onChange={(e)=>updatePackage(p.id,{ price: e.target.value.replace(/[^0-9]/g,'') })} className="h-10 px-3 border rounded-lg text-sm" placeholder="Price" />
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button type="button" onClick={()=>removePackage(p.id)} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Remove</button>
                      </div>
                    </div>
                  ))}
                  {packages.length === 0 && <div className="text-sm text-gray-500">No packages yet.</div>}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-[#1C6A83] text-white px-5 py-2.5 rounded-xl hover:bg-[#0F4A5C] disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
