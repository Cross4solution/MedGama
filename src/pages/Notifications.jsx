import React, { useEffect, useMemo, useState } from 'react';
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
import { endpoints } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { acceptInvite, cancelInvite, loadInvites, rejectInvite } from '../lib/invites';

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
  const { token, user } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [invites, setInvites] = useState([]);
  const [inviteTab, setInviteTab] = useState('incoming');

  const loadNotifications = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await endpoints.doctorNotifications();
      const paginator = res?.data?.notifications ?? res?.notifications ?? null;
      const list = Array.isArray(paginator?.data) ? paginator.data : [];
      const mapped = list.map((n, idx) => ({
        id: n.id ?? idx,
        type: 'system',
        title: n.data?.title || 'Bildirim',
        body: n.data?.content || '',
        time: n.created_at || n.updated_at || '',
        read: !!n.read_at,
        href: null,
      }));
      setItems(mapped);
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Bildirimler alınırken bir hata oluştu.';
      notify({ type: 'error', message: msg });
      try {
        window.dispatchEvent(new Event('medgama:notifications-updated'));
      } catch {}
    } finally {
      setLoading(false);
      try {
        window.dispatchEvent(new Event('medgama:notifications-updated'));
      } catch {}
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const sync = () => {
      const list = loadInvites();
      setInvites(Array.isArray(list) ? list : []);
    };

    sync();
    try {
      window.addEventListener('storage', sync);
      window.addEventListener('medgama:invites-updated', sync);
    } catch {}
    return () => {
      try {
        window.removeEventListener('storage', sync);
        window.removeEventListener('medgama:invites-updated', sync);
      } catch {}
    };
  }, []);

  const TABS = useMemo(() => ([
    { id: 'all', label: 'All', icon: Bell, count: items.length + invites.length },
    { id: 'invites', label: 'Invites', icon: UserPlus, count: invites.length },
    { id: 'mention', label: TYPE_META.mention.label, icon: TYPE_META.mention.icon, count: items.filter(i=>i.type==='mention').length },
    { id: 'message', label: TYPE_META.message.label, icon: TYPE_META.message.icon, count: items.filter(i=>i.type==='message').length },
    { id: 'comment', label: TYPE_META.comment.label, icon: TYPE_META.comment.icon, count: items.filter(i=>i.type==='comment').length },
    { id: 'like', label: TYPE_META.like.label, icon: TYPE_META.like.icon, count: items.filter(i=>i.type==='like').length },
    { id: 'follow', label: TYPE_META.follow.label, icon: TYPE_META.follow.icon, count: items.filter(i=>i.type==='follow').length },
    { id: 'appointment', label: TYPE_META.appointment.label, icon: TYPE_META.appointment.icon, count: items.filter(i=>i.type==='appointment').length },
    { id: 'system', label: TYPE_META.system.label, icon: TYPE_META.system.icon, count: items.filter(i=>i.type==='system').length },
  ]), [items, invites.length]);

  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? items : items.filter(i => i.type === tab);

  const actorType = user?.role === 'clinic' ? 'clinic' : user?.role === 'doctor' ? 'doctor' : 'patient';
  const actorId = user?.id || user?.email || user?.name || '';

  const inviteIncoming = useMemo(() => {
    if (!actorId || (actorType !== 'doctor' && actorType !== 'clinic')) return [];
    return invites.filter((i) => i && i.toType === actorType && i.toId === actorId);
  }, [actorId, actorType, invites]);

  const inviteOutgoing = useMemo(() => {
    if (!actorId || (actorType !== 'doctor' && actorType !== 'clinic')) return [];
    return invites.filter((i) => i && i.fromType === actorType && i.fromId === actorId);
  }, [actorId, actorType, invites]);

  const visibleInvites = inviteTab === 'incoming' ? inviteIncoming : inviteOutgoing;

  const onAcceptInvite = async (inviteId) => {
    try {
      acceptInvite(inviteId);
      notify({ type: 'success', message: 'Davet kabul edildi.' });
    } catch {
      notify({ type: 'error', message: 'Davet kabul edilirken bir hata oluştu.' });
    }
  };

  const onRejectInvite = async (inviteId) => {
    try {
      rejectInvite(inviteId);
      notify({ type: 'success', message: 'Davet reddedildi.' });
    } catch {
      notify({ type: 'error', message: 'Davet reddedilirken bir hata oluştu.' });
    }
  };

  const onCancelInvite = async (inviteId) => {
    try {
      cancelInvite(inviteId);
      notify({ type: 'success', message: 'Davet iptal edildi.' });
    } catch {
      notify({ type: 'error', message: 'Davet iptal edilirken bir hata oluştu.' });
    }
  };

  const markAllAsRead = async () => {
    if (!token || !items.length) return;

    setMarkingAll(true);
    try {
      await endpoints.doctorNotificationsMarkAllRead();
      await loadNotifications();
      notify({ type: 'success', message: 'Tüm bildirimler okundu olarak işaretlendi.' });
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Bildirimler okundu işaretlenirken bir hata oluştu.';
      notify({ type: 'error', message: msg });
    } finally {
      setMarkingAll(false);
      try {
        window.dispatchEvent(new Event('medgama:notifications-updated'));
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-700" /> Notifications
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            disabled={markingAll || loading || !items.length}
            className="px-3 py-1.5 rounded-lg text-sm border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {markingAll ? 'Processing...' : 'Mark all as read'}
          </button>
        </div>

      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Icon Sidebar - Hidden on mobile */}
        <aside className="hidden md:block col-span-3">
          <div className="rounded-xl border bg-white shadow-sm p-2">
            <nav className="flex-col overflow-visible divide-y divide-gray-200">
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
                    <span className="inline">{t.label}</span>
                    <span className={`ml-auto text-xs ${active ? 'text-teal-600' : 'text-gray-500'}`}>{t.count}</span>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right: Scrollable List - Full width on mobile */}
        <section className="col-span-12 md:col-span-9">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="h-[70vh] overflow-y-auto pr-2">
              <div className="divide-y">
                {tab === 'invites' && (
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-sm font-semibold text-gray-900">Invites</div>
                      <div className="inline-flex rounded-lg border bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setInviteTab('incoming')}
                          className={`px-3 py-1.5 text-xs font-medium ${inviteTab === 'incoming' ? 'bg-teal-50 text-teal-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          Incoming
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteTab('outgoing')}
                          className={`px-3 py-1.5 text-xs font-medium border-l ${inviteTab === 'outgoing' ? 'bg-teal-50 text-teal-700 border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                        >
                          Outgoing
                        </button>
                      </div>
                    </div>

                    {!actorId || (actorType !== 'doctor' && actorType !== 'clinic') ? (
                      <div className="text-sm text-gray-600">Invite yönetimi sadece doktor/klinik hesaplarında kullanılabilir.</div>
                    ) : visibleInvites.length === 0 ? (
                      <div className="text-sm text-gray-600">Invite bulunmuyor.</div>
                    ) : (
                      <div className="space-y-3">
                        {visibleInvites.map((inv) => {
                          const isIncoming = inviteTab === 'incoming';
                          const otherName = isIncoming ? inv.fromName : inv.toName;
                          const otherTitle = isIncoming ? inv.fromTitle : inv.toTitle;
                          const otherAvatar = isIncoming ? inv.fromAvatar : inv.toAvatar;
                          const status = inv.status;
                          const statusLabel = status === 'pending' ? 'Pending' : status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Cancelled';
                          const canAcceptReject = isIncoming && status === 'pending';
                          const canCancel = !isIncoming && status === 'pending';
                          return (
                            <div key={inv.id} className="rounded-xl border bg-white p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                  {otherAvatar ? (
                                    <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">N/A</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-gray-900 truncate">{otherName || '—'}</div>
                                      {otherTitle ? (
                                        <div className="text-xs text-gray-600 truncate">{otherTitle}</div>
                                      ) : null}
                                    </div>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : status === 'cancelled' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                                    >
                                      {statusLabel}
                                    </span>
                                  </div>
                                  {inv.message ? (
                                    <div className="mt-2 text-sm text-gray-700">{inv.message}</div>
                                  ) : null}
                                  <div className="mt-2 text-xs text-gray-500">{inv.createdAt || ''}</div>

                                  {(canAcceptReject || canCancel) && (
                                    <div className="mt-3 flex items-center gap-2">
                                      {canAcceptReject && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => onAcceptInvite(inv.id)}
                                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
                                          >
                                            Accept
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onRejectInvite(inv.id)}
                                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}
                                      {canCancel && (
                                        <button
                                          type="button"
                                          onClick={() => onCancelInvite(inv.id)}
                                          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab !== 'invites' && (
                  <>
                    {loading && !filtered.length && (
                      <div className="p-8 text-center text-sm text-gray-500">Loading notifications...</div>
                    )}
                    {!loading && filtered.length === 0 && (
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
                            {n.type === 'comment' && n.comment && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-600">Yapılan yorum:</div>
                                <blockquote className="mt-1 border rounded-lg bg-gray-50 text-gray-700 text-sm p-3">"{n.comment}"</blockquote>
                              </div>
                            )}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    </div>
  );
}