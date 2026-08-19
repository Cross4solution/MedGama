import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { socialAPI } from '../lib/api';

const FavoritesContext = createContext({ count: 0, refresh: () => {}, increment: () => {}, decrement: () => {}, setCount: () => {} });

export function FavoritesProvider({ children }) {
  const { user, hydrated } = useAuth();
  const [count, setCount] = useState(0);

  // Kullanıcı NESNESİ değil kimliği izleniyor.
  //
  // Oturum bilgisi tazelendiğinde (ör. /auth/me dönünce) nesne yenileniyor;
  // bağımlılık nesne olduğu için refresh de yenileniyor ve efekt tekrar
  // çalışıyordu. Sayfa açılışında bu uca iki istek gidiyordu.
  const kullaniciId = user?.id ?? null;

  const refresh = useCallback(() => {
    if (!kullaniciId) { setCount(0); return; }
    socialAPI.favoritesCount()
      .then(res => setCount(res?.data?.count ?? res?.count ?? 0))
      .catch(() => {});
  }, [kullaniciId]);

  // Oturum yerleşmeden istek atma: yerleşme sırasındaki ara durumlar
  // gereksiz çağrı üretiyor.
  useEffect(() => { if (hydrated) refresh(); }, [hydrated, refresh]);

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
