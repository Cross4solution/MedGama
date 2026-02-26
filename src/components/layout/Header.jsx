import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Stethoscope, Hospital, Home, Info, HeartPulse, Building2, Cpu, LayoutDashboard, Newspaper, CalendarClock, Bookmark, Settings, ArrowUpRight, Video, Monitor, Bell, MessageCircle, Check, CheckCheck, Trash2, Clock, BellOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { notificationAPI } from '../../lib/api';

const Header = () => {
  const { user, sidebarMobileOpen, setSidebarMobileOpen, logout, hydrated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // legacy (mobile menu removed)
  const [isScrolled, setIsScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [mobileLoginExpanded, setMobileLoginExpanded] = useState(false);
  const { pathname } = useLocation();

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
    } catch { /* silent */ }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await notificationAPI.list({ per_page: 15 });
      setNotifications(res?.data?.data || res?.data || []);
    } catch { /* silent */ }
    setNotifLoading(false);
  }, [user]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  // Close notif dropdown on outside click
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
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch { /* silent */ }
  };

  const getNotifIcon = (type) => {
    if (!type) return Bell;
    if (type.includes('post_commented') || type.includes('comment')) return MessageCircle;
    if (type.includes('Booked')) return CalendarClock;
    if (type.includes('Confirmed')) return Check;
    if (type.includes('Cancelled')) return X;
    if (type.includes('Reminder')) return Clock;
    return Bell;
  };

  const getNotifColor = (type) => {
    if (!type) return 'bg-gray-100 text-gray-500';
    if (type.includes('post_commented') || type.includes('comment')) return 'bg-teal-100 text-teal-600';
    if (type.includes('Booked')) return 'bg-blue-100 text-blue-600';
    if (type.includes('Confirmed')) return 'bg-emerald-100 text-emerald-600';
    if (type.includes('Cancelled')) return 'bg-red-100 text-red-600';
    if (type.includes('Reminder')) return 'bg-amber-100 text-amber-600';
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

  const handleNotifClick = (notif) => {
    if (!notif.read_at) handleMarkRead(notif.id);
    setNotifOpen(false);
    const data = notif.data || {};
    if (data.post_id) {
      navigate(`/post/${encodeURIComponent(data.post_id)}`);
      return;
    }
    if (data.appointment_id) {
      navigate(user?.role === 'patient' ? '/telehealth' : '/crm/appointments');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileLoginExpanded(false);
  };

  // Close login dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) setLoginOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Header transparency on scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
    <header className={`site-header fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
          {/* Logo */}
          {(() => {
            const logoTo = '/home-v2';
            return (
              <Link to={logoTo} onClick={closeMenu} className="flex items-center space-x-2 cursor-pointer select-none ml-9 sm:ml-9">
                <img
                  src="/images/logo/logo.svg"
                  alt="MedaGama Logo"
                  className="h-8 md:h-9 w-auto object-contain rounded"
                  loading="eager"
                  decoding="async"
                />
                <span className="text-[17px] font-bold text-gray-900 tracking-tight">MedaGama</span>
              </Link>
            );
          })()}

          {/* Logoya daha da yakın menü */}
          <nav className="hidden md:flex items-center space-x-6 ml-auto mr-20">
            <Link to="/home-v2" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/vasco-ai" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">
              Vasco AI
            </Link>
            <Link to="/about" className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">
              {t('nav.about')}
            </Link>
          </nav>

          {/* Right cluster: actions (desktop) + mobile trigger */}
          <div className="flex items-center justify-end gap-2">
            <div className="hidden md:flex items-center space-x-2.5">
              {!hydrated ? null : !user ? (
                <>
                  <div className="relative" ref={loginRef}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={loginOpen}
                      onClick={() => setLoginOpen((p) => !p)}
                      className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3.5 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                      {t('common.login')}
                      <svg className="w-3.5 h-3.5 ml-1 inline-block text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                    </button>
                    {loginOpen && (
                      <div role="menu" className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                        <div className="px-2 pt-1 pb-1">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('nav.signIn')}</p>
                        </div>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/login'); }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600"><User className="w-[18px] h-[18px]" /></span>
                          <span className="font-semibold">{t('common.patient')}</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/doctor-login'); }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 hover:border-blue-300 transition-all"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600"><Stethoscope className="w-[18px] h-[18px]" /></span>
                          <span className="font-semibold">{t('common.doctor')}</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/clinic-login'); }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg bg-violet-50 border border-violet-200 text-violet-800 hover:bg-violet-100 hover:border-violet-300 transition-all"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 text-violet-600"><Hospital className="w-[18px] h-[18px]" /></span>
                          <span className="font-semibold">{t('common.clinic')}</span>
                        </button>
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={()=>{ setLoginOpen(false); navigate('/clinic-login'); }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-all"
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700 text-gray-300"><LayoutDashboard className="w-[18px] h-[18px]" /></span>
                          <span className="font-semibold">CRM Panel</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <Link to="/register" className="text-sm font-semibold bg-teal-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-teal-700 shadow-sm hover:shadow transition-all">{t('common.register')}</Link>
                </>
              ) : (
                <>
                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(p => !p)}
                      className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-sm">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && <p className="text-[11px] text-gray-400">{unreadCount} unread</p>}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                          {notifLoading ? (
                            <div className="flex items-center justify-center py-10">
                              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                              <BellOff className="w-8 h-8 mb-2 text-gray-300" />
                              <p className="text-sm font-medium">No notifications yet</p>
                              <p className="text-[11px]">You'll see appointment updates here</p>
                            </div>
                          ) : (
                            notifications.map((notif) => {
                              const notifType = String(notif?.data?.type || notif?.type || '');
                              const NIcon = getNotifIcon(notifType);
                              const iconColor = getNotifColor(notifType);
                              const isUnread = !notif.read_at;
                              const data = notif.data || {};
                              return (
                                <div
                                  key={notif.id}
                                  onClick={() => handleNotifClick(notif)}
                                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
                                    isUnread ? 'bg-teal-50/30 hover:bg-teal-50/60' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                    <NIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] leading-snug ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                      {data.title || data.message || notif.type?.split('\\').pop()?.replace('Notification', '') || 'Notification'}
                                    </p>
                                    {data.body && (
                                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{data.body}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                                    {isUnread && (
                                      <div className="w-2 h-2 rounded-full bg-teal-500" title="Unread" />
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteNotif(notif.id); }}
                                      className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                            <button
                              onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                              className="w-full text-center text-[12px] font-semibold text-teal-600 hover:text-teal-700 py-1 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              View all notifications
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Avatar + Name */}
                  <div className="relative" ref={profileRef}>
                    <div className="flex items-center gap-2 px-1.5 py-1 rounded-lg border border-transparent" title={user.name}>
                      <img
                        src={user.avatar || '/images/default/default-avatar.svg'}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-[13px] text-gray-700 font-medium max-w-[140px] truncate">{user.name}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Mobile trigger */}
            {!hydrated ? null : user ? (
              <div className="flex items-center gap-1 md:hidden">
                {/* Mobile notification bell */}
                <button
                  onClick={() => setNotifOpen(p => !p)}
                  className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={toggleMenu}
                  aria-label={isMenuOpen ? 'Close profile menu' : 'Open profile menu'}
                  className="p-0.5 rounded-full border border-gray-200 overflow-hidden"
                  title={user.name}
                >
                  <img
                    src={user.avatar || '/images/default/default-avatar.svg'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* Logout confirm modal */}
    {confirmLogoutOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={()=>setConfirmLogoutOpen(false)} />
        <div role="dialog" aria-modal="true" className="relative bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm w-[90%] p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('common.logout')}?</h3>
          <p className="text-sm text-gray-600 mb-4">You are about to log out of your account. Are you sure?</p>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setConfirmLogoutOpen(false)} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">{t('common.cancel')}</button>
            <button onClick={()=>{ setConfirmLogoutOpen(false); logout(); navigate('/home-v2'); }} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">{t('common.logout')}</button>
          </div>
        </div>
      </div>
    )}
    {/* Guest mobile menu (local) */}
    {!user && isMenuOpen && (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden" onClick={closeMenu} />
        {/* Panel */}
        <div className="fixed top-14 left-0 right-0 z-50 mx-4 max-w-md md:hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
          <nav className="divide-y divide-gray-100">
            <div className="p-4 grid grid-cols-2 gap-2">
              {!mobileLoginExpanded ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileLoginExpanded(true)}
                    className="col-span-2 px-3 py-2 rounded-lg border text-sm font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{t('common.login')}</span>
                  </button>
                  <Link to="/register" onClick={closeMenu} className="col-span-2 text-center px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">{t('common.register')}</Link>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className="col-span-2 px-3 py-2 rounded-lg border text-sm font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{t('nav.patientLogin')}</span>
                  </Link>
                  <Link to="/doctor-login" onClick={closeMenu} className="col-span-1 px-3 py-2 rounded-lg border text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>{t('common.doctor')}</span>
                  </Link>
                  <Link to="/clinic-login" onClick={closeMenu} className="col-span-1 px-3 py-2 rounded-lg border text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Hospital className="w-4 h-4" />
                    <span>{t('common.clinic')}</span>
                  </Link>
                  <Link to="/register" onClick={closeMenu} className="col-span-2 text-center px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">{t('common.register')}</Link>
                </>
              )}
            </div>
            <div className="p-2">
              <Link to="/home-v2" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Home className="w-4 h-4" />
                <span>{t('nav.home')}</span>
              </Link>
              <Link to="/vasco-ai" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Cpu className="w-4 h-4" />
                <span>Vasco AI</span>
              </Link>
              <Link to="/about" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-800 rounded-lg">
                <Info className="w-4 h-4" />
                <span>{t('nav.about')}</span>
              </Link>
              {/* Contact removed */}
            </div>
          </nav>
        </div>
      </>
    )}
    {/* Authenticated mobile menu (local) for any logged-in user */}
    {user && isMenuOpen && (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden" onClick={closeMenu} />
        {/* Panel */}
        <div className="fixed top-14 left-0 right-0 z-50 mx-4 max-w-md md:hidden overflow-hidden rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-2xl">
          {(() => {
            const role = (user?.role || 'patient');
            const initial = (user?.name || 'U')[0]?.toUpperCase();
            const roleLabel = String(role).charAt(0).toUpperCase() + String(role).slice(1);
            // Mirror mobile dropdown with SidebarPatient menu for patients
            const patientItems = [
              { to: '/explore', label: 'Medstream', icon: Video },
              { to: '/saved', label: 'Saved Posts', icon: Bookmark },
              { to: '/telehealth-appointment', label: 'Appointments', icon: CalendarClock },
              { to: '/doctor-chat', label: 'Messages', icon: 'chat-conversation' },
              { to: '/telehealth', label: 'Telehealth', icon: Monitor },
              { to: '/notifications', label: 'Notifications', icon: Bell },
              { to: '/profile', label: 'Profile', icon: User },
            ];
            const doctorItems = [
              { to: '/explore', label: 'Medstream', icon: Video },
              { to: '/saved', label: 'Saved Posts', icon: Bookmark },
              { to: '/telehealth-appointment', label: 'Appointments', icon: CalendarClock },
              { to: '/doctor-chat', label: 'Messages', icon: 'chat-conversation' },
              { to: '/telehealth', label: 'Telehealth', icon: Monitor },
              { to: '/notifications', label: 'Notifications', icon: Bell },
              { to: '/profile', label: 'Profile', icon: User },
            ];
            const clinicItems = [
              { to: '/explore', label: 'Medstream', icon: Video },
              { to: '/saved', label: 'Saved Posts', icon: Bookmark },
              { to: '/telehealth-appointment', label: 'Appointments', icon: CalendarClock },
              { to: '/doctor-chat', label: 'Messages', icon: 'chat-conversation' },
              { to: '/telehealth', label: 'Telehealth', icon: Monitor },
              { to: '/notifications', label: 'Notifications', icon: Bell },
              { to: '/profile', label: 'Profile', icon: User },
            ];
            const showCRM = role === 'doctor' || role === 'clinic' || role === 'clinicOwner';
            const items = role === 'clinic' ? clinicItems : (role === 'doctor' ? doctorItems : patientItems);
            return (
              <nav>
                {/* Profile header */}
                <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-200/50">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 font-medium truncate">{roleLabel}</p>
                    </div>
                  </div>
                </div>
                {/* Menu items */}
                <div className="p-2">
                  <div className="mb-2 px-3 pt-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Menu</div>
                  {items.map((it, idx) => {
                    const active = it.to ? pathname === it.to : false;
                    const IconEl = it.icon === 'chat-conversation' ? MessageCircle : it.icon;
                    if (it.external) {
                      return (
                        <a key={`ext-${idx}`} href={it.href} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-gray-900">
                          <span className="flex items-center gap-2.5">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 group-hover:bg-gray-200/60 transition-colors">
                              <IconEl className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                            </span>
                            {it.label}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      );
                    }
                    return (
                      <Link key={`int-${idx}`} to={it.to} onClick={closeMenu} className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${active ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 text-teal-700 shadow-sm ring-1 ring-teal-100' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}>
                        <span className="flex items-center gap-2.5">
                          <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-teal-100/80' : 'bg-gray-100/80 group-hover:bg-gray-200/60'} transition-colors`}>
                            <IconEl className={`w-3.5 h-3.5 ${active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                          </span>
                          {it.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                {/* CRM */}
                {showCRM && (
                  <div className="px-2">
                    <a
                      href="/crm"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMenu}
                      className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100/80 group-hover:bg-gray-200/60 transition-colors">
                          <LayoutDashboard className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                        </span>
                        CRM
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  </div>
                )}
                {/* Logout */}
                <div className="px-3 pb-3 pt-2 border-t border-gray-100 mt-2">
                  <button
                    onClick={() => { closeMenu(); logout(); }}
                    className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600 shadow-md shadow-rose-200/50 transition-all duration-200"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              </nav>
            );
          })()}
        </div>
      </>
    )}
    </>
  );
};

export default Header;
