import React from 'react';
import { getStatusBadge } from '../../lib/constants';

/**
 * StatusBadge — Platform-wide status badge component.
 * Uses centralized status colors from constants.js (Single Source of Truth).
 *
 * @param {string} status - Status string (pending, approved, rejected, hidden, etc.)
 * @param {string} [size='sm'] - Size variant: 'xs' | 'sm' | 'md'
 * @param {boolean} [dot=false] - Show colored dot before label
 * @param {string} [label] - Override label text
 * @param {string} [className] - Additional classes
 */
export default function StatusBadge({ status, size = 'sm', dot = false, label, className = '' }) {
  const badge = getStatusBadge(status);
  const displayLabel = label || badge.label;

  const sizeMap = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${badge.bg} ${badge.text} ${badge.border} ${sizeMap[size] || sizeMap.sm} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />}
      {displayLabel}
    </span>
  );
}
