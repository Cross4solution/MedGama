import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = ({ type = 'info', message = '', timeout = 3000 }) => {
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
      {/* Container */}
      <div className="fixed top-16 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-md border text-sm bg-white ${
            t.type === 'success' ? 'border-green-200 text-green-800' : t.type === 'error' ? 'border-red-200 text-red-800' : 'border-gray-200 text-gray-800'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
