import React, { useState, useMemo, useEffect } from 'react';
import { appointmentAPI, clinicVerificationAPI, hospitalAPI, patientAPI, billingAPI } from '../../lib/api';
import { appointmentTimeDisplay } from '../../utils/dates';
import {
  CalendarDays,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Phone,
  Video,
  MapPin,
  MoreVertical,
  Plus,
  Filter,
  Bell,
  FileText,
  Stethoscope,
  Activity,
  ClipboardCheck,
  ArrowUpRight,
  Eye,
  MessageSquare,
  UserPlus,
  RefreshCw,
  ExternalLink,
  Crown,
  Lock,
  Shield,
  Rss,
  Star,
  Mail,
  PieChart,
  Image,
} from 'lucide-react';
import { Link } from '@/compat/router';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AiInsightBanner from '../../components/crm/AiInsightBanner';
import ClinicVerificationModal from '../../components/crm/ClinicVerificationModal';
import PremiumGate from '../../components/crm/PremiumGate';

// ─── Mock Data ───────────────────────────────────────────────
const TODAY = new Date();
const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

/*
 * Bu panelde bir zamanlar uydurma veri vardı: 1284 hasta, €2.450 günlük gelir,
 * "Mehmet Özkan'ın laboratuvar sonuçları anormal" diye bir acil uyarı ve
 * hastaların yanında risk etiketleri. Hiçbirinin arkasında bir şey yoktu —
 * laboratuvar uyarısı üreten bir sistem de, risk hesaplayan bir şey de
 * projede hiç yazılmadı. Doktorun böyle bir uyarıya güvenip beklemesi
 * tıbbi bir risk; müşteriye demoda gerçek gibi gösterilmesi ayrı bir sorun.
 *
 * Kutular artık gerçek uçlardan besleniyor, karşılığı olmayan iki blok
 * kaldırıldı. Yeni bir hesapta sayılar sıfır görünür; doğrusu da budur.
 */


// ─── Sub-components ──────────────────────────────────────────

