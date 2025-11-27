// @ts-nocheck
import React from 'react';
import { User, Stethoscope, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function RegisterStep1({
  fd,
  errors,
  localErrors,
  role,
  handleInputChange,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleNext,
}) {
  return (
    <>
      <div className="w-full max-w-md mb-1 sm:mb-1.5">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left md:text-left">Register as</label>
        <div className="w-full flex justify-center pl-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'patient', label: 'Patient' },
              { key: 'doctor', label: 'Doctor' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleInputChange({ target: { name: 'role', value: opt.key } })}
                className={`${role === opt.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'} inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[120px]`}
              >
                {opt.key === 'patient' ? (
                  <User className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Stethoscope className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
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
          {(errors.firstName || localErrors.firstName) && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.firstName || localErrors.firstName}</p>
          )}
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
          {(errors.lastName || localErrors.lastName) && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.lastName || localErrors.lastName}</p>
          )}
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
          {(errors.email || localErrors.email) && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.email || localErrors.email}</p>
          )}
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
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.password}</p>
          )}
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
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 text-center md:text-left">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

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
  );
}
