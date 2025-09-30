// Lightweight JSON API client for MedGama
const BASE_URL = 'https://medgama.soulm8.co/api';

export async function api(path, options = {}) {
  const { method = 'GET', body, token } = options;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

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
  register: (payload) => api('/auth/register', { method: 'POST', body: payload }),
};
