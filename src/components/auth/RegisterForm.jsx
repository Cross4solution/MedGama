// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Stethoscope,
  Calendar,
  MapPin,
  Chrome,
  Facebook,
  Smartphone
} from 'lucide-react';
import PhoneNumberInput from '../forms/PhoneNumberInput';
import { listCountriesAll, getFlagCode } from '../../utils/geo';
import CountryCombobox from '../forms/CountryCombobox';
import MedicalHistoryTags from './MedicalHistoryTags';
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
 * @param {boolean} [props.submitting]
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
  submitting = false,
}) => {
  // Multi-step state
  const [step, setStep] = useState(1); // 1 -> basic, 2 -> details
  const [localErrors, setLocalErrors] = useState({});
  const dobRef = useRef(null);
  /** @type {any} */
  const fd = (formData || {});
  
  // Global country options (loaded async)
  const [allCountries, setAllCountries] = useState([]);
  useEffect(() => {
    listCountriesAll({ excludeIslands: false, excludeNoCities: false }).then(setAllCountries);
  }, []);

  const validateStep1 = () => {
    setLocalErrors({});
    return true;
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
         <div className="text-center mb-1">
           <div className="flex items-center justify-center gap-2 sm:gap-3 mb-0.5">
             <img src="/images/logo/crm-logo.jpg" alt="MedGama" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
             <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">MedGama</span>
           </div>
           <h1 className="text-lg font-bold text-gray-900 mb-0.5">Create an Account</h1>
           <p className="text-xs text-gray-500">Sign up to start your health journey</p>
         </div>
         <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 flex flex-col items-center">
           {step === 1 && (
           <>
           <div className="w-full max-w-md mb-2">
             <label className="block text-xs font-medium text-gray-500 mb-2 text-left">Register as</label>
             <div className="inline-flex w-full rounded-xl bg-gray-100 p-1 gap-1">
               {[
                 { key: 'patient', label: 'Patient', Icon: User },
                 { key: 'doctor', label: 'Doctor', Icon: Stethoscope },
               ].map((opt) => {
                 const isActive = (fd.role ?? 'patient') === opt.key;
                 return (
                   <button
                     key={opt.key}
                     type="button"
                     onClick={() => handleInputChange({ target: { name: 'role', value: opt.key } })}
                     className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                       isActive
                         ? 'bg-teal-600 text-white shadow-md'
                         : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800'
                     }`}
                   >
                     <opt.Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
                     <span>{opt.label}</span>
                   </button>
                 );
               })}
             </div>
           </div>
            <div className="grid grid-cols-1 gap-1 w-full max-w-md">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left md:text-left">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="firstName"
              value={fd.firstName ?? ''}
              onChange={handleInputChange}
              className={`w-full h-10 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                (errors.firstName || localErrors.firstName) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your first name"
            />
          </div>
          {(errors.firstName || localErrors.firstName) && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.firstName || localErrors.firstName}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left md:text-left">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="lastName"
              value={fd.lastName ?? ''}
              onChange={handleInputChange}
              className={`w-full h-10 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                (errors.lastName || localErrors.lastName) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your last name"
            />
          </div>
          {(errors.lastName || localErrors.lastName) && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.lastName || localErrors.lastName}</p>}
        </div>
      </div>
             <div className="grid grid-cols-1 gap-1 w-full max-w-2xl mb-2 sm:mb-3">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left md:text-left">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={fd.email ?? ''}
              onChange={handleInputChange}
              className={`w-full h-10 pl-9 pr-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                (errors.email || localErrors.email) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="name@example.com"
            />
          </div>
          {(errors.email || localErrors.email) && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.email || localErrors.email}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left md:text-left">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={fd.password ?? ''}
              onChange={handleInputChange}
              className={`w-full h-10 pl-9 pr-10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.password}</p>}
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left md:text-left">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={fd.confirmPassword ?? ''}
              onChange={handleInputChange}
              className={`w-full h-10 pl-9 pr-10 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left text-sm ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.confirmPassword}</p>}
        </div>
        
          </div>
            {/* Step 1 Actions */}
            <div className="w-full max-w-md flex items-center justify-end mt-3 sm:mt-4">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 sm:py-2 px-5 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md mt-2 sm:mt-3"
              >
                Next
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>

      </>
      )}
      {step === 2 && (
        <>
        <div className="grid grid-cols-1 gap-2.5 w-full max-w-md">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
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
                  triggerClassName="w-full h-11 border border-gray-300 rounded-xl pl-10 pr-3 text-sm bg-white text-left flex items-center gap-2 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  getFlagUrl={(name) => {
                    try {
                      const code = getFlagCode(name);
                      return code ? `https://flagcdn.com/24x18/${code}.png` : null;
                    } catch { return null; }
                  }}
                />
            </div>
            {errors.country && (
              <p className="text-red-500 text-xs mt-1.5 text-left">{errors.country}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Phone Number</label>
            <PhoneNumberInput
              value={fd.phone ?? ''}
              countryName={fd.country ?? ''}
              onChange={(val) => handleInputChange({ target: { name: 'phone', value: val } })}
              allowedCountryNames={allCountries}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1.5 text-left">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
              Date of Birth
            </label>
            <div
              className="relative date-with-icon cursor-pointer"
              onClick={() => dobRef.current?.showPicker?.()}
            >
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={dobRef}
                type="date"
                name="birthDate"
                value={fd.birthDate ?? ''}
                onChange={handleInputChange}
                className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-xl hover:border-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-left text-sm bg-white"
              />
            </div>
          </div>
          {(fd.role ?? 'patient') === 'patient' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 text-left">
                Medical History <span className="font-normal text-gray-400">(chronic diseases, allergies, medications)</span>
              </label>
              <MedicalHistoryTags
                value={fd.medicalHistory ?? ''}
                onChange={(val) => handleInputChange({ target: { name: 'medicalHistory', value: val } })}
              />
            </div>
          )}
        </div>

        <div className="w-full max-w-md mt-3 pt-3 border-t border-gray-100 space-y-2.5">
          {/* Terms of Use — required */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={!!fd.acceptTerms}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-gray-600 text-left leading-relaxed">
              <span className="text-red-500">*</span>{' '}
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTermsPopup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Terms of Use
              </button>
            </span>
          </label>
          {errors.acceptTerms && <p className="text-red-500 text-xs ml-7 text-left">{errors.acceptTerms}</p>}

          {/* Privacy Policy — required (GDPR Art. 7) */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="acceptPrivacy"
              checked={!!fd.acceptPrivacy}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-gray-600 text-left leading-relaxed">
              <span className="text-red-500">*</span>{' '}
              I have read and consent to the processing of my personal data as described in the{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyPopup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>
          {errors.acceptPrivacy && <p className="text-red-500 text-xs ml-7 text-left">{errors.acceptPrivacy}</p>}

          {/* Health Data Consent — optional, for patients (GDPR Art. 9) */}
          {(fd.role ?? 'patient') === 'patient' && (
            <>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="acceptHealthData"
                  checked={!!fd.acceptHealthData}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-gray-500 text-left leading-relaxed">
                  I explicitly consent to the processing of my health data (medical history, conditions, allergies) for care coordination purposes. <span className="text-gray-400 text-xs">(Optional — GDPR Art. 9)</span>
                </span>
              </label>
            </>
          )}

          {/* Marketing opt-in — optional, unbundled (GDPR Art. 7) */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="receiveUpdates"
              checked={!!fd.receiveUpdates}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-gray-500 text-left leading-relaxed">
              I would like to receive emails about health tips, new services, and special offers. <span className="text-gray-400 text-xs">(Optional — you can unsubscribe at any time)</span>
            </span>
          </label>
        </div>

        <div className="w-full max-w-md flex items-center justify-between gap-3 mt-4 mb-2">
          <button onClick={handleBack} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center gap-2 py-2.5 px-6 rounded-xl focus:ring-4 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md ${submitting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-200'}`}
          >
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </div>
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
