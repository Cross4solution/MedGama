import axios from 'axios';

const PRODUCTION_API_BASE = 'https://medgama-production.up.railway.app/api';

const FALLBACK_API_BASE = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost) return PRODUCTION_API_BASE;
  }
  return 'http://127.0.0.1:8001/api';
})();

const BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost) return PRODUCTION_API_BASE;
  }
  return (process.env.REACT_APP_API_BASE || FALLBACK_API_BASE).replace(/\/+$/, '');
})();

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
    let token = null;
    if (saved) {
      const parsed = JSON.parse(saved);
      token = parsed?.token || null;
    }
    if (!token) {
      token = localStorage.getItem('access_token') || localStorage.getItem('google_access_token');
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// ── Response Interceptor — normalize errors ──
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = data?.code || null; // Backend error code: FORBIDDEN, VALIDATION_ERROR, etc.

    // Auto-logout on 401 for any endpoint except login/register (token expired or invalid)
    if (status === 401) {
      const url = error.config?.url || '';
      const isLoginOrRegister = url.includes('/login') || url.includes('/register');
      if (!isLoginOrRegister) {
        try { localStorage.removeItem('auth_state'); } catch {}
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }

    // Human-readable Turkish messages for common status codes
    let message;
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        message = 'İstek zaman aşımına uğradı. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
      } else {
        message = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }
    } else {
      // Try to use backend message first, then provide Turkish fallback
      const rawMsg = data?.message || data?.error || '';
      if (status === 401) {
        message = rawMsg || 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
      } else if (status === 403) {
        message = 'Bu işlemi gerçekleştirme yetkiniz bulunmuyor.';
      } else if (status === 422 && data?.errors) {
        const firstField = Object.keys(data.errors)[0];
        const firstErr = data.errors[firstField];
        message = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
      } else if (status === 422) {
        message = rawMsg || 'Girdiğiniz bilgilerde hata var. Lütfen kontrol edin.';
      } else if (status === 404) {
        message = 'Aradığınız kayıt bulunamadı.';
      } else if (status === 429) {
        message = 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.';
      } else if (status >= 500) {
        message = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      } else {
        message = rawMsg || `Bir hata oluştu (${status})`;
      }
    }

    return Promise.reject({
      status: status || 0,
      code,
      data,
      message,
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
  // Avatar upload (multipart/form-data)
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.post('/auth/profile/avatar', fd, { headers: { 'Content-Type': undefined } });
  },
  // Password change with current_password verification
  changePassword: (payload) => api.put('/auth/profile/password', payload),
  // Medical history
  getMedicalHistory: () => api.get('/auth/profile/medical-history'),
  updateMedicalHistory: (payload) => api.put('/auth/profile/medical-history', payload),
  // Notification preferences
  getNotificationPrefs: () => api.get('/auth/profile/notification-preferences'),
  updateNotificationPrefs: (payload) => api.put('/auth/profile/notification-preferences', payload),
  // GDPR data export (Art. 20)
  dataExport: () => api.get('/auth/profile/data-export'),
  // Account deletion
  deleteAccount: (payload) => api.delete('/auth/profile', { data: payload }),
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
  createStaff: (id, payload) => api.post(`/clinics/${id}/staff`, payload),
};

// ── Doctor Service ──
export const doctorAPI = {
  list: (params) => api.get('/doctors', { params }),
  get: (id) => api.get(`/doctors/${id}`),
};

