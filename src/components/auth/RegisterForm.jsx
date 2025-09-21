// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Calendar,
  MapPin,
  Chrome,
  Facebook,
  Smartphone
} from 'lucide-react';
import PhoneNumberInput from '../forms/PhoneNumberInput';
import { listCountriesAll, getFlagCode } from '../../utils/geo';
import CountryCombobox from '../forms/CountryCombobox';
// getFlagCode imported above with listCountriesAll

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
  const dobRef = useRef(null);
  /** @type {any} */
  const fd = (formData || {});
  
  // Global country options (island nations excluded per requirement)
  const allCountries = useMemo(() => listCountriesAll({ excludeIslands: true, excludeNoCities: true }), []);

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // phone helpers removed (now inside PhoneNumberInput)

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  const validateStep1 = () => {
    const le = {};
    if (!String(fd.firstName || '').trim()) le.firstName = 'First name is required';
    if (!String(fd.lastName || '').trim()) le.lastName = 'Last name is required';
    if (!String(fd.email || '').trim()) le.email = 'Email is required';
    if (!String(fd.phone || '').trim()) le.phone = 'Phone is required';
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
             <div className="grid grid-cols-1 gap-1 sm:gap-2 w-full max-w-2xl mb-6 sm:mb-8">
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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-center md:text-left">Phone</label>
          <PhoneNumberInput
            value={fd.phone ?? ''}
            countryName={fd.country ?? ''}
            onChange={(val) => handleInputChange({ target: { name: 'phone', value: val } })}
            allowedCountryNames={allCountries}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.phone}</p>}
        </div>
      </div>
            {/* Step 1 Actions */}
            <div className="w-full max-w-md flex items-center justify-end mt-8 sm:mt-10">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 bg-blue-600 text-white py-2.5 sm:py-3 px-6 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md mt-4 sm:mt-6"
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
                  options={allCountries}
                  value={fd.country ?? ''}
                  onChange={(val) => {
                    // Update selected country; PhoneNumberInput will sync code via countryName prop
                    handleInputChange({ target: { name: 'country', value: val } });
                  }}
                  placeholder="Select a country"
                  triggerClassName="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm bg-white text-left flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                  getFlagUrl={(name) => {
                    try {
                      const code = getFlagCode(name);
                      return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                    } catch { return null; }
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

        <div className="w-full max-w-md flex items-center justify-between gap-2 mt-2 mb-12 sm:mb-16">
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
        {/* Spacer to force visible gap before the login link */}
        <div aria-hidden className="h-10 sm:h-14" />
        </>
      )}
      <p className="mt-0 text-center text-sm sm:text-base text-gray-600">
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