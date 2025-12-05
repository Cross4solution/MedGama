// Lightweight JSON API client for MedGama

import { logger } from "utils/logger";

const BASE_URL = 'https://medgama.soulm8.co/api';

export async function api(path, options = {}) {
  const { method = 'GET', body } = options;
  let { token } = options;
  if (!token) {
    try {
      const saved = localStorage.getItem('auth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        token = parsed?.token || null;
      }
      if (!token) {
        const lsToken = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
        if (lsToken) token = lsToken;
      }
    } catch (error) {
      logger.error('Error fetching token from localStorage', error);
    }
  }
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  logger.info(`${method} ${BASE_URL}${path}`);
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    throw {
      status: res.status,
      data,
      message: (data && (data.message || data.error)) || `HTTP ${res.status}`,
    };
  }
  return data;
}

export const endpoints = {
  login: (payload) => api('/auth/login', { method: 'POST', body: payload }),
  userRegister: (payload) => api('/auth/register/user', { method: 'POST', body: payload }),
  doctorRegister: (payload) => api('/auth/register/doctor', { method: 'POST', body: payload }),
  updateProfile: (payload) => api('/authorized/doctor/profile', { method: 'PUT', body: payload }),
  me: (options = {}) => api('/authorized/doctor/profile', { method: 'GET', ...options }),
  doctorNotifications: (options = {}) => api('/authorized/doctor/notification', { method: 'GET', ...options }),
  doctorNotificationsMarkAllRead: (options = {}) => api('/authorized/doctor/notification/makeread', { method: 'GET', ...options }),
};
