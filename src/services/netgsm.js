/**
 * NETGSM OTP SMS Service
 * 
 * This module handles phone verification via NETGSM API.
 * In production, OTP generation and verification MUST happen server-side (Laravel).
 * The front-end only triggers send/verify requests to the backend API.
 * 
 * Backend endpoints expected:
 *   POST /api/auth/send-otp   { phone }           → { success, message, expires_in }
 *   POST /api/auth/verify-otp { phone, otp_code }  → { success, verified, token? }
 * 
 * NETGSM API docs: https://www.netgsm.com.tr/dokuman/
 * NETGSM OTP SMS endpoint: https://api.netgsm.com.tr/sms/send/otp
 */

const API_BASE = process.env.REACT_APP_API_BASE || '';
const SEND_OTP_URL = process.env.REACT_APP_API_SEND_OTP || '/api/auth/send-otp';
const VERIFY_OTP_URL = process.env.REACT_APP_API_VERIFY_OTP || '/api/auth/verify-otp';

/**
 * Send OTP to a phone number via backend → NETGSM
 * @param {string} phone - Phone number in international format (e.g. +905321234567)
 * @returns {Promise<{success: boolean, message: string, expires_in?: number}>}
 */
export async function sendOTP(phone) {
  // --- DEMO MODE: simulate OTP send when no backend ---
  if (!API_BASE) {
    console.log('[NETGSM Demo] OTP sent to', phone);
    return new Promise((resolve) =>
      setTimeout(() => resolve({
        success: true,
        message: 'Verification code sent. (Demo mode — use code 123456)',
        expires_in: 120,
      }), 800)
    );
  }

  const res = await fetch(API_BASE + SEND_OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone: normalizePhone(phone) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to send OTP');
  }

  return res.json();
}

/**
 * Verify OTP code entered by user
 * @param {string} phone
 * @param {string} otpCode - 6-digit code
 * @returns {Promise<{success: boolean, verified: boolean, token?: string}>}
 */
export async function verifyOTP(phone, otpCode) {
  // --- DEMO MODE ---
  if (!API_BASE) {
    console.log('[NETGSM Demo] Verifying OTP for', phone, '→', otpCode);
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        if (otpCode === '123456') {
          resolve({ success: true, verified: true, message: 'Phone verified successfully.' });
        } else {
          reject(new Error('Invalid verification code. (Demo: use 123456)'));
        }
      }, 600)
    );
  }

  const res = await fetch(API_BASE + VERIFY_OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone: normalizePhone(phone), otp_code: otpCode }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Verification failed');
  }

  return res.json();
}

/**
 * Normalize phone to E.164 format for Turkey
 * Strips spaces, dashes, parens. Adds +90 if missing.
 */
export function normalizePhone(phone) {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) cleaned = '+90' + cleaned.slice(1);
  else if (cleaned.startsWith('90') && !cleaned.startsWith('+')) cleaned = '+' + cleaned;
  else if (!cleaned.startsWith('+')) cleaned = '+90' + cleaned;
  return cleaned;
}

/**
 * Basic Turkish phone validation
 */
export function isValidTurkishPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^\+90[5][0-9]{9}$/.test(normalized);
}
