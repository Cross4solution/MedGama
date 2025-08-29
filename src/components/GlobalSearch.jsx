import React, { useMemo, useState } from 'react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const clinics = [
    'Acıbadem Sağlık Grubu',
    'Acibadem International',
    'SmileCare Clinic',
    'AestheticPlus',
    'Vision Center',
    'OrthoLife',
  ];
  const doctors = [
    'Dr. Ahmet Yılmaz',
    'Dr. Mehmet Demir',
    'Dr. Elif Kaya',
    'Dr. Ayşe Yılmaz',
  ];

  const normalize = (s) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const items = [
      ...clinics.map((c) => ({ type: 'Klinik', name: c })),
      ...doctors.map((d) => ({ type: 'Doktor', name: d })),
    ];
    return items
      .filter((i) => {
        const nameN = normalize(i.name);
        return tokens.every((t) => nameN.includes(t));
      })
      .slice(0, 8);
  }, [query]);

  const onSelect = (name) => {
    setQuery(name); // autofill input with selected value
    setOpen(false);
    // TODO: optionally navigate to results
    // console.log('Clinics search select:', name);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search clinics or doctors"
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-64 overflow-auto">
            {results.map((r, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => onSelect(r.name)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{r.name}</span>
                  <span className="text-xs text-gray-500">{r.type === 'Klinik' ? 'Clinic' : r.type === 'Doktor' ? 'Doctor' : r.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
