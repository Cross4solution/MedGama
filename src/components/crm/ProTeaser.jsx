import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  FolderArchive,
  CalendarClock,
  Video,
  Shield,
  Sparkles,
  X,
  Check,
  Crown,
  Zap,
  BarChart3,
  Users,
  Stethoscope,
  HeartPulse,
  Activity,
  PieChart,
  DollarSign,
  FileText,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Search,
  Lock,
  Star,
  Globe,
  CalendarDays,
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Pricing Comparison Modal
// ═══════════════════════════════════════════════════
const PricingModal = ({ open, onClose, t }) => {
  if (!open) return null;

  const features = [
    { key: 'medstream', label: t('pro.pricing.medstream', 'MedStream (Public Relations)'), free: true, pro: true },
    { key: 'profile', label: t('pro.pricing.profile', 'Professional Profile'), free: true, pro: true },
    { key: 'settings', label: t('pro.pricing.settings', 'Settings & Preferences'), free: true, pro: true },
    { key: 'crm', label: t('pro.pricing.crm', 'Advanced CRM & Analytics'), free: false, pro: true },
    { key: 'telehealth', label: t('pro.pricing.telehealth', 'Telehealth (Video Consultation)'), free: false, pro: true },
    { key: 'appointments', label: t('pro.pricing.appointments', 'Smart Appointment System'), free: false, pro: true },
    { key: 'archive', label: t('pro.pricing.archive', 'Unlimited Medical Archive'), free: false, pro: true },
    { key: 'support', label: t('pro.pricing.prioritySupport', 'Priority Support'), free: false, pro: true },
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 lg:pl-[256px]" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-6 py-5 rounded-t-3xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-6 h-6 text-amber-300" />
            <h2 className="text-xl font-bold text-white">{t('pro.pricing.title', 'Compare Plans')}</h2>
          </div>
          <p className="text-teal-100 text-xs">{t('pro.pricing.subtitle', 'Choose the plan that fits your practice')}</p>
        </div>

        {/* Table */}
        <div className="px-5 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
              <div className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                {t('pro.pricing.feature', 'Feature')}
              </div>
              <div className="px-4 py-2.5 text-center">
                <span className="text-xs font-semibold text-gray-700">Free</span>
              </div>
              <div className="px-4 py-2.5 text-center bg-teal-50/50">
                <span className="text-xs font-bold text-teal-700 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" /> PRO
                </span>
              </div>
            </div>

            {/* Table Body */}
            {features.map((f, idx) => (
              <div key={f.key} className={`grid grid-cols-3 ${idx < features.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="px-4 py-2 text-xs text-gray-700 font-medium">{f.label}</div>
                <div className="px-4 py-2 flex items-center justify-center">
                  {f.free ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-gray-300" />
                    </span>
                  )}
                </div>
                <div className="px-4 py-2 flex items-center justify-center bg-teal-50/30">
                  <span className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('pro.pricing.maybeLater', 'Maybe Later')}
            </button>
            <button
              className="flex-1 w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl text-xs font-bold hover:from-teal-700 hover:to-emerald-600 transition-all shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              {t('pro.pricing.upgradePro', 'Upgrade to Professional')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ═══════════════════════════════════════════════════
// Mock CRM Dashboard Background (Demo data)
// ═══════════════════════════════════════════════════
const MockDashboardBg = () => (
  <div className="p-6 space-y-6 select-none pointer-events-none" aria-hidden="true">
    {/* Stats Row */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total Patients', value: '1,248', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Monthly Revenue', value: '₺47,320', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: "Today's Appointments", value: '12', icon: Stethoscope, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Satisfaction Rate', value: '96%', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <Activity className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue Chart Mock */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-500" /> Revenue Analytics
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">+23%</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-gray-400">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
        </div>
      </div>

      {/* Patient Density Mock */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-violet-500" /> Patient Density
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-1 h-32">
          {Array.from({ length: 35 }).map((_, i) => {
            const intensity = [0.2, 0.4, 0.6, 0.8, 1][Math.floor(Math.random() * 5)];
            return (
              <div
                key={i}
                className="rounded-sm"
                style={{ backgroundColor: `rgba(20, 184, 166, ${intensity})` }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-[9px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-200" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-400" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-600" /> High</span>
        </div>
      </div>
    </div>

    {/* Recent Patients Table Mock */}
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-amber-500" /> Recent Medical Records
      </h3>
      <div className="space-y-3">
        {[
          { name: 'Zeynep K.', type: 'Blood Test', date: 'Today', status: 'Complete' },
          { name: 'Ali Y.', type: 'MRI Report', date: 'Yesterday', status: 'Pending' },
          { name: 'Selin A.', type: 'X-Ray', date: '2 days ago', status: 'Complete' },
          { name: 'Mehmet O.', type: 'Lab Results', date: '3 days ago', status: 'In Review' },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
              {r.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800">{r.name}</p>
              <p className="text-[10px] text-gray-400">{r.type}</p>
            </div>
            <span className="text-[10px] text-gray-400">{r.date}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.status === 'Complete' ? 'bg-emerald-50 text-emerald-600' : r.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════
// ProTeaser — Main Export
// Sidebar width constant (must match CRMLayout sidebar: w-64 = 256px)
// ═══════════════════════════════════════════════════
const SIDEBAR_W = 256;

const ProTeaser = ({ page = 'crm' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPricing, setShowPricing] = useState(false);

  // ── Scroll lock: prevent background page scrolling while ProTeaser is mounted ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const benefits = [
    {
      icon: TrendingUp,
      title: t('pro.teaser.revenueTitle', 'Revenue Analytics'),
      desc: t('pro.teaser.revenueDesc', 'Track your earnings by specialty and time period.'),
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: FolderArchive,
      title: t('pro.teaser.archiveTitle', 'Unlimited Archive'),
      desc: t('pro.teaser.archiveDesc', 'All lab results and notes at your fingertips.'),
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: CalendarClock,
      title: t('pro.teaser.calendarTitle', 'Smart Calendar'),
      desc: t('pro.teaser.calendarDesc', 'Reduce your assistant workload by 50%.'),
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Video,
      title: t('pro.teaser.telehealthTitle', 'Telehealth'),
      desc: t('pro.teaser.telehealthDesc', 'Conduct video consultations with patients.'),
      color: 'from-rose-500 to-pink-500',
    },
  ];

  return createPortal(
    <>
      {/* ══ Overlay: Now covers full viewport to ensure consistent blur ══ */}
      <div
        className="fixed inset-0 z-[60] lg:left-[256px] lg:w-[calc(100%-256px)]"
      >
        {/* ── Background: Mock Dashboard (blurred) ── */}
        <div className="absolute inset-0 overflow-hidden">
          <MockDashboardBg />
        </div>

        {/* ── Glassmorphism Blur — only content area ── */}
        <div className="absolute inset-0 backdrop-blur-[8px] bg-white/50" />

        {/* ── Centering container — mathematically centered within content area ── */}
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          {/* ── Marketing Overlay Card ── */}
          <div className="relative z-10 w-full max-w-xl">

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/60 overflow-hidden">

              {/* ── Header: Dark Navy (#101827) ── */}
              <div className="relative overflow-hidden px-6 sm:px-8 py-6" style={{ background: 'linear-gradient(135deg, #101827 0%, #1a2332 50%, #101827 100%)' }}>
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <div className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" style={{ background: '#0A6E6F' }} />
                  <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" style={{ background: '#10B981' }} />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #0A6E6F, #10B981)' }}>
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: 'rgba(10,110,111,0.15)', borderColor: 'rgba(10,110,111,0.3)', color: '#5EEAD4' }}>
                      Professional
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
                    {t('pro.teaser.headline', 'Transform Your Clinic Into a Digital Powerhouse')}
                  </h1>
                  <p className="text-sm mt-3 leading-relaxed" style={{ color: '#9CA3AF' }}>
                    {t('pro.teaser.subheadline', 'Manage patients, appointments, and revenue — all from a single professional dashboard.')}
                  </p>
                </div>
              </div>

              {/* ── Benefits Grid — 2-col, smart spacing ── */}
              <div className="px-6 sm:px-8 pt-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <b.icon className="w-[18px] h-[18px] text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 leading-snug">{b.title}</p>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#4B5563' }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── CTAs: Button pairing — secondary left, primary right ── */}
              <div className="px-6 sm:px-8 pt-4 pb-6 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowPricing(true)}
                  className="sm:flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  {t('pro.teaser.compareCta', 'Compare Plans')}
                </button>
                <button
                  onClick={() => navigate('/crm/billing')}
                  className="sm:flex-1 px-5 py-3 text-white rounded-xl text-[13px] font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #0A6E6F, #10B981)', boxShadow: '0 8px 24px rgba(10,110,111,0.25)' }}
                >
                  <Crown className="w-4 h-4" />
                  {t('pro.teaser.upgradeCta', 'Upgrade to Professional')}
                </button>
              </div>
            </div>

            {/* Trust badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px]" style={{ color: '#6B7280' }}>
              <Shield className="w-3.5 h-3.5" />
              <span>{t('pro.teaser.trustBadge', 'Cancel anytime · No commitment · GDPR compliant')}</span>
            </div>
          </div>
        </div>
      </div>

      {showPricing && <PricingModal open={showPricing} onClose={() => setShowPricing(false)} t={t} />}
    </>,
    document.body
  );
};

export default ProTeaser;
