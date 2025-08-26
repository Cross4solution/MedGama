import React from 'react';

export default function CitySelector({ value, onChange, disabled }) {
  const cities = [
    'İstanbul',
    'Ankara',
    'İzmir',
    'Bursa',
    'Antalya',
    'Konya',
    'Adana',
    'Gaziantep',
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      disabled={disabled}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-100"
    >
      <option value="">Şehir seçiniz</option>
      {cities.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
