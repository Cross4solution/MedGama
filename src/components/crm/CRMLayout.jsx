import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Stethoscope,
  PieChart,
  HelpCircle,
  Shield,
  Plug,
  Receipt,
  ExternalLink,
  Home,
  Rss,
  Video,
  DollarSign,
  LifeBuoy,
  BookOpen,
  Building2,
  Star,
  Check,
  Clock,
  Heart,
  MessageCircle,
  CalendarClock,
  Loader2,
  CheckCheck,
  Trash2,
  BellOff,
  Sparkles,
  Lock,
  Mail,
  AlertTriangle,
  AlertOctagon,
  Info,
  Wrench,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { notificationAPI, chatAPI } from '../../lib/api';
import { useNotifications } from '../../context/NotificationsContext';
import { getEcho } from '../../lib/echo';
import { useToast } from '../../context/ToastContext';
import resolveStorageUrl from '../../utils/resolveStorageUrl';

const getNavSections = (t, role, isVerified, { chatUnreadCount = 0 } = {}) => {
  const isClinic = role === 'clinic' || role === 'clinicOwner';
  const doctorUnverified = role === 'doctor' && !isVerified;

  const mainItems = [
    { label: t('crm.sidebar.dashboard'), icon: LayoutDashboard, path: '/crm', pro: true },
    { label: t('crm.sidebar.appointments'), icon: CalendarDays, path: '/crm/appointments', pro: true, locked: doctorUnverified },
    { label: t('crm.sidebar.smartCalendar', 'Smart Calendar'), icon: CalendarCheck, path: '/crm/calendar', pro: true },
    { label: t('crm.sidebar.patients'), icon: Users, path: '/crm/patients', pro: true },
  ];
  // Doctor-only: examination
  if (!isClinic) {
    mainItems.push({ label: t('crm.sidebar.examination'), icon: Stethoscope, path: '/crm/examination', pro: true });
  }
  mainItems.push({ label: t('crm.sidebar.telehealth', 'Telehealth'), icon: Video, path: '/crm/telehealth', pro: true });
  mainItems.push({ label: t('crm.sidebar.contactInbox', 'Contact Messages'), icon: Mail, path: '/crm/contact-inbox', badge: chatUnreadCount > 0 ? chatUnreadCount : undefined });
  // Clinic-only: staff management + clinic manager panel
  if (isClinic) {
    mainItems.push({ label: t('crm.sidebar.staff', 'Staff'), icon: Users, path: '/crm/staff' });
    mainItems.push({ label: t('crm.sidebar.clinicManager', 'Clinic Management'), icon: Building2, path: '/crm/clinic-manager' });
  }

  const managementItems = [
    { label: t('crm.sidebar.revenue', 'Revenue & Finance'), icon: DollarSign, path: '/crm/revenue', pro: true },
    { label: t('crm.sidebar.billing'), icon: Receipt, path: '/crm/billing', pro: true },
    { label: t('crm.sidebar.reviews', 'Reviews'), icon: Star, path: '/crm/reviews' },
    { label: t('crm.sidebar.reports'), icon: PieChart, path: '/crm/reports', pro: true },
    { label: t('crm.sidebar.integrations'), icon: Plug, path: '/crm/integrations', pro: true },
  ];

  return [
    { title: t('crm.sidebar.main'), items: mainItems },
    { title: t('crm.sidebar.management'), items: managementItems },
    {
      title: t('crm.sidebar.system'),
      items: [
        { label: t('crm.sidebar.support', 'Support'), icon: LifeBuoy, path: '/crm/support' },
        { label: t('crm.sidebar.faq', 'FAQ'), icon: BookOpen, path: '/crm/faq' },
        { label: t('crm.sidebar.settings'), icon: Settings, path: '/crm/settings' },
      ],
    },
  ];
};

const CRM_ALLOWED_ROLES = ['doctor', 'clinic', 'clinicOwner', 'superAdmin', 'saasAdmin'];

