import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Phone as PhoneIcon } from 'lucide-react';
import countryCodes from '../../data/countryCodes';

export default function PhoneNumberInput({ value = '', onChange, countryName }) {
  const phoneWrapRef = useRef(null);
  const [showPhoneCodes, setShowPhoneCodes] = useState(false);
  const [phoneCodeQuery, setPhoneCodeQuery] = useState('');

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
  const phoneCodes = useMemo(() => [
    '+90','+1','+44','+49','+43','+33','+39','+34','+31','+48','+30','+351','+41','+7','+61','+971',
    '+46','+47','+45','+420','+421','+36','+40','+380','+373','+359','+32','+353','+372','+371','+370',
    '+81','+82','+86','+62','+60','+65','+66','+84','+63','+64',
    '+52','+55','+54','+56','+57','+58','+51',
    '+20','+212','+216','+213','+234','+27','+966','+92'
  ], []);

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

  const phoneMeta = useMemo(() => ({
    '+90': { name: 'Turkey', iso: countryCodes['Turkey'], placeholder: '+90 555 555 55 55' },
    '+1': { name: 'United States', iso: countryCodes['United States'], placeholder: '+1 555 123 4567' },
    '+44': { name: 'United Kingdom', iso: countryCodes['United Kingdom'], placeholder: '+44 7123 456789' },
    '+49': { name: 'Germany', iso: countryCodes['Germany'], placeholder: '+49 1523 4567890' },
    '+43': { name: 'Austria', iso: countryCodes['Austria'], placeholder: '+43 660 123 4567' },
    '+33': { name: 'France', iso: countryCodes['France'], placeholder: '+33 6 12 34 56 78' },
    '+39': { name: 'Italy', iso: countryCodes['Italy'], placeholder: '+39 347 123 4567' },
    '+34': { name: 'Spain', iso: countryCodes['Spain'], placeholder: '+34 612 34 56 78' },
    '+31': { name: 'Netherlands', iso: countryCodes['Netherlands'], placeholder: '+31 6 12 34 56 78' },
    '+48': { name: 'Poland', iso: countryCodes['Poland'], placeholder: '+48 512 345 678' },
    '+30': { name: 'Greece', iso: countryCodes['Greece'], placeholder: '+30 691 234 5678' },
    '+351': { name: 'Portugal', iso: countryCodes['Portugal'], placeholder: '+351 912 345 678' },
    '+41': { name: 'Switzerland', iso: countryCodes['Switzerland'], placeholder: '+41 79 123 45 67' },
    '+7': { name: 'Russia', iso: countryCodes['Russia'], placeholder: '+7 912 345 67 89' },
    '+61': { name: 'Australia', iso: 'au', placeholder: '+61 4 1234 5678' },
    '+971': { name: 'United Arab Emirates', iso: 'ae', placeholder: '+971 50 123 4567' },
    '+46': { name: 'Sweden', iso: countryCodes['Sweden'], placeholder: '+46 70 123 45 67' },
    '+47': { name: 'Norway', iso: countryCodes['Norway'], placeholder: '+47 412 34 567' },
    '+45': { name: 'Denmark', iso: countryCodes['Denmark'], placeholder: '+45 12 34 56 78' },
    '+420': { name: 'Czech Republic', iso: countryCodes['Czech Republic'], placeholder: '+420 601 123 456' },
    '+421': { name: 'Slovakia', iso: countryCodes['Slovakia'], placeholder: '+421 901 234 567' },
    '+36': { name: 'Hungary', iso: countryCodes['Hungary'], placeholder: '+36 20 123 4567' },
    '+40': { name: 'Romania', iso: countryCodes['Romania'], placeholder: '+40 712 345 678' },
    '+380': { name: 'Ukraine', iso: countryCodes['Ukraine'], placeholder: '+380 67 123 4567' },
    '+373': { name: 'Moldova', iso: countryCodes['Moldova'], placeholder: '+373 621 23 456' },
    '+359': { name: 'Bulgaria', iso: countryCodes['Bulgaria'], placeholder: '+359 87 123 4567' },
    '+32': { name: 'Belgium', iso: countryCodes['Belgium'], placeholder: '+32 470 12 34 56' },
    '+353': { name: 'Ireland', iso: countryCodes['Ireland'], placeholder: '+353 85 123 4567' },
    '+372': { name: 'Estonia', iso: countryCodes['Estonia'], placeholder: '+372 5123 456' },
    '+371': { name: 'Latvia', iso: countryCodes['Latvia'], placeholder: '+371 21 234 567' },
    '+370': { name: 'Lithuania', iso: countryCodes['Lithuania'], placeholder: '+370 612 34 567' },
    '+81': { name: 'Japan', iso: countryCodes['Japan'], placeholder: '+81 90 1234 5678' },
    '+82': { name: 'South Korea', iso: countryCodes['South Korea'], placeholder: '+82 10 1234 5678' },
    '+86': { name: 'China', iso: countryCodes['China'], placeholder: '+86 131 2345 6789' },
    '+62': { name: 'Indonesia', iso: countryCodes['Indonesia'], placeholder: '+62 812 1234 5678' },
    '+60': { name: 'Malaysia', iso: countryCodes['Malaysia'], placeholder: '+60 12 345 6789' },
    '+65': { name: 'Singapore', iso: countryCodes['Singapore'], placeholder: '+65 8123 4567' },
    '+66': { name: 'Thailand', iso: countryCodes['Thailand'], placeholder: '+66 81 234 5678' },
    '+84': { name: 'Vietnam', iso: countryCodes['Vietnam'], placeholder: '+84 91 234 56 78' },
    '+63': { name: 'Philippines', iso: countryCodes['Philippines'], placeholder: '+63 912 345 6789' },
    '+64': { name: 'New Zealand', iso: 'nz', placeholder: '+64 21 123 4567' },
    '+52': { name: 'Mexico', iso: 'mx', placeholder: '+52 55 1234 5678' },
    '+55': { name: 'Brazil', iso: 'br', placeholder: '+55 11 91234 5678' },
    '+54': { name: 'Argentina', iso: 'ar', placeholder: '+54 9 11 1234 5678' },
    '+56': { name: 'Chile', iso: 'cl', placeholder: '+56 9 1234 5678' },
    '+57': { name: 'Colombia', iso: 'co', placeholder: '+57 300 123 4567' },
    '+58': { name: 'Venezuela', iso: 've', placeholder: '+58 412 123 4567' },
    '+51': { name: 'Peru', iso: 'pe', placeholder: '+51 912 345 678' },
    '+20': { name: 'Egypt', iso: 'eg', placeholder: '+20 10 123 45678' },
    '+212': { name: 'Morocco', iso: 'ma', placeholder: '+212 6 12 34 56 78' },
    '+216': { name: 'Tunisia', iso: 'tn', placeholder: '+216 21 234 567' },
    '+213': { name: 'Algeria', iso: 'dz', placeholder: '+213 551 23 45 67' },
    '+234': { name: 'Nigeria', iso: 'ng', placeholder: '+234 803 123 4567' },
    '+27': { name: 'South Africa', iso: 'za', placeholder: '+27 82 123 4567' },
    '+966': { name: 'Saudi Arabia', iso: 'sa', placeholder: '+966 50 123 4567' },
    '+92': { name: 'Pakistan', iso: 'pk', placeholder: '+92 300 1234567' },
  }), []);

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

  // Lock body scroll while dropdown open
  useEffect(() => {
    if (!showPhoneCodes) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    const prevent = (e) => e.preventDefault();
    window.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('touchmove', prevent);
    };
  }, [showPhoneCodes]);

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
    const entry = Object.entries(phoneMeta).find(([code, meta]) => meta.name === countryName);
    if (entry) {
      const [code] = entry;
      setPhoneCode(code);
      // also update parent value with new code
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
      {showPhoneCodes && (
        <div
          className="absolute z-20 mt-1 left-9 bg-white border border-gray-300 rounded-xl shadow-xl w-72 sm:w-80 max-h-80 overflow-auto overscroll-contain p-2 divide-y divide-gray-100"
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
        </div>
      )}
    </div>
  );
}
