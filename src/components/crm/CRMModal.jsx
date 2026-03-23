import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * CRMModal — Unified modal wrapper for all CRM modals.
 *
 * CENTERING STRATEGY:
 *   Desktop (lg+): The centering container starts at left:256px (sidebar width)
 *   and spans width:calc(100%-256px) so the modal sits in the exact optical
 *   center of the white content area — never overlapping the sidebar.
 *   Mobile: Full viewport centering (no sidebar).
 *
 * Props:
 *  - isOpen        : bool
 *  - onClose       : () => void
 *  - title         : string
 *  - subtitle      : string (optional)
 *  - icon          : Lucide component (optional)
 *  - maxWidth      : tailwind max-w class (default 'max-w-lg')
 *  - children      : modal body
 *  - footer        : footer element (optional)
 *  - hideHeader    : bool (optional)
 */
const SIDEBAR_WIDTH = 256; // lg:w-64 = 16rem = 256px

const CRMModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  maxWidth = 'max-w-lg',
  children,
  footer,
  hideHeader = false,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop — full viewport, blur + dim */}
      <div
        className="fixed inset-0 z-[1000] bg-black/40"
        style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Centering container — sidebar-aware on desktop
        Mobile: full viewport centered
        Desktop (lg+): offset left by sidebar width so modal centers in content area only
      */}
      <div
        className="fixed inset-0 z-[1001] flex items-center justify-center p-4 lg:pl-[256px] pointer-events-none"
      >
        <div
          className={`relative bg-white rounded-2xl ${maxWidth} w-full shadow-2xl flex flex-col overflow-hidden animate-fadeIn pointer-events-auto`}
          style={{ maxHeight: 'min(90vh, 800px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {!hideHeader && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/60 to-white flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(10,110,111,0.1)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#0A6E6F' }} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{title}</h2>
                  {subtitle && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-gray-100 bg-gray-50/40 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

/* ─── Shared sub-components for consistent form styling ──── */

/** Standard label — 13px, gray-500 toned, with optional icon */
export const ModalLabel = ({ children, required, icon: LabelIcon }) => (
  <label className="flex items-center gap-1.5 mb-2" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
    {LabelIcon && <LabelIcon className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />}
    <span>{children}</span>
    {required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
  </label>
);

/** Standard text input — teal focus ring */
export const ModalInput = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full h-10 px-3.5 border border-gray-200 rounded-xl text-sm bg-white placeholder:text-gray-300 outline-none transition-all ${className}`}
    style={{ ...(props.style || {}), '--tw-ring-color': 'rgba(10,110,111,0.15)' }}
    onFocus={(e) => { e.currentTarget.style.borderColor = '#0A6E6F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,111,0.1)'; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; props.onBlur?.(e); }}
  />
);

/** Standard select — teal focus ring */
export const ModalSelect = ({ className = '', children, ...props }) => (
  <select
    {...props}
    className={`w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white outline-none transition-all ${className}`}
    onFocus={(e) => { e.currentTarget.style.borderColor = '#0A6E6F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,111,0.1)'; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; props.onBlur?.(e); }}
  >
    {children}
  </select>
);

/** Standard textarea — teal focus ring */
export const ModalTextarea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm bg-white placeholder:text-gray-300 outline-none transition-all resize-none ${className}`}
    onFocus={(e) => { e.currentTarget.style.borderColor = '#0A6E6F'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,110,111,0.1)'; props.onFocus?.(e); }}
    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; props.onBlur?.(e); }}
  />
);

/** Primary action button — #0A6E6F filled, icon-ready, h-10 matched */
export const ModalPrimaryButton = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md ${className}`}
    style={{ backgroundColor: props.disabled ? undefined : '#0A6E6F', ...(props.style || {}) }}
    onMouseEnter={(e) => { if (!props.disabled) e.currentTarget.style.backgroundColor = '#085858'; }}
    onMouseLeave={(e) => { if (!props.disabled) e.currentTarget.style.backgroundColor = '#0A6E6F'; }}
  >
    {children}
  </button>
);

/** Cancel / secondary button — pure gray, h-10 matched */
export const ModalCancelButton = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center px-4 h-10 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors ${className}`}
  >
    {children || 'Cancel'}
  </button>
);

export default CRMModal;
