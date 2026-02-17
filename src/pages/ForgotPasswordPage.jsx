import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { Mail, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Steps: 1 = enter email, 2 = enter code, 3 = new password, 4 = success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = React.useRef([]);

  // Cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Step 1: Send reset code
  const handleSendCode = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err?.errors?.email?.[0] || err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Code input handlers
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerifyCode();
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setStep(3);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
    } catch (err) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword({ email, code: code.join(''), password });
      setStep(4);
    } catch (err) {
      const msg = err?.errors?.code?.[0] || err?.errors?.password?.[0] || err?.message || 'Something went wrong.';
      // If code expired or invalid, go back to code step
      if (err?.errors?.code) setStep(2);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h1>
          <p className="text-sm text-gray-500 mb-6">Your password has been successfully changed.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          {step === 1 && <Mail className="w-8 h-8 text-indigo-600" />}
          {step === 2 && <KeyRound className="w-8 h-8 text-indigo-600" />}
          {step === 3 && <KeyRound className="w-8 h-8 text-indigo-600" />}
        </div>

        {/* Step 1: Enter email */}
        {step === 1 && (
          <>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Forgot your password?</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Enter your email and we'll send you a 6-digit reset code.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs text-center mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={handleSendCode}
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="text-center mt-5">
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          </>
        )}

        {/* Step 2: Enter code */}
        {step === 2 && (
          <>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Enter reset code</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              We sent a 6-digit code to <span className="font-medium text-gray-700">{maskedEmail}</span>
            </p>

            <div className="flex justify-center gap-2.5 mb-5" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className={`w-11 h-13 text-center text-lg font-bold border-2 rounded-xl transition-all outline-none ${
                    error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                    digit ? 'border-indigo-400 bg-indigo-50/50' :
                    'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
                  } focus:ring-2`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-xs text-center mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={handleVerifyCode}
              disabled={code.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center mt-5">
              <p className="text-xs text-gray-400 mb-1">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="text-center mt-3">
              <button onClick={() => { setStep(1); setError(''); }} className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Change email
              </button>
            </div>
          </>
        )}

        {/* Step 3: New password */}
        {step === 3 && (
          <>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Set new password</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Choose a strong password for your account.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    className="w-full h-11 pl-10 pr-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                    placeholder="Repeat your password"
                    className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="mb-4">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        password.length >= level * 3
                          ? level <= 1 ? 'bg-red-400' : level <= 2 ? 'bg-orange-400' : level <= 3 ? 'bg-yellow-400' : 'bg-emerald-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {password.length < 6 ? 'Too short' : password.length < 8 ? 'Fair' : password.length < 12 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}

            {error && <p className="text-red-500 text-xs text-center mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={handleResetPassword}
              disabled={loading || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="text-center mt-4">
              <button onClick={() => { setStep(2); setError(''); }} className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
