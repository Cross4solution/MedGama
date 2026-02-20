import React, { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error:   'bg-red-50 border-red-300 text-red-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  info:    'bg-blue-50 border-blue-300 text-blue-800',
};

const TOAST_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = ({ type = 'info', message = '', timeout = 3500 }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((arr) => [...arr, { id, type, message }]);
    if (timeout > 0) {
      window.setTimeout(() => {
        setToasts((arr) => arr.filter((t) => t.id !== id));
      }, timeout);
    }
    return id;
  };

  const remove = (id) => setToasts((arr) => arr.filter((t) => t.id !== id));

  const value = useMemo(() => ({ notify, remove }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-16 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-[slideIn_0.25s_ease-out] ${TOAST_STYLES[t.type] || TOAST_STYLES.info}`}
            role="alert"
          >
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{TOAST_ICONS[t.type] || TOAST_ICONS.info}</span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="ml-1 opacity-50 hover:opacity-100 text-xs font-bold flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
