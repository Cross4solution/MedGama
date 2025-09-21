import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Phone as PhoneIcon } from 'lucide-react';
import countryCodes from '../../data/countryCodes';
import countryDialCodes from '../../data/countryDialCodes';
import { getFlagCode } from '../../utils/geo';

export default function PhoneNumberInput({ value = '', onChange, countryName, allowedCountryNames = null }) {
  const phoneWrapRef = useRef(null);
  const [showPhoneCodes, setShowPhoneCodes] = useState(false);
  const [phoneCodeQuery, setPhoneCodeQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0, width: 320 });
  const dropdownRef = useRef(null);
  const [dropdownHeight, setDropdownHeight] = useState(320); // default to max-h-80 (320px)

  // Parse incoming value
  const parsePhone = (val = '') => {
    const m = (val || '').match(/^(\+\d{1,3})\s*(.*)$/);
    return m ? { code: m[1], number: m[2] } : { code: '+90', number: (val || '').replace(/^\+/, '') };
  };
  const { code: initCode, number: initNumber } = parsePhone(value);
  const [phoneCode, setPhoneCode] = useState(initCode);
  const [phoneNumber, setPhoneNumber] = useState(initNumber);
  const displayPhone = `${phoneCode} ${phoneNumber || ''}`.trim();

  // Available codes (extendable)
  const phoneCodes = useMemo(() => {
    const all = Object.values(countryDialCodes || {});
    return Array.from(new Set(all)).sort((a,b) => Number(a.replace('+','')) - Number(b.replace('+','')));
  }, []);

  // Helpers
  const isoFor = (name) => {
    if (!name) return null;
    const direct = countryCodes[name];
    if (direct) return direct;
    const map = {
      'Czech Republic': 'cz', 'New Zealand': 'nz', Mexico: 'mx', Brazil: 'br', Argentina: 'ar', Chile: 'cl',
      Colombia: 'co', Venezuela: 've', Peru: 'pe', Morocco: 'ma', Tunisia: 'tn', Algeria: 'dz', Nigeria: 'ng',
      'South Africa': 'za', Australia: 'au', Japan: 'jp', 'South Korea': 'kr', China: 'cn', Singapore: 'sg',
      Malaysia: 'my', Indonesia: 'id', Thailand: 'th', Vietnam: 'vn', Philippines: 'ph', Russia: 'ru',
      Ukraine: 'ua', Slovakia: 'sk', Denmark: 'dk', Sweden: 'se', Norway: 'no', Ireland: 'ie', Belgium: 'be',
      Latvia: 'lv', Lithuania: 'lt', Estonia: 'ee', Switzerland: 'ch', Austria: 'at', Netherlands: 'nl', Poland: 'pl',
      Greece: 'gr', Portugal: 'pt', France: 'fr', Italy: 'it', Spain: 'es', Turkey: 'tr', 'United Kingdom': 'gb',
      'United States': 'us', Egypt: 'eg', 'Saudi Arabia': 'sa', Pakistan: 'pk', 'United Arab Emirates': 'ae',
    };
    return map[name] || null;
  };
  const getFlagUrlByIso = (iso) => iso ? `https://flagcdn.com/24x18/${iso}.png` : null;

  const phoneMeta = useMemo(() => {
    // Build code -> representative country meta
    const codeToNames = new Map();
    Object.entries(countryDialCodes || {}).forEach(([name, code]) => {
      const arr = codeToNames.get(code) || [];
      arr.push(name);
      codeToNames.set(code, arr);
    });
    const obj = {};
    for (const code of phoneCodes) {
      const candidates = codeToNames.get(code) || [];
      // pick representative name: if allowedCountryNames provided, prefer one from it
      let rep = candidates[0] || '';
      if (Array.isArray(allowedCountryNames) && allowedCountryNames.length > 0) {
        const found = candidates.find((n) => allowedCountryNames.includes(n));
        if (found) rep = found;
      }
      const iso = getFlagCode(rep) || countryCodes[rep] || null;
      obj[code] = { name: rep, iso, placeholder: `${code} 555 123 4567` };
    }
    return obj;
  }, [phoneCodes, allowedCountryNames]);

  const phoneMaxDigits = useMemo(() => ({
    '+90': 10,'+1': 10,'+44': 10,'+49': 11,'+43': 11,'+33': 9,'+39': 10,'+34': 9,'+31': 9,'+48': 9,'+30': 10,
    '+351': 9,'+41': 9,'+7': 10,'+61': 9,'+971': 9,'+46': 9,'+47': 8,'+45': 8,'+420': 9,'+421': 9,'+36': 9,'+40': 9,
    '+380': 9,'+373': 8,'+359': 9,'+32': 9,'+353': 9,'+372': 7,'+371': 8,'+370': 8,'+81': 10,'+82': 10,'+86': 11,
    '+62': 10,'+60': 9,'+65': 8,'+66': 9,'+84': 9,'+63': 10,'+64': 9,'+52': 10,'+55': 11,'+54': 10,'+56': 9,
    '+57': 10,'+58': 10,'+51': 9,'+20': 10,'+212': 10,'+216': 8,'+213': 9,'+234': 10,'+27': 9,'+966': 9,'+92': 10,
  }), []);

  const phoneStartRules = useMemo(() => ({
    '+90': /^5/, '+1': /^[2-9]/, '+44': /^7/, '+33': /^[67]/, '+34': /^[67]/, '+49': /^[1-9]/, '+61': /^4/,
    '+971': /^5/, '+31': /^6/, '+48': /^[5-9]/, '+30': /^6/, '+351': /^9/, '+41': /^7/, '+7': /^[3489]/,
  }), []);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!phoneWrapRef.current) return;
      if (!phoneWrapRef.current.contains(e.target)) setShowPhoneCodes(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Note: Previously, body scroll was locked while dropdown was open, which
  // could cause layout shift on some pages. We avoid altering body styles to
  // keep the page from "jumping" when the dropdown opens.
  // (Wheel/touch events are still stopped on the dropdown container below.)

  // Compute absolute (fixed) position for the dropdown and keep it in viewport
  useEffect(() => {
    if (!showPhoneCodes) return;
    const update = () => {
      const el = phoneWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Align to flag button (left: ~36px from wrapper)
      const left = Math.max(8, rect.left + 36);
      // Open UPWARDS: place the dropdown right above the input
      const desiredHeight = Math.min(dropdownHeight || 320, 320);
      const top = Math.max(8, rect.top - desiredHeight - 6);
      // width: prefer 320 but keep within viewport
      const desired = 320;
      const width = Math.min(desired, window.innerWidth - left - 8);
      setDropdownPos({ left, top, width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showPhoneCodes, dropdownHeight]);

  // Measure dropdown height after it renders to position accurately above input
  useEffect(() => {
    if (!showPhoneCodes) return;
    const raf = requestAnimationFrame(() => {
      if (dropdownRef.current) {
        const h = Math.min(320, dropdownRef.current.scrollHeight);
        if (h && Math.abs(h - dropdownHeight) > 2) setDropdownHeight(h);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [showPhoneCodes, phoneCodeQuery]);

  // Re-format when code changes
  useEffect(() => {
    const codeRe = new RegExp('^' + String(phoneCode || '').replace('+','\\+') + '\\s*');
    const digitsRaw = (value || '').replace(codeRe, '').replace(/\D+/g, '');
    const limit = phoneMaxDigits[phoneCode] || 14;
    const digits = digitsRaw.slice(0, limit);
    setPhoneNumber(formatPhone(phoneCode, digits));
  }, [phoneCode]);

  // If a countryName is provided from parent, sync the code accordingly
  useEffect(() => {
    if (!countryName) return;
    const code = countryDialCodes[countryName] || null;
    if (code) {
      setPhoneCode(code);
      const rawDigits = (displayPhone || '').replace(/^\+\d{1,3}\s*/, '').replace(/\D+/g, '');
      const limit = phoneMaxDigits[code] || 14;
      const digits = rawDigits.slice(0, limit);
      onChange && onChange(`${code} ${digits}`.trim());
    }
  }, [countryName]);

  // helpers for grouping
  const formatByGroups = (d, groups) => {
    const parts = [];
    let idx = 0;
    for (const g of groups) { if (idx >= d.length) break; parts.push(d.slice(idx, idx + g)); idx += g; }
    if (idx < d.length) parts.push(d.slice(idx));
    return parts.filter(Boolean).join(' ').trim();
  };

  const formatPhone = (code, digits) => {
    let d = (digits || '').replace(/\D+/g, '');
    const limit = phoneMaxDigits[code] || 14;
    d = d.slice(0, limit);
    switch (code) {
      case '+90': return formatByGroups(d, [3,3,2,2]);
      case '+1': return formatByGroups(d, [3,3,4]);
      case '+44': return formatByGroups(d, [3,3,4]);
      case '+33': return formatByGroups(d, [1,2,2,2,2]);
      case '+34': return formatByGroups(d, [3,3,3]);
      case '+49': return formatByGroups(d, [3,3,3,2]);
      case '+61': return formatByGroups(d, [1,4,4]);
      case '+971': return formatByGroups(d, [2,3,4]);
      case '+31': return formatByGroups(d, [2,3,4]);
      case '+48': return formatByGroups(d, [3,3,3]);
      case '+30': return formatByGroups(d, [3,3,4]);
      case '+351': return formatByGroups(d, [3,3,3]);
      case '+41': return formatByGroups(d, [2,3,4]);
      case '+7': return formatByGroups(d, [3,3,2,2]);
      default: return formatByGroups(d, [3,3,4]);
    }
  };

  const phonePlaceholder = (code = '+90') => phoneMeta[code]?.placeholder || `${code} 555 123 4567`;

  return (
    <div className="relative" ref={phoneWrapRef}>
      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <button
        type="button"
        onClick={() => setShowPhoneCodes((s)=>!s)}
        className="absolute left-9 top-1/2 -translate-y-1/2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-none w-7 h-7 flex items-center justify-center focus:outline-none focus:ring-0 select-none"
        aria-label="Choose phone country code"
      >
        {(phoneMeta[phoneCode]?.iso || isoFor(phoneMeta[phoneCode]?.name)) && (
          <img src={getFlagUrlByIso(phoneMeta[phoneCode]?.iso || isoFor(phoneMeta[phoneCode]?.name))} alt="" width={14} height={10} className="inline-block rounded-[2px]" />
        )}
        <span className="sr-only">{phoneCode}</span>
      </button>
      <input
        type="tel"
        inputMode="numeric"
        name="phone"
        value={displayPhone}
        onChange={(e) => {
          const raw = e.target.value || '';
          const limit = phoneMaxDigits[phoneCode] || 14;
          const codeRe = new RegExp('^' + String(phoneCode || '').replace('+','\\+') + '\\s*');
          const cleanAfterCode = raw.replace(codeRe, '');
          const clean = cleanAfterCode.replace(/\D+/g, '');
          const rule = phoneStartRules[phoneCode];
          if (clean.length === 1 && rule && !rule.test(clean[0])) return;
          const digits = clean.slice(0, limit);
          const formatted = formatPhone(phoneCode, digits);
          setPhoneNumber(formatted);
          onChange && onChange(`${phoneCode} ${digits}`.trim());
        }}
        className={`w-full h-11 pl-24 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm border-gray-300`}
        placeholder={phonePlaceholder(phoneCode)}
      />
      {showPhoneCodes && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[1000] bg-white border border-gray-300 rounded-xl shadow-xl max-h-80 overflow-auto overscroll-contain p-2 divide-y divide-gray-100"
          style={{ left: dropdownPos.left, top: dropdownPos.top, width: dropdownPos.width, maxHeight: 320 }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white pb-2 mb-2 z-10 border-b border-gray-200">
            <input
              value={phoneCodeQuery}
              onChange={(e)=>setPhoneCodeQuery(e.target.value)}
              placeholder="Search country or code"
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
            />
          </div>
          {(phoneCodes.filter((c)=> {
            const meta = phoneMeta[c] || {}; const q = phoneCodeQuery.trim().toLowerCase();
            // If allowedCountryNames provided, include code if ANY of its countries are allowed
            if (Array.isArray(allowedCountryNames) && allowedCountryNames.length > 0) {
              if (!allowedCountryNames.includes(meta.name)) return false;
            }
            if (!q) return true; return (meta.name||'').toLowerCase().includes(q) || c.includes(q);
          })).map((c)=> {
            const meta = phoneMeta[c] || {};
            const iso = meta.iso || isoFor(meta.name);
            return (
              <button
                key={c}
                type="button"
                onClick={()=> {
                  setShowPhoneCodes(false);
                  setPhoneCode(c);
                  const rawDigits = (phoneNumber || '').replace(/\D+/g, '');
                  const limit = phoneMaxDigits[c] || 14;
                  const digits = rawDigits.slice(0, limit);
                  const formatted = formatPhone(c, digits);
                  setPhoneNumber(formatted);
                  onChange && onChange(`${c} ${digits}`.trim());
                }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 rounded-md ${ displayPhone.startsWith(c) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                {iso && <img src={getFlagUrlByIso(iso)} alt="" width={20} height={15} className="inline-block rounded-sm" />}
                <span className="flex-1 truncate">{meta.name || 'Country'}</span>
                <span className="text-gray-500">{c}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