const StatusBadge = ({ status }) => {
  // Kendi kancası şart: t üst bileşende tanımlı, burada kapsam dışı.
  const { t } = useTranslation();
  const config = {
    completed: { label: t('crm.dashboard.status.completed', 'Completed'), className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'in-progress': { label: t('crm.dashboard.status.inProgress', 'In Progress'), className: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' },
    upcoming: { label: t('crm.dashboard.status.upcoming', 'Upcoming'), className: 'bg-gray-50 text-gray-600 border-gray-200' },
    cancelled: { label: t('crm.dashboard.status.cancelled', 'Cancelled'), className: 'bg-red-50 text-red-600 border-red-200 line-through' },
    'no-show': { label: t('crm.dashboard.status.noShow', 'No Show'), className: 'bg-orange-50 text-orange-600 border-orange-200' },
  };
  const c = config[status] || config.upcoming;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.className}`}>{c.label}</span>;
};

const MethodIcon = ({ method }) => {
  if (method === 'video') return <Video className="w-3.5 h-3.5 text-sky-500" />;
  if (method === 'phone') return <Phone className="w-3.5 h-3.5 text-violet-500" />;
  return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
};

// Risk rozeti kaldırıldı: hastanın risk düzeyini hesaplayan bir şey yok.

// ─── Upgrade Banner (empty state CTA for free doctors) ───────
const UpgradeBanner = ({ t, label }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <Lock className="w-8 h-8 text-gray-300 mb-2" />
    <p className="text-xs text-gray-400 mb-3">{label || t('crm.dashboard.upgradeHint', 'Upgrade to Professional to unlock live data')}</p>
    <Link
      to="/crm/billing"
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-lg text-xs font-bold hover:from-teal-700 hover:to-emerald-600 transition-all shadow-sm"
    >
      <Crown className="w-3.5 h-3.5" />
      {t('pro.teaser.upgradeCta', 'Upgrade to Professional')}
    </Link>
  </div>
);

// ─── Hospital Stat Cards (L4 only) ───────────────────────────

const HOSPITAL_STAT_CONFIG = [
  { key: 'total_branches',  labelKey: 'hospital.stats.totalBranches',  fallback: 'Total Branches',    icon: MapPin,     bg: 'bg-teal-50',    iconColor: 'text-teal-600',    border: 'border-teal-100'   },
  { key: 'total_clinics',   labelKey: 'hospital.stats.linkedClinics',  fallback: 'Linked Clinics',    icon: Building2,  bg: 'bg-blue-50',    iconColor: 'text-blue-600',    border: 'border-blue-100'   },
  { key: 'total_doctors',   labelKey: 'hospital.stats.activeDoctors',  fallback: 'Active Doctors',    icon: Users,      bg: 'bg-violet-50',  iconColor: 'text-violet-600',  border: 'border-violet-100' },
];

const HospitalStatCards = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalAPI.stats()
      .then((res) => setStats(res?.stats ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {HOSPITAL_STAT_CONFIG.map((cfg) => {
        const Icon = cfg.icon;
        return (
          <div key={cfg.key} className={`bg-white rounded-xl border ${cfg.border} p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${cfg.iconColor}`} />
              </div>
              <p className="text-xs font-medium text-gray-500">{t(cfg.labelKey, cfg.fallback)}</p>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-7 w-16 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-gray-50 rounded animate-pulse" />
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {stats?.[cfg.key] ?? '—'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────

const CRMDashboard = () => {
  const { user, isPro } = useAuth();
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [apiAppointments, setApiAppointments] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Kutulardaki sayılar sunucudan; gelmezse kutu "—" gösterir, uydurmaz.
  const [hastaOzeti, setHastaOzeti] = useState(null);
  const [gelirOzeti, setGelirOzeti] = useState(null);
  const [gunlukGelir, setGunlukGelir] = useState(null);

  useEffect(() => {
    patientAPI.stats().then(res => setHastaOzeti(res?.data || res)).catch(() => {});
    billingAPI.stats().then(res => setGelirOzeti(res?.data || res)).catch(() => {});
    billingAPI.revenueChart({ period: 'daily' })
      .then(res => setGunlukGelir(res?.data || res?.chart || res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    appointmentAPI.list({ per_page: 50 }).then(res => {
      const list = res?.data || [];
      // Boş liste de bir cevaptır: eskiden yalnızca dolu liste yazılıyordu,
      // randevusu olmayan klinikte kutu "—" (bilinmiyor) gösteriyordu.
      {
        setApiAppointments(list.map(a => ({
          id: a.id,
          date: a.appointment_date,
          // Panel saati de bakanın kendi diliminde: randevu ekranıyla farklı
          // saat göstermesi kafa karıştırıyordu.
          time: appointmentTimeDisplay(a, isTr ? 'tr-TR' : 'en-US').time
            || a.appointment_time || '09:00',
          endTime: '',
          patient: a.patient?.fullname || 'Patient',
          age: '',
          type: a.appointment_type === 'online' ? 'Video Call' : 'In-Person',
          status: a.status || 'upcoming',
          method: a.appointment_type === 'online' ? 'video' : 'in-person',
          notes: a.confirmation_note || a.doctor_note || '',
          doctor: a.doctor?.fullname || '',
        })));
      }
    }).catch(() => {});
  }, []);

  const appointments = apiAppointments || [];

  const paraBirimi = { EUR: '€', USD: '$', TRY: '₺', GBP: '£' }[gelirOzeti?.currency] || '';
  const sayi = (v) => (v === null || v === undefined ? '—' : v);
  const tutar = (v) => (v === null || v === undefined ? '—' : `${paraBirimi}${Number(v).toLocaleString(isTr ? 'tr-TR' : 'en-US')}`);

  const bugun = new Date().toISOString().slice(0, 10);
  const bugunkuRandevu = apiAppointments
    ? apiAppointments.filter(a => a.date?.slice(0, 10) === bugun).length
    : null;

  // Kutular: hepsinin arkasında gerçek bir uç var. "Bekleyen onay" kutusu
  // kaldırıldı — randevular artık doğrudan onaylı geliyor, onay diye bir
  // adım kalmadı.
  const STATS = [
    { label: t('crm.dashboard.todayAppointments', isTr ? 'Bugünkü randevu' : "Today's appointments"),
      value: sayi(bugunkuRandevu), icon: CalendarDays, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', borderColor: 'border-blue-100' },
    { label: t('crm.dashboard.newPatientsMonth', isTr ? 'Bu ay yeni hasta' : 'New patients this month'),
      value: sayi(hastaOzeti?.new_this_month), icon: Clock, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', borderColor: 'border-amber-100' },
    { label: t('crm.dashboard.todayRevenue', isTr ? 'Bugünkü gelir' : "Today's revenue"),
      value: tutar(gelirOzeti?.today_revenue), icon: DollarSign, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
    { label: t('crm.dashboard.totalPatients', isTr ? 'Toplam hasta' : 'Total patients'),
      value: sayi(hastaOzeti?.total), icon: Users, bgColor: 'bg-violet-50', iconColor: 'text-violet-600', borderColor: 'border-violet-100' },
  ];

  // Gelir grafiği: son yedi günün gerçek toplamları.
  const GELIR_GRAFIGI = Array.isArray(gunlukGelir)
    ? gunlukGelir.slice(-7).map(d => ({ day: d.label || d.period || '', amount: Number(d.total ?? d.gross ?? 0) }))
    : [];

  const filteredAppointments = useMemo(() => {
    if (appointmentFilter === 'all') return appointments;
    return appointments.filter((a) => a.status === appointmentFilter);
  }, [appointmentFilter, appointments]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [appointmentFilter]);

  const maxRevenue = Math.max(...GELIR_GRAFIGI.map((d) => d.amount), 1);

  // "Son hastalar" gerçek randevulardan: her hasta bir kez, en yenisi üstte.
  const sonHastalar = useMemo(() => {
    const gorulen = new Map();
    for (const a of [...appointments].sort((x, y) => String(y.date).localeCompare(String(x.date)))) {
      if (!a.patient || gorulen.has(a.patient)) continue;
      gorulen.set(a.patient, { name: a.patient, tarih: a.date || '' });
    }
    return [...gorulen.values()].slice(0, 5);
  }, [appointments]);

  const isClinicOwner = user?.role_id === 'clinicOwner';
  const isHospital = user?.role_id === 'hospital';
  const isFreeTier = isHospital ? false : !isPro;

  // ── Clinic Verification ──
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [clinicVerificationStatus, setClinicVerificationStatus] = useState(null);

  useEffect(() => {
    if (!isClinicOwner) return;
    clinicVerificationAPI.status().then(res => {
      const d = res?.data || res;
      setClinicVerificationStatus(d.verification_status || 'unverified');
    }).catch(() => {});
  }, [isClinicOwner]);

  const clinicNeedsVerification = isClinicOwner && clinicVerificationStatus && clinicVerificationStatus !== 'verified';

  // ── Hospital Dashboard (L4) ───────────────────────────────
  if (isHospital) {
    const HOSPITAL_QUICK_ACTIONS = [
      { label: t('crm.sidebar.branches', 'Branch Management'), icon: MapPin,       color: 'bg-teal-50 text-teal-600 hover:bg-teal-100',        path: '/crm/branches' },
      { label: t('crm.sidebar.staff', 'Staff'),               icon: Users,         color: 'bg-violet-50 text-violet-600 hover:bg-violet-100',  path: '/crm/staff' },
      // MedStream kısayolu kaldırıldı: sosyal akış CRM'in işi değil.
      { label: t('crm.sidebar.reviews', 'Reviews'),           icon: Star,          color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',     path: '/crm/reviews' },
      { label: t('crm.sidebar.contactInbox', 'Messages'),     icon: Mail,          color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', path: '/crm/contact-inbox' },
      { label: t('crm.sidebar.reports', 'Reports'),           icon: PieChart,      color: 'bg-pink-50 text-pink-600 hover:bg-pink-100',        path: '/crm/reports' },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {TODAY.getHours() < 12 ? 'Good Morning' : TODAY.getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {user?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Herkese açık profil yeni sekmede: CRM'den çıkıp geri dönmek
                yerine yan yana bakılabilsin. */}
            <Link
              to={`/hospital/${user?.hospital?.codename || user?.codename || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-teal-200 text-teal-700 bg-teal-50 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">{t('doctorProfile.viewPublicProfile', 'View Public Profile')}</span>
            </Link>
            {/* "Yenile" kaldırıldı: sayfayı baştan yüklüyordu, oysa veri
                zaten açılışta çekiliyor ve randevu değişikliği anlık
                düşüyor. Tarayıcının kendi yenileme tuşundan farkı yoktu. */}
          </div>
        </div>

        {/* AI Banner */}
        {/* Uyarı kaynağı yok: banner yalnızca gerçekten elimizde olan
            veriden çıkarım yapar, uydurma uyarı beslenmez. */}
        <AiInsightBanner appointments={[]} alerts={[]} stats={[]} patients={[]} />

        {/* Hospital Network Stats */}
        <HospitalStatCards />

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">{t('crm.dashboard.quickActions', 'Quick Actions')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {HOSPITAL_QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${action.color} border border-transparent hover:border-gray-200 hover:shadow-sm`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold text-center leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Doctor / Clinic Dashboard ─────────────────────────────
  return (
    <div className="space-y-5">
      {/* Başlık alanı kısaldı: selamlama üç satır yer kaplayınca asıl iş olan
          randevu listesi ekranın altına düşüyor, ilk bakışta görünmüyordu. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900">
            Good {TODAY.getHours() < 12 ? 'Morning' : TODAY.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Doctor'} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/doctor/${user?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-teal-200 text-teal-700 bg-teal-50 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">{t('doctorProfile.viewPublicProfile')}</span>
          </Link>
          {(user?.role_id === 'doctor' && !user?.is_verified) || clinicNeedsVerification ? (
            <button
              onClick={() => clinicNeedsVerification ? setShowVerifyModal(true) : null}
              title={t('crm.verificationBanner.restrictedFeature', 'Verification required to use this feature')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                clinicNeedsVerification
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
              }`}
            >
              {clinicNeedsVerification ? <Shield className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {clinicNeedsVerification ? t('crm.clinicVerification.verifyNow', 'Verify Now') : t('crm.dashboard.newAppointment')}
            </button>
          ) : (
            <Link
              to="/crm/appointments"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              {t('crm.dashboard.newAppointment')}
            </Link>
          )}
          {/* "Yenile" kaldırıldı: hiçbir işlevi yoktu (onClick bile yoktu) ve
              olsaydı bile veri açılışta çekiliyor, randevu değişikliği anlık
              düşüyor. */}
        </div>
      </div>

      {/* Clinic Verification Banner */}
      {clinicNeedsVerification && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          clinicVerificationStatus === 'pending_review'
            ? 'bg-blue-50 border-blue-200'
            : clinicVerificationStatus === 'rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
        }`}>
          <Shield className={`w-5 h-5 flex-shrink-0 ${
            clinicVerificationStatus === 'pending_review' ? 'text-blue-600' : clinicVerificationStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${
              clinicVerificationStatus === 'pending_review' ? 'text-blue-700' : clinicVerificationStatus === 'rejected' ? 'text-red-700' : 'text-amber-700'
            }`}>
              {clinicVerificationStatus === 'pending_review'
                ? t('crm.clinicVerification.statusPending', 'Your documents are under review')
                : clinicVerificationStatus === 'rejected'
                  ? t('crm.clinicVerification.statusRejected', 'Your verification was rejected')
                  : t('crm.clinicVerification.statusUnverified', 'Your clinic is not yet verified')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {clinicVerificationStatus === 'pending_review'
                ? t('crm.clinicVerification.pendingDesc', 'Our team is reviewing your documents. This usually takes 1-2 business days.')
                : t('crm.clinicVerification.verifyDesc', 'Verify your clinic to unlock all features including appointments.')}
            </p>
          </div>
          {clinicVerificationStatus !== 'pending_review' && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:shadow-md transition-all flex-shrink-0"
              style={{ backgroundColor: '#0A6E6F' }}
            >
              <Shield className="w-4 h-4" />
              {t('crm.clinicVerification.verifyNow', 'Verify Now')}
            </button>
          )}
        </div>
      )}

      {/* AI Insight Banner */}
      <AiInsightBanner
        appointments={appointments}
        alerts={[]}
        stats={STATS}
        patients={[]}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border ${stat.borderColor} p-3 sm:p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
            </div>
            {isFreeTier ? (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-300 select-none">—</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </>
            )}
          </div>
        ))}
      </div>
      {isFreeTier && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-teal-100 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <Crown className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{t('crm.dashboard.unlockInsights', 'Unlock Real-Time Insights')}</p>
                <p className="text-xs text-gray-500">{t('crm.dashboard.upgradeHint', 'Upgrade to Professional to unlock live data')}</p>
              </div>
            </div>
            <Link
              to="/crm/billing"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl text-xs font-bold hover:from-teal-700 hover:to-emerald-600 transition-all shadow-lg shadow-teal-200/50"
            >
              <Crown className="w-3.5 h-3.5" />
              {t('pro.teaser.upgradeCta', 'Upgrade to Professional')}
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Appointments + Right Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Appointments + Quick Actions */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Appointments List */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                {/* Başlık "Bugünkü Randevular"dı ama liste tüm randevuları
                    gösteriyor ve altında dönem filtreleri var. Üstteki kutu
                    bugünü sayınca ikisi çelişiyordu. */}
                <h2 className="text-sm font-bold text-gray-900">
                  {t('crm.dashboard.appointmentsTitle', isTr ? 'Randevular' : 'Appointments')}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {appointments.length} {isTr ? 'randevu' : 'appointments'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { key: 'all', label: t('crm.dashboard.filter.all', 'All') },
                { key: 'upcoming', label: t('crm.dashboard.filter.upcoming', 'Upcoming') },
                { key: 'in-progress', label: t('crm.dashboard.filter.active', 'Active') },
                { key: 'completed', label: t('crm.dashboard.filter.done', 'Done') },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAppointmentFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    appointmentFilter === f.key
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment Rows */}
          <div className="divide-y divide-gray-50 min-h-0">
            {isFreeTier ? (
              <UpgradeBanner t={t} label={t('crm.dashboard.upgradeAppointments', 'Upgrade to see your live appointment schedule')} />
            ) : filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CalendarDays className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">{t('crm.dashboard.noAppointments')}</p>
              </div>
            ) : (
              paginatedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group ${
                    apt.status === 'in-progress' ? 'bg-blue-50/30 border-l-2 border-l-blue-500' : ''
                  } ${apt.status === 'cancelled' ? 'opacity-50' : ''}`}
                >
                  {/* Time */}
                  <div className="w-14 sm:w-16 flex-shrink-0 text-center">
                    <p className={`text-sm font-bold ${apt.status === 'in-progress' ? 'text-blue-600' : 'text-gray-900'}`}>{apt.time}</p>
                    <p className="text-[10px] text-gray-400">{apt.endTime}</p>
                  </div>

                  {/* Divider */}
                  <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${
                    apt.status === 'completed' ? 'bg-emerald-300' :
                    apt.status === 'in-progress' ? 'bg-blue-400' :
                    apt.status === 'cancelled' ? 'bg-red-300' :
                    'bg-gray-200'
                  }`} />

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                    {apt.patient.split(' ').map((n) => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient}</p>
                      <MethodIcon method={apt.method} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-500">{apt.type}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">Age {apt.age}</span>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={apt.status} />
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <div className="flex items-center justify-between">
              <Link to="/crm/appointments" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                {t('crm.dashboard.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              {!isFreeTier && totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">{t('crm.dashboard.quickActions')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {[
                { label: t('crm.dashboard.action.newPatient', 'New Patient'), icon: UserPlus, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100', path: '/crm/patients' },
                { label: t('crm.dashboard.action.writePrescription', 'Write Prescription'), icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100', path: '/crm/prescriptions' },
                { label: t('crm.dashboard.action.startVideoCall', 'Start Video Call'), icon: Video, color: 'bg-sky-50 text-sky-600 hover:bg-sky-100', path: '/crm/appointments' },
                { label: t('crm.dashboard.action.viewReports', 'View Reports'), icon: FileText, color: 'bg-violet-50 text-violet-600 hover:bg-violet-100', path: '/crm/reports' },
                { label: t('crm.dashboard.action.sendMessage', 'Send Message'), icon: MessageSquare, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100', path: '/crm/messages' },
                { label: t('crm.dashboard.action.revenueReport', 'Revenue Report'), icon: DollarSign, color: 'bg-pink-50 text-pink-600 hover:bg-pink-100', path: '/crm/revenue' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${action.color} border border-transparent hover:border-gray-200 hover:shadow-sm`}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold text-center leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Acil uyarı bloğu kaldırıldı: uyarı üreten bir sistem yok.
              "Laboratuvar sonuçları anormal" gibi tıbbi bir uyarıyı,
              arkasında hiçbir şey yokken göstermek doktorun ona güvenip
              beklemesine yol açardı. */}
          {/* Weekly Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('crm.dashboard.weeklyRevenue')}</h2>
              </div>
              <span className="text-xs font-semibold text-emerald-600">
                {tutar(GELIR_GRAFIGI.reduce((a, d) => a + d.amount, 0))}
              </span>
            </div>
            {isFreeTier ? (
              <UpgradeBanner t={t} label={t('crm.dashboard.upgradeRevenue', 'Upgrade to track your weekly revenue')} />
            ) : GELIR_GRAFIGI.length === 0 ? (
              // Fatura yoksa gösterilecek bir şey de yok. Eskiden burada
              // uydurma bir hafta (€8.400) çiziliyordu.
              <p className="px-5 py-8 text-center text-xs text-gray-400">
                {isTr ? 'Henüz gelir kaydı yok.' : 'No revenue recorded yet.'}
              </p>
            ) : (
              <div className="px-5 py-4">
                <div className="flex items-end justify-between gap-2 h-28">
                  {GELIR_GRAFIGI.map((d, i) => {
                    const h = d.amount > 0 ? Math.max(12, (d.amount / maxRevenue) * 100) : 4;
                    const isToday = i === GELIR_GRAFIGI.length - 1;
                    return (
                      <div key={`${d.day}-${i}`} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-gray-500">
                          {d.amount > 0 ? tutar(Math.round(d.amount)) : '—'}
                        </span>
                        <div
                          className={`w-full max-w-[32px] rounded-lg transition-all ${
                            isToday ? 'bg-gradient-to-t from-teal-600 to-teal-400 shadow-sm shadow-teal-200' :
                            d.amount > 0 ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-100'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                        <span className={`text-[10px] font-medium ${isToday ? 'text-teal-600 font-bold' : 'text-gray-400'}`}>{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('crm.dashboard.recentPatients')}</h2>
              </div>
              <Link to="/crm/patients" className="text-xs font-semibold text-teal-600 hover:text-teal-700">{t('crm.dashboard.viewAll')}</Link>
            </div>
            {isFreeTier ? (
              <UpgradeBanner t={t} label={t('crm.dashboard.upgradePatients', 'Upgrade to see your recent patients')} />
            ) : sonHastalar.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-gray-400">
                {isTr ? 'Henüz hasta kaydı yok.' : 'No patients yet.'}
              </p>
            ) : (
              // Liste gerçek randevulardan türetiliyor. Yanlarındaki risk
              // etiketleri kaldırıldı ("Abnormal Labs · yüksek risk"): risk
              // hesaplayan bir şey yok, uydurma bir tıbbi değerlendirmeyi
              // doktorun ekranında göstermek kabul edilemez.
              <div className="divide-y divide-gray-50">
                {sonHastalar.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0">
                      {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.tarih}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Clinic Verification Modal */}
      <ClinicVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onStatusChange={(status) => setClinicVerificationStatus(status)}
      />
    </div>
  );
};

export default CRMDashboard;
