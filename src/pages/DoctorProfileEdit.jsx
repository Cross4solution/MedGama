import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, User, Info, Plus, X, Images, Star, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DoctorAvailabilityEditor from '../components/doctor/DoctorAvailabilityEditor';

function StarRow({ value = 0 }) {
  const arr = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {arr.map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= value ? 'text-yellow-500' : 'text-gray-300'}`}
          fill={i <= value ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

export default function DoctorProfileEdit() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({
    heroImage: '/images/doctor-hero-1_720.jpg',
    name: 'Dr. Ayşe Yılmaz',
    title: 'Cardiologist',
    location: 'Istanbul, Turkey',
    aboutP1:
      "1998 yılında İstanbul Üniversitesi Tıp Fakültesi'nden mezun oldum ve kardiyoloji alanında uzmanlık eğitimimi tamamladım.",
    aboutP2:
      'Hastalarıma en güncel tedavi yöntemlerini sunmak ve onların yaşam kalitesini artırmak önceliğimdir.',
    badge1: 'Board Certified',
    badge2: '15+ Years',
    badge3: 'Publications',
    badge4: 'Patient-Focused',
  });

  const [services, setServices] = useState([
    {
      id: 's1',
      name: 'Coronary Angiography',
      description: 'Imaging and treatment of coronary arteries',
      priceRange: '₺8,000 - ₺15,000',
    },
    {
      id: 's2',
      name: 'Echocardiography',
      description: 'Heart ultrasound imaging',
      priceRange: '₺1,500 - ₺3,000',
    },
  ]);

  const [gallery, setGallery] = useState([]); // {url,name}
  const [reviews] = useState([
    { id: 'r1', user: 'Verified Patient', rating: 5, text: 'Excellent care and professional staff.', date: '2025-09-01' },
    { id: 'r2', user: 'Anonymous', rating: 4, text: 'Quick appointment and clear explanations.', date: '2025-08-22' },
    { id: 'r3', user: 'Verified Patient', rating: 3, text: 'Waiting time was a bit long, but overall fine.', date: '2025-07-10' },
  ]);
  const [saving, setSaving] = useState(false);
  const galleryInputRef = React.useRef(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const addGalleryImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items = files.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setGallery((prev) => [...prev, ...items]);
  };

  const removeGalleryImage = (idx) => setGallery((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // TODO: connect to API
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[#1C6A83]" /> Edit Doctor Profile
        </h1>

        {isDoctor && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Public doctor profile</p>
              <p className="text-xs text-gray-600 mt-0.5">
                View how your professional profile appears to patients on MedStream.
              </p>
            </div>
            <Link
              to="/doctor/doc-1"
              className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
            >
              View doctor profile
            </Link>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-1 mb-2 scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'services', label: 'Services' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'location', label: 'Location' },
              { id: 'availability', label: 'Availability' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'text-[#1C6A83] border-[#1C6A83]'
                    : 'text-gray-700 border-transparent hover:text-[#1C6A83] hover:border-[#1C6A83]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* About paragraph - single field like ClinicProfileEdit */}
              <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">About Doctor</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      This text corresponds to the about section on your public doctor profile.
                    </p>
                  </div>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                  <textarea
                    name="aboutP1"
                    rows={3}
                    value={form.aboutP1}
                    onChange={onChange}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20"
                    placeholder="About the doctor"
                  />
                  <p className="text-xs text-gray-500">
                    Line breaks will be preserved on the public profile (demo only, not persisted).
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#1C6A83] text-white px-5 py-2.5 rounded-xl hover:bg-[#0F4A5C] disabled:opacity-60 text-sm"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save overview'}
                </button>
              </div>
            </div>
          )}

          {tab === 'availability' && (
            <DoctorAvailabilityEditor user={user} />
          )}

          {/* Reviews Tab - static preview similar to clinic edit */}
          {tab === 'reviews' && (
            <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6">
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
                          <div className="mt-1">
                            <StarRow value={r.rating} />
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{r.text}</p>
                        </div>
                        <div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="text-sm text-gray-500">No reviews yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {tab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Services</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Edit the main services and price ranges shown on your doctor profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setServices((prev) => [
                      ...prev,
                      { id: `s${Date.now()}`, name: '', description: '', priceRange: '' },
                    ])
                  }
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs font-medium"
                >
                  <Plus className="w-4 h-4" /> Add service
                </button>
              </div>

              <div className="space-y-3">
                {services.map((s, idx) => (
                  <div key={s.id} className="p-4 rounded-xl border bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-[#1C6A83]" />
                              <input
                                value={s.name}
                                onChange={(e) =>
                                  setServices((arr) =>
                                    arr.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                                  )
                                }
                                placeholder="Service name"
                                className="flex-1 h-9 px-2 border rounded-lg text-sm"
                              />
                            </div>
                            <textarea
                              value={s.description}
                              onChange={(e) =>
                                setServices((arr) =>
                                  arr.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                                )
                              }
                              rows={2}
                              placeholder="Short description"
                              className="w-full border rounded-lg px-2 py-1.5 text-sm resize-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700">Price range</label>
                            <input
                              value={s.priceRange}
                              onChange={(e) =>
                                setServices((arr) =>
                                  arr.map((x, i) => (i === idx ? { ...x, priceRange: e.target.value } : x))
                                )
                              }
                              placeholder="₺min - ₺max"
                              className="w-full h-9 px-2 border rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setServices((arr) => arr.filter((_, i) => i !== idx))
                        }
                        className="mt-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 text-xs"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                {services.length === 0 && (
                  <div className="text-sm text-gray-500">No services yet.</div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#1C6A83] text-white px-5 py-2.5 rounded-xl hover:bg-[#0F4A5C] disabled:opacity-60 text-sm"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save services'}
                </button>
              </div>
            </div>
          )}

          {/* Gallery Tab - styled similar to clinic edit */}
          {tab === 'gallery' && (
            <div className="rounded-2xl border bg-white shadow-sm p-4 md:p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Gallery</h2>
                  <div>
                    <input
                      ref={galleryInputRef}
                      onChange={addGalleryImages}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                    >
                      <Images className="w-4 h-4" /> Add Images
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map((g, idx) => (
                    <div
                      key={`${g.url}-${idx}`}
                      className="relative group rounded-lg overflow-hidden border bg-gray-50"
                    >
                      <img src={g.url} alt={g.name || 'image'} className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white border rounded-full p-1 shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="text-sm text-gray-500">No images yet.</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#1C6A83] text-white px-5 py-2.5 rounded-xl hover:bg-[#0F4A5C] disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Location Tab - Leaflet map similar to clinic edit */}
          {tab === 'location' && (
            <div className="space-y-4">
              {(() => {
                const lat = 41.0082;
                const lng = 28.9784;
                const html = `<!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
                    <style>html,body,#map{height:100%;margin:0}</style>
                  </head>
                  <body>
                    <div id="map"></div>
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
                    <script>
                      var map = L.map('map').setView([${lat}, ${lng}], 14);
                      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
                      var marker = L.marker([${lat}, ${lng}], {draggable: true}).addTo(map);
                    </script>
                  </body>
                  </html>`;
                return (
                  <div className="rounded-xl border overflow-hidden">
                    <iframe title="doctor-map" srcDoc={html} className="w-full h-[360px] border-0" />
                    <div className="px-3 py-2 text-xs text-gray-600">Lat: {lat.toFixed(5)} · Lng: {lng.toFixed(5)}</div>
                  </div>
                );
              })()}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
