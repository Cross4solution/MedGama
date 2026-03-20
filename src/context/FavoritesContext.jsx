import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { socialAPI } from '../lib/api';

const FavoritesContext = createContext({ count: 0, refresh: () => {}, increment: () => {}, decrement: () => {}, setCount: () => {} });

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) { setCount(0); return; }
    socialAPI.favoritesCount()
      .then(res => setCount(res?.data?.count ?? res?.count ?? 0))
      .catch(() => {});
  }, [user]);

  // Fetch on mount & user change
  useEffect(() => { refresh(); }, [refresh]);

  // Optimistic increment/decrement helpers
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => Math.max(0, c - 1)), []);

  return (
    <FavoritesContext.Provider value={{ count, refresh, increment, decrement, setCount }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
