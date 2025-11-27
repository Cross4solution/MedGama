import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../lib/api';

// Very light mock auth just for frontend flows
const AuthContext = createContext(null);

function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

function normalizeApiUser(apiUser) {
  if (!apiUser) return null;
  const base = apiUser.user || apiUser;
  const profile = base.user_profile || {};
  const merged = { ...base, ...profile };

  // Backend farklı alan isimleri kullanabileceği için (first_name, last_name, phone_country_code vb.)
  // bunları frontend tarafında kullanılan fname, lname, phone_cc alanlarına mapliyoruz.
  const fname = merged.fname || merged.first_name || '';
  const lname = merged.lname || merged.last_name || '';
  const phone = merged.phone || merged.phone_number || '';
  const phone_cc = merged.phone_cc || merged.phone_country_code || '';

  const name =
    fname ||
    merged.name ||
    [fname, lname].filter(Boolean).join(' ').trim() ||
    merged.email ||
    '';

  return { ...merged, fname, lname, phone, phone_cc, name };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [country, setCountry] = useState('TR'); // default TR for demo
  // Global UI state for Patient Sidebar (mobile drawer)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const meUnavailableRef = React.useRef(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('auth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        const exp = parsed.token_expires_at || null;
        const now = Date.now();
        if (exp && now > exp) {
          // Token süresi dolmuş: auth state'i temizle ve özel sayfalardaysan login'e at
          setUser(null);
          setToken(null);
          setTokenExpiresAt(null);
          try {
            localStorage.removeItem('auth_state');
            localStorage.removeItem('access_token');
          } catch {}
          try {
            const path = typeof window !== 'undefined' && window.location ? (window.location.pathname || '/') : '/';
            const protectedPrefixes = ['/profile', '/notifications', '/clinic-edit', '/telehealth', '/telehealth-appointment', '/doctor-chat'];
            const onProtected = protectedPrefixes.some((p) => path.startsWith(p));
            if (onProtected) {
              window.location.assign('/login');
            }
          } catch {}
          setAuthReady(true);
          return;
        }
        const normalized = normalizeApiUser(parsed.user || null) || (parsed.user || null);
        setUser(normalized);
        setToken(parsed.token || null);
        setTokenExpiresAt(exp || null);
        setCountry(parsed.country || 'TR');
        setAuthReady(true);
        return;
      }
      // Fallback: if no auth_state, but we do have a token from Google/backend, keep the session
      const lsToken = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
      if (lsToken) {
        setToken(lsToken);
        const decoded = decodeJwt(lsToken);
        const expMs = decoded?.exp ? decoded.exp * 1000 : null;
        setTokenExpiresAt(expMs);
        // user will be fetched by the next effect via fetchCurrentUser
        setAuthReady(true);
        return;
      }
      setAuthReady(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('auth_state', JSON.stringify({ user, token, token_expires_at: tokenExpiresAt, country }));
    } catch {}
  }, [user, token, tokenExpiresAt, country]);

  const login = async (emailOrUser, password) => {
    // Backward-compatible demo login: if first arg is an object, treat it as user
    if (emailOrUser && typeof emailOrUser === 'object') {
      const normalized = normalizeApiUser(emailOrUser) || emailOrUser;
      setUser(normalized);
      setToken(null);
      return { success: true, message: 'Demo login', data: { user: normalized } };
    }
    const res = await endpoints.login({ email: emailOrUser, password });
    // Accept both flat and nested API shapes
    const apiUserRaw = res?.user ?? res?.data?.user ?? null;
    const access = res?.access_token ?? res?.data?.access_token ?? null;
    const apiUserFallback = normalizeApiUser(apiUserRaw);
    if (!access) {
      throw { status: 401, message: 'Invalid credentials', data: res };
    }
    const decoded = decodeJwt(access);
    const expMs = decoded?.exp ? decoded.exp * 1000 : null;

    // Önce sadece token'ı set et, user'ı backend'den /authorized/user/profile ile çek
    setToken(access);
    setTokenExpiresAt(expMs || null);
    let finalUser = null;
    try {
      finalUser = await fetchCurrentUser(access);
    } catch {
      finalUser = null;
    }

    // Eğer profil endpoint'i başarısız olursa, login cevabındaki user'ı fallback olarak kullan
    if (!finalUser && apiUserFallback) {
      const isDoctor = apiUserFallback && typeof apiUserFallback === 'object' && ('specialty' in apiUserFallback || 'hospital' in apiUserFallback || 'access' in apiUserFallback || apiUserFallback?.role === 'doctor');
      const userWithRole = { ...apiUserFallback, role: isDoctor ? 'doctor' : (apiUserFallback?.role || 'patient') };
      setUser(userWithRole);
      finalUser = userWithRole;
    }

    if (!finalUser) {
      throw { status: 401, message: 'Invalid credentials', data: res };
    }

    try {
      if (access) {
        localStorage.setItem('access_token', access);
      }
      localStorage.setItem('auth_state', JSON.stringify({
        user: finalUser,
        token: access,
        token_expires_at: expMs || null,
        country,
      }));
    } catch {}

    return { data: { user: finalUser, access_token: access } };
  };

  const applyApiAuth = (res) => {
    try {
      let apiUserRaw = res?.user ?? res?.data?.user ?? null;
      let access = res?.access_token ?? res?.data?.access_token ?? null;
      if (!access) {
        const lsAccess = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
        if (lsAccess) access = lsAccess;
      }
      if (!apiUserRaw) {
        try { apiUserRaw = JSON.parse(localStorage.getItem('google_user') || 'null'); } catch {}
      }
      const apiUser = normalizeApiUser(apiUserRaw);
      if (!apiUser || !access) return null;
      const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser || apiUser?.role === 'doctor');
      const userWithRole = { ...apiUser, role: isDoctor ? 'doctor' : (apiUser?.role || 'patient') };
      const decoded = decodeJwt(access);
      const expMs = decoded?.exp ? decoded.exp * 1000 : null;
      setUser(userWithRole);
      setToken(access);
      setTokenExpiresAt(expMs || null);
      try { localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: access, token_expires_at: expMs || null, country })); } catch {}
      return { user: userWithRole, access_token: access };
    } catch { return null; }
  };

  const fetchCurrentUser = async (overrideToken) => {
    try {
      const tk = overrideToken || token || localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
      if (!tk) return null;

      // Prefer backend profile via API client (shares BASE_URL and token logic)
      const data = await endpoints.me({ token: tk }).catch(() => null);

      const apiUserRaw = data?.user ?? data?.data?.user ?? data ?? null;
      const apiUser = normalizeApiUser(apiUserRaw);
      if (!apiUser) {
        try {
          const lsUser = JSON.parse(localStorage.getItem('google_user') || 'null');
          if (lsUser) {
            const normalizedLs = normalizeApiUser(lsUser) || lsUser;
            const userWithRole = { ...normalizedLs, role: normalizedLs?.role || 'patient' };
            setUser(userWithRole);
            setToken(tk);
            try { localStorage.setItem('auth_state', JSON.stringify({ user: userWithRole, token: tk, token_expires_at: tokenExpiresAt, country })); } catch {}
            return userWithRole;
          }
        } catch {}
        return null;
      }
      const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser || apiUser?.role === 'doctor');
      const userWithRole = { ...apiUser, role: isDoctor ? 'doctor' : (apiUser?.role || 'patient') };

      // Backend profil endpoint'i fname/lname/phone/phone_cc alanlarını boş string olarak döndürebiliyor.
      // Bu durumda, daha önce login/register aşamasında dolu gelen değerleri kaybetmemek için
      // mevcut user state'indeki değerleri koruyup sadece dolu gelen değerlerle overwrite ediyoruz.
      const mergedUser = {
        ...(user || {}),
        ...userWithRole,
        fname: userWithRole.fname || (user && user.fname) || '',
        lname: userWithRole.lname || (user && user.lname) || '',
        phone: userWithRole.phone || (user && user.phone) || '',
        phone_cc: userWithRole.phone_cc || (user && user.phone_cc) || '',
      };

      setUser(mergedUser);
      setToken(tk);
      try { localStorage.setItem('auth_state', JSON.stringify({ user: mergedUser, token: tk, token_expires_at: tokenExpiresAt, country })); } catch {}
      return mergedUser;
    } catch { return null; }
  };
  const register = async (email, password, password_confirmation) => {
    const res = await endpoints.userRegister({ email, password, password_confirmation });
    return res;
  };
  const registerDoctor = async (email, password, password_confirmation, specialty) => {
    const res = await endpoints.doctorRegister({ email, password, password_confirmation, specialty });
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);

  const updateProfile = async (payload) => {
    const res = await endpoints.updateProfile(payload);

    // Update cevabından dönen user + user_profile bilgisini hemen normalize edip
    // context user state'ine yazalım ki form anında güncellensin.
    try {
      const apiUserRaw = res?.user ?? res?.data?.user ?? null;
      const apiUser = normalizeApiUser(apiUserRaw);
      if (apiUser) {
        const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser || apiUser?.role === 'doctor');
        const userWithRole = { ...apiUser, role: isDoctor ? 'doctor' : (apiUser?.role || 'patient') };

        const mergedUser = {
          ...(user || {}),
          ...userWithRole,
          fname: userWithRole.fname || (user && user.fname) || '',
          lname: userWithRole.lname || (user && user.lname) || '',
          phone: userWithRole.phone || (user && user.phone) || '',
          phone_cc: userWithRole.phone_cc || (user && user.phone_cc) || '',
        };

        setUser(mergedUser);
        try { localStorage.setItem('auth_state', JSON.stringify({ user: mergedUser, token, token_expires_at: tokenExpiresAt, country })); } catch {}
      }
    } catch {}

    // Ek olarak, backend profil endpoint'inden gelen diğer alanları da senkronize etmek için
    // fetchCurrentUser'ı best-effort olarak çağırmaya devam edelim (merge mantığı sayesinde
    // boş gelen fname/lname vb. değerler mevcut dolu değerleri ezmeyecek).
    try {
      await fetchCurrentUser();
    } catch {}

    return res;
  };

  const logout = (options = {}) => {
    const { skipConfirmation = false } = options;
    
    if (skipConfirmation) {
      setUser(null);
      setToken(null);
      setTokenExpiresAt(null);
      try {
        localStorage.removeItem('auth_state');
        localStorage.removeItem('access_token');
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_user');
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
          setTokenExpiresAt(null);
          try {
            localStorage.removeItem('auth_state');
            localStorage.removeItem('access_token');
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_user');
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
    tokenExpiresAt,
    authReady,
    country,
    setCountry,
    login,
    applyApiAuth,
    fetchCurrentUser,
    demoLogin,
    register,
    registerDoctor,
    logout,
    updateProfile,
    formatCurrency: (usd) => formatCurrency(usd, country),
    sidebarMobileOpen,
    setSidebarMobileOpen,
  }), [user, token, tokenExpiresAt, authReady, country, sidebarMobileOpen]);

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
