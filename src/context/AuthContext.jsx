import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../lib/api';

// Very light mock auth just for frontend flows
const AuthContext = createContext(null);

const COUNTRY_TO_CURRENCY = {
  TR: { code: 'TRY', locale: 'tr-TR', symbol: '₺' },
  US: { code: 'USD', locale: 'en-US', symbol: '$' },
  DE: { code: 'EUR', locale: 'de-DE', symbol: '€' },
  AT: { code: 'EUR', locale: 'de-AT', symbol: '€' },
  GB: { code: 'GBP', locale: 'en-GB', symbol: '£' },
};

function formatCurrency(amountUSD, countryCode = 'US') {
  const map = COUNTRY_TO_CURRENCY[countryCode] || COUNTRY_TO_CURRENCY.US;
  // Very naive FX mock; in real app use live rates
  const rates = { USD: 1, EUR: 0.92, TRY: 33, GBP: 0.78 };
  const rate = rates[map.code] ?? 1;
  const converted = (amountUSD ?? 0) * rate;
  try {
    return new Intl.NumberFormat(map.locale, { style: 'currency', currency: map.code, maximumFractionDigits: 0 }).format(converted);
  } catch {
    return `${map.symbol}${Math.round(converted).toLocaleString()}`;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [country, setCountry] = useState('TR'); // default TR for demo
  // Global UI state for Patient Sidebar (mobile drawer)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('auth_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
        setCountry(parsed.country || 'TR');
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('auth_state', JSON.stringify({ user, token, country }));
  }, [user, token, country]);

  const login = async (emailOrUser, password) => {
    // Backward-compatible demo login: if first arg is an object, treat it as user
    if (emailOrUser && typeof emailOrUser === 'object') {
      setUser(emailOrUser);
      setToken(null);
      return { success: true, message: 'Demo login', data: { user: emailOrUser } };
    }
    const res = await endpoints.login({ email: emailOrUser, password });
    const apiUser = res?.data?.user ?? { name: 'User' };
    const access = res?.data?.access_token ?? null;
    setUser(apiUser);
    setToken(access);
    return res;
  };
  const register = async (email, password, password_confirmation) => {
    const res = await endpoints.register({ email, password, password_confirmation });
    return res;
  };
  const demoLogin = (role = 'patient') => {
    const demo = role === 'doctor' ? { id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' }
      : role === 'clinic' ? { id: 'clinic-demo-1', role: 'clinic', name: 'Demo Clinic' }
      : { id: 'patient-demo-1', role: 'patient', name: 'Demo Patient' };
    setUser(demo);
    setToken(null);
    return demo;
  };
  const logout = () => { setUser(null); setToken(null); };

  const value = useMemo(() => ({
    user,
    token,
    country,
    setCountry,
    login,
    demoLogin,
    register,
    logout,
    formatCurrency: (usd) => formatCurrency(usd, country),
    sidebarMobileOpen,
    setSidebarMobileOpen,
  }), [user, country, sidebarMobileOpen]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
