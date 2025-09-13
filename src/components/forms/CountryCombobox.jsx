import React, { useEffect, useMemo, useRef, useState } from 'react';
import countryCodes from '../../data/countryCodes';

export default function CountryCombobox({ options = [], value, onChange, placeholder = 'Select Country', triggerClassName = '', getFlagUrl }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const normalize = (s) => s?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Alias eşleştirme: Türkçe veya yaygın kısaltmalar
  const aliases = useMemo(() => ({
    'United States': ['usa', 'u.s.a', 'us', 'america', 'amerika', 'abd', 'united states of america'],
    Russia: ['russia', 'rusya', 'russian federation'],
    Germany: ['almanya', 'germany', 'deutschland'],
    Greece: ['yunanistan', 'greece'],
    Spain: ['ispanya', 'spain', 'españa'],
    Italy: ['italya', 'italia', 'italy'],
    Turkey: ['türkiye', 'turkey', 'turkiye'],
    'United Kingdom': ['uk', 'u.k', 'britain', 'england', 'united kingdom', 'ingiltere', 'britanya'],
    Netherlands: ['hollanda', 'netherlands'],
    Czechia: ['çekya', 'czechia', 'czech republic'],
    'North Macedonia': ['makedonya', 'north macedonia'],
    Serbia: ['sırbistan', 'serbia'],
    Poland: ['polonya', 'poland'],
    Sweden: ['isveç', 'sweden'],
    Norway: ['norveç', 'norway'],
    Finland: ['finlandiya', 'finland'],
    Ukraine: ['ukrayna', 'ukraine'],
    Belarus: ['beyaz rusya', 'belarus'],
    Austria: ['avusturya', 'austria'],
    Switzerland: ['isviçre', 'switzerland'],
    Hungary: ['macaristan', 'hungary'],
    Bulgaria: ['bulgaristan', 'bulgaria'],
    Romania: ['romanya', 'romania'],
    Greecee: ['yunanistan'],
  }), []);

  const filtered = useMemo(() => {
    const q = normalize(query || '');
    if (!q) return options;
    return options.filter((opt) => {
      const nameMatch = normalize(opt).includes(q);
      const aliasList = aliases[opt] || [];
      const aliasMatch = aliasList.some((a) => normalize(a).includes(q));
      return nameMatch || aliasMatch;
    });
  }, [options, query, aliases]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedLabel = value || '';
  const defaultGetFlagUrl = (name) => {
    const code = countryCodes[name];
    return code ? `https://flagcdn.com/24x18/${code}.png` : null;
  };
  const resolveFlagUrl = (name) => {
    if (typeof getFlagUrl === 'function') {
      try {
        const ext = getFlagUrl(name);
        return ext || defaultGetFlagUrl(name);
      } catch {
        return defaultGetFlagUrl(name);
      }
    }
    return defaultGetFlagUrl(name);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={
          triggerClassName && triggerClassName.length > 0
            ? triggerClassName
            : 'w-full border border-gray-300 rounded-lg px-3 py-2 text-base md:text-sm bg-white text-left flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1C6A83]/20 transition-shadow'
        }
        onClick={() => setOpen((o) => !o)}
      >
        {selectedLabel ? (
          <span className="inline-flex items-center gap-2">
            {resolveFlagUrl(selectedLabel) && (
              <img src={resolveFlagUrl(selectedLabel)} alt="" width={18} height={14} className="inline-block rounded-sm" loading="lazy" />
            )}
            <span>{selectedLabel}</span>
          </span>
        ) : (
          placeholder
        )}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              className="w-full border border-gray-200 rounded px-2 py-1 text-base md:text-sm"
              placeholder="Search country"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-64 overflow-y-auto text-sm">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { onChange && onChange(opt); setOpen(false); setQuery(''); }}
                >
                  {resolveFlagUrl(opt) && (
                    <img src={resolveFlagUrl(opt)} alt="" width={18} height={14} className="inline-block rounded-sm" loading="lazy" />
                  )}
                  <span>{opt}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-gray-500 text-xs">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
