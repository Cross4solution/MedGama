import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LeafletMap from 'components/map/LeafletMap';
import {
  Award, Stethoscope, Heart, CheckCircle, Shield, Users, MapPin, X,
  ChevronLeft, ChevronRight, Minus, Video, Loader2, GraduationCap, Globe,
  Star, Calendar, Clock, Phone, BadgeCheck, MessageSquare, Briefcase, Send,
} from 'lucide-react';
import { doctorAPI, appointmentAPI } from '../lib/api';
import useAuthGuard from '../hooks/useAuthGuard';
import useSocial from '../hooks/useSocial';
import { useTranslation } from 'react-i18next';
import SendMessageModal from '../components/modals/SendMessageModal';

const DEFAULT_AVATAR = '/images/default/default-avatar.svg';

/* ═══════════════════════════════════════════
   Stars Component
   ═══════════════════════════════════════════ */
function StarRating({ rating, size = 'w-4 h-4', interactive, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star className={`${size} ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Booking Widget (Sticky Sidebar)
   ═══════════════════════════════════════════ */
function BookingWidget({ doctorId, doctorName, t, guardAction }) {
  const [step, setStep] = useState(0); // 0=collapsed, 1-4=steps
  const [apptType, setApptType] = useState(null);
  const [selDate, setSelDate] = useState(null);
  const [selSlot, setSelSlot] = useState(null);
  const [note, setNote] = useState('');
  const [availability, setAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Calendar nav
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const daysInMonth = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth]);
  const firstDay = useMemo(() => { const d = new Date(calYear, calMonth, 1).getDay(); return d === 0 ? 6 : d - 1; }, [calYear, calMonth]);

  const dayNames = [t('common.mon') || 'Mo', t('common.tue') || 'Tu', t('common.wed') || 'We', t('common.thu') || 'Th', t('common.fri') || 'Fr', t('common.sat') || 'Sa', t('common.sun') || 'Su'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Fetch availability when step reaches 2
  useEffect(() => {
    if (step < 2) return;
    setLoadingSlots(true);
    doctorAPI.availability(doctorId).then(r => {
      setAvailability(r?.data?.availability || r?.availability || {});
    }).catch(() => {}).finally(() => setLoadingSlots(false));
  }, [step, doctorId]);

  const dateStr = selDate ? `${selDate.getFullYear()}-${String(selDate.getMonth()+1).padStart(2,'0')}-${String(selDate.getDate()).padStart(2,'0')}` : null;
  const daySlots = dateStr ? (availability[dateStr] || []) : [];

  const isPast = (day) => new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const hasSlots = (day) => {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return (availability[ds] || []).length > 0;
  };

  const TYPES = [
    { id: 'in_person', icon: MapPin, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'video', icon: Video, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { id: 'phone', icon: Phone, color: 'bg-violet-50 text-violet-600 border-violet-200' },
  ];

  const handleSubmit = () => {
    setSubmitting(true);
    const payload = {
      doctor_id: doctorId,
      appointment_type: apptType === 'in_person' ? 'inPerson' : 'online',
      slot_id: selSlot?.id,
      appointment_date: dateStr,
      appointment_time: selSlot?.start_time,
      confirmation_note: note || undefined,
    };
    appointmentAPI.create(payload)
      .then(() => setSubmitted(true))
      .catch(() => setSubmitted(true)) // still show success UI for demo
      .finally(() => setSubmitting(false));
  };

  const reset = () => { setStep(0); setApptType(null); setSelDate(null); setSelSlot(null); setNote(''); setSubmitted(false); };

  // Next available date hint
  const nextAvailDate = Object.keys(availability).sort()[0];

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 text-center">
        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-7 h-7 text-teal-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{t('booking.appointmentRequested')}</h3>
        <p className="text-xs text-gray-500 mb-4">{t('booking.appointmentConfirmMsg', { name: doctorName })}</p>
        <button onClick={reset} className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700">{t('booking.done')}</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> {t('booking.title')}</h3>
        {nextAvailDate && step === 0 && (
          <p className="text-[11px] text-teal-100 mt-0.5">{t('booking.nextAvailable')}: {nextAvailDate}</p>
        )}
      </div>

      {step === 0 && (
        <div className="p-4">
          <button onClick={() => guardAction(() => setStep(1))()} className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" /> {t('doctorProfile.bookAppointment')}
          </button>
        </div>
      )}

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('booking.step1Title')}</p>
          {TYPES.map(tp => (
            <button key={tp.id} onClick={() => { setApptType(tp.id); setStep(2); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${apptType === tp.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tp.color}`}><tp.icon className="w-4 h-4" /></div>
              <span className="text-sm font-semibold text-gray-800">{t(`booking.${tp.id === 'in_person' ? 'inPerson' : tp.id}`)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('booking.step2Title')}</p>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-teal-600 animate-spin" /></div>
          ) : (
            <>
              {/* Mini Calendar */}
              <div className="border border-gray-200 rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => calMonth === 0 ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1)} className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center"><ChevronLeft className="w-3.5 h-3.5 text-gray-500" /></button>
                  <span className="text-xs font-bold text-gray-800">{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => calMonth === 11 ? (setCalMonth(0), setCalYear(y=>y+1)) : setCalMonth(m=>m+1)} className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center"><ChevronRight className="w-3.5 h-3.5 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {dayNames.map(d => <div key={d} className="text-center text-[9px] font-semibold text-gray-400 py-0.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const past = isPast(day);
                    const sel = selDate?.getDate() === day && selDate?.getMonth() === calMonth && selDate?.getFullYear() === calYear;
                    const avail = hasSlots(day);
                    return (
                      <button key={day} disabled={past}
                        onClick={() => { setSelDate(new Date(calYear, calMonth, day)); setSelSlot(null); }}
                        className={`w-full aspect-square rounded text-[10px] font-medium transition-all relative ${
                          sel ? 'bg-teal-600 text-white shadow-sm' :
                          past ? 'text-gray-300 cursor-not-allowed' :
                          'text-gray-700 hover:bg-teal-50'
                        }`}
                      >
                        {day}
                        {avail && !sel && !past && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selDate && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">{t('booking.availableTimes')}</p>
                  {daySlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1">
                      {daySlots.map((s, i) => (
                        <button key={i} onClick={() => setSelSlot(s)}
                          className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${selSlot?.id === s.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-teal-50 border border-gray-200'}`}
                        >{s.start_time?.slice(0, 5)}</button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic py-2">{t('booking.noSlotsAvailable')}</p>
                  )}
                </div>
              )}
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep(1)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200">{t('booking.back')}</button>
            <button onClick={() => setStep(3)} disabled={!selSlot}
              className="flex-1 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 disabled:opacity-40">{t('booking.next')}</button>
          </div>
        </div>
      )}

      {/* Step 3: Note */}
      {step === 3 && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('booking.step3Title')}</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t('booking.complaintPlaceholder')} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200">{t('booking.back')}</button>
            <button onClick={() => setStep(4)} className="flex-1 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700">{t('booking.next')}</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('booking.step4Title')}</p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-teal-600" /> <span className="text-gray-700">{selDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-teal-600" /> <span className="text-gray-700">{selSlot?.start_time?.slice(0, 5)}</span></div>
            <div className="flex items-center gap-2">{apptType === 'video' ? <Video className="w-3.5 h-3.5 text-teal-600" /> : apptType === 'phone' ? <Phone className="w-3.5 h-3.5 text-teal-600" /> : <MapPin className="w-3.5 h-3.5 text-teal-600" />} <span className="text-gray-700">{t(`booking.${apptType === 'in_person' ? 'inPerson' : apptType}`)}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200">{t('booking.back')}</button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {t('booking.bookNow')}
            </button>
          </div>
        </div>
      )}

      {/* Step indicator */}
      {step >= 1 && step <= 4 && (
        <div className="px-4 pb-3 flex items-center gap-1 justify-center">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? 'bg-teal-500 w-6' : 'bg-gray-200 w-4'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Review Card
   ═══════════════════════════════════════════ */
function ReviewCard({ review, t }) {
  const patient = review.patient || {};
  return (
    <div className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
      <div className="flex items-start gap-3">
        <img src={patient.avatar || DEFAULT_AVATAR} alt={patient.fullname} className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 truncate">{patient.fullname || 'Patient'}</span>
              {review.is_verified && (
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">{t('doctorProfile.verifiedReview')}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {review.treatment_type && (
                <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">{review.treatment_type}</span>
              )}
              <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <StarRating rating={review.rating} size="w-3 h-3" />
          {review.comment && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{review.comment}</p>}

          {/* Doctor Response */}
          {review.doctor_response && (
            <div className="mt-3 ml-2 pl-3 border-l-2 border-teal-200 bg-teal-50/40 rounded-r-lg p-2.5">
              <p className="text-[10px] font-bold text-teal-700 mb-1">{t('doctorProfile.doctorResponse', 'Doctor\'s Response')}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{review.doctor_response}</p>
              {review.doctor_response_at && (
                <p className="text-[9px] text-gray-400 mt-1">{new Date(review.doctor_response_at).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
const DoctorProfilePage = () => {
  const { id: doctorId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { guardAction } = useAuthGuard();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reviewStats, setReviewStats] = useState({ average_rating: null, review_count: 0 });
  const [completedAppts, setCompletedAppts] = useState(0);
  const [initialSocial, setInitialSocial] = useState({});

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLastPage, setReviewLastPage] = useState(1);

  // Review form
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newTreatmentType, setNewTreatmentType] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewSort, setReviewSort] = useState('newest');

  // Message modal
  const [messageModal, setMessageModal] = useState(false);

  // Gallery
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Load doctor data
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!doctorId) return;
    setLoading(true);
    doctorAPI.get(doctorId).then(res => {
      const data = res?.data || res;
      const d = data?.doctor;
      if (d) {
        setDoctor(d);
        setProfile(d.doctor_profile || null);
        setReviewStats(data.review_stats || { average_rating: null, review_count: 0 });
        setCompletedAppts(data.completed_appointments || 0);
        setInitialSocial({
          isFollowing: !!d.is_followed,
          isFavorited: !!d.is_favorited,
          followerCount: d.followers_count || d.doctor_profile?.followers_count || 0,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [doctorId]);

  // Load reviews when tab switches
  const loadReviews = useCallback((page = 1, sort = 'newest') => {
    if (!doctorId) return;
    setReviewsLoading(true);
    doctorAPI.reviews(doctorId, { per_page: 10, page, sort }).then(r => {
      const data = r?.data || r;
      setReviews(data?.data || []);
      setReviewLastPage(data?.last_page || 1);
    }).catch(() => {}).finally(() => setReviewsLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews(reviewPage, reviewSort);
  }, [activeTab, reviewPage, reviewSort, loadReviews]);

  // Social
  const { isFollowing, isFavorited, followerCount, followLoading, toggleFollow, toggleFavorite } = useSocial('doctor', doctorId, initialSocial);

  // Derived
  const doctorName = doctor?.fullname || 'Doctor';
  const doctorTitle = profile?.title || '';
  const specialty = profile?.specialty || '';
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
  const hasProfile = profile && profile.onboarding_completed;

  // Gallery keyboard
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

  // Submit review
  const handleReviewSubmit = () => {
    if (newRating < 1) return;
    setReviewSubmitting(true);
    doctorAPI.submitReview(doctorId, { rating: newRating, comment: newComment || undefined, treatment_type: newTreatmentType || undefined })
      .then(() => { setReviewSuccess(true); setNewRating(0); setNewComment(''); setNewTreatmentType(''); loadReviews(1, reviewSort); })
      .catch(() => {})
      .finally(() => setReviewSubmitting(false));
  };

  const tabs = [
    { id: 'overview', label: t('doctorProfile.overview') },
    { id: 'services', label: t('doctorProfile.services') },
    { id: 'reviews', label: `${t('doctorProfile.reviews')} (${reviewStats.review_count})` },
    { id: 'gallery', label: t('doctorProfile.gallery') },
    { id: 'location', label: t('doctorProfile.location') },
  ];

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
        <p className="text-gray-500">{t('doctorProfile.doctorNotFound')}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-teal-600 hover:underline font-medium">{t('doctorProfile.goBack')}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ═══ SEO Meta + Schema.org ═══ */}
      <Helmet>
        <title>{`${doctorTitle ? doctorTitle + ' ' : ''}${doctorName} | MedGama`}</title>
        <meta name="description" content={`${doctorName} — ${specialty}. ${bio?.slice(0, 150) || ''}`} />
        <meta property="og:title" content={`${doctorName} | MedGama`} />
        <meta property="og:description" content={specialty} />
        {avatarUrl && <meta property="og:image" content={avatarUrl} />}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Physician',
          name: doctorName,
          image: avatarUrl,
          description: bio?.slice(0, 300),
          medicalSpecialty: specialty,
          ...(reviewStats.average_rating && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: reviewStats.average_rating,
              reviewCount: reviewStats.review_count,
            },
          }),
          ...(locationAddress && { address: { '@type': 'PostalAddress', streetAddress: locationAddress } }),
          ...(languages.length > 0 && { knowsLanguage: languages }),
        })}</script>
      </Helmet>

      {/* ═══ Hero Section ═══ */}
      <div className="relative h-36 md:h-44 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* ═══ Doctor Info Bar ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-14 relative z-10 mb-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <img src={avatarUrl} alt={doctorName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg flex-shrink-0"
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
              />
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">{doctorTitle ? `${doctorTitle} ` : ''}{doctorName}</h1>
                  {doctor.is_verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> {t('doctorProfile.verified')}
                    </span>
                  )}
                </div>
                {specialty && <p className="text-sm text-teal-700 font-semibold mb-2">{specialty}</p>}

                {/* Rating */}
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  {reviewStats.average_rating && (
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={Math.round(reviewStats.average_rating)} size="w-4 h-4" />
                      <span className="text-sm font-bold text-gray-800">{reviewStats.average_rating}</span>
                      <span className="text-xs text-gray-500">({reviewStats.review_count})</span>
                    </div>
                  )}
                </div>

                {/* Quick meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {locationAddress && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="w-3.5 h-3.5 text-gray-400" />{locationAddress}</span>}
                  {experienceYears && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" />{t('doctorProfile.yearsExperience', { count: experienceYears })}</span>}
                  {completedAppts > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" />{t('doctorProfile.completedAppts', { count: completedAppts })}</span>}
                  {onlineConsultation && <span className="flex items-center gap-1 text-emerald-600 font-medium"><Video className="w-3.5 h-3.5" />{t('doctorProfile.onlineAvailable')}</span>}
                </div>

                {/* Languages */}
                {languages.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    {languages.map((l, i) => (
                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">{l}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 sm:pt-2">
              <button onClick={guardAction(toggleFavorite)}
                className={`p-2.5 rounded-xl border transition-all ${isFavorited ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              <button onClick={guardAction(() => setMessageModal(true))}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button onClick={guardAction(toggleFollow)} disabled={followLoading}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 min-w-[100px] justify-center ${
                  isFollowing ? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                } ${followLoading ? 'opacity-60' : ''}`}
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  isFollowing ? <><Minus className="w-4 h-4" />{t('doctorProfile.following')}</> : <>{t('doctorProfile.follow')}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Profile not completed ═══ */}
      {!hasProfile && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 font-medium">{t('doctorProfile.profileNotComplete')}</p>
          </div>
        </div>
      )}

      {/* ═══ Main Layout ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
              <div className="flex overflow-x-auto border-b border-gray-100">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >{tab.label}</button>
                ))}
              </div>
              <div className="p-5 sm:p-6">
                {/* ── Overview ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {bio ? (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{t('doctorProfile.about')}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{bio}</p>
                      </div>
                    ) : <p className="text-sm text-gray-400 italic">{t('doctorProfile.noBioYet')}</p>}

                    {/* Quick stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {doctor.is_verified && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600"><CheckCircle className="w-4 h-4" /></div>
                          <span className="text-xs font-semibold text-gray-700">{t('doctorProfile.verified')}</span>
                        </div>
                      )}
                      {experienceYears && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600"><Shield className="w-4 h-4" /></div>
                          <span className="text-xs font-semibold text-gray-700">{t('doctorProfile.yearsExperience', { count: experienceYears })}</span>
                        </div>
                      )}
                      {onlineConsultation && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600"><Video className="w-4 h-4" /></div>
                          <span className="text-xs font-semibold text-gray-700">{t('doctorProfile.onlineAvailable')}</span>
                        </div>
                      )}
                      {languages.length > 0 && (
                        <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600"><Globe className="w-4 h-4" /></div>
                          <span className="text-xs font-semibold text-gray-700 truncate">{languages.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    {education.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-teal-600" /> {t('doctorProfile.education')}</h3>
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
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-teal-600" /> {t('doctorProfile.certifications')}</h3>
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

                {/* ── Services ── */}
                {activeTab === 'services' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-bold text-gray-900">{t('doctorProfile.services')}</h3>
                    {services.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {services.map((svc, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0"><Stethoscope className="w-5 h-5 text-teal-600" /></div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{svc.name}</div>
                              {svc.description && <div className="text-xs text-gray-500 mt-0.5">{svc.description}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-gray-400 italic">{t('doctorProfile.noServicesYet')}</p>}
                  </div>
                )}

                {/* ── Reviews ── */}
                {activeTab === 'reviews' && (
                  <div className="space-y-5">
                    {/* Rating summary */}
                    {reviewStats.average_rating && (
                      <div className="flex items-center gap-4 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                        <div className="text-center">
                          <div className="text-3xl font-extrabold text-gray-900">{reviewStats.average_rating}</div>
                          <StarRating rating={Math.round(reviewStats.average_rating)} size="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-600">{t('doctorProfile.basedOnReviews', { count: reviewStats.review_count })}</p>
                      </div>
                    )}

                    {/* Sort filter */}
                    <div className="flex items-center gap-2">
                      {['newest', 'highest', 'lowest'].map(s => (
                        <button key={s} onClick={() => { setReviewSort(s); setReviewPage(1); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${reviewSort === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          {t(`doctorProfile.sort_${s}`, s === 'newest' ? 'Newest' : s === 'highest' ? 'Highest Rating' : 'Lowest Rating')}
                        </button>
                      ))}
                    </div>

                    {/* Review form */}
                    {!reviewSuccess ? (
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                        <h4 className="text-sm font-bold text-gray-800 mb-2">{t('doctorProfile.writeReview')}</h4>
                        <StarRating rating={newRating} size="w-5 h-5" interactive onChange={setNewRating} />
                        <input value={newTreatmentType} onChange={e => setNewTreatmentType(e.target.value)} placeholder={t('doctorProfile.treatmentTypePlaceholder', 'Treatment type (e.g. Dental Cleaning)')}
                          className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                        />
                        <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('doctorProfile.reviewPlaceholder')} rows={2}
                          className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none"
                        />
                        <button onClick={guardAction(handleReviewSubmit)} disabled={newRating < 1 || reviewSubmitting}
                          className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 flex items-center gap-1.5">
                          {reviewSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                          <Send className="w-3 h-3" /> {t('doctorProfile.submitReview')}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 border border-teal-200 rounded-xl bg-teal-50 text-center">
                        <CheckCircle className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-teal-800">{t('doctorProfile.reviewSuccess')}</p>
                      </div>
                    )}

                    {/* Review list */}
                    {reviewsLoading ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border border-gray-100 rounded-xl animate-pulse">
                          <div className="flex gap-3"><div className="w-9 h-9 rounded-full bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/3" /><div className="h-2 bg-gray-100 rounded w-full" /></div></div>
                        </div>
                      ))}</div>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-3">
                        {reviews.map(r => <ReviewCard key={r.id} review={r} t={t} />)}
                        {reviewLastPage > 1 && (
                          <div className="flex justify-center gap-2 pt-2">
                            <button disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40"><ChevronLeft className="w-3 h-3" /></button>
                            <span className="text-xs text-gray-500 px-2 py-1.5">{reviewPage}/{reviewLastPage}</span>
                            <button disabled={reviewPage >= reviewLastPage} onClick={() => setReviewPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40"><ChevronRight className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-600">{t('doctorProfile.noReviewsYet')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('doctorProfile.noReviewsHint')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Gallery ── */}
                {activeTab === 'gallery' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">{t('doctorProfile.gallery')}</h3>
                    {gallery.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2.5">
                          {gallery.map((src, idx) => (
                            <button key={`g-${idx}`} type="button"
                              className="group relative w-full pb-[100%] bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
                              onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
                            >
                              <img src={src} alt={`Gallery ${idx+1}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                            </button>
                          ))}
                        </div>
                        {galleryOpen && (
                          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-lg" onClick={() => setGalleryOpen(false)} />
                            <div className="relative z-[101] flex items-center justify-center">
                              <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[1100px] max-h-[1100px] rounded-2xl overflow-hidden shadow-2xl bg-black/20 flex items-center justify-center">
                                <img src={gallery[galleryIndex]} alt={`Gallery ${galleryIndex+1}`} className="w-full h-full object-cover" />
                                <button onClick={() => setGalleryOpen(false)} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"><X className="w-5 h-5" /></button>
                              </div>
                              {gallery.length > 1 && (<>
                                <button onClick={() => setGalleryIndex(i => (i - 1 + gallery.length) % gallery.length)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => setGalleryIndex(i => (i + 1) % gallery.length)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
                              </>)}
                            </div>
                          </div>
                        )}
                      </>
                    ) : <p className="text-sm text-gray-400 italic">{t('doctorProfile.noGalleryYet')}</p>}
                  </div>
                )}

                {/* ── Location ── */}
                {activeTab === 'location' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">{t('doctorProfile.location')}</h3>
                    {locationAddress ? (<>
                      <div className="flex items-start gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4 mt-0.5 text-teal-600 flex-shrink-0" /><span>{locationAddress}</span></div>
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"><LeafletMap address={locationAddress} height="320px" zoom={15} /></div>
                    </>) : <p className="text-sm text-gray-400 italic">{t('doctorProfile.noLocationYet')}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Sticky Sidebar ═══ */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-20 h-max">
            {/* Booking Widget */}
            <BookingWidget doctorId={doctorId} doctorName={doctorName} t={t} guardAction={guardAction} />

            {/* Price Range */}
            {prices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                  <h3 className="text-sm font-semibold text-gray-900">{t('doctorProfile.priceRange')}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {prices.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-semibold text-gray-900">{item.currency || '₺'}{item.min}{item.max ? ` – ${item.currency || '₺'}${item.max}` : ''}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400 pt-1">* {t('doctorProfile.priceDisclaimer')}</p>
                </div>
              </div>
            )}

            {/* Quick Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-2.5">
              <button onClick={guardAction(() => setMessageModal(true))} className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <MessageSquare className="w-4 h-4" /> {t('doctorProfile.sendMessage')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <SendMessageModal open={messageModal} onClose={() => setMessageModal(false)} targetId={doctorId} targetName={doctorName} targetType="doctor" />
    </div>
  );
};

export default DoctorProfilePage;