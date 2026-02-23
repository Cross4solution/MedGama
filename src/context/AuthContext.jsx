import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints, authAPI } from '../lib/api';

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
  const hydratedRef = React.useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // Listen for auth:logout events from API interceptor (401)
  useEffect(() => {
    const handleForceLogout = () => {
      loggedOutRef.current = true;
      setUser(null);
      setToken(null);
      try { localStorage.removeItem('auth_state'); localStorage.setItem('auth_logout', '1'); } catch {}
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  useEffect(() => {
    try {
      // If user explicitly logged out, don't auto-hydrate from tokens
      if (localStorage.getItem('auth_logout') === '1') {
        loggedOutRef.current = true;
        hydratedRef.current = true;
        setHydrated(true);
        return;
      }
      const saved = localStorage.getItem('auth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user && parsed.token) {
          const av = parsed.user?.avatar;
          const isPlaceholder = typeof av === 'string' && (av.includes('gravatar.com') || av.includes('identicon') || av.includes('ui-avatars.com'));
          if (isPlaceholder || !av) parsed.user.avatar = '/images/default/default-avatar.svg';
          // Re-evaluate role from role_id to fix stale cached roles
          const rid = parsed.user?.role_id || parsed.user?.role || '';
          if (rid === 'doctor' || rid === 'clinic' || rid === 'clinicOwner') {
            parsed.user.role = rid;
          }
          setUser(parsed.user);
          setToken(parsed.token);
          setCountry(parsed.country || 'TR');
          hydratedRef.current = true;
          setHydrated(true);
          return;
        }
      }
      // Fallback: if no auth_state, but we do have a token from Google/backend, keep the session
      const lsToken = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
      if (lsToken) {
        setToken(lsToken);
        // user will be fetched by the next effect via fetchCurrentUser
      }
    } catch {}
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Only persist to localStorage after initial hydration and when we have real data
    if (!hydratedRef.current) return;
    if (user && token) {
      localStorage.setItem('auth_state', JSON.stringify({ user, token, country }));
    }
  }, [user, token, country]);

  // Update user fields without touching token (for profile edits)
  const updateUser = useCallback((updatedFields, newCountry) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
    if (newCountry) setCountry(newCountry);
  }, []);

  const DEFAULT_AVATAR = '/images/default/default-avatar.svg';
  const normalizeAvatar = (url) => {
    if (!url) return DEFAULT_AVATAR;
    if (typeof url !== 'string') return DEFAULT_AVATAR;
    const lower = url.toLowerCase();
    if (lower.includes('gravatar.com') || lower.includes('identicon') || lower.includes('ui-avatars.com')) return DEFAULT_AVATAR;
    return url;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const login = useCallback(async (emailOrUser, password, rememberMe = false) => {
    // Backward-compatible demo login: if first arg is an object, treat it as user
    if (emailOrUser && typeof emailOrUser === 'object') {
      setUser(emailOrUser);
      setToken(null);
      return { success: true, message: 'Demo login', data: { user: emailOrUser } };
    }
    const res = await endpoints.login({ email: emailOrUser, password, remember: rememberMe });
    // Laravel UserResource returns { data: { ...user }, token, requires_email_verification }
    const apiUser = res?.data ?? res?.user ?? null;
    const access = res?.token ?? res?.access_token ?? null;
    if (!apiUser || !access) {
      // eslint-disable-next-line no-throw-literal
      throw { status: 401, message: 'Invalid credentials. Please check your email and password.', data: res };
    }
    // Map role_id to role for frontend compatibility
    const role = apiUser?.role_id || apiUser?.role || 'patient';
    const name = apiUser?.fullname || apiUser?.name || apiUser?.email || 'User';
    const userWithRole = { ...apiUser, role, name, avatar: normalizeAvatar(apiUser?.avatar) };
    setUser(userWithRole);
    setToken(access);
    meUnavailableRef.current = false; // Reset so fetchCurrentUser can refresh avatar
    try {
      localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: access, country }));
      localStorage.removeItem('auth_logout');
      loggedOutRef.current = false;
    } catch {}
    // Fetch fresh user data from /auth/me to get latest avatar
    try { fetchCurrentUser(access); } catch {}
    return { data: { user: userWithRole, access_token: access }, requires_email_verification: !!res?.requires_email_verification };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const applyApiAuth = useCallback((res) => {
    try {
      let apiUser = res?.data ?? res?.user ?? null;
      let access = res?.token ?? res?.access_token ?? null;
      if (!access) {
        const lsAccess = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
        if (lsAccess) access = lsAccess;
      }
      if (!apiUser) {
        try { apiUser = JSON.parse(localStorage.getItem('google_user') || 'null'); } catch {}
      }
      if (!apiUser || !access) return null;
      const roleRaw = apiUser?.role_id || apiUser?.role || '';
      const isDoctor = apiUser && typeof apiUser === 'object' && (roleRaw === 'doctor' || 'specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser);
      const isClinic = roleRaw === 'clinic' || roleRaw === 'clinicOwner';
      const role = isDoctor ? 'doctor' : isClinic ? roleRaw : (roleRaw || 'patient');
      const name = apiUser?.name || [apiUser?.fname, apiUser?.lname].filter(Boolean).join(' ').trim() || apiUser?.email || 'User';
      const userWithRole = { ...apiUser, name, avatar: normalizeAvatar(apiUser?.avatar), role };
      setUser(userWithRole);
      setToken(access);
      try { localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: access, country })); } catch {}
      try { localStorage.removeItem('auth_logout'); loggedOutRef.current = false; } catch {}
      return { user: userWithRole, access_token: access };
    } catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      if (h.endsWith('.vercel.app') || h === 'medagama.com' || h === 'www.medagama.com') return '/api';
    }
    return (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');
  })();
  const ME_PATH = process.env.REACT_APP_API_ME || '/auth/me';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCurrentUser = useCallback(async (overrideToken) => {
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
        mode: 'cors',
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
      // Laravel UserResource wraps user in { data: { ...fields } }
      const apiUser = data?.data ?? data?.user ?? data ?? null;
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
      const roleRaw = apiUser?.role_id || apiUser?.role || '';
      const isDoctor = apiUser && typeof apiUser === 'object' && (roleRaw === 'doctor' || 'specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser);
      const isClinic = roleRaw === 'clinic' || roleRaw === 'clinicOwner';
      const role = isDoctor ? 'doctor' : isClinic ? roleRaw : (roleRaw || 'patient');
      const userWithRole = { ...apiUser, avatar: normalizeAvatar(apiUser?.avatar), role };
      setUser(userWithRole);
      setToken(tk);
      try { localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: tk, country })); } catch {}
      return userWithRole;
    } catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, country]);

  const register = useCallback(async (payload) => {
    const res = await endpoints.userRegister(payload);
    // Laravel UserResource: { data: { ...user }, token, requires_email_verification }
    const apiUser = res?.data ?? res?.user ?? null;
    const access = res?.token ?? res?.access_token ?? null;
    if (apiUser && access) {
      const role = apiUser?.role_id || apiUser?.role || 'patient';
      const name = apiUser?.fullname || apiUser?.name || apiUser?.email || 'User';
      const userWithRole = { ...apiUser, role, name, avatar: normalizeAvatar(apiUser?.avatar) };
      setUser(userWithRole);
      setToken(access);
      try {
        localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: access, country }));
        localStorage.removeItem('auth_logout');
        loggedOutRef.current = false;
      } catch {}
    }
    return res;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerDoctor = useCallback(async (payload) => {
    const res = await endpoints.doctorRegister(payload);
    // Laravel UserResource: { data: { ...user }, token, requires_email_verification }
    const apiUser = res?.data ?? res?.user ?? null;
    const access = res?.token ?? res?.access_token ?? null;
    if (apiUser && access) {
      const role = apiUser?.role_id || apiUser?.role || 'doctor';
      const name = apiUser?.fullname || apiUser?.name || apiUser?.email || 'User';
      const userWithRole = { ...apiUser, role, name, avatar: normalizeAvatar(apiUser?.avatar) };
      setUser(userWithRole);
      setToken(access);
      try {
        localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: access, country }));
        localStorage.removeItem('auth_logout');
        loggedOutRef.current = false;
        sessionStorage.setItem('doctor_just_registered', 'true');
      } catch {}
    }
    return res;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const demoLogin = useCallback((role = 'patient') => {
    if (process.env.NODE_ENV === 'production') return null;
    const demo = role === 'doctor' ? { id: 'doc-demo-1', role: 'doctor', name: 'Demo Doctor' }
      : role === 'clinic' ? { id: 'clinic-demo-1', role: 'clinic', name: 'Demo Clinic' }
      : { id: 'patient-demo-1', role: 'patient', name: 'Demo Patient' };
    setUser(demo);
    setToken(null);
    return demo;
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);

  const clearLocalAuth = useCallback(() => {
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
  }, []);

  const performLogout = useCallback(() => {
    // Revoke token on backend (fire-and-forget)
    authAPI.logout().catch(() => {});
    clearLocalAuth();
  }, [clearLocalAuth]);

  const logout = useCallback((options = {}) => {
    const { skipConfirmation = false } = options;
    
    if (skipConfirmation) {
      performLogout();
      return true;
    }
    
    // Show confirmation dialog
    return new Promise((resolve) => {
      setLogoutCallback(() => (confirmed) => {
        setShowLogoutConfirm(false);
        if (confirmed) {
          performLogout();
          resolve(true);
        } else {
          resolve(false);
        }
      });
      setShowLogoutConfirm(true);
    });
  }, [performLogout]);

  const value = useMemo(() => ({
    user,
    setUser,
    token,
    country,
    setCountry,
    login,
    updateUser,
    applyApiAuth,
    fetchCurrentUser,
    demoLogin,
    register,
    registerDoctor,
    logout,
    formatCurrency: (usd) => formatCurrency(usd, country),
    sidebarMobileOpen,
    setSidebarMobileOpen,
    hydrated,
  }), [user, token, country, sidebarMobileOpen, hydrated, login, updateUser, applyApiAuth, fetchCurrentUser, demoLogin, register, registerDoctor, logout]);

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

  // Listen for auth:logout event from API interceptor (token expired / 401)
  useEffect(() => {
    const handleForceLogout = () => {
      clearLocalAuth();
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && !window.location.pathname.includes('-login')) {
        window.location.href = '/login';
      }
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [clearLocalAuth]);

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
