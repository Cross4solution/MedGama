import React from 'react';

/**
 * @param {{
 *  open: boolean,
 *  onClose: () => void,
 *  title: React.ReactNode,
 *  children: React.ReactNode,
 *  footer?: React.ReactNode,
 * }} props
 */
export default function Modal({ open, onClose, title, children, footer = null }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl border">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Close</button>
          </div>
          <div className="p-4 text-sm text-gray-800 max-h-[60vh] overflow-auto">{children}</div>
          {footer && <div className="px-4 py-3 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
