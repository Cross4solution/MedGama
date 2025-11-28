// @ts-nocheck
import React from 'react';
import { MapPin, Calendar, Stethoscope, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import PhoneNumberInput from '../forms/PhoneNumberInput';
import CountryCombobox from '../forms/CountryCombobox';
import { getFlagCode } from '../../utils/geo';

const SPECIALTIES = [
  { value: '', label: 'Select specialty' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'urology', label: 'Urology' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'anesthesiology', label: 'Anesthesiology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'otolaryngology', label: 'Otolaryngology' },
  { value: 'gastroenterology', label: 'Gastroenterology' },
  { value: 'endocrinology', label: 'Endocrinology' },
  { value: 'hematology', label: 'Hematology' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'nephrology', label: 'Nephrology' },
  { value: 'pulmonology', label: 'Pulmonology' },
  { value: 'rheumatology', label: 'Rheumatology' },
  { value: 'immunology', label: 'Immunology' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'general_surgery', label: 'General Surgery' },
  { value: 'plastic_surgery', label: 'Plastic Surgery' },
  { value: 'vascular_surgery', label: 'Vascular Surgery' },
  { value: 'thoracic_surgery', label: 'Thoracic Surgery' },
  { value: 'neurosurgery', label: 'Neurosurgery' },
  { value: 'emergency_medicine', label: 'Emergency Medicine' },
  { value: 'family_medicine', label: 'Family Medicine' },
  { value: 'internal_medicine', label: 'Internal Medicine' },
  { value: 'sports_medicine', label: 'Sports Medicine' },
  { value: 'infectious_disease', label: 'Infectious Disease' },
  { value: 'geriatrics', label: 'Geriatrics' },
  { value: 'allergy_immunology', label: 'Allergy & Immunology' },
  { value: 'dental', label: 'Dental' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'obstetrics', label: 'Obstetrics' },
  { value: 'occupational_medicine', label: 'Occupational Medicine' },
];

function DatePicker({ value, onChange, name = 'birthDate' }) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });

  const selectedDate = value ? new Date(value) : null;

  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startWeekday = (startOfMonth.getDay() + 6) % 7; // convert Sun=0 to Mon=0
  const days = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

  const formatIso = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const formattedDisplay = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${selectedDate.getFullYear()}`
    : 'gg.aa.yyyy';

  const [inputValue, setInputValue] = React.useState(formattedDisplay);
  const [showYearList, setShowYearList] = React.useState(false);
  const [showMonthList, setShowMonthList] = React.useState(false);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    setInputValue(formattedDisplay);
  }, [formattedDisplay]);

  // Outside click: close picker and any open lists
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
        setShowMonthList(false);
        setShowYearList(false);
      }
    };
    if (open || showMonthList || showYearList) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, showMonthList, showYearList]);

  const handleSelect = (day) => {
    const iso = formatIso(month.getFullYear(), month.getMonth(), day);
    onChange({ target: { name, value: iso } });
    setOpen(false);
  };

  const changeMonth = (delta) => {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const changeYear = (deltaYears) => {
    setMonth((prev) => new Date(prev.getFullYear() + deltaYears, prev.getMonth(), 1));
  };

  const handleInputBlur = () => {
    const raw = (inputValue || '').trim();
    if (!raw) return;

    // yyyy-mm-dd
    let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, y, mo, d] = m;
      const iso = `${y}-${mo}-${d}`;
      onChange({ target: { name, value: iso } });
      return;
    }

    // gg.aa.yyyy or gg/aa/yyyy
    m = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (m) {
      const [_, d, mo, y] = m;
      const day = parseInt(d, 10);
      const monthIdx = parseInt(mo, 10) - 1;
      const year = parseInt(y, 10);
      if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
        const iso = formatIso(year, monthIdx, day);
        onChange({ target: { name, value: iso } });
      }
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={(e) => {
          const raw = e.target.value || '';
          // Sadece rakamları al, max 8 hane (ggAaYYYY)
          const digits = raw.replace(/\D/g, '').slice(0, 8);
          let out = digits;
          if (digits.length > 2 && digits.length <= 4) {
            out = `${digits.slice(0, 2)}.${digits.slice(2)}`;
          } else if (digits.length > 4) {
            out = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
          }
          setInputValue(out);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleInputBlur}
        placeholder="gg.aa.yyyy"
        className="w-full h-11 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm bg-white border-gray-300 shadow-sm hover:shadow-md"
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl bg-white border border-gray-200 shadow-lg p-2 text-xs">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => {
                  setShowMonthList((prev) => !prev);
                  setShowYearList(false);
                }}
                className="px-1.5 py-0.5 rounded-full hover:bg-gray-100 text-gray-700 text-[11px]"
              >
                {month.toLocaleString('default', { month: 'long' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowYearList((prev) => !prev);
                  setShowMonthList(false);
                }}
                className="px-1.5 py-0.5 rounded-full hover:bg-gray-100 text-gray-700 text-[11px]"
              >
                {month.getFullYear()}
              </button>
              {(showMonthList || showYearList) && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-40 p-3 w-64 max-w-[90vw]">
                  {showMonthList && (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, idx) => {
                        const d = new Date(2000, idx, 1);
                        const lbl = d.toLocaleString('default', { month: 'short' });
                        const active = idx === month.getMonth();
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setMonth((prev) => new Date(prev.getFullYear(), idx, 1));
                              setShowMonthList(false);
                            }}
                            className={`h-8 rounded-xl text-[11px] flex items-center justify-center transition-colors border ${
                              active
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-blue-50'
                            }`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {showYearList && (
                    <div className="grid grid-cols-3 gap-2 text-[11px] mt-1">
                      {Array.from({ length: 80 }).map((_, idx) => {
                        const y = new Date().getFullYear() - idx;
                        const active = y === month.getFullYear();
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => {
                              setMonth((prev) => new Date(y, prev.getMonth(), 1));
                              setShowYearList(false);
                            }}
                            className={`h-8 rounded-xl px-2 text-center transition-colors border ${
                              active
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-blue-50'
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-gray-500">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px]">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === month.getFullYear() &&
                selectedDate.getMonth() === month.getMonth() &&
                selectedDate.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`h-7 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'text-gray-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecialtySelect({ value, onChange, error }) {
  const [open, setOpen] = React.useState(false);

  const selected = SPECIALTIES.find((opt) => opt.value === value) || SPECIALTIES[0];

  const handleSelect = (val) => {
    onChange({ target: { name: 'specialty', value: val } });
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-11 px-3 border rounded-xl text-left text-sm bg-white flex items-center justify-between shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <span className="flex items-center gap-2 truncate text-gray-700">
          <Stethoscope className="w-4 h-4 text-gray-400" />
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
          {SPECIALTIES.map((opt) => (
            <button
              key={opt.value || 'empty'}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between ${
                opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && (
                <span className="text-xs text-blue-600">Selected</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegisterStep2({
  fd,
  errors,
  role,
  allCountries,
  handleInputChange,
  setShowTermsPopup,
  setShowPrivacyPopup,
  handleBack,
  submitting,
}) {
  return (
    <>
      <div className="w-full max-w-md flex justify-start mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 sm:py-2 px-5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          Back
        </button>
      </div>
      <div className="grid grid-cols-1 gap-1 sm:gap-2 w-full max-w-md">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-left md:text-left">
            Country
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-20" />
            <CountryCombobox
              options={allCountries}
              value={fd.country ?? ''}
              onChange={(val) => {
                handleInputChange({ target: { name: 'country', value: val } });
              }}
              placeholder="Select a country"
              triggerClassName="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm bg-white text-left flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow"
              getFlagUrl={(name) => {
                try {
                  const code = getFlagCode(name);
                  return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                } catch {
                  return null;
                }
              }}
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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-left md:text-left">Phone</label>
          <PhoneNumberInput
            value={fd.phone ?? ''}
            countryName={fd.country ?? ''}
            onChange={(val) => handleInputChange({ target: { name: 'phone', value: val } })}
            allowedCountryNames={allCountries}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.phone}</p>
          )}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-left md:text-left">
            Date of Birth
          </label>
          <DatePicker
            value={fd.birthDate ?? ''}
            onChange={handleInputChange}
            name="birthDate"
          />
        </div>
        {role === 'doctor' && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-left md:text-left">
              Specialty
            </label>
            <SpecialtySelect
              value={fd.specialty ?? ''}
              onChange={handleInputChange}
              error={errors.specialty}
            />
            {errors.specialty && (
              <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.specialty}</p>
            )}
          </div>
        )}
        {role === 'patient' && (
          <div className="mt-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 text-left md:text-left">
              Medical history (chronic diseases, allergies, medications)
            </label>
            <textarea
              name="medicalHistory"
              value={fd.medicalHistory ?? ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full h-20 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              placeholder="Optional: e.g., Diabetes Type 2, Penicillin allergy, Hypertension, etc."
            />
          </div>
        )}
      </div>

      <div className="space-y-1 sm:space-y-1.5 w-full max-w-md mt-1.5 sm:mt-2 pt-0.5 pb-0">
        <div>
          <label className="flex items-start space-x-2 sm:space-x-3 justify-center md:justify-start">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={!!fd.acceptTerms}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <span className="text-sm text-gray-600 text-center md:text-left leading-relaxed">
              <span className="text-red-500">*</span>{' '}
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsPopup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Terms of Use
              </button>{' '}
              and{' '}
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
          {errors.acceptTerms && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.acceptTerms}</p>
          )}
        </div>
        <label className="flex items-start space-x-2 sm:space-x-3 justify-center md:justify-start">
          <input
            type="checkbox"
            name="receiveUpdates"
            checked={!!fd.receiveUpdates}
            onChange={handleInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 transform scale-[1.3]"
          />
          <span className="text-sm text-gray-600 text-center md:text-left leading-relaxed">
            I would like to receive emails about health tips, new services, and special offers.
          </span>
        </label>
      </div>

      <div className="w-full max-w-md flex items-center justify-end gap-2 mt-2 mb-2 sm:mb-3">
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex items-center gap-2 py-2 sm:py-2.5 px-5 rounded-xl focus:ring-4 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md ${submitting ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-200'}`}
        >
          {submitting ? 'Creating…' : 'Create Account'}
        </button>
      </div>
    </>
  );
}
