import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../lib/api';

const NotificationsContext = createContext({
  unreadCount: 0,
  refresh: () => {},
  decrement: () => {},
  reset: () => {},
  setCount: () => {},
});

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) { setUnreadCount(0); return; }
    notificationAPI.unreadCount()
      .then(res => {
        const c = res?.data?.unread_count ?? res?.data?.count ?? 0;
        setUnreadCount(c);
      })
      .catch(() => {});
  }, [user]);

  // Fetch on mount & user change
  useEffect(() => { refresh(); }, [refresh]);

  // Polling fallback — every 30s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  const decrement = useCallback((by = 1) => setUnreadCount(c => Math.max(0, c - by)), []);
  const reset = useCallback(() => setUnreadCount(0), []);
  const setCount = useCallback((n) => setUnreadCount(n), []);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh, decrement, reset, setCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
