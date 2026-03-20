import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEOHead, { buildPhysicianSchema } from '../components/seo/SEOHead';
import LeafletMap from 'components/map/LeafletMap';
import {
  Award, Stethoscope, Heart, CheckCircle, Shield, Users, MapPin, X,
  ChevronLeft, ChevronRight, Minus, Video, Loader2, GraduationCap, Globe,
  Star, Calendar, Clock, Phone, BadgeCheck, MessageSquare, Briefcase, Send,
  Settings, Eye, ImageOff, Building2,
} from 'lucide-react';
import { doctorAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useAuthGuard from '../hooks/useAuthGuard';
import useSocial from '../hooks/useSocial';
import { useTranslation } from 'react-i18next';
import SendMessageModal from '../components/modals/SendMessageModal';
import DoctorBookingModal from '../components/modals/DoctorBookingModal';
import resolveStorageUrl from '../utils/resolveStorageUrl';

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
   Review Card
   ═══════════════════════════════════════════ */
function ReviewCard({ review, t }) {
  const patient = review.patient || {};
  return (
    <div className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
      <div className="flex items-start gap-3">
        <img src={resolveStorageUrl(patient.avatar)} alt={patient.fullname} className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0" />
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
  const { user: authUser } = useAuth();
  const { notify } = useToast();
  const isOwner = authUser && (authUser.id === doctorId);
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
  const [reviewError, setReviewError] = useState(null);
  const [reviewSort, setReviewSort] = useState('newest');
  const [canReview, setCanReview] = useState(false);

  // Message modal
  const [messageModal, setMessageModal] = useState(false);
  const [bookModal, setBookModal] = useState(false);
  const [onlineBookModal, setOnlineBookModal] = useState(false);

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
        setCanReview(!!data.can_review);
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
  const doctorMeta = {
    name: doctor?.fullname || '',
    avatar: doctor?.avatar || '',
  };
  const socialCallbacks = {
    onFavoriteChange: (favorited) => {
      notify({
        type: 'success',
        message: favorited
          ? t('doctorProfile.addedToFavorites', 'Added to favorites')
          : t('doctorProfile.removedFromFavorites', 'Removed from favorites'),
      });
    },
  };
  const { isFollowing, isFavorited, followerCount, followLoading, toggleFollow, toggleFavorite } = useSocial('doctor', doctorId, initialSocial, doctorMeta, socialCallbacks);

  // Derived
  const doctorName = doctor?.fullname || 'Doctor';
  const doctorTitle = profile?.title || '';
  const specialty = profile?.specialty || '';
  const avatarUrl = resolveStorageUrl(doctor?.avatar);
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
  const operatingHours = profile?.operating_hours || null;
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
    if (newRating < 1 || newComment.trim().length < 10) return;
    setReviewSubmitting(true);
    setReviewError(null);
    doctorAPI.submitReview(doctorId, { rating: newRating, comment: newComment, treatment_type: newTreatmentType || undefined })
      .then(() => { setReviewSuccess(true); setCanReview(false); setNewRating(0); setNewComment(''); setNewTreatmentType(''); loadReviews(1, reviewSort); })
      .catch((err) => {
        const status = err?.response?.status || err?.status;
        if (status === 403) setReviewError(t('doctorProfile.reviewNeedAppointment', 'You must have a completed appointment to review this doctor.'));
        else if (status === 409) setReviewError(t('doctorProfile.reviewAlreadyExists', 'You have already reviewed this doctor.'));
        else if (status === 429) setReviewError(t('doctorProfile.reviewFloodLimit', 'Please wait 24 hours between reviews.'));
        else setReviewError(t('doctorProfile.reviewSubmitError', 'Failed to submit review. Please try again.'));
      })
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
      <SEOHead
        title={`${doctorTitle ? doctorTitle + ' ' : ''}${doctorName} — ${specialty}`}
        description={`${doctorName} — ${specialty}. ${bio?.slice(0, 150) || ''}`}
        canonical={`/doctor/${doctorId}`}
        image={avatarUrl}
        type="profile"
        jsonLd={buildPhysicianSchema({
          name: `${doctorTitle ? doctorTitle + ' ' : ''}${doctorName}`,
          image: avatarUrl,
          description: bio,
          specialty,
          rating: reviewStats.average_rating,
          reviewCount: reviewStats.review_count,
          address: locationAddress,
          languages,
          url: `https://medagama.com/doctor/${doctorId}`,
        })}
      />

      {/* ═══ Owner Preview Bar ═══ */}
      {isOwner && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800 font-medium">{t('doctorProfile.ownerBarText')}</span>
            </div>
            <Link to="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors shadow-sm">
              <Settings className="w-3.5 h-3.5" /> {t('doctorProfile.editSettings')}
            </Link>
          </div>
        </div>
      )}

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
                {specialty && <p className="text-sm text-teal-700 font-semibold mb-1">{specialty}</p>}

                {/* Clinic Affiliation */}
                {doctor.clinic && doctor.clinic.codename && (
                  <Link to={`/clinic/${doctor.clinic.codename}`} className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-1.5 group">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-500" />
                    {t('doctorProfile.workingAt', 'Working at')} <span className="font-semibold underline decoration-dotted">{doctor.clinic.fullname || doctor.clinic.name}</span>
                  </Link>
                )}

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
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {languages.map((l, i) => (
                      <span key={i} className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{l}</span>
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
              <button onClick={guardAction(() => navigate(`/doctor-chat?startWith=${doctorId}`))}
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
                  isFollowing ? <><CheckCircle className="w-4 h-4" />{t('doctorProfile.following')}</> : <>{t('doctorProfile.follow')}</>
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
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 flex-shrink-0"><Globe className="w-4 h-4" /></div>
                          <div className="flex flex-wrap gap-1.5">
                            {languages.map((l, i) => (
                              <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-gray-700 border border-gray-200">{l}</span>
                            ))}
                          </div>
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

                    {/* Operating Hours */}
                    {operatingHours && Object.keys(operatingHours).length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" /> {t('doctorProfile.operatingHours')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                            const d = operatingHours[day];
                            const isOpen = d?.enabled !== false && d?.start && d?.end;
                            return (
                              <div key={day} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${isOpen ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                                <span className={`text-sm font-semibold ${isOpen ? 'text-gray-800' : 'text-gray-400'}`}>{t(`onboarding.${day}`)}</span>
                                {isOpen ? (
                                  <span className="text-sm text-teal-700 font-medium">{d.start} – {d.end}</span>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">{t('onboarding.closed')}</span>
                                )}
                              </div>
                            );
                          })}
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
                    {reviewSuccess ? (
                      <div className="p-5 border border-teal-200 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-center">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-6 h-6 text-teal-600" />
                        </div>
                        <p className="text-sm font-bold text-teal-800 mb-1">{t('doctorProfile.reviewSuccess', 'Thank you for your review!')}</p>
                        <p className="text-xs text-teal-600">{t('doctorProfile.reviewSuccessDesc', 'Your review has been submitted and will be visible after moderation.')}</p>
                      </div>
                    ) : canReview ? (
                      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                        <h4 className="text-sm font-bold text-gray-800 mb-2">{t('doctorProfile.writeReview')}</h4>
                        <StarRating rating={newRating} size="w-5 h-5" interactive onChange={setNewRating} />
                        <input value={newTreatmentType} onChange={e => setNewTreatmentType(e.target.value)} placeholder={t('doctorProfile.treatmentTypePlaceholder', 'Treatment type (e.g. Dental Cleaning)')}
                          className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                        />
                        <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('doctorProfile.reviewPlaceholder', 'Share your experience (min. 10 characters)...')} rows={3}
                          className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none"
                        />
                        {newComment.length > 0 && newComment.trim().length < 10 && (
                          <p className="text-[10px] text-amber-600 mt-1">{t('doctorProfile.reviewMinChars', 'Please write at least 10 characters.')}</p>
                        )}
                        {reviewError && (
                          <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600 font-medium">{reviewError}</p>
                          </div>
                        )}
                        <button onClick={guardAction(handleReviewSubmit)} disabled={newRating < 1 || newComment.trim().length < 10 || reviewSubmitting}
                          className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors">
                          {reviewSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                          <Send className="w-3 h-3" /> {t('doctorProfile.submitReview')}
                        </button>
                      </div>
                    ) : (
                      <div className="relative p-5 border border-gray-200 rounded-xl bg-gray-50/80 backdrop-blur-sm text-center overflow-hidden">
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
                        <div className="relative z-10">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                            <Shield className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">{t('doctorProfile.reviewGateTitle', 'Verified Reviews Only')}</p>
                          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                            {t('doctorProfile.reviewGateDesc', 'Only patients who have completed an appointment with this doctor can share their experience. Complete your appointment and come back to leave a review.')}
                          </p>
                        </div>
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
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                          <ImageOff className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">{t('doctorProfile.galleryComingSoon')}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-[260px] text-center">{t('doctorProfile.galleryComingSoonHint')}</p>
                      </div>
                    )}
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
            {/* Booking CTA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="w-4 h-4" /> {t('booking.title')}</h3>
              </div>
              <div className="p-4 space-y-2.5">
                <button onClick={guardAction(() => setBookModal(true))} className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> {t('doctorProfile.bookAppointment')}
                </button>
                {onlineConsultation && (
                  <button onClick={guardAction(() => setOnlineBookModal(true))} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Video className="w-4 h-4" /> {t('doctorProfile.onlineConsultation')}
                  </button>
                )}
              </div>
            </div>

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
              <button onClick={guardAction(() => navigate(`/doctor-chat?startWith=${doctorId}`))} className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <MessageSquare className="w-4 h-4" /> {t('doctorProfile.sendMessage')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DoctorBookingModal open={bookModal} onClose={() => setBookModal(false)} doctorId={doctorId} doctorName={doctorName} />
      <DoctorBookingModal open={onlineBookModal} onClose={() => setOnlineBookModal(false)} doctorId={doctorId} doctorName={doctorName} initialType="video" />
      <SendMessageModal open={messageModal} onClose={() => setMessageModal(false)} targetId={doctorId} targetName={doctorName} targetType="doctor" />
    </div>
  );
};

export default DoctorProfilePage;