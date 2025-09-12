// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  MapPin,
  Chrome,
  Facebook,
  Smartphone
} from 'lucide-react';
import countriesEurope from '../../data/countriesEurope';
import CountryCombobox from '../forms/CountryCombobox';
import countryCodes from '../../data/countryCodes';

/**
 * @typedef {Object} RegisterFormData
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {string} [country]
 * @property {string} [birthDate]
 * @property {string} [password]
 * @property {string} [confirmPassword]
 * @property {boolean} [acceptTerms]
 * @property {boolean} [receiveUpdates]
 */

/**
 * @param {Object} props
 * @param {RegisterFormData} props.formData
 * @param {Record<string, string>} props.errors
 * @param {boolean} props.showPassword
 * @param {boolean} props.showConfirmPassword
 * @param {(v:boolean)=>void} props.setShowPassword
 * @param {(v:boolean)=>void} props.setShowConfirmPassword
 * @param {(e:any)=>void} props.handleInputChange
 * @param {(e:any)=>void} props.handleSubmit
 * @param {(page:string)=>void} props.setCurrentPage
 * @param {(v:boolean)=>void} props.setShowTermsPopup
 * @param {(v:boolean)=>void} props.setShowPrivacyPopup
 */
const RegisterForm = ({
  formData = {},
  errors = {},
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  handleInputChange,
  handleSubmit,
  setCurrentPage,
  setShowTermsPopup,
  setShowPrivacyPopup,
}) => {
  // Multi-step state
  const [step, setStep] = useState(1); // 1 -> basic, 2 -> details
  const [localErrors, setLocalErrors] = useState({});
  // Phone country code (in-input) dropdown state
  const [showPhoneCodes, setShowPhoneCodes] = useState(false);
  const phoneCodes = useMemo(() => ['+90','+1','+44','+49','+43','+33','+39','+34','+31','+48','+30','+351','+41','+7','+61','+971'], []);
  const phoneWrapRef = useRef(null);
  const dobRef = useRef(null);
  // Local derived states for code and number (to prevent duplicate +code in input)
  const parsePhone = (val = '') => {
    const m = (val || '').match(/^(\+\d{1,3})\s*(.*)$/);
    return m ? { code: m[1], number: m[2] } : { code: '+90', number: (val || '').replace(/^\+/, '') };
  };
  /** @type {any} */
  const fd = (formData || {});
  const { code: initCode, number: initNumber } = parsePhone(fd.phone);
  const [phoneCode, setPhoneCode] = useState(initCode);
  const [phoneNumber, setPhoneNumber] = useState(initNumber);

  // Phone meta by country code (name, iso, placeholder)
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
  }), []);

  // Max digits per country (national number without country code).
  const phoneMaxDigits = useMemo(() => ({
    '+90': 10, // TR
    '+1': 10,  // US/CA
    '+44': 10, // UK
    '+49': 11, // DE
    '+43': 11, // AT
    '+33': 9,  // FR
    '+39': 10, // IT
    '+34': 9,  // ES
    '+31': 9,  // NL
    '+48': 9,  // PL
    '+30': 10, // GR
    '+351': 9, // PT (mobile common)
    '+41': 9,  // CH
    '+7': 10,  // RU
    '+61': 9,  // AU (mobile base)
    '+971': 9, // UAE (common mobile length)
  }), []);

  const getFlagUrlByIso = (iso) => iso ? `https://flagcdn.com/24x18/${iso}.png` : null;

  const phonePlaceholder = (code = '+90') => phoneMeta[code]?.placeholder || `${code} 555 123 4567`;

  // Country-specific starting digit rules (simple, mobile-focused)
  const phoneStartRules = useMemo(() => ({
    '+90': /^5/,       // TR mobile 5xxx...
    '+1': /^[2-9]/,    // US/CA area code cannot start with 0 or 1
    '+44': /^7/,       // UK mobile starts with 7
    '+33': /^[67]/,    // FR mobile 6 or 7
    '+34': /^[67]/,    // ES mobile 6 or 7
    '+49': /^[1-9]/,   // DE general (avoid leading 0)
    '+61': /^4/,       // AU mobile starts with 4
    '+971': /^5/,      // UAE mobile starts with 5
    '+31': /^6/,       // NL mobile starts with 6
    '+48': /^[5-9]/,   // PL common mobile ranges
    '+30': /^6/,       // GR mobile starts with 6
    '+351': /^9/,      // PT mobile starts with 9
    '+41': /^7/,       // CH mobile starts with 7
    '+7': /^[3489]/,   // RU (broadly allow 3/4/8/9)
  }), []);

  // helpers for grouping
  const formatByGroups = (d, groups) => {
    const parts = [];
    let idx = 0;
    for (const g of groups) {
      if (idx >= d.length) break;
      parts.push(d.slice(idx, idx + g));
      idx += g;
    }
    if (idx < d.length) parts.push(d.slice(idx));
    return parts.filter(Boolean).join(' ').trim();
  };

  // Format phone by country code
  const formatPhone = (code, digits) => {
    let d = (digits || '').replace(/\D+/g, '');
    const limit = phoneMaxDigits[code] || 14;
    d = d.slice(0, limit);

    switch (code) {
      case '+90': {
        // TR mobile: 10 haneli ve 5 ile başlar -> 555 555 55 55
        if (d.startsWith('0')) d = d.slice(1); // baştaki 0'ı gösterimde kaldır
        return formatByGroups(d, [3,3,2,2]);
      }
      case '+1':
        // US/CA: 3-3-4
        return formatByGroups(d, [3,3,4]);
      case '+44':
        // UK (genel): 3-3-4
        return formatByGroups(d, [3,3,4]);
      case '+33':
        // FR (genel): 1-2-2-2-2
        return formatByGroups(d, [1,2,2,2,2]);
      case '+34':
        // ES: 3-3-3
        return formatByGroups(d, [3,3,3]);
      case '+49':
        // DE (genel): 3-3-3-2
        return formatByGroups(d, [3,3,3,2]);
      case '+61':
        // AU mobile: 1-4-4 (ör: 4 1234 5678)
        return formatByGroups(d, [1,4,4]);
      case '+971':
        // UAE (genel): 2-3-4
        return formatByGroups(d, [2,3,4]);
      case '+31':
        // NL (genel): 2-3-4
        return formatByGroups(d, [2,3,4]);
      case '+48':
        // PL: 3-3-3
        return formatByGroups(d, [3,3,3]);
      case '+30':
        // GR: 3-3-4
        return formatByGroups(d, [3,3,4]);
      case '+351':
        // PT: 3-3-3
        return formatByGroups(d, [3,3,3]);
      case '+41':
        // CH: 2-3-4
        return formatByGroups(d, [2,3,4]);
      case '+7':
        // RU (genel): 3-3-2-2
        return formatByGroups(d, [3,3,2,2]);
      default:
        // Generic 3-3-4
        return formatByGroups(d, [3,3,4]);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!phoneWrapRef.current) return;
      if (!phoneWrapRef.current.contains(e.target)) setShowPhoneCodes(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Format display phone on code change (and initial mount)
  useEffect(() => {
    const digitsRaw = (fd.phone || '').replace(/^\+\d{1,3}\s*/, '').replace(/\D+/g, '');
    const limit = phoneMaxDigits[phoneCode] || 14;
    const digits = digitsRaw.slice(0, limit);
    setPhoneNumber(formatPhone(phoneCode, digits));
  }, [phoneCode]);

  const validateStep1 = () => {
    const le = {};
    if (!String(fd.firstName || '').trim()) le.firstName = 'First name is required';
    if (!String(fd.lastName || '').trim()) le.lastName = 'Last name is required';
    if (!String(fd.email || '').trim()) le.email = 'Email is required';
    if (!String(fd.phone || '').trim() && !String(phoneNumber || '').trim()) le.phone = 'Phone is required';
    setLocalErrors(le);
    return Object.keys(le).length === 0;
  };

  const handleNext = (e) => {
    e?.preventDefault?.();
    if (validateStep1()) setStep(2);
  };

  const handleBack = (e) => {
    e?.preventDefault?.();
    setStep(1);
  };

  return (
  <div className="w-full max-w-md mx-auto">
         <div className="text-center mb-2 sm:mb-3 md:mb-2">
           <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
             <img src="/images/logo/crm-logo.jpg" alt="MedGama" className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
             <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">MedGama</span>
           </div>
           <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Create an Account</h1>
       <p className="text-xs sm:text-sm text-gray-600">Sign up to start your health journey</p>
       <div className="mt-1 text-[11px] sm:text-xs text-gray-500">Step {step} / 2</div>
         </div>
         <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-2 md:space-y-1 flex flex-col items-center">
            {step === 1 && (
            <>
            <div className="grid grid-cols-1 gap-1 sm:gap-2 w-full max-w-md">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="firstName"
              value={fd.firstName ?? ''}
              onChange={handleInputChange}
              className={`w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                (errors.firstName || localErrors.firstName) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your first name"
            />
          </div>
          {(errors.firstName || localErrors.firstName) && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.firstName || localErrors.firstName}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="lastName"
              value={fd.lastName ?? ''}
              onChange={handleInputChange}
              className={`w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                (errors.lastName || localErrors.lastName) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your last name"
            />
          </div>
          {(errors.lastName || localErrors.lastName) && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.lastName || localErrors.lastName}</p>}
        </div>
      </div>
             <div className="grid grid-cols-1 gap-1 sm:gap-2 w-full max-w-2xl">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={fd.email ?? ''}
              onChange={handleInputChange}
              className={`w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                (errors.email || localErrors.email) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="name@example.com"
            />
          </div>
          {(errors.email || localErrors.email) && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.email || localErrors.email}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">
            Phone
          </label>
          <div className="relative" ref={phoneWrapRef}>
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {/* Country code prefix inside input (no layout change) */}
            <button
              type="button"
              onClick={() => setShowPhoneCodes((s)=>!s)}
              className="absolute left-9 top-1/2 -translate-y-1/2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-none w-7 h-7 flex items-center justify-center focus:outline-none focus:ring-0 select-none"
              aria-label="Choose phone country code"
            >
              {phoneMeta[phoneCode]?.iso && (
                <img src={getFlagUrlByIso(phoneMeta[phoneCode].iso)} alt="" width={14} height={10} className="inline-block rounded-[2px]" />
              )}
              <span className="sr-only">{phoneCode}</span>
            </button>
            <input
              type="tel"
              inputMode="numeric"
              name="phone"
              value={phoneNumber}
              onChange={(e) => {
                const raw = e.target.value || '';
                const limit = phoneMaxDigits[phoneCode] || 14;
                const clean = raw.replace(/\D+/g, '');
                const rule = phoneStartRules[phoneCode];
                // enforce starting digit rule at first character
                if (clean.length === 1 && rule && !rule.test(clean[0])) {
                  return; // ignore invalid first digit
                }
                const digits = clean.slice(0, limit);
                const formatted = formatPhone(phoneCode, digits);
                setPhoneNumber(formatted);
                handleInputChange({ target: { name: 'phone', value: `${phoneCode} ${digits}`.trim() } });
              }}
              className={`w-full h-11 pl-24 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={phonePlaceholder(phoneCode)}
            />
            {showPhoneCodes && (
              <div
                className="absolute z-20 mt-1 left-9 bg-white border border-gray-200 rounded-lg shadow-lg w-48 sm:w-56 max-h-56 overflow-auto overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {phoneCodes.map((c)=> {
                  const meta = phoneMeta[c] || {};
                  const iso = meta.iso;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={()=> {
                        setShowPhoneCodes(false);
                        setPhoneCode(c);
                        // Reformat existing digits with new code
                        const rawDigits = (phoneNumber || '').replace(/\D+/g, '');
                        const limit = phoneMaxDigits[c] || 14;
                        const digits = rawDigits.slice(0, limit);
                        const formatted = formatPhone(c, digits);
                        setPhoneNumber(formatted);
                        handleInputChange({ target: { name: 'phone', value: `${c} ${digits}`.trim() } });
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs sm:text-sm hover:bg-gray-50 flex items-center gap-2 ${ (fd.phone||'').startsWith(c) || phoneCode===c ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                    >
                      {iso && <img src={getFlagUrlByIso(iso)} alt="" width={18} height={14} className="inline-block rounded-sm" />}
                      <span className="flex-1 truncate">{meta.name || 'Country'}</span>
                      <span className="text-gray-500">{c}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.phone}</p>}
        </div>
      </div>
            {/* Step 1 Actions */}
            <div className="w-full max-w-md flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 sm:py-2.5 px-5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md"
              >
                Next
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>

      </>
      )}
      {step === 2 && (
        <>
        <div className="grid grid-cols-1 gap-1 sm:gap-2 w-full max-w-md">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Country
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-20" />
              <CountryCombobox
                  options={countriesEurope}
                  value={fd.country ?? ''}
                  onChange={(val) => {
                    handleInputChange({ target: { name: 'country', value: val } });
                    const entry = Object.entries(phoneMeta).find(([code, meta]) => meta.name === val);
                    if (entry) {
                      const [code] = entry;
                      setPhoneCode(code);
                    }
                  }}
                  placeholder="Select a country"
                  triggerClassName="w-full h-11 border border-gray-300 rounded-none pl-10 pr-3 text-sm bg-white text-left flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                />
            </div>
            {errors.country && (
              <div className="flex items-center mt-2 text-red-500 text-xs">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-center md:text-left">{errors.country}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
              Date of Birth
            </label>
            <div
              className="relative date-with-icon cursor-pointer"
              onClick={() => dobRef.current?.showPicker?.()}
            >
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={dobRef}
                type="date"
                name="birthDate"
                value={fd.birthDate ?? ''}
                onChange={handleInputChange}
                className="w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm bg-white border-gray-300"
              />
            </div>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4 w-full max-w-md mt-4 sm:mt-6 pt-2 pb-2">
          <div>
            <label className="flex items-start space-x-2 sm:space-x-3 justify-center md:justify-start">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={!!fd.acceptTerms}
                onChange={handleInputChange}
                className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <span className="text-sm text-gray-600 text-center md:text-left leading-relaxed">
                <span className="text-red-500">*</span>
                {' '}
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsPopup(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Terms of Use
                </button>{' '}and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyPopup(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>
            {errors.acceptTerms && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.acceptTerms}</p>}
          </div>
          <label className="flex items-start space-x-2 sm:space-x-3 justify-center md:justify-start">
            <input
              type="checkbox"
              name="receiveUpdates"
              checked={!!fd.receiveUpdates}
              onChange={handleInputChange}
              className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
            />
            <span className="text-sm text-gray-600 text-center md:text-left leading-relaxed">
             I would like to receive emails about health tips, new services, and special offers.
           </span>
          </label>
        </div>

        <div className="w-full max-w-md flex items-center justify-between gap-2 mt-2">
          <button onClick={handleBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-green-500 text-white py-2 sm:py-2.5 px-5 rounded-xl hover:bg-green-600 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md"
          >
            Create Account
          </button>
        </div>
        </>
      )}
      <p className="text-center text-xs text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setCurrentPage('login')}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          Log in
        </button>
      </p>
    </form>
  </div>
);

};

export default RegisterForm;