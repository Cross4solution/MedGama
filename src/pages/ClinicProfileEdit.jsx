import React, { useRef, useState, useEffect } from 'react';
import { Save, Building2, MapPin, Info, Image as ImageIcon, Upload, Plus, X, DollarSign, Images, Package, Star, Stethoscope, Activity, Brain, Scissors, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { clinicAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function TagEditor({ label, value = [], onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = (text || '').trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...(value || []), v]);
    setText('');
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    }
  };
  const remove = (idx) => onChange((value || []).filter((_, i) => i !== idx));
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="min-h-[42px] w-full px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white hover:border-gray-300 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all flex flex-wrap gap-1.5">
        {value && value.map((tag, i) => (
          <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium">
            {tag}
            <button type="button" onClick={()=>remove(i)} className="ml-0.5 p-0.5 rounded hover:bg-teal-100 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={()=>{ if (text.trim()) add(); }}
          placeholder={placeholder}
          className="flex-1 min-w-[140px] h-7 px-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

function ServiceModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [department, setDepartment] = useState(initial?.department || '');
  const [icon, setIcon] = useState(initial?.icon || 'Activity');
  const [description, setDescription] = useState(initial?.description || '');
  const [procedures, setProcedures] = useState(initial?.procedures || []);
  const [priceRange, setPriceRange] = useState(initial?.priceRange || '');
  const [duration, setDuration] = useState(initial?.duration || '');
  const [availability, setAvailability] = useState(Array.isArray(initial?.availability) ? initial.availability : []);
  const [tags, setTags] = useState(initial?.tags || []);
  const [languages, setLanguages] = useState(initial?.languages || []);
  const [insurance, setInsurance] = useState(initial?.insurance || []);
  const [visibility, setVisibility] = useState(initial?.visibility !== undefined ? !!initial.visibility : true);

  const toggleAvail = (val) => {
    setAvailability((prev) => prev.includes(val) ? prev.filter((x)=>x!==val) : [...prev, val]);
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{initial ? 'Edit Service' : 'Create Service'}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4"/></button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={name} onChange={(e)=>setName(e.target.value)} className="h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="Service name" />
            <input value={department} onChange={(e)=>setDepartment(e.target.value)} className="h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="Department" />
            <select value={icon} onChange={(e)=>setIcon(e.target.value)} className="h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none">
              <option value="Activity">Activity</option>
              <option value="Stethoscope">Stethoscope</option>
              <option value="Brain">Brain</option>
              <option value="Scissors">Scissors</option>
            </select>
            <input value={priceRange} onChange={(e)=>setPriceRange(e.target.value)} className="h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="₺min - ₺max" />
            <input value={duration} onChange={(e)=>setDuration(e.target.value)} className="h-10 px-3 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="Duration (e.g., 45 min)" />
            <div className="h-10 px-3 border border-gray-200 rounded-xl text-sm flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><input type="checkbox" className="rounded" checked={availability.includes('Onsite')} onChange={()=>toggleAvail('Onsite')} /> Onsite</label>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><input type="checkbox" className="rounded" checked={availability.includes('Telehealth')} onChange={()=>toggleAvail('Telehealth')} /> Telehealth</label>
            </div>
          </div>
          <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="Short description" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TagEditor label="Linked Procedures" value={procedures} onChange={setProcedures} placeholder="Add procedure" />
            <TagEditor label="Tags" value={tags} onChange={setTags} placeholder="Add tag" />
            <TagEditor label="Languages" value={languages} onChange={setLanguages} placeholder="TR, EN" />
            <TagEditor label="Insurance" value={insurance} onChange={setInsurance} placeholder="Insurance" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600"><input type="checkbox" className="rounded" checked={visibility} onChange={(e)=>setVisibility(e.target.checked)} /> Visible</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button type="button" onClick={()=> onSave({ name, department, icon, description, procedures, priceRange, duration, availability, tags, languages, insurance, visibility }) } className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-200/50 transition-all duration-200">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRow({ value = 0 }) {
  const arr = [1,2,3,4,5];
  return (
    <div className="flex items-center gap-0.5">
      {arr.map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= value ? 'text-yellow-500' : 'text-gray-300'}`} fill={i <= value ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

export default function ClinicProfileEdit() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
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
    { id: 's1', name: 'Cardiac Surgery Consultation', department: 'Cardiology', icon: 'Activity', description: 'Initial consultation with cardiac surgeon.', procedures: ['Bypass Evaluation','Valve Assessment'], priceRange: '₺2000 - ₺5000', duration: '45 min', availability: ['Onsite'], tags: ['adult','pre-op'], languages: ['TR','EN'], insurance: ['SGK'], visibility: true, order: 1 },
    { id: 's2', name: 'Oncology Consultation', department: 'Oncology', icon: 'Stethoscope', description: 'Cancer diagnosis, chemo plan.', procedures: ['Chemo Plan'], priceRange: '₺1500 - ₺4000', duration: '30 min', availability: ['Onsite','Telehealth'], tags: ['adult'], languages: ['TR','EN'], insurance: ['Private'], visibility: true, order: 2 },
  ]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
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
  const [reviews, setReviews] = useState([
    { id: 'r1', user: 'Verified Patient', rating: 5, text: 'Excellent care and professional staff.', date: '2025-09-01' },
    { id: 'r2', user: 'Anonymous', rating: 4, text: 'Quick appointment and clear explanations.', date: '2025-08-22' },
    { id: 'r3', user: 'Verified Patient', rating: 3, text: 'Waiting time was a bit long, but overall fine.', date: '2025-07-10' }
  ]);
  const heroInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [mapLat, setMapLat] = useState(41.0082); // Istanbul default
  const [mapLng, setMapLng] = useState(28.9784);

  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin) return;
      const d = e?.data;
      if (d && d.type === 'clinic-map-select' && typeof d.lat === 'number' && typeof d.lng === 'number') {
        setMapLat(d.lat);
        setMapLng(d.lng);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Overview badges (accreditations)
  const [accreditations, setAccreditations] = useState(['JCI Accredited','ISO 9001']);
  const toggleAcc = (label) => setAccreditations((prev)=> prev.includes(label) ? prev.filter(x=>x!==label) : [...prev, label]);

  // Doctors data: name, specialties, and three sets to power Advanced Search
  const [doctorsData, setDoctorsData] = useState([
    {
      id: 'd1',
      name: 'Dr. Example',
      specialties: ['ENT'],
      procedures: ['Sinus Lifting', 'Rhinoplasty'],
      diseases: ['Sinusitis', 'Upper Respiratory Infection'],
      symptoms: ['Headache', 'Nausea']
    }
  ]);

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

  // Load clinic data from API on mount
  useEffect(() => {
    if (!user?.clinic_id) return;
    clinicAPI.getByCodename(user.clinic_id).then(res => {
      const c = res?.clinic || res;
      if (c) {
        setForm(prev => ({
          ...prev,
          name: c.fullname || c.name || prev.name,
          location: c.address || prev.location,
          aboutP1: c.biography || prev.aboutP1,
          logo: c.avatar || prev.logo,
        }));
        if (c.address) setAddress(c.address);
        if (c.website) setMapUrl(c.website);
      }
    }).catch(() => {});
  }, [user?.clinic_id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      if (user?.clinic_id) {
        await clinicAPI.update(user.clinic_id, {
          fullname: form.name,
          address: address,
          biography: form.aboutP1 + (form.aboutP2 ? '\n\n' + form.aboutP2 : ''),
          website: mapUrl || undefined,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save clinic profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/50">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Clinic Profile</h1>
            <p className="text-[11px] text-gray-400 font-medium">Manage your clinic information and services</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-gray-100">
          <nav className="flex overflow-x-auto gap-1 scrollbar-hide -mb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'services', label: 'Services' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'location', label: 'Location' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'packages', label: 'Packages' },
            ].map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} type="button" className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${tab===t.id ? 'text-teal-700 border-teal-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}>{t.label}</button>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 p-5 md:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Overview */}
            {tab === 'overview' && (
            <>
              {/* Branding (Logo & Background) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      {(logoUrl || form.logo) ? (
                        <img src={logoUrl || form.logo} alt="logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <input ref={logoInputRef} onChange={(e)=>onSelectFile(e,'logo')} type="file" accept="image/*" className="hidden" />
                      <button type="button" onClick={()=>logoInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"><Upload className="w-3.5 h-3.5"/> Upload</button>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Background Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-full h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      {(heroPreview || form.heroImage) ? (
                        <img src={heroPreview || form.heroImage} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="shrink-0">
                      <input ref={heroInputRef} onChange={(e)=>onSelectFile(e,'hero')} type="file" accept="image/*" className="hidden" />
                      <button type="button" onClick={()=>heroInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"><Upload className="w-3.5 h-3.5"/> Upload</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">About Clinic</label>
                <textarea value={form.aboutP1} name="aboutP1" onChange={onChange} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm hover:border-gray-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none" placeholder="About the clinic" />
              </div>

              <div className="mt-5">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Accreditations</label>
                <div className="flex flex-wrap gap-2">
                  {['JCI Accredited','ISO 9001','Ministry of Health','Health Tourism'].map((lab)=> (
                    <label key={lab} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-200 ${accreditations.includes(lab) ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}>
                      <input type="checkbox" className="hidden" checked={accreditations.includes(lab)} onChange={()=>toggleAcc(lab)} />
                      {lab}
                    </label>
                  ))}
                </div>

                {/* Preview chips */}
                {accreditations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {accreditations.map((lab)=> (
                      <span key={lab} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200/60 text-xs font-medium text-gray-600 bg-gray-50/80">{lab}</span>
                    ))}
                  </div>
                )}
              </div>
            </>) }

            {/* Services Tab */}
            {tab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Services</h2>
                  <button type="button" onClick={()=> { setEditingService(null); setServiceModalOpen(true); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Plus className="w-4 h-4"/> Add Service</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((s, idx) => (
                    <div key={s.id} className="p-4 rounded-xl border bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{s.name || 'Untitled Service'}</span>
                            <span className="text-xs text-gray-600">· {s.department || '—'}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {s.priceRange && <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50">{s.priceRange}</span>}
                            {Array.isArray(s.availability) && s.availability.map((a)=> (
                              <span key={a} className="text-xs px-2 py-0.5 rounded-full border bg-gray-50">{a}</span>
                            ))}
                            {s.visibility === false && <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-700">Hidden</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button type="button" onClick={()=> { setEditingService({ data: s, index: idx }); setServiceModalOpen(true); }} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Edit</button>
                          <button type="button" onClick={()=> setServices((arr)=> arr.filter((_,i)=> i!==idx))} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {services.length === 0 && <div className="text-sm text-gray-500">No services yet.</div>}

                {serviceModalOpen && (
                  <ServiceModal
                    initial={editingService?.data || null}
                    onClose={()=> setServiceModalOpen(false)}
                    onSave={(val)=>{
                      if (editingService) {
                        setServices((arr)=> arr.map((x,i)=> i===editingService.index ? { ...x, ...val } : x));
                      } else {
                        setServices((arr)=> [...arr, { id: `s${Date.now()}`, order: (arr[arr.length-1]?.order||0)+1, ...val }]);
                      }
                      setServiceModalOpen(false);
                      setEditingService(null);
                    }}
                  />
                )}
              </div>
            )}


            {/* Reviews Tab */}
            {tab === 'reviews' && (
              <div className="space-y-3">
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl border bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{r.user}</span>
                            <span className="text-xs text-gray-500">{r.date}</span>
                          </div>
                          <div className="mt-1"><StarRow value={r.rating} /></div>
                          <p className="text-sm text-gray-700 mt-1">{r.text}</p>
                        </div>
                        <div>
                          <button type="button" onClick={()=> alert('Reported (demo)')} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">Report</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && <div className="text-sm text-gray-500">No reviews yet.</div>}
                </div>
              </div>
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
              <div>
                {(() => {
                  const lat = mapLat;
                  const lng = mapLng;
                  const html = `<!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset=\"utf-8\" />
                      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
                      <link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\" crossorigin=\"\" />
                      <style>html,body,#map{height:100%;margin:0}</style>
                    </head>
                    <body>
                      <div id=\"map\"></div>
                      <script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\" crossorigin=\"\"></script>
                      <script>
                        var map = L.map('map').setView([${lat}, ${lng}], 14);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
                        var marker = L.marker([${lat}, ${lng}], {draggable: true}).addTo(map);
                        function report(lat,lng){
                          try { parent.postMessage({ type: 'clinic-map-select', lat: lat, lng: lng }, '*'); } catch(e) {}
                        }
                        map.on('click', function(ev){
                          var p = ev.latlng; marker.setLatLng(p); report(p.lat, p.lng);
                        });
                        marker.on('dragend', function(ev){ var p = ev.target.getLatLng(); report(p.lat, p.lng); });
                      </script>
                    </body>
                    </html>`;
                  return (
                    <div className="rounded-xl border overflow-hidden">
                      <iframe title="clinic-map" srcDoc={html} className="w-full h-[360px] border-0" />
                      <div className="px-3 py-2 text-xs text-gray-600">Lat: {lat.toFixed(5)} · Lng: {lng.toFixed(5)}</div>
                    </div>
                  );
                })()}
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

            {tab !== 'reviews' && (
              <div className="space-y-3">
                {saveError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">{saveError}</div>}
                {saveSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Profile saved successfully!</div>}
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-200/50 hover:shadow-lg transition-all duration-200 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
