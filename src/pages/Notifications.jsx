import React, { useMemo, useState } from 'react';
import {
  AtSign,
  MessageCircle,
  MessageSquare,
  Heart,
  UserPlus,
  CalendarClock,
  Bell,
  Info,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

const TYPE_META = {
  mention: { label: 'Mentions', icon: AtSign, color: 'text-purple-600', bg: 'bg-purple-100/80' },
  message: { label: 'Messages', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100/80' },
  comment: { label: 'Comments', icon: MessageCircle, color: 'text-teal-600', bg: 'bg-teal-100/80' },
  like: { label: 'Likes', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100/80' },
  follow: { label: 'Follows', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-100/80' },
  appointment: { label: 'Appointments', icon: CalendarClock, color: 'text-amber-600', bg: 'bg-amber-100/80' },
  system: { label: 'System', icon: Info, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function Notifications() {
  // Seed notifications (demo)
  const [items, setItems] = useState([
    { id: 'n1', type: 'mention', title: 'You were mentioned', body: 'Dr. Ahmet mentioned you in a discussion.', time: '2m', read: false, href: '/explore' },
    { id: 'n2', type: 'message', title: 'New message', body: 'Clinic Support: "Hello, how can we help?"', time: '10m', read: false, href: '/doctor-chat' },
    { id: 'n3', type: 'comment', title: 'New comment', body: 'Bir kullanıcı gönderinize yorum yaptı.', comment: 'Tedaviden sonra ağrılarım ciddi şekilde azaldı, teşekkür ederim. İlgili tavrınız ve hızlı dönüşünüz için ayrıca minnettarım.', time: '1h', read: false, href: '/explore' },
    { id: 'n4', type: 'like', title: 'New like', body: 'Your update received 12 new likes.', time: '3h', read: true, href: '/explore' },
    { id: 'n5', type: 'follow', title: 'New follower', body: 'Ayşe started following you.', time: 'yesterday', read: true, href: '/doctor/doc-3' },
    { id: 'n6', type: 'appointment', title: 'Appointment reminder', body: 'Telehealth appointment at 14:30 tomorrow.', time: '2d', read: true, href: '/telehealth-appointment' },
    { id: 'n7', type: 'system', title: 'System update', body: 'We have improved security and performance.', time: '3d', read: true },
  ]);

  const TABS = useMemo(() => ([
    { id: 'all', label: 'All', icon: Bell, count: items.length },
    { id: 'mention', label: TYPE_META.mention.label, icon: TYPE_META.mention.icon, count: items.filter(i=>i.type==='mention').length },
    { id: 'message', label: TYPE_META.message.label, icon: TYPE_META.message.icon, count: items.filter(i=>i.type==='message').length },
    { id: 'comment', label: TYPE_META.comment.label, icon: TYPE_META.comment.icon, count: items.filter(i=>i.type==='comment').length },
    { id: 'like', label: TYPE_META.like.label, icon: TYPE_META.like.icon, count: items.filter(i=>i.type==='like').length },
    { id: 'follow', label: TYPE_META.follow.label, icon: TYPE_META.follow.icon, count: items.filter(i=>i.type==='follow').length },
    { id: 'appointment', label: TYPE_META.appointment.label, icon: TYPE_META.appointment.icon, count: items.filter(i=>i.type==='appointment').length },
    { id: 'system', label: TYPE_META.system.label, icon: TYPE_META.system.icon, count: items.filter(i=>i.type==='system').length },
  ]), [items]);

  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? items : items.filter(i => i.type === tab);

  const markAllAsRead = () => setItems(prev => prev.map(i => ({ ...i, read: true })));

  const unreadCount = items.filter(i => !i.read).length;

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
              <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && <p className="text-[11px] text-gray-400 font-medium">{unreadCount} unread</p>}
            </div>
          </div>
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        </div>

        {/* Mobile horizontal tabs */}
        <div className="md:hidden mb-4 -mx-4 px-4">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${active ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-200/50' : 'bg-white text-gray-600 border border-gray-200/80 hover:border-gray-300'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.count > 0 && <span className={`ml-0.5 text-[10px] ${active ? 'text-white/80' : 'text-gray-400'}`}>{t.count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Left: Sidebar - Hidden on mobile */}
          <aside className="hidden md:block col-span-3">
            <div className="sticky top-24 rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-lg shadow-gray-200/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Categories</div>
              </div>
              <nav className="p-2 space-y-0.5">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${active ? 'bg-gradient-to-r from-teal-50 to-emerald-50/60 text-teal-700 shadow-sm ring-1 ring-teal-100' : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'}`}
                    >
                      <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${active ? 'bg-teal-100/80' : 'bg-gray-100/80'} transition-colors`}>
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-600' : 'text-gray-500'}`} />
                      </span>
                      <span className="flex-1 text-left">{t.label}</span>
                      <span className={`text-[11px] font-semibold min-w-[20px] text-center ${active ? 'text-teal-600' : 'text-gray-400'}`}>{t.count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right: Notification List */}
          <section className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-gray-200/30 overflow-hidden">
              <div className="h-[70vh] overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No notifications</p>
                    <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                  </div>
                )}
                {filtered.map((n, idx) => {
                  const meta = TYPE_META[n.type] || TYPE_META.system;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      className={`group px-4 sm:px-5 py-4 flex items-start gap-3.5 transition-colors duration-150 hover:bg-gray-50/60 ${idx > 0 ? 'border-t border-gray-100' : ''} ${!n.read ? 'bg-teal-50/30' : ''}`}
                    >
                      {/* Unread dot */}
                      <div className="pt-3 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full transition-colors ${n.read ? 'bg-gray-200' : 'bg-teal-500 shadow-sm shadow-teal-300/50'}`} />
                      </div>
                      {/* Icon */}
                      <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`text-sm font-semibold ${n.read ? 'text-gray-800' : 'text-gray-900'}`}>{n.title}</div>
                            <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.body}</div>
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 mt-0.5">{n.time}</span>
                        </div>
                        {n.type === 'comment' && n.comment && (
                          <div className="mt-2.5">
                            <div className="text-[11px] text-gray-400 font-medium mb-1">Comment:</div>
                            <blockquote className="border-l-2 border-teal-200 rounded-r-lg bg-gray-50/80 text-gray-600 text-sm p-3 leading-relaxed italic">"{n.comment}"</blockquote>
                          </div>
                        )}
                        {n.href && (
                          <a href={n.href} className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}