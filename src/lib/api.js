import axios from 'axios';
import { API_BASE_URL } from '../config/apiBase';

const BASE_URL = API_BASE_URL;

// Debug: verify which API URL was baked into this build (check browser console)
if (typeof window !== 'undefined') {
  console.info('[MedaGama] API_BASE =', BASE_URL);
}

// ── Axios Instance ──
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000,
});

// ── Request Interceptor — attach JWT token + Accept-Language ──
api.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('auth_state');
    if (saved) {
      const { token } = JSON.parse(saved);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  // Send current UI language to backend for locale-aware responses
  try {
    const lang = localStorage.getItem('preferred_language') || 'en';
    config.headers['Accept-Language'] = lang;
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
    return api.post('/auth/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
  // Reviews
  reviews: (id, params) => api.get(`/clinics/${id}/reviews`, { params }),
  reviewStats: (id) => api.get(`/clinics/${id}/review-stats`),
  submitReview: (id, payload) => api.post(`/clinics/${id}/reviews`, payload),
  // Onboarding
  onboardingProfile: () => api.get('/clinic-onboarding'),
  updateOnboarding: (payload) => api.put('/clinic-onboarding', payload),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post('/clinic-onboarding/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Clinic Verification ──
export const clinicVerificationAPI = {
  status: () => api.get('/clinic-verification/status'),
  submit: (formData) => api.post('/clinic-verification/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Admin
  adminList: (params) => api.get('/admin/clinic-verifications', { params }),
  approve: (id, notes) => api.put(`/admin/clinic-verifications/${id}/approve`, { notes }),
  reject: (id, notes) => api.put(`/admin/clinic-verifications/${id}/reject`, { notes }),
};

// ── Social Service (Follow / Favorite) ──
export const socialAPI = {
  follow: (targetType, targetId) => api.post('/social/follow', { target_type: targetType, target_id: targetId }),
  unfollow: (targetType, targetId) => api.post('/social/unfollow', { target_type: targetType, target_id: targetId }),
  toggleFollow: (targetType, targetId) => api.post('/social/toggle-follow', { target_type: targetType, target_id: targetId }),
  isFollowing: (targetType, targetId) => api.get('/social/is-following', { params: { target_type: targetType, target_id: targetId } }),
  followers: (targetType, targetId, params) => api.get('/social/followers', { params: { target_type: targetType, target_id: targetId, ...params } }),
  following: (params) => api.get('/social/following', { params }),
  favorite: (targetType, targetId) => api.post('/social/favorite', { target_type: targetType, target_id: targetId }),
  unfavorite: (targetType, targetId) => api.post('/social/unfavorite', { target_type: targetType, target_id: targetId }),
  toggleFavorite: (targetType, targetId) => api.post('/social/toggle-favorite', { target_type: targetType, target_id: targetId }),
  isFavorited: (targetType, targetId) => api.get('/social/is-favorited', { params: { target_type: targetType, target_id: targetId } }),
  favorites: (params) => api.get('/social/favorites', { params }),
  favoritesCount: () => api.get('/social/favorites/count'),
};

// ── Contact Messages (Patient → Clinic/Doctor inquiries) ──
export const contactMessageAPI = {
  send: (formData) => api.post('/contact-messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  inbox: (params) => api.get('/contact-messages/inbox', { params }),
  show: (id) => api.get(`/contact-messages/${id}`),
  remove: (id) => api.delete(`/contact-messages/${id}`),
  unreadCount: () => api.get('/contact-messages/unread-count'),
  downloadUrl: (msgId, attId) => `${BASE_URL}/contact-messages/${msgId}/download/${attId}`,
};

// ── Doctor Service ──
export const doctorAPI = {
  list: (params) => api.get('/doctors', { params }),
  suggestions: (params) => api.get('/doctors/suggestions', { params }),
  get: (id) => api.get(`/doctors/${id}`),
  reviews: (id, params) => api.get(`/doctors/${id}/reviews`, { params }),
  submitReview: (id, data) => api.post(`/doctors/${id}/reviews`, data),
  availability: (id, params) => api.get(`/doctors/${id}/availability`, { params }),
  myReviews: (params) => api.get('/doctors/my-reviews', { params }),
  respondToReview: (reviewId, response) => api.put(`/doctors/reviews/${reviewId}/respond`, { response }),
  reviewableAppointments: () => api.get('/doctors/reviewable-appointments'),
};

// ── Doctor Profile (own profile management + onboarding) ──
export const doctorProfileAPI = {
  get: () => api.get('/doctor-profile'),
  update: (data) => api.put('/doctor-profile', data),
  updateOnboarding: (data) => api.put('/doctor-profile/onboarding', data),
  uploadGallery: (formData) => api.post('/doctor-profile/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteGalleryImage: (url) => api.delete('/doctor-profile/gallery', { data: { url } }),
  reorderGallery: (gallery) => api.put('/doctor-profile/gallery/reorder', { gallery }),
  updateOperatingHours: (operating_hours) => api.put('/doctor-profile/operating-hours', { operating_hours }),
  updateServices: (services) => api.put('/doctor-profile/services', { services }),
  updateSocial: (data) => api.put('/doctor-profile/social', data),
  // Verification documents (Doc §8.3)
  getVerificationRequests: () => api.get('/doctor-profile/verification'),
  submitVerification: (formData) => api.post('/doctor-profile/verification', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Appointment Service ──
export const appointmentAPI = {
  list: (params) => api.get('/appointments', { params }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (payload) => api.post('/appointments', payload),
  update: (id, payload) => api.put(`/appointments/${id}`, payload),
  delete: (id) => api.delete(`/appointments/${id}`),
  calendarEvents: (params) => api.get('/appointments/calendar-events', { params }),
  reschedule: (id, payload) => api.patch(`/appointments/${id}/reschedule`, payload),
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

// ── Patient Documents — Medical Wallet (Bölüm 7.4) ──
export const patientDocumentAPI = {
  list: (params) => api.get('/patient-documents', { params }),
  stats: () => api.get('/patient-documents/stats'),
  get: (id) => api.get(`/patient-documents/${id}`),
  upload: (formData) => api.post('/patient-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, payload) => api.put(`/patient-documents/${id}`, payload),
  delete: (id) => api.delete(`/patient-documents/${id}`),
  download: (id) => api.get(`/patient-documents/${id}/download`, { responseType: 'blob' }),
  share: (id, doctorId) => api.post(`/patient-documents/${id}/share`, { doctor_id: doctorId }),
  revoke: (id, doctorId) => api.post(`/patient-documents/${id}/revoke`, { doctor_id: doctorId }),
  sharedWithDoctor: (patientId) => api.get(`/patient-documents/shared/${patientId}`),
};

// ── Digital Anamnesis Service ──
export const anamnesisAPI = {
  get: (patientId) => api.get(`/anamnesis/${patientId}`),
  upsert: (payload) => api.post('/anamnesis', payload),
};

// ── Examination & Prescription Service ──
export const examinationAPI = {
  list: (params) => api.get('/crm/examinations', { params }),
  get: (id) => api.get(`/crm/examinations/${id}`),
  create: (payload) => api.post('/crm/examinations', payload),
  update: (id, payload) => api.put(`/crm/examinations/${id}`, payload),
  delete: (id) => api.delete(`/crm/examinations/${id}`),
  searchIcd10: (term) => api.get('/crm/icd10/search', { params: { q: term } }),
  prescriptionPdf: (id) => api.get(`/crm/examinations/${id}/prescription-pdf`, { responseType: 'blob' }),
};

// ── CRM Patient Management (Bölüm 7.3) ──
export const patientAPI = {
  list: (params) => api.get('/crm/patients', { params }),
  stats: () => api.get('/crm/patients/stats'),
  filters: () => api.get('/crm/patients/filters'),
  get: (id) => api.get(`/crm/patients/${id}`),
  timeline: (id, params) => api.get(`/crm/patients/${id}/timeline`, { params }),
  summary: (id) => api.get(`/crm/patients/${id}/summary`),
  documents: (id, params) => api.get(`/crm/patients/${id}/documents`, { params }),
  addTag: (id, tag) => api.post(`/crm/patients/${id}/tags`, { tag }),
  removeTag: (tagId) => api.delete(`/crm/patients/tags/${tagId}`),
  setStage: (id, stage) => api.post(`/crm/patients/${id}/stage`, { stage }),
};

// ── CRM Billing / Invoicing (Bölüm 7.5) ──
export const billingAPI = {
  invoices: (params) => api.get('/crm/billing/invoices', { params }),
  getInvoice: (id) => api.get(`/crm/billing/invoices/${id}`),
  createInvoice: (payload) => api.post('/crm/billing/invoices', payload),
  updateInvoice: (id, payload) => api.put(`/crm/billing/invoices/${id}`, payload),
  deleteInvoice: (id) => api.delete(`/crm/billing/invoices/${id}`),
  invoicePdf: (id) => api.get(`/crm/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
  stats: (params) => api.get('/crm/billing/stats', { params }),
  revenueChart: (params) => api.get('/crm/billing/revenue-chart', { params }),
  outstanding: (params) => api.get('/crm/billing/outstanding', { params }),
};

// ── Finance / Analytics (Bölüm 7.5) ──
export const financeAPI = {
  topServices: (params) => api.get('/finance/top-services', { params }),
  payout: (params) => api.get('/finance/payout', { params }),
  platformOverview: (params) => api.get('/finance/platform-overview', { params }),
  exchangeRates: () => api.get('/finance/exchange-rates'),
  convert: (payload) => api.post('/finance/convert', payload),
  export: (params) => api.get('/finance/export', { params, responseType: 'blob' }),
};

// ── Support / Help Center (Bölüm 12) ──
export const supportAPI = {
  categories: () => api.get('/support/categories'),
  tickets: (params) => api.get('/support/tickets', { params }),
  getTicket: (id) => api.get(`/support/tickets/${id}`),
  createTicket: (formData) => api.post('/support/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  reply: (id, formData) => api.post(`/support/tickets/${id}/reply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, status) => api.patch(`/support/tickets/${id}/status`, { status }),
  assign: (id, assignedTo) => api.patch(`/support/tickets/${id}/assign`, { assigned_to: assignedTo }),
  stats: () => api.get('/support/stats'),
  storeCategory: (payload) => api.post('/support/categories', payload),
  updateCategory: (id, payload) => api.put(`/support/categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/support/categories/${id}`),
};

export const faqAPI = {
  list: (params) => api.get('/faqs', { params }),
  adminList: () => api.get('/admin/faqs'),
  create: (payload) => api.post('/admin/faqs', payload),
  update: (id, payload) => api.put(`/admin/faqs/${id}`, payload),
  delete: (id) => api.delete(`/admin/faqs/${id}`),
};

// ── Clinic Manager Panel (§8.2) ──
export const clinicManagerAPI = {
  overview: () => api.get('/clinic-manager/overview'),
  doctors: (params) => api.get('/clinic-manager/doctors', { params }),
  doctorDetail: (id) => api.get(`/clinic-manager/doctors/${id}`),
  addDoctor: (id) => api.post(`/clinic-manager/doctors/${id}/add`),
  removeDoctor: (id) => api.delete(`/clinic-manager/doctors/${id}/remove`),
  updateDoctorHours: (id, hours) => api.put(`/clinic-manager/doctors/${id}/hours`, { operating_hours: hours }),
  financials: (params) => api.get('/clinic-manager/financials', { params }),
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
  createPost: ({ content, post_type, specialty_id, is_anonymous, gdpr_consent, photos = [], videos = [], papers = [], onProgress } = {}) => {
    const hasFiles = photos.length > 0 || videos.length > 0 || papers.length > 0;

    // Text-only post — simple JSON
    if (!hasFiles) {
      return api.post('/medstream/posts', {
        content, post_type: post_type || 'text',
        specialty_id: specialty_id || undefined,
        is_anonymous: !!is_anonymous,
        gdpr_consent: !!gdpr_consent,
      });
    }

    // Build FormData for file upload
    const fd = new FormData();
    if (content) fd.append('content', content);
    fd.append('post_type', post_type || 'mixed');
    if (specialty_id) fd.append('specialty_id', specialty_id);
    if (is_anonymous) fd.append('is_anonymous', '1');
    if (gdpr_consent) fd.append('gdpr_consent', '1');

    photos.forEach((file, i) => fd.append(`photos[${i}]`, file));
    videos.forEach((file, i) => fd.append(`videos[${i}]`, file));
    papers.forEach((file, i) => fd.append(`papers[${i}]`, file));

    return api.post('/medstream/posts', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

  // Feed & Follows (Bölüm 5)
  feed: (params) => api.get('/medstream/feed', { params }),
  toggleFollow: (userId) => api.post(`/medstream/follow/${userId}`),
  followCounts: (userId) => api.get(`/medstream/follow-counts/${userId}`),

  // Secure file download (forces browser download)
  downloadFile: (path, filename) => api.get('/medstream/download', {
    params: { path, filename },
    responseType: 'blob',
  }),
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
      headers: { 'Content-Type': 'multipart/form-data' },
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

// ── Live Search (Public — autocomplete) ──
export const searchAPI = {
  live: (q) => api.get('/search/live', { params: { q } }),
};

// ── Catalog Service (Public) ──
export const catalogAPI = {
  search: (type, q) => api.get('/catalog/search', { params: { type, q } }),
  popular: (type, limit) => api.get('/catalog/popular', { params: { type, limit } }),
  specialties: (params) => api.get('/catalog/specialties', { params }),
  specialtiesSearch: (params) => api.get('/catalog/specialties/search', { params }),
  cities: (params) => api.get('/catalog/cities', { params }),
  citiesSearch: (params) => api.get('/catalog/cities/search', { params }),
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
  growthTrend: () => api.get('/admin/growth-trend'),
  doctors: (params) => api.get('/admin/doctors', { params }),
  verifyDoctor: (id, verified) => api.put(`/admin/doctors/${id}/verify`, { verified }),
  // User management (Doc §14)
  users: (params) => api.get('/admin/users', { params }),
  userStats: () => api.get('/admin/users/stats'),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  suspendUser: (id, suspend) => api.put(`/admin/users/${id}/suspend`, { suspend }),
  resetPassword: (id, password) => api.put(`/admin/users/${id}/reset-password`, { password }),
  reports: (params) => api.get('/admin/reports', { params }),
  approveReport: (id) => api.put(`/admin/reports/${id}/approve`),
  removeReport: (id) => api.delete(`/admin/reports/${id}/remove`),
  // Catalog CRUD
  specialties: (params) => api.get('/admin/catalog/specialties', { params }),
  createSpecialty: (payload) => api.post('/admin/catalog/specialties', payload),
  updateSpecialty: (id, payload) => api.put(`/admin/catalog/specialties/${id}`, payload),
  deleteSpecialty: (id) => api.delete(`/admin/catalog/specialties/${id}`),
  cities: (params) => api.get('/admin/catalog/cities', { params }),
  createCity: (payload) => api.post('/admin/catalog/cities', payload),
  updateCity: (id, payload) => api.put(`/admin/catalog/cities/${id}`, payload),
  deleteCity: (id) => api.delete(`/admin/catalog/cities/${id}`),
  diseases: (params) => api.get('/admin/catalog/diseases', { params }),
  createDisease: (payload) => api.post('/admin/catalog/diseases', payload),
  updateDisease: (id, payload) => api.put(`/admin/catalog/diseases/${id}`, payload),
  treatmentTags: (params) => api.get('/admin/catalog/treatment-tags', { params }),
  createTreatmentTag: (payload) => api.post('/admin/catalog/treatment-tags', payload),
  updateTreatmentTag: (id, payload) => api.put(`/admin/catalog/treatment-tags/${id}`, payload),
  deleteTreatmentTag: (id) => api.delete(`/admin/catalog/treatment-tags/${id}`),
  // Feature Toggles
  featureToggles: () => api.get('/admin/feature-toggles'),
  updateFeatureToggle: (key, value) => api.put('/admin/feature-toggles', { key, value }),
  // Audit Logs
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  auditLogStats: () => api.get('/admin/audit-logs/stats'),
  searchUsers: (q) => api.get('/admin/users/search', { params: { q } }),
  // Verification Requests (Doc §8.3)
  doctorVerificationDetail: (doctorId) => api.get(`/admin/verification-requests/doctor/${doctorId}`),
  verificationRequests: (params) => api.get('/admin/verification-requests', { params }),
  verificationStats: () => api.get('/admin/verification-requests/stats'),
  approveVerification: (id) => api.put(`/admin/verification-requests/${id}/approve`),
  rejectVerification: (id, reason) => api.put(`/admin/verification-requests/${id}/reject`, { reason }),
  undoVerification: (id) => api.put(`/admin/verification-requests/${id}/undo`),
  requestMoreInfo: (id, message) => api.put(`/admin/verification-requests/${id}/request-info`, { message }),
  verificationDocumentUrl: (id) => `${api.defaults.baseURL}/admin/verification-requests/${id}/document`,
  // Review moderation (Doc §10)
  reviews: (params) => api.get('/admin/reviews', { params }),
  reviewStats: () => api.get('/admin/reviews/stats'),
  approveReview: (id) => api.put(`/admin/reviews/${id}/approve`),
  rejectReview: (id, note) => api.put(`/admin/reviews/${id}/reject`, { note }),
  hideReview: (id, note) => api.put(`/admin/reviews/${id}/hide`, { note }),
  // Announcements (admin CRUD)
  announcements: (params) => api.get('/admin/announcements', { params }),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
};

// ── Announcements (public) ──
export const announcementAPI = {
  list: () => api.get('/announcements'),
};

// ── Analytics Service (Clinic BI) ──
export const analyticsAPI = {
  clinicSummary: (clinicId) => api.get(`/analytics/clinic/${clinicId}/summary`),
  doctorPerformance: (clinicId) => api.get(`/analytics/clinic/${clinicId}/doctors`),
  engagement: (clinicId) => api.get(`/analytics/clinic/${clinicId}/engagement`),
  appointmentTrend: (clinicId) => api.get(`/analytics/clinic/${clinicId}/appointment-trend`),
};

// ── Telehealth — Daily.co + Deepgram (§4.4) ──
export const telehealthAPI = {
  session: (appointmentId) => api.get(`/telehealth/${appointmentId}/session`),
  transcriptionToken: (appointmentId, lang = 'en') => api.get(`/telehealth/${appointmentId}/transcription-token`, { params: { lang } }),
  simulateTranscript: (appointmentId, count = 1) => api.get(`/telehealth/${appointmentId}/simulate-transcript`, { params: { count } }),
  updateStatus: (appointmentId, meetingStatus) => api.put(`/telehealth/${appointmentId}/status`, { meeting_status: meetingStatus }),
};

// ── Hospital Public Profiles (L4) ──
export const hospitalAPI = {
  getByCodename: (codename) => api.get(`/hospitals/${codename}`),
};

// ── Branch Management (L4 Hospitals) ──
export const branchAPI = {
  list: (params) => api.get('/branches', { params }),
  get: (id) => api.get(`/branches/${id}`),
  create: (payload) => api.post('/branches', payload),
  update: (id, payload) => api.put(`/branches/${id}`, payload),
  delete: (id) => api.delete(`/branches/${id}`),
  assignClinic: (id, payload) => api.post(`/branches/${id}/assign-clinic`, payload),
  assignDoctor: (id, payload) => api.post(`/branches/${id}/assign-doctor`, payload),
};

// ── Legacy compat (for existing code that imports { endpoints }) ──
export const endpoints = {
  login: (payload) => authAPI.login(payload),
  userRegister: (payload) => authAPI.register({ role_id: 'patient', ...payload }),
  doctorRegister: (payload) => authAPI.register({ role_id: 'doctor', ...payload }),
};

export default api;
