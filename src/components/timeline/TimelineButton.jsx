import React from 'react';

// Tek tip timeline butonu
// Kullanım: <TimelineButton className="w-full sm:w-auto">Book Appointment</TimelineButton>
export default function TimelineButton({ children, className = '', disabled = false, type = 'button', onClick = () => {} }) {
  const base = 'btn btn-primary btn-md';
  const cls = `${base} ${className}`.trim();
  const btnType = (type === 'submit' || type === 'reset' || type === 'button') ? type : 'button';
  return (
    <button type={btnType} disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
