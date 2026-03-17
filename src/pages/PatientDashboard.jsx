import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, patientDocumentAPI, doctorAPI } from '../lib/api';
import EmptyState from '../components/common/EmptyState';
import {
  Activity, Calendar, Video, FileText, Clock, ChevronRight,
  Pill, FolderHeart, Monitor, Stethoscope, AlertCircle, Loader2,
  TrendingUp, Heart, Shield, Star, X, Send
} from 'lucide-react';

const PatientDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [docStats, setDocStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reviewable appointments
  const [reviewable, setReviewable] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apptRes, statsRes, reviewableRes] = await Promise.allSettled([
          appointmentAPI.list({ per_page: 100 }),
          patientDocumentAPI.stats(),
          doctorAPI.reviewableAppointments(),
        ]);
        if (apptRes.status === 'fulfilled') {
          setAppointments(apptRes.value?.data || []);
        }
        if (statsRes.status === 'fulfilled') {
          setDocStats(statsRes.value || null);
        }
        if (reviewableRes.status === 'fulfilled') {
          setReviewable(reviewableRes.value?.data || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchData();
  }, []);

  // ── Categorize appointments ──
  const now = new Date();

  const upcoming = useMemo(() =>
    appointments
      .filter(a => ['pending', 'confirmed'].includes(a.status))
      .map(a => ({
        ...a,
        startDate: new Date(`${a.appointment_date}T${a.appointment_time || '00:00'}`),
      }))
      .filter(a => a.startDate >= new Date(now.getTime() - 3600000))
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 5),
    [appointments, now]
  );

  const completed = useMemo(() =>
    appointments.filter(a => a.status === 'completed'),
    [appointments]
  );

  const online = useMemo(() =>
    appointments.filter(a => a.appointment_type === 'online'),
    [appointments]
  );

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  };

  const fmtTime = (t) => {
    if (!t) return '';
    return t.slice(0, 5);
  };

  const minutesUntil = (date) => Math.floor((date.getTime() - Date.now()) / 60000);

  // ── Review submit handler ──
  const handleReviewSubmit = async () => {
    if (!reviewModal || reviewRating < 1) return;
    setReviewSubmitting(true);
    try {
      await doctorAPI.submitReview(reviewModal.doctor_id, {
        rating: reviewRating,
        comment: reviewComment || undefined,
        appointment_id: reviewModal.appointment_id,
      });
      setReviewSuccess(true);
      setReviewable(prev => prev.filter(r => r.appointment_id !== reviewModal.appointment_id));
      setTimeout(() => {
        setReviewModal(null);
        setReviewRating(0);
        setReviewHover(0);
        setReviewComment('');
        setReviewSuccess(false);
      }, 1800);
    } catch { /* silent */ }
    setReviewSubmitting(false);
  };

  // ── Stats ──
  const stats = [
    {
      label: t('patientDashboard.upcomingAppointments', 'Upcoming'),
      value: upcoming.length,
      icon: Calendar,
      color: 'blue',
      onClick: () => navigate('/telehealth-appointment'),
    },
    {
      label: t('patientDashboard.completedVisits', 'Completed'),
      value: completed.length,
      icon: Stethoscope,
      color: 'green',
    },
    {
      label: t('patientDashboard.telehealthSessions', 'Telehealth'),
      value: online.length,
      icon: Monitor,
      color: 'purple',
      onClick: () => navigate('/telehealth'),
    },
    {
      label: t('patientDashboard.medicalDocuments', 'Documents'),
      value: docStats?.total_documents ?? 0,
      icon: FolderHeart,
      color: 'amber',
      onClick: () => navigate('/medical-archive'),
    },
  ];

  const colorMap = {
    blue:   { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    amber:  { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/50">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {t('patientDashboard.welcome', 'Welcome')}, {user?.fullname?.split(' ')[0] || t('common.patient')}
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                {t('patientDashboard.subtitle', 'Your health overview at a glance')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/telehealth-appointment')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-200/50 hover:shadow-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            {t('patientDashboard.bookAppointment', 'Book Appointment')}
          </button>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((stat, i) => {
            const c = colorMap[stat.color];
            return (
              <div
                key={i}
                onClick={stat.onClick}
                className={`rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-200 px-4 py-4 ${stat.onClick ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Rate Your Experience Prompt ── */}
        {reviewable.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
              {t('review.rateExperience', 'Rate Your Experience')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reviewable.map(item => (
                <div key={item.appointment_id} className="group relative rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-4 hover:shadow-md hover:border-amber-300 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                      {(item.doctor_name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{item.doctor_name}</h4>
                      <p className="text-[11px] text-gray-500">{item.specialty || t('common.doctor', 'Doctor')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => { setReviewModal(item); setReviewRating(0); setReviewComment(''); setReviewSuccess(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:shadow-md transition-all"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {t('review.rateNow', 'Rate Now')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Review Modal ── */}
        {reviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !reviewSubmitting && setReviewModal(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => !reviewSubmitting && setReviewModal(null)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>

              {reviewSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-emerald-600 fill-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{t('review.thankYou', 'Thank You!')}</h3>
                  <p className="text-sm text-gray-500">{t('review.submitted', 'Your review has been submitted successfully.')}</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md mx-auto mb-3">
                      {(reviewModal.doctor_name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{t('review.rateDoctor', 'Rate Your Doctor')}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{reviewModal.doctor_name}</p>
                    {reviewModal.specialty && <p className="text-xs text-teal-600 font-medium">{reviewModal.specialty}</p>}
                  </div>

                  {/* Star rating */}
                  <div className="flex justify-center gap-1.5 mb-5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onMouseEnter={() => setReviewHover(n)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(n)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star className={`w-8 h-8 ${
                          n <= (reviewHover || reviewRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200'
                        } transition-colors`} />
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && (
                    <p className="text-center text-xs font-medium text-amber-600 mb-4">
                      {[t('review.terrible','Terrible'), t('review.poor','Poor'), t('review.okay','Okay'), t('review.good','Good'), t('review.excellent','Excellent')][reviewRating - 1]}
                    </p>
                  )}

                  {/* Comment */}
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder={t('review.commentPlaceholder', 'Share your experience (optional)...')}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none mb-4"
                  />

                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewRating < 1 || reviewSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 transition-all"
                  >
                    {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {t('review.submitReview', 'Submit Review')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Upcoming Appointments ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                {t('patientDashboard.upcomingAppointments', 'Upcoming Appointments')}
              </h2>
              <button
                onClick={() => navigate('/telehealth-appointment')}
                className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1"
              >
                {t('common.viewAll', 'View All')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
              {upcoming.length === 0 ? (
                <EmptyState
                  type="appointments"
                  title={t('patientDashboard.noUpcoming', 'No upcoming appointments')}
                  description={t('patientDashboard.noUpcomingDesc', 'Book an appointment with a specialist to get started on your health journey.')}
                  actionLabel={t('patientDashboard.bookNow', 'Book an Appointment')}
                  actionUrl="/telehealth-appointment"
                />
              ) : (
                <div>
                  {upcoming.map((appt, idx) => {
                    const m = minutesUntil(appt.startDate);
                    const canJoin = appt.appointment_type === 'online' && m <= 15 && m >= -30;
                    const isToday = appt.startDate.toDateString() === now.toDateString();
                    const isTomorrow = appt.startDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                    const doctorName = appt.doctor?.fullname || appt.doctor_name || 'Doctor';
                    const initials = doctorName.split(' ').map(n => n[0]).join('').slice(0, 2);

                    return (
                      <div key={appt.id} className={`px-4 py-3.5 hover:bg-gray-50/60 transition-colors ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="flex items-center gap-3 justify-between">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{doctorName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-teal-600 font-medium">
                                {isToday ? t('common.today', 'Today') : isTomorrow ? t('common.tomorrow', 'Tomorrow') : fmtDate(appt.appointment_date)}
                                {' · '}{fmtTime(appt.appointment_time)}
                              </span>
                              {appt.appointment_type === 'online' && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                  <Monitor className="w-2.5 h-2.5" /> Online
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {canJoin ? (
                              <button
                                onClick={() => navigate(`/crm/telehealth?id=${appt.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50 hover:shadow-lg transition-all"
                              >
                                <Video className="w-3.5 h-3.5" />
                                {t('patientDashboard.joinNow', 'Join')}
                              </button>
                            ) : (
                              <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                                isToday ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-500 bg-gray-50 border border-gray-100'
                              }`}>
                                {isToday ? (m > 0 ? `${m} min` : t('common.now', 'Now')) : fmtDate(appt.appointment_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Quick Actions + Health Summary ── */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                {t('patientDashboard.quickActions', 'Quick Actions')}
              </h2>
              <div className="space-y-2">
                {[
                  { label: t('patientDashboard.bookAppointment', 'Book Appointment'), icon: Calendar, to: '/telehealth-appointment', color: 'from-teal-500 to-emerald-500' },
                  { label: t('patientDashboard.myTelehealth', 'My Telehealth'), icon: Monitor, to: '/telehealth', color: 'from-purple-500 to-violet-500' },
                  { label: t('patientDashboard.medicalArchive', 'Medical Archive'), icon: FolderHeart, to: '/medical-archive', color: 'from-amber-500 to-orange-500' },
                  { label: t('patientDashboard.messages', 'Messages'), icon: FileText, to: '/doctor-chat', color: 'from-blue-500 to-indigo-500' },
                ].map((action) => (
                  <button
                    key={action.to}
                    onClick={() => navigate(action.to)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-gray-200/60 bg-white hover:bg-gray-50/60 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1 text-left">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Health Tips */}
            <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  {t('patientDashboard.healthTip', 'Health Tip')}
                </h3>
              </div>
              <p className="text-xs text-teal-700 leading-relaxed">
                {t('patientDashboard.healthTipText', 'Keep your medical documents organized in your Medical Archive. Share them with your doctors before appointments for better care.')}
              </p>
            </div>

            {/* GDPR Notice */}
            <div className="rounded-2xl border border-gray-200/60 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('patientDashboard.dataProtection', 'Data Protection')}
                </h3>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {t('patientDashboard.gdprNotice', 'Your health data is encrypted and stored securely in compliance with GDPR Art. 9. You control who can access your medical documents.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
