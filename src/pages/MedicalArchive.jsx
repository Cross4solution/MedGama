import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { patientDocumentAPI } from '../lib/api';
import EmptyState from '../components/common/EmptyState';
import {
  FolderHeart, Upload, FileText, Image, File, Trash2, Download,
  Search, Filter, X, ChevronLeft, ChevronRight, Eye, Share2,
  Loader2, Plus, Calendar, Tag, AlertTriangle, Shield, Clock,
  FlaskConical, Scan, ScrollText, Pill, Microscope, Syringe,
  HeartPulse, FileWarning, FolderOpen
} from 'lucide-react';

const CATEGORIES = [
  { value: 'lab_result',   icon: FlaskConical, label: 'Lab Result' },
  { value: 'radiology',    icon: Scan,         label: 'Radiology' },
  { value: 'epicrisis',    icon: ScrollText,   label: 'Epicrisis' },
  { value: 'prescription', icon: Pill,         label: 'Prescription' },
  { value: 'pathology',    icon: Microscope,   label: 'Pathology' },
  { value: 'surgery',      icon: HeartPulse,   label: 'Surgery Report' },
  { value: 'vaccination',  icon: Syringe,      label: 'Vaccination' },
  { value: 'allergy',      icon: AlertTriangle,label: 'Allergy Test' },
  { value: 'insurance',    icon: Shield,       label: 'Insurance' },
  { value: 'other',        icon: FolderOpen,   label: 'Other' },
];

