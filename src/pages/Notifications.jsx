import React, { useMemo, useState } from 'react';
import { Header } from '../components/layout';
import {
  AtSign,
  MessageCircle,
  MessageSquare,
  Heart,
  UserPlus,
  CalendarClock,
  Bell,
  Info,
} from 'lucide-react';

const TYPE_META = {
  mention: { label: 'Mentions', icon: AtSign, color: 'text-purple-600 bg-purple-50' },
  message: { label: 'Messages', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
  comment: { label: 'Comments', icon: MessageCircle, color: 'text-teal-700 bg-teal-50' },
  like: { label: 'Likes', icon: Heart, color: 'text-rose-600 bg-rose-50' },
  follow: { label: 'Follows', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
  appointment: { label: 'Appointments', icon: CalendarClock, color: 'text-amber-600 bg-amber-50' },
  system: { label: 'System', icon: Info, color: 'text-gray-700 bg-gray-100' },
};

export default function Notifications() {
  // Seed notifications (demo)
  const [items, setItems] = useState([
    { id: 'n1', type: 'mention', title: 'You were mentioned', body: 'Dr. Ahmet mentioned you in a discussion.', time: '2m', read: false, href: '/explore' },
    { id: 'n2', type: 'message', title: 'New message', body: 'Clinic Support: "Hello, how can we help?"', time: '10m', read: false, href: '/doctor-chat' },
    { id: 'n3', type: 'comment', title: 'New comment', body: 'A user commented on your post.', time: '1h', read: false, href: '/explore' },
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

  return (
    <div>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-700" /> Notifications
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={markAllAsRead} className="px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 border-gray-200 hover:bg-gray-50">Mark all as read</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: Icon Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="rounded-xl border bg-white shadow-sm p-2">
              <nav className="flex md:flex-col overflow-x-auto md:overflow-visible md:divide-y md:divide-gray-200">
                {TABS.map((t)=>{
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={()=> setTab(t.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') setTab(t.id); }}
                      className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap cursor-pointer select-none ${active ? 'bg-teal-50 text-teal-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      title={t.label}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-teal-700' : 'text-gray-600'}`} />
                      <span className="hidden md:inline">{t.label}</span>
                      <span className={`ml-auto text-xs ${active ? 'text-teal-600' : 'text-gray-500'}`}>{t.count}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right: Scrollable List */}
          <section className="col-span-12 md:col-span-9">
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="h-[70vh] overflow-y-auto pr-2">
                <div className="divide-y">
                  {filtered.length === 0 && (
                    <div className="p-8 text-center text-sm text-gray-500">No notifications</div>
                  )}
                  {filtered.map((n) => {
                    const meta = TYPE_META[n.type] || TYPE_META.system;
                    const Icon = meta.icon;
                    return (
                      <div key={n.id} className={`p-4 flex items-start gap-3 ${n.read ? 'bg-white' : 'bg-teal-50/40'}`}>
                        <div className={`mt-1 w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-teal-600'}`} />
                        <div className={`mt-0.5 p-2 rounded-lg ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{n.title}</div>
                              <div className="text-sm text-gray-700 truncate">{n.body}</div>
                            </div>
                            <div className="text-xs text-gray-500 flex-shrink-0">{n.time}</div>
                          </div>
                          {n.href && (
                            <div className="mt-2">
                              <a href={n.href} className="text-xs text-teal-700 hover:underline">View</a>
                            </div>
                          )}
                        </div>
                        {/* item actions removed by request */}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
