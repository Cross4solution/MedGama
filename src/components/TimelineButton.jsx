import React from 'react';

// Tek tip timeline butonu
// Kullanım: <TimelineButton className="w-full sm:w-auto">Book Appointment</TimelineButton>
export default function TimelineButton({ children, className = '', disabled = false, type = 'button', onClick }) {
  const base = 'btn btn-primary btn-md';
  const cls = `${base} ${className}`.trim();
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
