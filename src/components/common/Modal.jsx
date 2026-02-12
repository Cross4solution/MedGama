import React from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 animate-in">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-gray-700 max-h-[60vh] overflow-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}
