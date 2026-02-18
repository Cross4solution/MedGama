import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeafletMap from 'components/map/LeafletMap';
import {
  Award,
  Stethoscope,
  Activity,
  Heart,
  CheckCircle,
  Shield,
  Users,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Minus,
  Video,
  Loader2,
  GraduationCap,
  Globe
} from 'lucide-react';
import Tabs from 'components/tabs/Tabs';
import { doctorAPI } from '../lib/api';

const DEFAULT_AVATAR = '/images/default/default-avatar.svg';

const DoctorProfilePage = () => {
  const { id: doctorId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!doctorId) return;
    setLoading(true);
    doctorAPI.get(doctorId).then(res => {
      const d = res?.doctor || res?.data?.doctor;
      if (d) {
        setDoctor(d);
        setProfile(d.doctor_profile || null);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [doctorId]);

  const doctorName = doctor?.fullname || 'Doctor';
  const doctorTitle = profile?.title || profile?.specialty || '';
  const doctorLocation = profile?.address || '';
  const avatarUrl = doctor?.avatar || DEFAULT_AVATAR;
  const bio = profile?.bio || '';
  const experienceYears = profile?.experience_years || '';
  const services = profile?.services || [];
  const prices = profile?.prices || [];
  const gallery = profile?.gallery || [];
  const education = profile?.education || [];
  const certifications = profile?.certifications || [];
  const languages = profile?.languages || [];
  const locationAddress = profile?.address || '';
  const onlineConsultation = profile?.online_consultation || false;

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' },
  ];

  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setGalleryOpen(false);
      if (e.key === 'ArrowLeft') setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length);
      if (e.key === 'ArrowRight') setGalleryIndex(i => (i + 1) % gallery.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [galleryOpen, gallery.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Doctor not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-teal-600 hover:underline font-medium">Go back</button>
      </div>
    );
  }

  const hasProfile = profile && profile.onboarding_completed;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="relative h-40 md:h-48 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Doctor Info Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={doctorName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-teal-100 shadow-sm flex-shrink-0"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{doctorName}</h1>
                  {doctor.is_verified && <CheckCircle className="w-5 h-5 text-teal-500" />}
                </div>
                {doctorTitle && <p className="text-sm text-teal-600 font-medium mb-1.5">{doctorTitle}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {doctorLocation && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" />{doctorLocation}</span>}
                  {experienceYears && <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-gray-400" />{experienceYears} Years</span>}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${isFollowing
                ? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'}`}
            >
              {isFollowing ? (
                <><Minus className="w-4 h-4" /><span>Following</span></>
              ) : (
                <><span>+ Follow</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Not completed profile notice */}
      {!hasProfile && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 font-medium">This doctor hasn't completed their profile yet.</p>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
              <div className="p-5 sm:p-6">
                {/* Overview */}
                {activeTab === 'genel-bakis' && (
                  <div className="space-y-6">
                    {bio ? (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                        <p className="text-sm text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{bio}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No bio available yet.</p>
                    )}

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {doctor.is_verified && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600"><CheckCircle className="w-4.5 h-4.5" /></div>
                          <span className="text-xs font-semibold text-gray-700">Verified</span>
                        </div>
                      )}
                      {experienceYears && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600"><Shield className="w-4.5 h-4.5" /></div>
                          <span className="text-xs font-semibold text-gray-700">{experienceYears} Years</span>
                        </div>
                      )}
                      {onlineConsultation && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600"><Video className="w-4.5 h-4.5" /></div>
                          <span className="text-xs font-semibold text-gray-700">Online</span>
                        </div>
                      )}
                      {languages.length > 0 && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600"><Globe className="w-4.5 h-4.5" /></div>
                          <span className="text-xs font-semibold text-gray-700">{languages.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    {education.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4.5 h-4.5 text-teal-600" /> Education</h3>
                        <div className="space-y-2">
                          {education.map((edu, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><GraduationCap className="w-4 h-4 text-blue-600" /></div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{edu.degree}</div>
                                <div className="text-xs text-gray-500">{edu.school}{edu.year ? ` · ${edu.year}` : ''}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {certifications.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4.5 h-4.5 text-teal-600" /> Certifications</h3>
                        <div className="flex flex-wrap gap-2">
                          {certifications.map((cert, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium border border-violet-100">
                              <Award className="w-3.5 h-3.5" /> {cert.name}{cert.year ? ` (${cert.year})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Services */}
                {activeTab === 'hizmetler' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-gray-900">Services</h3>
                    {services.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {services.map((service, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{service.name}</div>
                              {service.description && <div className="text-xs text-gray-500 mt-0.5">{service.description}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No services listed yet.</p>
                    )}
                  </div>
                )}

                {/* Gallery */}
                {activeTab === 'galeri' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Gallery</h3>
                    {gallery.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2.5">
                          {gallery.map((src, idx) => (
                            <button
                              key={`g-${idx}`}
                              type="button"
                              className="group relative w-full pb-[100%] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                              onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
                            >
                              <img src={src} alt={`Gallery ${idx+1}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                            </button>
                          ))}
                        </div>

                        {galleryOpen && (
                          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                            <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-lg" onClick={() => setGalleryOpen(false)} />
                            <div className="relative z-[101] flex items-center justify-center">
                              <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[1100px] max-h-[1100px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 flex items-center justify-center">
                                <img src={gallery[galleryIndex]} alt={`Gallery ${galleryIndex+1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setGalleryOpen(false)} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center" aria-label="Close">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              {gallery.length > 1 && (
                                <>
                                  <button type="button" onClick={() => setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center" aria-label="Previous">
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                  <button type="button" onClick={() => setGalleryIndex((i) => (i + 1) % gallery.length)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center" aria-label="Next">
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No gallery images yet.</p>
                    )}
                  </div>
                )}

                {/* Location */}
                {activeTab === 'konum' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Location</h3>
                    {locationAddress ? (
                      <>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 text-teal-600 flex-shrink-0" />
                          <span>{locationAddress}</span>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          <LeafletMap address={locationAddress} height="320px" zoom={15} />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No location provided yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 space-y-4 lg:sticky lg:top-24 h-max">
            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
              </div>
              <div className="p-4 space-y-2.5">
                {onlineConsultation && (
                  <button className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-xl hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                    <Video className="w-4 h-4" />
                    <span>Online Consultation</span>
                  </button>
                )}
                <button className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                  <img src="/images/icon/calender-svgrepo-com.svg" alt="Calendar" className="w-4 h-4 brightness-0 invert" />
                  <span>Book Appointment</span>
                </button>
                <button className="w-full bg-violet-600 text-white py-2.5 px-4 rounded-xl hover:bg-violet-700 focus:ring-4 focus:ring-violet-200 transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                  <img src="/images/icon/chat-round-line-svgrepo-com.svg" alt="Chat" className="w-4 h-4 brightness-0 invert" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>

            {/* Price Range */}
            {prices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                  <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
                </div>
                <div className="p-4 space-y-3">
                  {prices.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-semibold text-gray-900">
                        {item.currency || '₺'}{item.min}{item.max ? ` – ${item.currency || '₺'}${item.max}` : ''}
                      </span>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400 pt-1">* Prices may vary depending on complexity.</p>
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                  <h3 className="text-sm font-semibold text-gray-900">Languages</h3>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{lang}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;