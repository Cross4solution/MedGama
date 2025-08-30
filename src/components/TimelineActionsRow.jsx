import React from 'react';

// Ortak aksiyon satırı: sol tarafta ikon/aksiyon grubu, sağda buton/slot
// Responsive: mobilde dikey, sm ve üstünde yatay; araya sabit gap
export default function TimelineActionsRow({ left, right, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`.trim()}>
      <div className="flex items-center space-x-6">
        {left}
      </div>
      {right}
    </div>
  );
}
