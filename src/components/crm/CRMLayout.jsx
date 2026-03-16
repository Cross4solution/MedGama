import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { notificationAPI } from '../../lib/api';
import { getEcho } from '../../lib/echo';
import { useToast } from '../../context/ToastContext';

const getNavSections = (t, role) => {
  const isClinic = role === 'clinic' || role === 'clinicOwner';

  const mainItems = [
    { label: t('crm.sidebar.dashboard'), icon: LayoutDashboard, path: '/crm' },
    { label: t('crm.sidebar.appointments'), icon: CalendarDays, path: '/crm/appointments' },
    { label: t('crm.sidebar.smartCalendar', 'Smart Calendar'), icon: CalendarCheck, path: '/crm/calendar' },
    { label: t('crm.sidebar.patients'), icon: Users, path: '/crm/patients' },
  ];
  // Doctor-only: examination
  if (!isClinic) {
    mainItems.push({ label: t('crm.sidebar.examination'), icon: Stethoscope, path: '/crm/examination' });
  }
  mainItems.push({ label: t('crm.sidebar.telehealth', 'Telehealth'), icon: Video, path: '/crm/telehealth' });
  // Clinic-only: staff management + clinic manager panel
  if (isClinic) {
    mainItems.push({ label: t('crm.sidebar.staff', 'Staff'), icon: Users, path: '/crm/staff' });
    mainItems.push({ label: t('crm.sidebar.clinicManager', 'Clinic Management'), icon: Building2, path: '/crm/clinic-manager' });
  }

  const managementItems = [
    { label: t('crm.sidebar.revenue', 'Revenue & Finance'), icon: DollarSign, path: '/crm/revenue' },
    { label: t('crm.sidebar.billing'), icon: Receipt, path: '/crm/billing' },
    { label: t('crm.sidebar.reviews', 'Reviews'), icon: Star, path: '/crm/reviews' },
    { label: t('crm.sidebar.reports'), icon: PieChart, path: '/crm/reports' },
    { label: t('crm.sidebar.integrations'), icon: Plug, path: '/crm/integrations' },
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

// ── Notification helpers ──
const getNotifIcon = (type) => {
  if (!type) return Bell;
  if (type.includes('review')) return Star;
  if (type.includes('verification')) return Check;
  if (type.includes('liked')) return Heart;
  if (type.includes('comment')) return MessageCircle;
  if (type.includes('chat') || type.includes('message')) return MessageCircle;
  if (type.includes('booked') || type.includes('Booked')) return CalendarClock;
  if (type.includes('confirmed') || type.includes('Confirmed')) return Check;
  if (type.includes('cancelled') || type.includes('Cancelled')) return X;
  if (type.includes('reminder') || type.includes('Reminder')) return Clock;
  return Bell;
};

const getNotifColor = (type) => {
  if (!type) return 'bg-gray-100 text-gray-500';
  if (type.includes('new_review')) return 'bg-amber-100 text-amber-600';
  if (type.includes('review_approved')) return 'bg-emerald-100 text-emerald-600';
  if (type.includes('review_rejected') || type.includes('review_hidden')) return 'bg-red-100 text-red-600';
  if (type.includes('review_response')) return 'bg-teal-100 text-teal-600';
  if (type.includes('verification_approved')) return 'bg-emerald-100 text-emerald-600';
  if (type.includes('verification_rejected')) return 'bg-red-100 text-red-600';
  if (type.includes('booked') || type.includes('Booked')) return 'bg-blue-100 text-blue-600';
  if (type.includes('confirmed') || type.includes('Confirmed')) return 'bg-emerald-100 text-emerald-600';
  if (type.includes('cancelled') || type.includes('Cancelled')) return 'bg-red-100 text-red-600';
  if (type.includes('reminder') || type.includes('Reminder')) return 'bg-amber-100 text-amber-600';
  return 'bg-gray-100 text-gray-500';
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
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { notify: showToast } = useToast();
  const userRole = user?.role || user?.role_id || 'doctor';
  const NAV_SECTIONS = getNavSections(t, userRole);

  // ── Notification state ──
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.unreadCount();
      setUnreadCount(res?.data?.unread_count ?? res?.data?.count ?? 0);
    } catch {}
  }, [user]);

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
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotifClick = (notif) => {
    if (!notif.read_at) handleMarkRead(notif.id);
    setNotifOpen(false);
    const data = notif.data || {};
    if (data.link) { navigate(data.link); return; }
    if (data.appointment_id) { navigate('/crm/appointments'); return; }
    if (data.review_id) { navigate('/crm/reviews'); return; }
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active
                        ? 'bg-teal-500/15 text-teal-400 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Go to Main Site */}
      <div className="px-3 mb-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 group"
        >
          <Home className="w-[18px] h-[18px] flex-shrink-0 text-gray-500 group-hover:text-gray-300" />
          <span className="flex-1">{t('crm.sidebar.mainSite', 'Ana Siteye Git')}</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
        </Link>
      </div>

      {/* User card */}
      <div className="border-t border-gray-800/50 p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {(user?.name || 'D')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Dr. Demo'}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.role === 'clinic' ? 'Clinic Admin' : 'Physician'}</p>
          </div>
        </div>
      </div>
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
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(p => !p)} className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/60 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-bold text-gray-900">{t('notifications.title', 'Notifications')}</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" /> {t('notifications.markAllRead', 'Mark all read')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto">
                      {notifLoading ? (
                        <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" /></div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <BellOff className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">{t('notifications.empty', 'No notifications yet')}</p>
                        </div>
                      ) : (
                        notifications.map(notif => {
                          const data = notif.data || {};
                          const nType = data.type || '';
                          const NIcon = getNotifIcon(nType);
                          const iconColor = getNotifColor(nType);
                          const isUnread = !notif.read_at;

                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${isUnread ? 'bg-teal-50/30' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                <NIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-relaxed ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                  {data.title || data.message || 'Notification'}
                                </p>
                                {data.message && data.title && (
                                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{data.message}</p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                              </div>
                              {isUnread && <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-4 py-2.5">
                      <Link to="/notifications" onClick={() => setNotifOpen(false)}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                        {t('notifications.viewAll', 'View All Notifications')} →
                      </Link>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    {(user?.name || 'D')[0].toUpperCase()}
                  </div>
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

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CRMLayout;
