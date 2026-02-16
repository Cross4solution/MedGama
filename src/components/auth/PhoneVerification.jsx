import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, Shield, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { sendOTP, verifyOTP, isValidTurkishPhone, normalizePhone } from '../../services/netgsm';
import { useTranslation } from 'react-i18next';

/**
 * PhoneVerification — reusable OTP component for Doctor & Clinic login flows.
 *
 * Props:
 *   onVerified(phone)  — called when OTP is successfully verified
 *   onSkip()           — optional, called if user skips (demo mode)
 *   className          — optional wrapper class
 *   title              — optional heading override
 */
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 120; // seconds

const PhoneVerification = ({ onVerified, onSkip, className = '', title }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState('phone'); // phone | otp | verified
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ─── Send OTP ──────────────────────────────────────────────
  const handleSendOTP = useCallback(async () => {
    setError('');
    if (!isValidTurkishPhone(phone)) {
      setError('Please enter a valid Turkish mobile number (05XX XXX XXXX)');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) {
        setStep('otp');
        setCountdown(result.expires_in || RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // ─── Verify OTP ────────────────────────────────────────────
  const handleVerifyOTP = useCallback(async (code) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await verifyOTP(phone, otpCode);
      if (result.success && result.verified) {
        setStep('verified');
        setTimeout(() => onVerified?.(normalizePhone(phone)), 600);
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, onVerified]);

  // ─── OTP Input Handlers ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      handleVerifyOTP(pasted);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) {
        setCountdown(result.expires_in || RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Step: Phone Input */}
      {step === 'phone' && (
        <>
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{title || t('auth.phoneVerification')}</h3>
            <p className="text-xs text-gray-500 mt-1">{t('auth.enterMobileNumber')}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('auth.mobileNumber')}</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 h-10 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-600 flex-shrink-0">
                <img src="https://flagcdn.com/24x18/tr.png" alt="TR" className="w-5 h-3.5 object-cover rounded-sm" />
                +90
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                className="flex-1 h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="5XX XXX XX XX"
                maxLength={15}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleSendOTP}
            disabled={loading || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? t('auth.sending') : t('auth.sendVerificationCode')}
          </button>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            {t('auth.smsNotice')}
          </p>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
            >
              {t('auth.skipForNow')}
            </button>
          )}
        </>
      )}

      {/* Step: OTP Input */}
      {step === 'otp' && (
        <>
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{t('auth.enterVerificationCode')}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {t('auth.weSentCode')} <strong className="text-gray-700">{normalizePhone(phone)}</strong>
            </p>
          </div>

          {/* OTP Boxes */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 rounded-xl transition-all outline-none ${
                  digit
                    ? 'border-teal-400 bg-teal-50/50 text-teal-700'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={() => handleVerifyOTP()}
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? t('auth.verifying') : t('auth.verifyCode')}
          </button>

          {/* Resend & Timer */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('auth.changeNumber')}
            </button>
            {countdown > 0 ? (
              <span className="text-gray-400">{t('auth.resendIn')} <strong className="text-gray-600">{formatCountdown(countdown)}</strong></span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> {t('auth.resendCode')}
              </button>
            )}
          </div>
        </>
      )}

      {/* Step: Verified */}
      {step === 'verified' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 ring-4 ring-emerald-100">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{t('auth.phoneVerified')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('auth.phoneVerifiedDesc')}</p>
          <p className="text-sm font-semibold text-emerald-600 mt-2">{normalizePhone(phone)}</p>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
