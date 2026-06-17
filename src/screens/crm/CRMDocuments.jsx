import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Upload, Search, Download, Trash2, X, FolderOpen,
  File, Image, FileSpreadsheet, Loader2, AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ProTeaser from '../../components/crm/ProTeaser';
import { patientDocumentAPI } from '../../lib/api';

// Backend enum (PatientDocument::$allowedCategories) → TR label
const CATEGORIES = [
  { value: 'lab_result', label: 'Laboratuvar' },
  { value: 'radiology', label: 'Görüntüleme' },
  { value: 'epicrisis', label: 'Epikriz' },
  { value: 'prescription', label: 'Reçete' },
  { value: 'pathology', label: 'Patoloji' },
  { value: 'surgery', label: 'Ameliyat' },
  { value: 'vaccination', label: 'Aşı' },
  { value: 'allergy', label: 'Alerji' },
  { value: 'insurance', label: 'Sigorta' },
  { value: 'other', label: 'Diğer' },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

// Mirror of backend PatientDocument::$allowedMimeTypes (PHI — safe types only)
const ALLOWED_MIME = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/dicom',
];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB — matches backend max:20480

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
};

const FileIcon = ({ mime }) => {
  if (mime === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (mime?.includes('spreadsheet') || mime?.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  if (mime?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

const CRMDocuments = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ total_documents: 0, total_size: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload form
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('lab_result');
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { per_page: 100 };
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const [listRes, statsRes] = await Promise.all([
        patientDocumentAPI.list(params),
        patientDocumentAPI.stats().catch(() => null),
      ]);
      const data = listRes?.data?.data ?? listRes?.data ?? [];
      setDocuments(Array.isArray(data) ? data : []);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      console.error('Documents fetch error:', err);
      setError(t('common.loadError', 'Dokümanlar yüklenirken bir hata oluştu.'));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery, t]);

  useEffect(() => {
    if (user?.role_id === 'doctor' && !isPro) return;
    const timer = setTimeout(fetchDocuments, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchDocuments, user, isPro]);

  const validateFile = (file) => {
    if (!file) return null;
    if (file.size > MAX_SIZE) return t('crm.documents.fileTooLarge', 'Dosya çok büyük (maks. 20MB).');
    if (file.type && !ALLOWED_MIME.includes(file.type)) {
      return t('crm.documents.fileTypeNotAllowed', 'İzin verilmeyen dosya türü. PDF, JPEG, PNG, WebP, Word, Excel veya DICOM yükleyin.');
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const v = validateFile(file);
    if (v) { setUploadError(v); setSelectedFile(null); return; }
    setUploadError(null);
    setSelectedFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadTitle('');
    setUploadCategory('lab_result');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) { setUploadError(t('crm.documents.selectFile', 'Lütfen bir dosya seçin.')); return; }
    if (!uploadTitle.trim()) { setUploadError(t('crm.documents.titleRequired', 'Başlık gereklidir.')); return; }
    const v = validateFile(selectedFile);
    if (v) { setUploadError(v); return; }

    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('title', uploadTitle.trim());
      fd.append('category', uploadCategory);
      await patientDocumentAPI.upload(fd);
      setShowUploadModal(false);
      resetUploadForm();
      await fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err?.response?.data?.errors?.file?.[0]
        || err?.response?.data?.message
        || t('crm.documents.uploadFailed', 'Yükleme başarısız oldu.');
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await patientDocumentAPI.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: doc.mime_type }));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || doc.title || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(t('crm.documents.confirmDelete', 'Bu dokümanı silmek istediğinize emin misiniz?'))) return;
    setDeletingId(doc.id);
    try {
      await patientDocumentAPI.delete(doc.id);
      await fetchDocuments();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="documents" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.documents.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.documents.subtitle')}</p>
        </div>
        <button onClick={() => { resetUploadForm(); setShowUploadModal(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
          <Upload className="w-4 h-4" /> {t('crm.documents.uploadDocument')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3">
          <p className="text-lg font-bold text-gray-900">{stats.total_documents ?? documents.length}</p>
          <p className="text-[11px] text-gray-500">{t('crm.documents.totalDocuments')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3">
          <p className="text-lg font-bold text-gray-900">{formatSize(stats.total_size)}</p>
          <p className="text-[11px] text-gray-500">{t('crm.documents.storageUsed')}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder={t('crm.documents.searchDocuments')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button onClick={() => setCategoryFilter('All')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${categoryFilter === 'All' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'}`}>{t('common.all', 'Tümü')}</button>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600">
              <option value="All">{t('common.all', 'Tümü')}</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 mb-2 animate-spin text-teal-500" />
              <p className="text-sm font-medium">{t('common.loading', 'Yükleniyor...')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-400">
              <AlertCircle className="w-10 h-10 mb-2 opacity-60" />
              <p className="text-sm font-medium text-red-500">{error}</p>
              <button onClick={fetchDocuments} className="mt-3 text-xs font-semibold text-teal-600 hover:text-teal-700">{t('common.retry', 'Tekrar dene')}</button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FolderOpen className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('crm.documents.empty', 'Henüz doküman yok')}</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <FileIcon mime={doc.mime_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.title || doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    <span>{formatSize(doc.file_size)}</span>
                    <span>·</span>
                    <span>{doc.document_date ? String(doc.document_date).slice(0, 10) : ''}</span>
                  </div>
                </div>
                <span className="hidden sm:inline-flex text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg border border-gray-200 flex-shrink-0">{CATEGORY_LABEL[doc.category] || doc.category}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleDownload(doc)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600" title={t('common.download', 'İndir')}><Download className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(doc)} disabled={deletingId === doc.id} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 disabled:opacity-50" title={t('common.delete', 'Sil')}>
                    {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{t('crm.documents.uploadDocument')}</h2>
              <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.dcm,application/dicom"
                onChange={handleFileSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-teal-400 hover:bg-teal-50/20 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-medium text-teal-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatSize(selectedFile.size)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">{t('crm.documents.clickToUpload')}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, JPG, PNG, DICOM (maks. 20MB)</p>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.documents.documentTitle', 'Başlık')} *</label>
                <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={t('crm.documents.documentTitle', 'Başlık')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.documents.category')}</label>
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {uploadError && (
                <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {uploadError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">{t('common.cancel')}</button>
              <button onClick={handleUpload} disabled={uploading} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-60 inline-flex items-center gap-1.5">
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('crm.documents.upload')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDocuments;
