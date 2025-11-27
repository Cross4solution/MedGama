// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
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
// getFlagCode imported above with listCountriesAll
import RegisterStep1 from './RegisterStep1';
import RegisterStep2 from './RegisterStep2';

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

function useRegisterFormState(formData) {
  /** @type {any} */
  const fd = (formData || {});
  const role = fd.role ?? 'patient';
  const allCountries = useMemo(() => listCountriesAll({ excludeIslands: false, excludeNoCities: false }), []);
  return { fd, role, allCountries };
}

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
  const { fd, role, allCountries } = useRegisterFormState(formData);

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // phone helpers removed (now inside PhoneNumberInput)

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

  // Phone logic moved to PhoneNumberInput

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
  const renderStep1 = () => (
    <RegisterStep1
      fd={fd}
      errors={errors}
      localErrors={localErrors}
      role={role}
      handleInputChange={handleInputChange}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      handleNext={handleNext}
    />
  );

  const renderStep2 = () => (
    <RegisterStep2
      fd={fd}
      errors={errors}
      role={role}
      allCountries={allCountries}
      handleInputChange={handleInputChange}
      setShowTermsPopup={setShowTermsPopup}
      setShowPrivacyPopup={setShowPrivacyPopup}
      handleBack={handleBack}
      submitting={submitting}
    />
  );

  return (
  <div className="w-full max-w-md mx-auto">
         <div className="text-center mb-1.5 sm:mb-2 md:mb-2">
           <div className="flex items-center justify-center mb-1 sm:mb-2">
             <div className="h-9 sm:h-11 flex items-end">
               <img
                 src="/images/logo/crm-logo.jpg"
                 alt="MedGama"
                 className="h-full w-auto object-contain transform scale-[2.7] translate-y-[10px]"
               />
             </div>
           </div>
           <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Create an Account</h1>
       <p className="text-xs sm:text-sm text-gray-600">Sign up to start your health journey</p>
         </div>
         <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-1 md:space-y-1 flex flex-col items-center">
           {step === 1 && renderStep1()}
           {step === 2 && renderStep2()}
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
