import React, { useState, useMemo } from 'react';
import {
  FileText, Upload, Search, Download, Eye, Trash2, X, FolderOpen,
  File, Image, FileSpreadsheet, FilePlus, Clock, User, Filter,
  ChevronRight, MoreVertical, Star, Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MOCK_DOCUMENTS = [
  { id: 1, name: 'Lab Results - Mehmet Ozkan', type: 'pdf', size: '2.4 MB', patient: 'Mehmet Ozkan', category: 'Lab Results', uploadedAt: '2026-02-16', uploadedBy: 'System', starred: true },
  { id: 2, name: 'X-Ray Report - Ali Yilmaz', type: 'pdf', size: '5.1 MB', patient: 'Ali Yilmaz', category: 'Imaging', uploadedAt: '2026-02-15', uploadedBy: 'Dr. Ahmet', starred: false },
  { id: 3, name: 'Insurance Pre-Auth - Elif Arslan', type: 'pdf', size: '340 KB', patient: 'Elif Arslan', category: 'Insurance', uploadedAt: '2026-02-15', uploadedBy: 'Secretary', starred: true },
  { id: 4, name: 'ECG Report - Pinar Dogan', type: 'pdf', size: '1.8 MB', patient: 'Pinar Dogan', category: 'Diagnostic', uploadedAt: '2026-02-14', uploadedBy: 'Lab Dept.', starred: false },
  { id: 5, name: 'Consent Form - Burak Sahin', type: 'pdf', size: '120 KB', patient: 'Burak Sahin', category: 'Consent', uploadedAt: '2026-02-14', uploadedBy: 'Secretary', starred: false },
  { id: 6, name: 'Monthly Revenue Report - Jan 2026', type: 'xlsx', size: '890 KB', patient: null, category: 'Financial', uploadedAt: '2026-02-01', uploadedBy: 'System', starred: false },
  { id: 7, name: 'Patient Satisfaction Survey Q4', type: 'pdf', size: '1.2 MB', patient: null, category: 'Reports', uploadedAt: '2026-01-28', uploadedBy: 'System', starred: false },
  { id: 8, name: 'Referral Letter - Zeynep Kaya', type: 'pdf', size: '95 KB', patient: 'Zeynep Kaya', category: 'Referral', uploadedAt: '2026-01-25', uploadedBy: 'Dr. Ahmet', starred: false },
  { id: 9, name: 'Ultrasound Images - Fatma Koc', type: 'jpg', size: '8.3 MB', patient: 'Fatma Koc', category: 'Imaging', uploadedAt: '2026-01-20', uploadedBy: 'Lab Dept.', starred: false },
  { id: 10, name: 'Treatment Protocol Template', type: 'docx', size: '210 KB', patient: null, category: 'Templates', uploadedAt: '2026-01-15', uploadedBy: 'Dr. Ahmet', starred: true },
];

const CATEGORIES = ['All', 'Lab Results', 'Imaging', 'Insurance', 'Diagnostic', 'Consent', 'Financial', 'Reports', 'Referral', 'Templates'];

const FileIcon = ({ type }) => {
  if (type === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (type === 'xlsx' || type === 'csv') return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  if (type === 'jpg' || type === 'png') return <Image className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
};

const CRMDocuments = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_DOCUMENTS.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, categoryFilter]);

  const stats = useMemo(() => ({
    total: MOCK_DOCUMENTS.length,
    totalSize: '20.5 MB',
    categories: new Set(MOCK_DOCUMENTS.map(d => d.category)).size,
  }), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.documents.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.documents.subtitle')}</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
          <Upload className="w-4 h-4" /> {t('crm.documents.uploadDocument')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3">
          <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          <p className="text-[11px] text-gray-500">{t('crm.documents.totalDocuments')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3">
          <p className="text-lg font-bold text-gray-900">{stats.totalSize}</p>
          <p className="text-[11px] text-gray-500">{t('crm.documents.storageUsed')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3">
          <p className="text-lg font-bold text-gray-900">{stats.categories}</p>
          <p className="text-[11px] text-gray-500">{t('crm.documents.categories')}</p>
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
            {CATEGORIES.slice(0, 6).map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${categoryFilter === c ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'}`}>{c}</button>
            ))}
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 sm:hidden">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FolderOpen className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('common.noResults')}</p>
            </div>
          ) : (
            filtered.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <FileIcon type={doc.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                    {doc.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    <span>{doc.type.toUpperCase()}</span>
                    <span>·</span>
                    <span>{doc.size}</span>
                    <span>·</span>
                    <span>{doc.uploadedAt}</span>
                    {doc.patient && (<><span>·</span><span className="text-gray-500 font-medium">{doc.patient}</span></>)}
                  </div>
                </div>
                <span className="hidden sm:inline-flex text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg border border-gray-200 flex-shrink-0">{doc.category}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                  <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><Download className="w-3.5 h-3.5" /></button>
                  <button className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-teal-400 hover:bg-teal-50/20 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">{t('crm.documents.clickToUpload')}</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, JPG, PNG (max 25MB)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.documents.category')}</label>
                <select className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.patient')} ({t('crm.documents.optional')})</label>
                <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Link to patient" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">{t('common.cancel')}</button>
              <button className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">{t('crm.documents.upload')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDocuments;
