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
    const isDoctor = apiUser && typeof apiUser === 'object' && ('specialty' in apiUser || 'hospital' in apiUser || 'access' in apiUser);
    const userWithRole = apiUser ? { ...apiUser, role: isDoctor ? 'doctor' : 'patient' } : null;
    const access = res?.data?.access_token ?? null;
    setUser(userWithRole);
    setToken(access);
    return res;
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
      return true;
    }
    
    // Show confirmation dialog
    return new Promise((resolve) => {
      setLogoutCallback(() => (confirmed) => {
        setShowLogoutConfirm(false);
        if (confirmed) {
          setUser(null);
          setToken(null);
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
    demoLogin,
    register,
    registerDoctor,
    logout,
    formatCurrency: (usd) => formatCurrency(usd, country),
    sidebarMobileOpen,
    setSidebarMobileOpen,
  }), [user, country, sidebarMobileOpen]);

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
