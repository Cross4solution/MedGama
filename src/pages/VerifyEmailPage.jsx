import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../lib/api';
import { Mail, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if already verified or not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    } else if (user.email_verified) {
      navigate('/home-v2', { replace: true });
    }
  }, [user, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.verifyEmail(fullCode);
      setSuccess(true);
      // Update user in context
      if (res?.user && setUser) {
        setUser({ ...user, ...res.user, email_verified: true });
      }
      setTimeout(() => navigate('/home-v2', { replace: true }), 1500);
    } catch (err) {
      setError(err?.errors?.code?.[0] || err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await authAPI.resendVerification();
      setResendCooldown(60);
    } catch (err) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-teal-600" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Verify your email</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          We sent a 6-digit code to <span className="font-medium text-gray-700">{maskedEmail}</span>
        </p>

        {/* Code inputs */}
        <div className="flex justify-center gap-2.5 mb-5" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-11 h-13 text-center text-lg font-bold border-2 rounded-xl transition-all outline-none ${
                error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                digit ? 'border-teal-400 bg-teal-50/50' :
                'border-gray-200 focus:border-teal-500 focus:ring-teal-200'
              } focus:ring-2`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs text-center mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Verify Email
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend */}
        <div className="text-center mt-5">
          <p className="text-xs text-gray-400 mb-1">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
