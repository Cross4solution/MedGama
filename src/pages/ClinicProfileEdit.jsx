import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Building2, MapPin, Info, Image as ImageIcon, Upload, Plus, X, Images, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReportReviewModal from '../components/reviews/ReportReviewModal';

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
  const isClinic = user?.role === 'clinic';

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReview, setReportReview] = useState(null);

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
  const [gallery, setGallery] = useState([]); // {url,name}
  const [address, setAddress] = useState('Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul');
  const [mapUrl, setMapUrl] = useState('https://maps.google.com/?q=Istanbul+Turkey');
  const [pricing, setPricing] = useState([
    { id: 'pr1', service: 'Consultation', range: '₺200 - ₺500' },
    { id: 'pr2', service: 'Cardiac Surgery', range: '₺50K - ₺150K' },
    { id: 'pr3', service: 'Oncology Treatment', range: '₺30K - ₺200K' },
  ]);
  const [publications, setPublications] = useState([]);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState([]);
  const addBeforeAfterPair = () => setBeforeAfterPairs((prev) => ([
    ...prev,
    { id: `ba${Date.now()}`, beforeUrl: '', beforeName: '', afterUrl: '', afterName: '' }
  ]));
  const onBeforeAfterFile = (idx, side, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBeforeAfterPairs((prev) => prev.map((p, i) => {
      if (i !== idx) return p;
      if (side === 'before') return { ...p, beforeUrl: url, beforeName: file.name };
      return { ...p, afterUrl: url, afterName: file.name };
    }));
    e.target.value = null;
  };
  const removeBeforeAfterPair = (idx) => setBeforeAfterPairs((prev) => prev.filter((_, i) => i !== idx));
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
  const [accreditations, setAccreditations] = useState([]);
  const removeAcc = (label) => setAccreditations((prev) => prev.filter((x) => x !== label));
  const [customAcc, setCustomAcc] = useState('');
  const addCustomAcc = () => {
    const label = (customAcc || '').trim();
    if (!label) return;
    setAccreditations((prev) => {
      const exists = prev.some((x) => x.toLowerCase() === label.toLowerCase());
      return exists ? prev : [...prev, label];
    });
    setCustomAcc('');
  };

  const [accreditationDocs, setAccreditationDocs] = useState([]);
  const accDocsInputRef = useRef(null);
  const addAccreditationDocs = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items = files.map((f) => ({
      id: `accdoc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: f.name,
      type: f.type,
      url: URL.createObjectURL(f)
    }));
    setAccreditationDocs((prev) => [...prev, ...items]);
    e.target.value = null;
  };
  const removeAccreditationDoc = (id) => setAccreditationDocs((prev) => prev.filter((d) => d.id !== id));

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
    const items = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name, type: f.type }));
    setGallery((prev) => [...prev, ...items]);
    e.target.value = null;
  };
  const removeGalleryImage = (idx) => setGallery((prev) => prev.filter((_, i) => i !== idx));

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

        {isClinic && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Public clinic profile</p>
              <p className="text-xs text-gray-600 mt-0.5">
                View how your clinic profile appears to patients on MedStream.
              </p>
            </div>
            <Link
              to="/clinic"
              state={{ accreditations, accreditationDocs }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
            >
              View clinic profile
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'prices', label: 'Prices' },
            { id: 'reviews', label: 'Reviews' },
            { id: 'publications', label: 'Publications' },
            { id: 'gallery', label: 'Gallery' },
            { id: 'location', label: 'Location' },
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} type="button" className={`px-3 py-1.5 text-sm border-b-2 transition-colors ${tab===t.id ? 'text-[#1C6A83] border-[#1C6A83]' : 'text-gray-700 border-transparent hover:text-[#1C6A83] hover:border-[#1C6A83]'}`}>{t.label}</button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Overview */}
            {tab === 'overview' && (
            <>
              {/* Branding (Logo & Background) */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden">
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                  <div className="flex items-center gap-3">
                    <div className="w-full h-24 rounded-lg bg-gray-50 border flex items-center justify-center overflow-hidden">
                      {(heroPreview || form.heroImage) ? (
                        <img src={heroPreview || form.heroImage} alt="cover" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="shrink-0">
                      <input ref={heroInputRef} onChange={(e)=>onSelectFile(e,'hero')} type="file" accept="image/*" className="hidden" />
                      <button type="button" onClick={()=>heroInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"><Upload className="w-4 h-4"/> Upload</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Clinic</label>
                  <textarea value={form.aboutP1} name="aboutP1" onChange={onChange} rows={3} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="About the clinic" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Accreditations</label>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={customAcc}
                    onChange={(e)=>setCustomAcc(e.target.value)}
                    onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); addCustomAcc(); } }}
                    type="text"
                    className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border text-sm bg-white"
                    placeholder="Add accreditation"
                  />
                  <button
                    type="button"
                    onClick={addCustomAcc}
                    className="inline-flex items-center px-3 py-2 rounded-xl border text-sm bg-white hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>

                {/* Preview chips */}
                {accreditations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {accreditations.map((lab)=> (
                      <span key={lab} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-gray-50">
                        {lab}
                        <button type="button" onClick={() => removeAcc(lab)} className="-mr-1 text-gray-500 hover:text-gray-700">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accreditation Documents</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={accDocsInputRef}
                      onChange={addAccreditationDocs}
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => accDocsInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
                    >
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                    <span className="text-xs text-gray-500">PDF or image</span>
                  </div>

                  {accreditationDocs.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {accreditationDocs.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border bg-white">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{d.name}</div>
                            <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-[#1C6A83] hover:underline">View</a>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAccreditationDoc(d.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 text-xs"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>) }

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
                          <button
                            type="button"
                            onClick={() => { setReportReview(r); setReportOpen(true); }}
                            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                          >
                            Reports
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && <div className="text-sm text-gray-500">No reviews yet.</div>}
                </div>

                <ReportReviewModal
                  open={reportOpen}
                  onClose={() => { setReportOpen(false); setReportReview(null); }}
                  review={reportReview}
                />
              </div>
            )}

            {tab === 'publications' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Publications</h2>
                  <button
                    type="button"
                    onClick={()=> setPublications((p)=> [...p, { id: `pub${Date.now()}`, title: '', docName: '', docUrl: '', docType: '' }])}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    <Plus className="w-4 h-4"/> Add Publication
                  </button>
                </div>
                <div className="space-y-3">
                  {publications.map((p, idx) => (
                    <div key={p.id} className="p-3 rounded-xl border bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          value={p.title}
                          onChange={(e)=> setPublications((arr)=> arr.map((x,i)=> i===idx ? { ...x, title: e.target.value } : x))}
                          className="h-10 px-3 border rounded-lg text-sm"
                          placeholder="Title"
                        />
                        <div className="md:col-span-2 flex items-center gap-2 min-w-0">
                          <input
                            id={`pub-doc-${idx}`}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e)=>{
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = URL.createObjectURL(file);
                              setPublications((arr)=> arr.map((x,i)=> i===idx ? { ...x, docName: file.name, docUrl: url, docType: file.type } : x));
                              e.target.value = null;
                            }}
                          />
                          <label
                            htmlFor={`pub-doc-${idx}`}
                            className="shrink-0 inline-flex items-center gap-2 px-3 h-10 rounded-lg border bg-white hover:bg-gray-50 text-sm cursor-pointer"
                          >
                            <Upload className="w-4 h-4" /> {p.docUrl ? 'Change PDF' : 'Upload Files'}
                          </label>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-sm text-gray-700 truncate">{p.docName || 'No file selected'}</div>
                              {p.docUrl && (
                                <a href={p.docUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm text-[#1C6A83] hover:underline">View</a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={()=> setPublications((arr)=> arr.filter((_,i)=> i!==idx))}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {publications.length === 0 && <div className="text-sm text-gray-500">No publications yet.</div>}
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {tab === 'gallery' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Gallery</h2>
                  <div>
                    <input ref={galleryInputRef} onChange={addGalleryImages} type="file" accept="image/*,video/*" multiple className="hidden" />
                    <button type="button" onClick={()=>galleryInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"><Images className="w-4 h-4"/> Add Files</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map((g, idx) => (
                    <div key={`${g.url}-${idx}`} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                      {String(g?.type || '').startsWith('video/') ? (
                        <video src={g.url} controls className="w-full h-28 object-cover" />
                      ) : (
                        <img src={g.url} alt={g.name||'file'} className="w-full h-28 object-cover" />
                      )}
                      <button type="button" onClick={()=>removeGalleryImage(idx)} className="absolute top-2 right-2 bg-white/90 hover:bg-white border rounded-full p-1 shadow"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {gallery.length === 0 && <div className="text-sm text-gray-500">No images yet.</div>}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-900">Before & After</h2>
                    <button type="button" onClick={addBeforeAfterPair} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                      <Plus className="w-4 h-4"/> Add Pair
                    </button>
                  </div>

                  <div className="space-y-3">
                    {beforeAfterPairs.map((pair, idx) => (
                      <div key={pair.id} className="p-3 rounded-xl border bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-2">Before</div>
                            <input id={`ba-before-${idx}`} type="file" accept="image/*" className="hidden" onChange={(e)=>onBeforeAfterFile(idx,'before',e)} />
                            <div className="rounded-xl border bg-gray-50 overflow-hidden">
                              {pair.beforeUrl ? (
                                <img src={pair.beforeUrl} alt={pair.beforeName || 'before'} className="w-full h-40 object-cover" />
                              ) : (
                                <div className="h-40 flex items-center justify-center text-xs text-gray-500">No image</div>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-500 truncate">{pair.beforeName || '—'}</div>
                              <label htmlFor={`ba-before-${idx}`} className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs cursor-pointer">
                                <Upload className="w-3.5 h-3.5" /> Upload
                              </label>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-2">After</div>
                            <input id={`ba-after-${idx}`} type="file" accept="image/*" className="hidden" onChange={(e)=>onBeforeAfterFile(idx,'after',e)} />
                            <div className="rounded-xl border bg-gray-50 overflow-hidden">
                              {pair.afterUrl ? (
                                <img src={pair.afterUrl} alt={pair.afterName || 'after'} className="w-full h-40 object-cover" />
                              ) : (
                                <div className="h-40 flex items-center justify-center text-xs text-gray-500">No image</div>
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-500 truncate">{pair.afterName || '—'}</div>
                              <label htmlFor={`ba-after-${idx}`} className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs cursor-pointer">
                                <Upload className="w-3.5 h-3.5" /> Upload
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button type="button" onClick={()=>removeBeforeAfterPair(idx)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 text-xs">
                            <X className="w-3 h-3" /> Remove pair
                          </button>
                        </div>
                      </div>
                    ))}

                    {beforeAfterPairs.length === 0 && <div className="text-sm text-gray-500">No before/after items yet.</div>}
                  </div>
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
            {tab === 'prices' && (
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

            {tab !== 'reviews' && (
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-[#1C6A83] text-white px-5 py-2.5 rounded-xl hover:bg-[#0F4A5C] disabled:opacity-60">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
