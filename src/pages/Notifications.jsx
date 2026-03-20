import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Heart,
  CalendarClock,
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Star,
  Clock,
  X,
  Shield,
  Loader2,
  BellOff,
  Trash2,
} from 'lucide-react';
import { notificationAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTranslation } from 'react-i18next';

const TYPE_META = {
  appointment_booked:    { label: 'Appointment Booked', icon: CalendarClock, color: 'text-blue-600', bg: 'bg-blue-100/80', category: 'appointment' },
  appointment_confirmed: { label: 'Appointment Confirmed', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100/80', category: 'appointment' },
  appointment_cancelled: { label: 'Appointment Cancelled', icon: X, color: 'text-red-600', bg: 'bg-red-100/80', category: 'appointment' },
  appointment_reminder:  { label: 'Appointment Reminder', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100/80', category: 'appointment' },
  new_review:            { label: 'New Review', icon: Star, color: 'text-amber-600', bg: 'bg-amber-100/80', category: 'review' },
  review_response:       { label: 'Doctor Response', icon: Star, color: 'text-teal-600', bg: 'bg-teal-100/80', category: 'review' },
  review_approved:       { label: 'Review Approved', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-100/80', category: 'review' },
  review_rejected:       { label: 'Review Rejected', icon: Star, color: 'text-red-600', bg: 'bg-red-100/80', category: 'review' },
  review_hidden:         { label: 'Review Hidden', icon: Star, color: 'text-gray-600', bg: 'bg-gray-100', category: 'review' },
  verification_approved: { label: 'Verification Approved', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100/80', category: 'system' },
  verification_rejected: { label: 'Verification Rejected', icon: Shield, color: 'text-red-600', bg: 'bg-red-100/80', category: 'system' },
  post_liked:            { label: 'Post Liked', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100/80', category: 'social' },
  post_commented:        { label: 'Post Comment', icon: MessageCircle, color: 'text-teal-600', bg: 'bg-teal-100/80', category: 'social' },
  new_chat_message:      { label: 'New Message', icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-100/80', category: 'message' },
  ticket_received:       { label: 'Support Ticket', icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100/80', category: 'support' },
};

const DEFAULT_META = { label: 'Notification', icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100', category: 'system' };

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'appointment', label: 'Appointments', icon: CalendarClock },
  { id: 'review', label: 'Reviews', icon: Star },
  { id: 'social', label: 'Social', icon: Heart },
  { id: 'message', label: 'Messages', icon: MessageCircle },
  { id: 'system', label: 'System', icon: Shield },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function Notifications() {
  const { user, isPro } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { decrement: globalDecrement, reset: globalReset, setCount: globalSetCount } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await notificationAPI.list({ per_page: 20, page: pg });
      const data = res?.data;
      setItems(data?.data || []);
      setLastPage(data?.last_page || 1);
      setPage(data?.current_page || 1);
    } catch {}
    setLoading(false);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationAPI.unreadCount();
      const c = res?.data?.unread_count ?? res?.data?.count ?? 0;
      setUnreadCount(c);
      globalSetCount(c);
    } catch {}
  }, [globalSetCount]);

  useEffect(() => {
    if (user) { fetchNotifications(1); fetchUnreadCount(); }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { fetchUnreadCount(); }, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      globalDecrement(1);
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
      globalReset();
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      const wasUnread = !items.find(n => n.id === id)?.read_at;
      await notificationAPI.delete(id);
      setItems(prev => prev.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        globalDecrement(1);
      }
    } catch {}
  };

  const handleClick = (notif) => {
    if (!notif.read_at) handleMarkRead(notif.id);
    const data = notif.data || {};
    if (data.link) { navigate(data.link); return; }
    if (data.post_id) { navigate(`/post/${encodeURIComponent(data.post_id)}`); return; }
    if (data.conversation_id) { navigate('/doctor-chat'); return; }
    if (data.appointment_id) {
      navigate(user?.role === 'patient' ? '/telehealth' : (isPro ? '/crm/appointments' : '/doctor/dashboard'));
      return;
    }
    if (data.review_id && user?.role !== 'patient') { navigate(isPro ? '/crm/reviews' : '/doctor/dashboard'); return; }
  };

  const getMeta = (notif) => {
    const type = notif?.data?.type || '';
    return TYPE_META[type] || DEFAULT_META;
  };

  const filtered = tab === 'all' ? items : items.filter(n => getMeta(n).category === tab);

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.id === 'all' ? items.length : items.filter(n => getMeta(n).category === cat.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/50">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('notifications.title', 'Notifications')}</h1>
              {unreadCount > 0 && <p className="text-[11px] text-gray-400 font-medium">{unreadCount} {t('notifications.unread', 'unread')}</p>}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t('notifications.markAllRead', 'Mark all as read')}
            </button>
          )}
        </div>

        {/* Mobile horizontal tabs */}
        <div className="md:hidden mb-4 -mx-4 px-4">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = tab === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setTab(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${active ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50' : 'bg-white text-gray-600 border border-gray-200/80 hover:border-gray-300'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                  {categoryCounts[c.id] > 0 && <span className={`ml-0.5 text-[10px] ${active ? 'text-white/80' : 'text-gray-400'}`}>{categoryCounts[c.id]}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Left: Sidebar */}
          <aside className="hidden md:block col-span-3">
            <div className="sticky top-24 rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('notifications.categories', 'Categories')}</div>
              </div>
              <nav className="p-2 space-y-0.5">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = tab === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setTab(c.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${active ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 text-teal-700 shadow-sm ring-1 ring-teal-100' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                    >
                      <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-teal-100/80' : 'bg-gray-100/80'} transition-colors`}>
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-600' : 'text-gray-500'}`} />
                      </span>
                      <span className="flex-1 text-left">{c.label}</span>
                      <span className={`text-[11px] font-semibold min-w-[20px] text-center ${active ? 'text-teal-600' : 'text-gray-400'}`}>{categoryCounts[c.id]}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right: Notification List */}
          <section className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
              <div className="min-h-[60vh] max-h-[70vh] overflow-y-auto">
                {loading ? (
                  <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
                ) : filtered.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <BellOff className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{t('notifications.noNotifications', 'No notifications')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('notifications.allCaughtUp', "You're all caught up!")}</p>
                  </div>
                ) : (
                  filtered.map((n, idx) => {
                    const meta = getMeta(n);
                    const Icon = meta.icon;
                    const data = n.data || {};
                    const isUnread = !n.read_at;

                    return (
                      <div
                        key={n.id}
                        className={`group px-4 sm:px-5 py-4 flex items-start gap-3.5 transition-colors duration-150 hover:bg-gray-50/60 ${idx > 0 ? 'border-t border-gray-100' : ''} ${isUnread ? 'bg-teal-50/30' : ''}`}
                      >
                        {/* Unread dot */}
                        <div className="pt-3 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full transition-colors ${isUnread ? 'bg-teal-500 shadow-sm shadow-teal-300/50' : 'bg-gray-200'}`} />
                        </div>
                        {/* Icon */}
                        <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shadow-sm`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-800'}`}>{data.title || meta.label}</div>
                              {data.message && <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{data.message}</div>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                              <span className="text-[11px] text-gray-400 font-medium">{timeAgo(n.created_at)}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleClick(n)}
                            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                          >
                            {t('notifications.view', 'View')} <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => fetchNotifications(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('common.previous', 'Previous')}
                  </button>
                  <span className="text-xs text-gray-400">{page} / {lastPage}</span>
                  <button
                    onClick={() => fetchNotifications(page + 1)}
                    disabled={page >= lastPage}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('common.next', 'Next')}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}