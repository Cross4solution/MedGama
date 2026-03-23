import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, ChevronRight } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', subtext: 'text-emerald-600',
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', Icon: CheckCircle, progressColor: 'bg-emerald-400',
  },
  error: {
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', subtext: 'text-red-600',
    iconBg: 'bg-red-100', iconColor: 'text-red-600', Icon: XCircle, progressColor: 'bg-red-400',
  },
  warning: {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', subtext: 'text-amber-600',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600', Icon: AlertTriangle, progressColor: 'bg-amber-400',
  },
  info: {
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', subtext: 'text-blue-600',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600', Icon: Info, progressColor: 'bg-blue-400',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback(({ type = 'info', title = '', message = '', timeout = 4500, onClick = null, actionUrl = null }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    // Backward compat: if only message is passed (old usage), treat it as title
    const finalTitle = title || message;
    const finalMessage = title ? message : '';
    setToasts((arr) => [...arr, { id, type, title: finalTitle, message: finalMessage, onClick, actionUrl, timeout, createdAt: Date.now() }]);
    if (timeout > 0) {
      window.setTimeout(() => {
        setToasts((arr) => arr.filter((t) => t.id !== id));
      }, timeout);
    }
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((arr) => arr.filter((t) => t.id !== id)), []);

  const value = useMemo(() => ({ notify, remove }), [notify, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container — top-right */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
          const IconComp = cfg.Icon;
          const isClickable = !!(t.onClick || t.actionUrl);

          return (
            <div
              key={t.id}
              className={`pointer-events-auto ${cfg.bg} ${cfg.border} border rounded-2xl shadow-xl overflow-hidden animate-[toastSlideIn_0.35s_ease-out] ${isClickable ? 'cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all' : ''}`}
              role="alert"
              onClick={() => {
                if (t.onClick) { t.onClick(); remove(t.id); }
                else if (t.actionUrl) { window.__TOAST_NAVIGATE?.(t.actionUrl); remove(t.id); }
              }}
            >
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <IconComp className={`w-4 h-4 ${cfg.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${cfg.text} leading-snug`}>{t.title}</p>
                  {t.message && <p className={`text-xs ${cfg.subtext} mt-0.5 leading-relaxed`}>{t.message}</p>}
                  {isClickable && (
                    <p className={`text-[10px] font-medium ${cfg.subtext} mt-1.5 flex items-center gap-0.5 opacity-70`}>
                      Click to view <ChevronRight className="w-2.5 h-2.5" />
                    </p>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                  className={`p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0 ${cfg.text} opacity-40 hover:opacity-80`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress bar */}
              {t.timeout > 0 && (
                <div className="h-0.5 w-full bg-black/5">
                  <div
                    className={`h-full ${cfg.progressColor} rounded-full`}
                    style={{ animation: `toastProgress ${t.timeout}ms linear forwards` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%) translateY(-8px); opacity: 0; }
          to   { transform: translateX(0) translateY(0); opacity: 1; }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
