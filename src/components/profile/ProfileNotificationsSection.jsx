import React, { useEffect, useState } from 'react';
import PatientNotify from '../../components/notifications/PatientNotify';
import { endpoints } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function ProfileNotificationsSection() {
  const { token } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await endpoints.doctorNotifications();
      const paginator = res?.data?.notifications ?? res?.notifications ?? null;
      const list = Array.isArray(paginator?.data) ? paginator.data : [];
      const mapped = list.map((n, idx) => ({
        id: n.id ?? idx,
        title: n.data?.title || 'Bildirim',
        text: n.data?.content || '',
        time: n.created_at || n.updated_at || '',
      }));
      setItems(mapped);
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Bildirimler alınırken bir hata oluştu.';
      notify({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleMarkAllRead = async () => {
    if (!token) return;
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
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Patient Notifications</h2>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || loading || !items.length}
            className="px-3 py-1.5 rounded-lg text-xs border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {markingAll ? 'İşleniyor...' : 'Tümünü okundu işaretle'}
          </button>
        </div>
        {loading && !items.length ? (
          <div className="text-sm text-gray-500">Bildirimler yükleniyor...</div>
        ) : (
          <PatientNotify items={items} />
        )}
      </div>
    </div>
  );
}
