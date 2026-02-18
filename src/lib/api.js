import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8001/api';

// ── Axios Instance ──
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000,
});

// ── Request Interceptor — attach JWT token ──
api.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('auth_state');
    if (saved) {
      const { token } = JSON.parse(saved);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// ── Response Interceptor — normalize errors ──
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Auto-logout on 401 only for auth-critical endpoints (login, me, etc.)
    // Don't logout for regular API calls (medstream, appointments, etc.) — just fail silently
    if (status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/me');
      if (isAuthEndpoint) {
        localStorage.removeItem('auth_state');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }

    return Promise.reject({
      status,
      data,
      message: data?.message || data?.error || error.message || `HTTP ${status}`,
      errors: data?.errors || {},
    });
  }
);

// ── Auth Service ──
export const authAPI = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (payload) => api.put('/auth/profile', payload),
  verifyEmail: (code) => api.post('/auth/verify-email', { code }),
  resendVerification: () => api.post('/auth/resend-verification'),
  verifyMobile: (code) => api.post('/auth/verify-mobile', { code }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

// ── Clinic Service ──
export const clinicAPI = {
  list: (params) => api.get('/clinics', { params }),
  getByCodename: (codename) => api.get(`/clinics/${codename}`),
  create: (payload) => api.post('/clinics', payload),
  update: (id, payload) => api.put(`/clinics/${id}`, payload),
  staff: (id, params) => api.get(`/clinics/${id}/staff`, { params }),
};

// ── Doctor Service ──
export const doctorAPI = {
  list: (params) => api.get('/doctors', { params }),
  get: (id) => api.get(`/doctors/${id}`),
};

// ── Appointment Service ──
export const appointmentAPI = {
  list: (params) => api.get('/appointments', { params }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (payload) => api.post('/appointments', payload),
  update: (id, payload) => api.put(`/appointments/${id}`, payload),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// ── Calendar Slot Service ──
export const calendarSlotAPI = {
  list: (params) => api.get('/calendar-slots', { params }),
  create: (payload) => api.post('/calendar-slots', payload),
  bulkCreate: (payload) => api.post('/calendar-slots/bulk', payload),
  update: (id, payload) => api.put(`/calendar-slots/${id}`, payload),
  delete: (id) => api.delete(`/calendar-slots/${id}`),
};

// ── Patient Record Service ──
export const patientRecordAPI = {
  list: (params) => api.get('/patient-records', { params }),
  get: (id) => api.get(`/patient-records/${id}`),
  create: (payload) => api.post('/patient-records', payload),
  delete: (id) => api.delete(`/patient-records/${id}`),
};

// ── Digital Anamnesis Service ──
export const anamnesisAPI = {
  get: (patientId) => api.get(`/anamnesis/${patientId}`),
  upsert: (payload) => api.post('/anamnesis', payload),
};

// ── CRM Service (Tags, Stages, Archives) ──
export const crmAPI = {
  tags: (params) => api.get('/crm/tags', { params }),
  createTag: (payload) => api.post('/crm/tags', payload),
  deleteTag: (id) => api.delete(`/crm/tags/${id}`),
  stages: (params) => api.get('/crm/stages', { params }),
  createStage: (payload) => api.post('/crm/stages', payload),
  updateStage: (id, payload) => api.put(`/crm/stages/${id}`, payload),
  archivedRecords: (params) => api.get('/crm/archived-records', { params }),
  createArchivedRecord: (payload) => api.post('/crm/archived-records', payload),
};

// ── MedStream Service ──
export const medStreamAPI = {
  posts: (params) => api.get('/medstream/posts', { params }),
  getPost: (id) => api.get(`/medstream/posts/${id}`),
  createPost: (payload) => api.post('/medstream/posts', payload),
  updatePost: (id, payload) => api.put(`/medstream/posts/${id}`, payload),
  deletePost: (id) => api.delete(`/medstream/posts/${id}`),
  comments: (postId, params) => api.get(`/medstream/posts/${postId}/comments`, { params }),
  createComment: (postId, payload) => api.post(`/medstream/posts/${postId}/comments`, payload),
  toggleLike: (postId) => api.post(`/medstream/posts/${postId}/like`),
  reportPost: (postId, reason) => api.post(`/medstream/posts/${postId}/report`, { reason }),
  bookmarks: (params) => api.get('/medstream/bookmarks', { params }),
  toggleBookmark: (payload) => api.post('/medstream/bookmarks', payload),
  reports: (params) => api.get('/medstream/reports', { params }),
  updateReport: (id, payload) => api.put(`/medstream/reports/${id}`, payload),
};

// ── Catalog Service (Public) ──
export const catalogAPI = {
  specialties: (params) => api.get('/catalog/specialties', { params }),
  cities: (params) => api.get('/catalog/cities', { params }),
  diseases: (params) => api.get('/catalog/diseases', { params }),
  symptoms: (params) => api.get('/catalog/symptoms', { params }),
  createSpecialty: (payload) => api.post('/catalog/specialties', payload),
  updateSpecialty: (id, payload) => api.put(`/catalog/specialties/${id}`, payload),
  deleteSpecialty: (id) => api.delete(`/catalog/specialties/${id}`),
  createCity: (payload) => api.post('/catalog/cities', payload),
  updateCity: (id, payload) => api.put(`/catalog/cities/${id}`, payload),
  deleteCity: (id) => api.delete(`/catalog/cities/${id}`),
  createDisease: (payload) => api.post('/catalog/diseases', payload),
  updateDisease: (id, payload) => api.put(`/catalog/diseases/${id}`, payload),
  createSymptom: (payload) => api.post('/catalog/symptoms', payload),
  updateSymptom: (id, payload) => api.put(`/catalog/symptoms/${id}`, payload),
};

// ── Legacy compat (for existing code that imports { endpoints }) ──
export const endpoints = {
  login: (payload) => authAPI.login(payload),
  userRegister: (payload) => authAPI.register({ ...payload, role_id: 'patient' }),
  doctorRegister: (payload) => authAPI.register({ ...payload, role_id: 'doctor' }),
};

export default api;
