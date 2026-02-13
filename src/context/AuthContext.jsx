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
  const meUnavailableRef = React.useRef(false);
  const loggedOutRef = React.useRef(false);

  useEffect(() => {
    try {
      // If user explicitly logged out, don't auto-hydrate from tokens
      if (localStorage.getItem('auth_logout') === '1') {
        loggedOutRef.current = true;
        return;
      }
      const saved = localStorage.getItem('auth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
        setCountry(parsed.country || 'TR');
        return;
      }
      // Fallback: if no auth_state, but we do have a token from Google/backend, keep the session
      const lsToken = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
      if (lsToken) {
        setToken(lsToken);
        // user will be fetched by the next effect via fetchCurrentUser
      }
    } catch {}
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
    // Accept both flat and nested API shapes
    const apiUser = res?.user ?? res?.data?.user ?? null;
    const access = res?.access_token ?? res?.data?.access_token ?? null;
    if (!apiUser || !access) {
      throw { status: 401, message: 'Invalid credentials', data: res };
    }
    const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser || apiUser?.role === 'doctor');
    const userWithRole = { ...apiUser, role: isDoctor ? 'doctor' : (apiUser?.role || 'patient') };
    setUser(userWithRole);
    setToken(access);
    return { data: { user: userWithRole, access_token: access } };
  };

  const applyApiAuth = (res) => {
    try {
      let apiUser = res?.user ?? res?.data?.user ?? null;
      let access = res?.access_token ?? res?.data?.access_token ?? null;
      if (!access) {
        const lsAccess = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
        if (lsAccess) access = lsAccess;
      }
      if (!apiUser) {
        try { apiUser = JSON.parse(localStorage.getItem('google_user') || 'null'); } catch {}
      }
      if (!apiUser || !access) return null;
      const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser || apiUser?.role === 'doctor');
      const name = apiUser?.name || [apiUser?.fname, apiUser?.lname].filter(Boolean).join(' ').trim() || apiUser?.email || 'User';
      const userWithRole = { ...apiUser, name, role: isDoctor ? 'doctor' : (apiUser?.role || 'patient') };
      setUser(userWithRole);
      setToken(access);
      try { localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: access, country })); } catch {}
      try { localStorage.removeItem('auth_logout'); loggedOutRef.current = false; } catch {}
      return { user: userWithRole, access_token: access };
    } catch { return null; }
  };

  const API_BASE = process.env.REACT_APP_API_BASE || '';
  const ME_PATH = process.env.REACT_APP_API_ME || '/api/auth/me';
  const fetchCurrentUser = async (overrideToken) => {
    try {
      if (loggedOutRef.current) return null;
      if (meUnavailableRef.current) return null;
      const tk = overrideToken || token || localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
      if (!tk) return null;
      const resp = await fetch((API_BASE + ME_PATH), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tk}`
        },
        cache: 'no-store',
        mode: 'cors'
      });
      if (resp.status === 404) {
        meUnavailableRef.current = true;
      }
      if (!resp.ok) {
        // Fallback: keep session with local user snapshot if available
        try {
          const lsUser = JSON.parse(localStorage.getItem('google_user') || 'null');
          if (lsUser) {
            const name = lsUser?.name || [lsUser?.fname, lsUser?.lname].filter(Boolean).join(' ').trim() || lsUser?.email || 'User';
            const userWithRole = { ...lsUser, name, role: lsUser?.role || 'patient' };
            setUser(userWithRole);
            setToken(tk);
            localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: tk, country }));
            return userWithRole;
          }
        } catch {}
        return null;
      }
      const data = await resp.json().catch(() => ({}));
      const apiUser = data?.user ?? data?.data?.user ?? data ?? null;
      if (!apiUser) {
        try {
          const lsUser = JSON.parse(localStorage.getItem('google_user') || 'null');
          if (lsUser) {
            const name = lsUser?.name || [lsUser?.fname, lsUser?.lname].filter(Boolean).join(' ').trim() || lsUser?.email || 'User';
            const userWithRole = { ...lsUser, name, role: lsUser?.role || 'patient' };
            setUser(userWithRole);
            setToken(tk);
            localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: tk, country }));
            return userWithRole;
          }
        } catch {}
        return null;
      }
      const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser || apiUser?.role === 'doctor');
      const userWithRole = { ...apiUser, role: isDoctor ? 'doctor' : (apiUser?.role || 'patient') };
      setUser(userWithRole);
      setToken(tk);
      try { localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: tk, country })); } catch {}
      return userWithRole;
    } catch { return null; }
  };
  const register = async (email, password, password_confirmation) => {
    const res = await endpoints.userRegister({ email, password, password_confirmation });
    return res;
  };
  const registerDoctor = async (email, password, password_confirmation) => {
    const res = await endpoints.doctorRegister({ email, password, password_confirmation });
    return res;
  };
  const demoLogin = (role = 'patient') => {
    if (process.env.NODE_ENV === 'production') return null;
    const demo = role === 'doctor' ? { id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' }
      : role === 'clinic' ? { id: 'clinic-demo-1', role: 'clinic', name: 'Demo Clinic' }
      : { id: 'patient-demo-1', role: 'patient', name: 'Demo Patient' };
    setUser(demo);
    setToken(null);
    return demo;
  };
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);

  const logout = (options = {}) => {
    const { skipConfirmation = false } = options;
    
    if (skipConfirmation) {
      setUser(null);
      setToken(null);
      try {
        localStorage.removeItem('auth_state');
        localStorage.removeItem('access_token');
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_user');
        localStorage.setItem('auth_logout', '1');
        loggedOutRef.current = true;
      } catch {}
      return true;
    }
    
    // Show confirmation dialog
    return new Promise((resolve) => {
      setLogoutCallback(() => (confirmed) => {
        setShowLogoutConfirm(false);
        if (confirmed) {
          setUser(null);
          setToken(null);
          try {
            localStorage.removeItem('auth_state');
            localStorage.removeItem('access_token');
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_user');
            localStorage.setItem('auth_logout', '1');
            loggedOutRef.current = true;
          } catch {}
          resolve(true);
        } else {
          resolve(false);
        }
      });
      setShowLogoutConfirm(true);
    });
  };

  const value = useMemo(() => ({
    user,
    token,
    country,
    setCountry,
    login,
    applyApiAuth,
    fetchCurrentUser,
    demoLogin,
    register,
    registerDoctor,
    logout,
    formatCurrency: (usd) => formatCurrency(usd, country),
    sidebarMobileOpen,
    setSidebarMobileOpen,
  }), [user, country, sidebarMobileOpen]);

  // If we have a token (from fallback) but no user yet, try to fetch current user once
  useEffect(() => {
    if (!user) {
      const lsToken = token || localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
      if (lsToken && !meUnavailableRef.current) {
        fetchCurrentUser(lsToken).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => logoutCallback?.(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => logoutCallback?.(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