// Smooth loading overlay for page transitions
const PageTransitionLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] animate-fadeIn">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

// ── Notification Severity System ──
// 4 categories: critical (red), warning (amber), info (blue), operational (orange)
const SEVERITY_CONFIG = {
  critical: { icon: AlertOctagon, bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', border: 'border-red-200', badgeColor: 'bg-red-500', label: 'Critical', dot: 'bg-red-500' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-200', badgeColor: 'bg-amber-500', label: 'Warning', dot: 'bg-amber-500' },
  info:     { icon: Info, bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-200', badgeColor: 'bg-blue-500', label: 'Info', dot: 'bg-blue-500' },
  operational: { icon: Wrench, bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', border: 'border-orange-200', badgeColor: 'bg-orange-500', label: 'Operational', dot: 'bg-orange-500' },
};

const classifyNotifSeverity = (type) => {
  if (!type) return 'info';
  const t = type.toLowerCase();
  // Critical: cancellations, rejections, failures
  if (t.includes('cancelled') || t.includes('rejected') || t.includes('failed') || t.includes('review_rejected') || t.includes('review_hidden') || t.includes('verification_rejected')) return 'critical';
  // Warning: reminders, pending items, urgent reviews
  if (t.includes('reminder') || t.includes('pending') || t.includes('new_review') || t.includes('expir')) return 'warning';
  // Operational: system, maintenance, updates
  if (t.includes('system') || t.includes('maintenance') || t.includes('update') || t.includes('operational')) return 'operational';
  // Info: everything else (booked, confirmed, liked, comment, chat, etc.)
  return 'info';
};

const getNotifIcon = (type) => {
  if (!type) return Bell;
  const t = type.toLowerCase();
  if (t.includes('review')) return Star;
  if (t.includes('verification')) return ShieldAlert;
  if (t.includes('liked')) return Heart;
  if (t.includes('comment') || t.includes('chat') || t.includes('message')) return MessageCircle;
  if (t.includes('booked')) return CalendarClock;
  if (t.includes('confirmed')) return Check;
  if (t.includes('cancelled')) return X;
  if (t.includes('reminder')) return Clock;
  const severity = classifyNotifSeverity(type);
  return SEVERITY_CONFIG[severity]?.icon || Bell;
};

const getNotifColor = (type) => {
  const severity = classifyNotifSeverity(type);
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
  return `${cfg.iconBg} ${cfg.iconColor}`;
};

// Only count unread Critical + Warning for the badge
const getUrgentCount = (notifications) => {
  return notifications.filter(n => {
    if (n.read_at) return false;
    const severity = classifyNotifSeverity((n.data?.type) || '');
    return severity === 'critical' || severity === 'warning';
  }).length;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const CRMLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isPro } = useAuth();
  const { t } = useTranslation();
  const { notify: showToast } = useToast();
  const userRole = user?.role || user?.role_id || 'doctor';
  const isVerified = user?.is_verified;
  // ── Chat unread count for sidebar badge ──
  const [chatUnread, setChatUnread] = useState(0);

  const fetchChatUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await chatAPI.unreadCount();
      const c = res?.data?.unread_count ?? 0;
      setChatUnread(c);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchChatUnread();
    const interval = setInterval(fetchChatUnread, 30000);
    return () => clearInterval(interval);
  }, [user, fetchChatUnread]);

  const NAV_SECTIONS = getNavSections(t, userRole, isVerified, { chatUnreadCount: chatUnread });

  // ── CRM Access Gate: only Pro users can access CRM (except /crm/billing for upgrade) ──
  useEffect(() => {
    if (!user) return;
    if (isPro) return;
    const isBilling = location.pathname === '/crm/billing';
    if (!isBilling) {
      navigate('/doctor/dashboard', { replace: true });
    }
  }, [user, isPro, location.pathname, navigate]);

  // ── Notification state ──
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const { unreadCount: globalUnreadCount, decrement: globalDecrement, reset: globalReset, setCount: globalSetCount } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Keep local count in sync with global context
  useEffect(() => { setUnreadCount(globalUnreadCount); }, [globalUnreadCount]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.unreadCount();
      const c = res?.data?.unread_count ?? res?.data?.count ?? 0;
      setUnreadCount(c);
      globalSetCount(c);
    } catch {}
  }, [user, globalSetCount]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await notificationAPI.list({ per_page: 10 });
      setNotifications(res?.data?.data || res?.data || []);
    } catch {}
    setNotifLoading(false);
  }, [user]);

  // Real-time via Echo
  useEffect(() => {
    if (!user?.id) return;
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.private(`notifications.${user.id}`);
    channel.listen('.notification.new', (payload) => {
      setUnreadCount(prev => prev + 1);
      globalSetCount(c => c + 1);
      setNotifications(prev => {
        if (prev.some(n => n.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, 10);
      });
      const data = payload?.data || payload || {};
      const toastMsg = data.title || data.message || 'New notification';
      const nType = String(data.type || '');
      const toastType = nType.includes('cancelled') || nType.includes('rejected') ? 'error'
        : nType.includes('reminder') ? 'warning' : 'info';
      showToast({ type: toastType, message: toastMsg, timeout: 5000 });
    });
    return () => { echo.leave(`notifications.${user.id}`); };
  }, [user?.id]);

  // Polling fallback
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const echo = getEcho();
    const interval = setInterval(fetchUnreadCount, echo ? 60000 : 15000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Fetch list when dropdown opens
  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      globalDecrement(1);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
      globalReset();
    } catch {}
  };

  const handleNotifClick = (notif) => {
    if (!notif.read_at) handleMarkRead(notif.id);
    setNotifOpen(false);
    const data = notif.data || {};
    // Priority: action_url > link > contextual routing
    if (data.action_url) { navigate(data.action_url); return; }
    if (data.link) { navigate(data.link); return; }
    if (data.appointment_id) { navigate('/crm/appointments'); return; }
    if (data.patient_id) { navigate('/crm/patient-360?id=' + data.patient_id); return; }
    if (data.review_id) { navigate('/crm/reviews'); return; }
    if (data.ticket_id) { navigate('/crm/support'); return; }
    if (data.conversation_id) { navigate('/crm/messages'); return; }
    if (data.invoice_id) { navigate('/crm/billing'); return; }
  };

  // CRM access control — redirect unauthorized users
  React.useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    const role = user?.role || user?.role_id || 'patient';
    if (!CRM_ALLOWED_ROLES.includes(role)) {
      navigate('/explore', { replace: true });
    }
  }, [user, navigate]);

  const isActive = (path) => {
    if (path === '/crm') return location.pathname === '/crm';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout?.({ skipConfirmation: true });
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800/50 hover:bg-white/5 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">MedaGama</span>
          <span className="block text-[10px] text-gray-400 font-medium tracking-wider uppercase">CRM Platform</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active
                        ? 'bg-teal-500/15 text-teal-400 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.locked && (
                      <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    {item.badge && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}

        {/* Go to MedaGama */}
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
        >
          <Home className="w-[18px] h-[18px] flex-shrink-0 text-gray-500 group-hover:text-gray-300" />
          <span className="flex-1">Go to MedaGama</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
        </Link>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-gray-900 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-gray-900 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 hover:text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left: Hamburger + Search */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 w-64 lg:w-80">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button className="sm:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <Search className="w-4.5 h-4.5" />
              </button>
              {/* Notification Bell — Smart Alerts */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(p => !p)} className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                  <Bell className="w-4.5 h-4.5" />
                  {(() => {
                    const urgentBadge = getUrgentCount(notifications);
                    const totalUnread = unreadCount;
                    const badgeNum = urgentBadge > 0 ? urgentBadge : totalUnread;
                    return badgeNum > 0 ? (
                      <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 ${urgentBadge > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}>
                        {badgeNum > 99 ? '99+' : badgeNum}
                      </span>
                    ) : null;
                  })()}
                </button>

                {/* Overlay — dim background when dropdown is open */}
                {notifOpen && (
                  <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} onClick={() => setNotifOpen(false)} />
                )}

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200/60 z-50 overflow-hidden animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">{t('notifications.urgentAlerts', 'Urgent Alerts')}</h3>
                          <p className="text-[10px] text-gray-400">{t('notifications.taskTracker', 'Smart task tracking')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg transition-colors hover:bg-teal-100">
                            <CheckCheck className="w-3 h-3" /> {t('notifications.markAllRead', 'Mark all read')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Summary Bar */}
                    {notifications.length > 0 && (
                      <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-50 bg-gray-50/30">
                        {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => {
                          const count = notifications.filter(n => classifyNotifSeverity(n.data?.type || '') === key && !n.read_at).length;
                          if (count === 0) return null;
                          return (
                            <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.iconBg} ${cfg.iconColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {count} {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto overscroll-contain">
                      {notifLoading ? (
                        <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" /></div>
                      ) : notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">{t('notifications.allClear', 'Harika! Şu an acil bir durum yok.')}</p>
                          <p className="text-xs text-gray-400">{t('notifications.allClearDesc', 'All tasks are up to date. You\'re doing great!')}</p>
                        </div>
                      ) : (
                        notifications.map(notif => {
                          const data = notif.data || {};
                          const nType = data.type || '';
                          const severity = classifyNotifSeverity(nType);
                          const sevCfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info;
                          const NIcon = getNotifIcon(nType);
                          const iconColor = getNotifColor(nType);
                          const isUnread = !notif.read_at;

                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors border-b border-gray-50 ${
                                isUnread
                                  ? severity === 'critical' ? 'bg-red-50/30 hover:bg-red-50/50'
                                  : severity === 'warning' ? 'bg-amber-50/30 hover:bg-amber-50/50'
                                  : 'bg-blue-50/20 hover:bg-gray-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                <NIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className={`text-xs leading-relaxed flex-1 ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                    {data.title || data.message || 'Notification'}
                                  </p>
                                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${sevCfg.iconBg} ${sevCfg.iconColor}`}>
                                    {sevCfg.label}
                                  </span>
                                </div>
                                {data.message && data.title && (
                                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{data.message}</p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                              </div>
                              {isUnread && <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${sevCfg.dot}`} />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between bg-gray-50/30">
                      <Link to="/crm/support" onClick={() => { handleMarkAllRead(); setNotifOpen(false); }}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1">
                        {t('notifications.viewAll', 'View All')} →
                      </Link>
                      {unreadCount > 0 && (
                        <span className="text-[10px] text-gray-400">{unreadCount} unread</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={resolveStorageUrl(user?.avatar)}
                    alt={user?.name || 'Doctor'}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name || 'Dr. Demo'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200/60 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'Dr. Demo'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'doctor@medagama.com'}</p>
                      </div>
                      <Link to="/crm/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" />
                        Settings
                      </Link>
                      <Link to="/crm" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Shield className="w-4 h-4 text-gray-400" />
                        Privacy & Data
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Verification Pending Banner — unverified doctors */}
        {userRole === 'doctor' && !user?.is_verified && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 lg:mt-8 mb-0 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">{t('crm.verificationBanner.title', 'Account Under Review')}</p>
                <p className="text-xs text-amber-700 mt-0.5">{t('crm.verificationBanner.description', 'Your account is being reviewed by our admin team. Appointment creation and MedStream interaction features (like, comment, share) are restricted until approval.')}</p>
              </div>
            </div>
            <Link
              to="/crm/settings?tab=verification"
              onClick={() => { setTimeout(() => document.querySelector('[data-tab="verification"]')?.click(), 300); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex-shrink-0"
            >
              <Shield className="w-3.5 h-3.5" />
              {t('crm.verificationBanner.action', 'Submit Documents')}
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<PageTransitionLoader />}>
            <div className="animate-fadeIn">
              {children}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default CRMLayout;
