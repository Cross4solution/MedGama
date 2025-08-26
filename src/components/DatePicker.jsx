import React from 'react';

export default function DatePicker({ value, onChange, className = '' }) {
  const toInput = (d) => {
    try {
      const iso = (d instanceof Date ? d : new Date(d)).toISOString();
      return iso.slice(0, 10);
    } catch {
      return '';
    }
  };

  const fromInput = (s) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <input
      type="date"
      value={toInput(value)}
      onChange={(e) => onChange && onChange(fromInput(e.target.value))}
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white ${className}`}
    />
  );
}
