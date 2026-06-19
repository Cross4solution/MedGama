'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import LangFlag from './LangFlag';
import { LOCALES, DEFAULT_LOCALE, getLocaleFromPath, stripLocale, withLocale } from '../../lib/locales';

// Sadece routing'i olan diller (LOCALES) gösterilir.
const ROUTED = LANGUAGES.filter((l) => LOCALES.includes(l.code));

export default function LanguageSwitcher({ compact = false }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = getLocaleFromPath(pathname);
  const currentLang = ROUTED.find((l) => l.code === current) || ROUTED.find((l) => l.code === DEFAULT_LOCALE);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (code) => {
    setOpen(false);
    if (code === current) return;
    // 1) middleware'in saygı duyması için i18next çerezi
    try { document.cookie = `i18next=${code}; path=/; max-age=31536000; samesite=lax`; } catch {}
    // 2) UI dilini değiştir
    try { i18n.changeLanguage(code); } catch {}
    // 3) Aynı sayfada kal, sadece locale prefix'ini değiştir
    const rest = stripLocale(pathname);
    router.push(withLocale(code, rest));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-md hover:bg-gray-100 transition-colors ${compact ? 'px-1.5 py-1' : 'px-1.5 py-1'}`}
        aria-label="Dil seçimi"
      >
        <LangFlag lang={currentLang} size={15} />
        {!compact && <span className="text-xs font-medium text-gray-500">{currentLang?.code?.toUpperCase()}</span>}
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1">
          {ROUTED.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => choose(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${l.code === current ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <LangFlag lang={l} size={18} />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
