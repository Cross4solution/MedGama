import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import countryCodes from '../../data/countryCodes';

export default function CountryCombobox({ options = [], value, onChange, placeholder = 'Select Country', triggerClassName = '', getFlagUrl }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

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

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
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
        ref={btnRef}
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
      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="p-2.5 border-b border-gray-100">
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
              placeholder="Search country"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-64 overflow-y-auto text-sm py-1">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-center gap-2 transition-colors"
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
        </div>,
        document.body
      )}
    </div>
  );
}