const MedicalArchive = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // ── State ──
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, doc: null });
  const [deleting, setDeleting] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: '',
    description: '',
    category: 'other',
    document_date: '',
  });

  // ── Fetch documents ──
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 12 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const res = await patientDocumentAPI.list(params);
      const data = res?.data || res;
      setDocuments(data?.data || data || []);
      setTotalPages(data?.last_page || 1);
    } catch {
      setDocuments([]);
    }
    setLoading(false);
  }, [page, search, categoryFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await patientDocumentAPI.stats();
      setStats(res || null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Upload handler ──
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('category', uploadForm.category);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      if (uploadForm.document_date) formData.append('document_date', uploadForm.document_date);

      await patientDocumentAPI.upload(formData);
      setShowUploadModal(false);
      setUploadForm({ file: null, title: '', description: '', category: 'other', document_date: '' });
      fetchDocuments();
      fetchStats();
    } catch { /* silent */ }
    setUploading(false);
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!deleteModal.doc) return;
    setDeleting(true);
    try {
      await patientDocumentAPI.delete(deleteModal.doc.id);
      setDocuments(prev => prev.filter(d => d.id !== deleteModal.doc.id));
      fetchStats();
    } catch { /* silent */ }
    setDeleting(false);
    setDeleteModal({ open: false, doc: null });
  };

  // ── Download handler ──
  const handleDownload = async (doc) => {
    try {
      const res = await patientDocumentAPI.download(doc.id);
      const blob = res instanceof Blob ? res : new Blob([res?.data || res]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // ── Helpers ──
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const fmtDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  const getCategoryInfo = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

  const getFileIcon = (mime) => {
    if (!mime) return File;
    if (mime.startsWith('image/')) return Image;
    if (mime.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-200/50">
              <FolderHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('medicalArchive.title', 'Medical Archive')}</h1>
              <p className="text-xs text-gray-400 font-medium">{t('medicalArchive.subtitle', 'Your medical documents, securely stored')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-200/50 hover:shadow-lg transition-all"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('medicalArchive.upload', 'Upload')}</span>
          </button>
        </div>

        {/* ── Stats Row ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl border border-gray-200/60 bg-white px-3 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('medicalArchive.totalFiles', 'Total Files')}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total_documents || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-200/60 bg-white px-3 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('medicalArchive.totalSize', 'Total Size')}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{formatSize(stats.total_size)}</p>
            </div>
            <div className="rounded-xl border border-gray-200/60 bg-white px-3 py-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('medicalArchive.categories', 'Categories')}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{Object.keys(stats.by_category || {}).length}</p>
            </div>
            <div className="rounded-xl border border-gray-200/60 bg-white px-3 py-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase">{t('medicalArchive.encrypted', 'Encrypted')}</p>
                <p className="text-[10px] text-gray-400">GDPR Art. 9</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('medicalArchive.searchPlaceholder', 'Search documents...')}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all outline-none min-w-[150px]"
          >
            <option value="">{t('medicalArchive.allCategories', 'All Categories')}</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {t(`medicalArchive.cat.${cat.value}`, cat.label)}
              </option>
            ))}
          </select>
        </div>

        {/* ── Document Grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/60 bg-white">
            <EmptyState
              type="vault"
              title={t('medicalArchive.empty', 'No documents yet')}
              description={t('medicalArchive.emptyDesc', 'Upload your medical documents to keep them organized and secure. Your files are encrypted and always accessible.')}
              actionLabel={t('medicalArchive.uploadFirst', 'Upload Your First Document')}
              onAction={() => setShowUploadModal(true)}
              secondaryLabel={t('medicalArchive.learnMore', 'Learn More')}
              secondaryUrl="/for-patients"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => {
              const catInfo = getCategoryInfo(doc.category);
              const FileIcon = getFileIcon(doc.mime_type);
              return (
                <div key={doc.id} className="rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{doc.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                            <catInfo.icon className="w-2.5 h-2.5" />
                            {t(`medicalArchive.cat.${doc.category}`, catInfo.label)}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    {doc.description && (
                      <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      {doc.document_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {fmtDate(doc.document_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {fmtDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title={t('common.download', 'Download')}
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline">{t('common.download', 'Download')}</span>
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, doc })}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition-all ${
                  p === page
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ══════════ Upload Modal ══════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50/80 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{t('medicalArchive.uploadDocument', 'Upload Document')}</h3>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="px-5 py-4 space-y-4">
                {/* File Input */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t('medicalArchive.file', 'File')} *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all"
                  >
                    {uploadForm.file ? (
                      <div className="flex items-center gap-2 justify-center">
                        <FileText className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{uploadForm.file.name}</span>
                        <span className="text-xs text-gray-400">({formatSize(uploadForm.file.size)})</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">{t('medicalArchive.dragOrClick', 'Click to select file')}</p>
                        <p className="text-[10px] text-gray-400 mt-1">PDF, JPEG, PNG, Word, Excel · Max 20 MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.dcm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadForm(prev => ({
                          ...prev,
                          file,
                          title: prev.title || file.name.replace(/\.[^.]+$/, ''),
                        }));
                      }
                    }}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t('medicalArchive.documentTitle', 'Title')} *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
                    placeholder={t('medicalArchive.titlePlaceholder', 'e.g. Blood Test Results - March 2026')}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t('medicalArchive.category', 'Category')} *</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {t(`medicalArchive.cat.${cat.value}`, cat.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t('medicalArchive.documentDate', 'Document Date')}</label>
                  <input
                    type="date"
                    value={uploadForm.document_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, document_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t('medicalArchive.description', 'Description')}</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none resize-none"
                    rows={2}
                    placeholder={t('medicalArchive.descriptionPlaceholder', 'Optional notes about this document...')}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file || !uploadForm.title}
                    className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl shadow-md shadow-teal-200/50 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? t('common.uploading', 'Uploading...') : t('medicalArchive.upload', 'Upload')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Delete Modal ══════════ */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, doc: null })} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50/80 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{t('medicalArchive.deleteDocument', 'Delete Document')}</h3>
                </div>
                <button onClick={() => setDeleteModal({ open: false, doc: null })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600">{t('medicalArchive.deleteConfirm', 'Are you sure you want to delete this document?')}</p>
                <div className="mt-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{deleteModal.doc?.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(deleteModal.doc?.file_size)}</p>
                </div>
              </div>
              <div className="px-5 pb-4 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteModal({ open: false, doc: null })}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 rounded-xl shadow-md shadow-rose-200/50 transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('common.delete', 'Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalArchive;
