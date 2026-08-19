import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../lib/api';
import { getEcho } from '../lib/echo';
import { useGorunurYoklama } from '../hooks/useGorunurYoklama';

const NotificationsContext = createContext({
  unreadCount: 0,
  refresh: () => {},
  increment: () => {},
  decrement: () => {},
  reset: () => {},
  setCount: () => {},
});

export function NotificationsProvider({ children }) {
  const { user, hydrated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Kullanıcı NESNESİ değil kimliği izleniyor — nesne her tazelemede
  // yenilendiği için efekt gereksiz yere ikinci kez çalışıyordu.
  const kullaniciId = user?.id ?? null;

  const refresh = useCallback(() => {
    if (!kullaniciId) { setUnreadCount(0); return; }
    notificationAPI.unreadCount()
      .then(res => {
        const c = res?.unread_count ?? res?.data?.unread_count ?? res?.count ?? 0;
        setUnreadCount(c);
      })
      .catch(() => {});
  }, [kullaniciId]);

  // Oturum yerleşmeden sorma.
  useEffect(() => { if (hydrated) refresh(); }, [hydrated, refresh]);

  // Yedek yoklama.
  //
  // Bildirimler soket üzerinden anlık geliyor; bu yoklama yalnızca soket
  // kopmuşsa devreye giren emniyet ağı. Bu yüzden soket varken seyrek
  // (2 dk), yokken sık (30 sn) çalışıyor — ve sekme görünmüyorsa hiç
  // çalışmıyor.
  const soketVar = typeof window !== 'undefined' && Boolean(getEcho());
  useGorunurYoklama(refresh, soketVar ? 120000 : 30000, Boolean(kullaniciId));

  const increment = useCallback((by = 1) => setUnreadCount(c => c + by), []);
  const decrement = useCallback((by = 1) => setUnreadCount(c => Math.max(0, c - by)), []);
  const reset = useCallback(() => setUnreadCount(0), []);
  const setCount = useCallback((n) => setUnreadCount(n), []);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh, increment, decrement, reset, setCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
