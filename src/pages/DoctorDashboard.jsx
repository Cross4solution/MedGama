import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { doctorProfileAPI, appointmentAPI } from '../lib/api';
import resolveStorageUrl from '../utils/resolveStorageUrl';
import useVerificationListener from '../hooks/useVerificationListener';
import AnnouncementBanner from '../components/ui/AnnouncementBanner';
import {
  User, Calendar, Star, Shield, CheckCircle, AlertTriangle,
  Clock, ChevronRight, ExternalLink, Settings, FileText,
  Sparkles, TrendingUp, Users, Video, Loader2, LayoutDashboard,
  Upload, Eye, Edit3, Bell, Crown,
} from 'lucide-react';

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isPro } = useAuth();

  // ── Real-time verification status listener ──
  useVerificationListener();

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.role !== 'doctor' && user.role_id !== 'doctor') {
      navigate('/dashboard', { replace: true }); return;
    }
    // If onboarding not completed, redirect
    if (user.onboarding_completed === false) {
      navigate('/onboarding', { replace: true }); return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, apptRes] = await Promise.allSettled([
          doctorProfileAPI.get(),
          appointmentAPI.list({ per_page: 5 }),
        ]);
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value?.profile || profileRes.value?.data?.profile || profileRes.value?.data || null);
        }
        if (apptRes.status === 'fulfilled') {
          setAppointments(apptRes.value?.data || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchData();
  }, [user, navigate]);

  const isVerified = user?.is_verified;
  const upcomingAppts = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Announcement Banner ── */}
        <AnnouncementBanner />

        {/* ── Welcome Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img
              src={resolveStorageUrl(user?.avatar)}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg"
              onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('doctorDashboard.welcome', 'Welcome')}, {user?.name || 'Doctor'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {profile?.specialty || t('doctorDashboard.subtitle', 'Manage your MedaGama profile')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/doctor/${user?.id}`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {t('doctorDashboard.viewProfile', 'View Public Profile')}
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              {t('doctorDashboard.editProfile', 'Edit Profile')}
            </Link>
          </div>
        </div>

        {/* ── Status Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Verification Status — dynamic by verification_status */}
          {(() => {
            const vs = user?.verification_status || (isVerified ? 'approved' : 'unverified');
            const cardConfig = {
              approved: {
                bg: 'bg-emerald-50', border: 'border-emerald-200',
                icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
                titleColor: 'text-emerald-900', descColor: 'text-emerald-700',
                title: t('doctorDashboard.verified', 'Account Verified'),
                desc: t('doctorDashboard.verifiedDesc', 'Your account is verified. Patients can book appointments.'),
                showBtn: false,
              },
              unverified: {
                bg: 'bg-amber-50', border: 'border-amber-200',
                icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
                titleColor: 'text-amber-900', descColor: 'text-amber-700',
                title: t('doctorDashboard.pendingVerification', 'Verification Pending'),
                desc: t('doctorDashboard.pendingDesc', 'Upload your documents to get verified and start receiving appointments.'),
                showBtn: true, btnText: t('doctorDashboard.uploadDocs', 'Upload Documents'),
                btnClass: 'text-amber-800 bg-amber-100 hover:bg-amber-200',
                btnLink: '/crm/settings?tab=verification',
              },
              pending_review: {
                bg: 'bg-blue-50', border: 'border-blue-200',
                icon: <Clock className="w-6 h-6 text-blue-600" />,
                titleColor: 'text-blue-900', descColor: 'text-blue-700',
                title: t('doctorDashboard.underReview', 'Documents Under Review'),
                desc: t('doctorDashboard.underReviewDesc', 'Your documents have been received. Our admin team is reviewing them (2-5 business days).'),
                showBtn: false,
              },
              info_requested: {
                bg: 'bg-orange-50', border: 'border-orange-300',
                icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
                titleColor: 'text-orange-900', descColor: 'text-orange-700',
                title: t('doctorDashboard.infoRequested', 'Additional Documents Needed'),
                desc: user?.admin_verification_note || t('doctorDashboard.infoRequestedDesc', 'The admin team has requested additional information.'),
                showBtn: true, btnText: t('doctorDashboard.updateDocs', 'Update Documents'),
                btnClass: 'text-orange-800 bg-orange-100 hover:bg-orange-200',
                btnLink: '/crm/settings?tab=verification',
              },
              rejected: {
                bg: 'bg-red-50', border: 'border-red-200',
                icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
                titleColor: 'text-red-900', descColor: 'text-red-700',
                title: t('doctorDashboard.rejected', 'Verification Rejected'),
                desc: t('doctorDashboard.rejectedDesc', 'Your verification was not approved. Please re-upload correct documents.'),
                showBtn: true, btnText: t('doctorDashboard.resubmitDocs', 'Re-submit Documents'),
                btnClass: 'text-red-800 bg-red-100 hover:bg-red-200',
                btnLink: '/crm/settings?tab=verification',
              },
            };
            const cfg = cardConfig[vs] || cardConfig.unverified;
            return (
              <div className={`p-5 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-3 mb-2">
                  {cfg.icon}
                  <h3 className={`font-semibold ${cfg.titleColor}`}>{cfg.title}</h3>
                </div>
                <p className={`text-sm ${cfg.descColor}`}>{cfg.desc}</p>
                {cfg.showBtn && (
                  <Link
                    to={cfg.btnLink}
                    className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${cfg.btnClass}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {cfg.btnText}
                  </Link>
                )}
              </div>
            );
          })()}

          {/* Upcoming Appointments */}
          <div className="p-5 rounded-2xl border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                {t('doctorDashboard.appointments', 'Appointments')}
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-800">{upcomingAppts.length}</p>
            <p className="text-sm text-blue-600 mt-1">
              {t('doctorDashboard.upcomingAppts', 'upcoming appointments')}
            </p>
          </div>

          {/* Profile Views / Rating */}
          <div className="p-5 rounded-2xl border bg-purple-50 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-purple-900">
                {t('doctorDashboard.rating', 'Rating')}
              </h3>
            </div>
            <p className="text-3xl font-bold text-purple-800">
              {profile?.average_rating ? Number(profile.average_rating).toFixed(1) : '—'}
            </p>
            <p className="text-sm text-purple-600 mt-1">
              {profile?.review_count || 0} {t('doctorDashboard.reviews', 'reviews')}
            </p>
          </div>
        </div>

        {/* ── CRM Pro Upgrade Banner ── */}
        {!isPro && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {t('doctorDashboard.crmTitle', 'MedaGama CRM — Professional Suite')}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {t('doctorDashboard.crmDesc', 'Smart calendar, revenue analytics, telehealth, patient management and more.')}
                  </p>
                </div>
              </div>
              <Link
                to="/crm/billing"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/20 flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                {t('doctorDashboard.upgradeCta', 'Upgrade to Pro')}
              </Link>
            </div>
            <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Calendar, label: t('doctorDashboard.featureCalendar', 'Smart Calendar') },
                { icon: TrendingUp, label: t('doctorDashboard.featureRevenue', 'Revenue Analytics') },
                { icon: Video, label: t('doctorDashboard.featureTelehealth', 'Telehealth') },
                { icon: Users, label: t('doctorDashboard.featurePatients', 'Patient CRM') },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <f.icon className="w-4 h-4 text-teal-400" />
                  <span className="text-xs text-gray-300 font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── If Pro, show CRM quick access ── */}
        {isPro && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-teal-900">
                    {t('doctorDashboard.crmAccess', 'CRM Professional Suite')}
                  </h3>
                  <p className="text-sm text-teal-600">
                    {t('doctorDashboard.crmAccessDesc', 'Access your full CRM dashboard with all professional tools.')}
                  </p>
                </div>
              </div>
              <Link
                to="/crm"
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
              >
                {t('doctorDashboard.openCrm', 'Open CRM')}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('doctorDashboard.quickActions', 'Quick Actions')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Edit3, label: t('doctorDashboard.editProfile', 'Edit Profile'), to: '/profile', color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { icon: Eye, label: t('doctorDashboard.viewProfile', 'View Public Profile'), to: `/doctor/${user?.id}`, color: 'text-purple-600 bg-purple-50 border-purple-200' },
              { icon: Bell, label: t('doctorDashboard.notifications', 'Notifications'), to: '/notifications', color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { icon: Settings, label: t('doctorDashboard.settings', 'Settings'), to: '/settings', color: 'text-gray-600 bg-gray-50 border-gray-200' },
            ].map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${a.color} hover:shadow-sm transition-all text-center`}
              >
                <a.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Upcoming Appointments List ── */}
        {upcomingAppts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('doctorDashboard.upcomingTitle', 'Upcoming Appointments')}
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {upcomingAppts.slice(0, 5).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${appt.status === 'confirmed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      {appt.status === 'confirmed'
                        ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                        : <Clock className="w-5 h-5 text-amber-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{appt.patient?.fullname || 'Patient'}</p>
                      <p className="text-xs text-gray-500">
                        {appt.appointment_date} · {appt.appointment_time}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorDashboard;