// ── Doctor Profile (own profile management + onboarding) ──
export const doctorProfileAPI = {
  get: () => api.get('/doctor-profile'),
  update: (data) => api.put('/doctor-profile', data),
  updateOnboarding: (data) => api.put('/doctor-profile/onboarding', data),
  uploadGallery: (formData) => api.post('/doctor-profile/gallery', formData, { headers: { 'Content-Type': undefined } }),
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

  /**
   * Create a post with file uploads (photos, videos, papers).
   * @param {Object} opts
   * @param {string}   opts.content       - Post text
   * @param {string}   opts.post_type     - 'text' | 'image' | 'video' | 'mixed'
   * @param {File[]}   opts.photos        - Photo files
   * @param {File[]}   opts.videos        - Video files
   * @param {File[]}   opts.papers        - PDF/doc files
   * @param {Function} opts.onProgress    - (percent: number) => void
   * @returns {Promise}
   */
  createPost: ({ content, post_type, photos = [], videos = [], papers = [], onProgress } = {}) => {
    const hasFiles = photos.length > 0 || videos.length > 0 || papers.length > 0;

    // Text-only post — simple JSON
    if (!hasFiles) {
      return api.post('/medstream/posts', { content, post_type: post_type || 'text' });
    }

    // Build FormData for file upload
    const fd = new FormData();
    if (content) fd.append('content', content);
    fd.append('post_type', post_type || 'mixed');

    photos.forEach((file, i) => fd.append(`photos[${i}]`, file));
    videos.forEach((file, i) => fd.append(`videos[${i}]`, file));
    papers.forEach((file, i) => fd.append(`papers[${i}]`, file));

    return api.post('/medstream/posts', fd, {
      headers: { 'Content-Type': undefined },
      timeout: 120000, // 2 min for large uploads
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  updatePost: (id, payload) => api.put(`/medstream/posts/${id}`, payload),
  deletePost: (id) => api.delete(`/medstream/posts/${id}`),
  comments: (postId, params) => api.get(`/medstream/posts/${postId}/comments`, { params }),
  createComment: (postId, payload) => api.post(`/medstream/posts/${postId}/comments`, payload),
  deleteComment: (commentId) => api.delete(`/medstream/comments/${commentId}`),
  toggleLike: (postId) => api.post(`/medstream/posts/${postId}/like`),
  reportPost: (postId, reason) => api.post(`/medstream/posts/${postId}/report`, { reason }),
  bookmarks: (params) => api.get('/medstream/bookmarks', { params }),
  toggleBookmark: (payload) => api.post('/medstream/bookmarks', payload),
  reports: (params) => api.get('/medstream/reports', { params }),
  updateReport: (id, payload) => api.put(`/medstream/reports/${id}`, payload),
};

// ── Messaging Service ──
export const messageAPI = {
  // Conversations
  conversations: (params) => api.get('/messages/conversations', { params }),
  createConversation: (payload) => api.post('/messages/conversations', payload),
  getConversation: (id) => api.get(`/messages/conversations/${id}`),
  updateConversation: (id, payload) => api.put(`/messages/conversations/${id}`, payload),
  deleteConversation: (id) => api.delete(`/messages/conversations/${id}`),

  // Messages within a conversation
  messages: (conversationId, params) => api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, { body, type, reply_to_id, attachments } = {}) => {
    const hasFiles = attachments && attachments.length > 0;
    if (!hasFiles) {
      return api.post(`/messages/conversations/${conversationId}/messages`, { body, type, reply_to_id });
    }
    const fd = new FormData();
    if (body) fd.append('body', body);
    if (type) fd.append('type', type);
    if (reply_to_id) fd.append('reply_to_id', reply_to_id);
    attachments.forEach((file, i) => fd.append(`attachments[${i}]`, file));
    return api.post(`/messages/conversations/${conversationId}/messages`, fd, {
      headers: { 'Content-Type': undefined },
      timeout: 60000,
    });
  },

  // Mark conversation as read
  markRead: (conversationId) => api.post(`/messages/conversations/${conversationId}/read`),

  // Single message operations
  updateMessage: (messageId, payload) => api.put(`/messages/${messageId}`, payload),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),

  // Search & unread count
  search: (params) => api.get('/messages/search', { params }),
  unreadCount: () => api.get('/messages/unread-count'),
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

// ── Notification Service ──
export const notificationAPI = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications'),
};

// ── Chat Service (1:1 Doctor-Patient) ──
export const chatAPI = {
  conversations: (params) => api.get('/chat/conversations', { params }),
  startConversation: (payload) => api.post('/chat/conversations', payload),
  messages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, { content, attachment } = {}) => {
    if (!attachment) {
      return api.post(`/chat/conversations/${conversationId}/messages`, { content });
    }
    const fd = new FormData();
    if (content) fd.append('content', content);
    fd.append('attachment', attachment);
    return api.post(`/chat/conversations/${conversationId}/messages`, fd, {
      headers: { 'Content-Type': undefined },
      timeout: 60000,
    });
  },
  markAsRead: (conversationId) => api.post(`/chat/conversations/${conversationId}/read`),
  typing: (conversationId, isTyping = true) => api.post(`/chat/conversations/${conversationId}/typing`, { is_typing: isTyping }),
  unreadCount: () => api.get('/chat/unread-count'),
};

// ── SuperAdmin Service ──
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  doctors: (params) => api.get('/admin/doctors', { params }),
  verifyDoctor: (id, verified) => api.put(`/admin/doctors/${id}/verify`, { verified }),
  reports: (params) => api.get('/admin/reports', { params }),
  approveReport: (id) => api.put(`/admin/reports/${id}/approve`),
  removeReport: (id) => api.delete(`/admin/reports/${id}/remove`),
};

// ── Analytics Service (Clinic BI) ──
export const analyticsAPI = {
  clinicSummary: (clinicId) => api.get(`/analytics/clinic/${clinicId}/summary`),
  doctorPerformance: (clinicId) => api.get(`/analytics/clinic/${clinicId}/doctors`),
  engagement: (clinicId) => api.get(`/analytics/clinic/${clinicId}/engagement`),
  appointmentTrend: (clinicId) => api.get(`/analytics/clinic/${clinicId}/appointment-trend`),
};

// ── Legacy compat (for existing code that imports { endpoints }) ──
export const endpoints = {
  login: (payload) => authAPI.login(payload),
  userRegister: (payload) => authAPI.register({ ...payload, role_id: 'patient' }),
  doctorRegister: (payload) => authAPI.register({ ...payload, role_id: 'doctor' }),
};

export default api;
