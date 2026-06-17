import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Plus, Search, Eye, X, Download, User, Pill,
  Loader2, AlertCircle, Info, Stethoscope,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/compat/router';
import { useAuth } from '../../context/AuthContext';
import ProTeaser from '../../components/crm/ProTeaser';
import { examinationAPI } from '../../lib/api';

// Normalize a single prescription line from backend (encrypted:array) — fields may vary.
const normalizeMeds = (prescriptions) => {
  if (!prescriptions) return [];
  const arr = Array.isArray(prescriptions) ? prescriptions : [prescriptions];
  return arr.map((m) => {
    if (typeof m === 'string') return { name: m, dosage: '', duration: '' };
    return {
      name: m?.name || m?.drug || m?.medication || m?.title || '—',
      dosage: m?.dosage || m?.dose || m?.frequency || '',
      duration: m?.duration || m?.period || '',
    };
  });
};

const CRMPrescriptions = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRx, setSelectedRx] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await examinationAPI.list({ per_page: 100 });
      const data = res?.data?.data ?? res?.data ?? [];
      const list = (Array.isArray(data) ? data : [])
        .map((rec) => ({
          id: rec.id,
          date: (rec.created_at || rec.upload_date || '').slice(0, 10),
          patient: rec.patient?.fullname || rec.patient_name || '—',
          diagnosis: rec.diagnosis_note || rec.description || '',
          notes: rec.treatment_plan || rec.examination_note || '',
          medications: normalizeMeds(rec.prescriptions),
        }))
        // Only records that actually carry a prescription
        .filter((r) => r.medications.length > 0);
      setRecords(list);
    } catch (err) {
      console.error('Prescriptions fetch error:', err);
      setError(t('common.loadError', 'Reçeteler yüklenirken bir hata oluştu.'));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user?.role_id === 'doctor' && !isPro) return;
    fetchRecords();
  }, [fetchRecords, user, isPro]);

  const filtered = records.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.patient.toLowerCase().includes(q) || (p.diagnosis || '').toLowerCase().includes(q);
  });

  const handleDownloadPdf = async (id) => {
    setDownloadingId(id);
    try {
      const res = await examinationAPI.prescriptionPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `recete_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Prescription PDF error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="prescriptions" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.prescriptions.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.prescriptions.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/crm/examination')} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" /> {t('crm.prescriptions.newPrescription')}
        </button>
      </div>

      {/* Reçeteler muayene üzerinden oluşturulur — bilgilendirme */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-800">{t('crm.prescriptions.infoTitle', 'Reçeteler muayene üzerinden oluşturulur')}</p>
          <p className="text-[11px] text-blue-600 leading-relaxed mt-0.5">
            {t('crm.prescriptions.infoBody', 'Yeni reçete yazmak için bir muayene kaydı açın. Aşağıda geçmiş muayenelerinizdeki reçeteler listelenir.')}
          </p>
        </div>
        <button onClick={() => navigate('/crm/examination')} className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 flex-shrink-0">
          <Stethoscope className="w-3.5 h-3.5" /> {t('crm.prescriptions.goToExamination', 'Muayeneye git')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder={t('crm.prescriptions.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
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
              <button onClick={fetchRecords} className="mt-3 text-xs font-semibold text-teal-600 hover:text-teal-700">{t('common.retry', 'Tekrar dene')}</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('crm.prescriptions.empty', 'Henüz reçete yok')}</p>
              <button onClick={() => navigate('/crm/examination')} className="mt-3 text-xs font-semibold text-teal-600 hover:text-teal-700">{t('crm.prescriptions.goToExamination', 'Muayeneye git')}</button>
            </div>
          ) : (
            filtered.map((rx) => (
              <div key={rx.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {rx.patient.split(' ').map((n) => n[0]).join('').slice(0, 2) || <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{rx.patient}</p>
                        {rx.date && <span className="text-[11px] text-gray-400">{rx.date}</span>}
                      </div>
                      {rx.diagnosis && <p className="text-xs text-gray-600 mt-0.5 font-medium truncate">{rx.diagnosis}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rx.medications.map((m, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                            <Pill className="w-2.5 h-2.5" /> {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setSelectedRx(rx)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600" title={t('common.view', 'Görüntüle')}><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDownloadPdf(rx.id)} disabled={downloadingId === rx.id} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50" title={t('common.download', 'İndir')}>
                      {downloadingId === rx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{t('crm.prescriptions.prescriptionDetails')}</h2>
              <button onClick={() => setSelectedRx(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-base font-bold text-gray-900">{selectedRx.patient}</p>
                {selectedRx.date && <p className="text-xs text-gray-500">{selectedRx.date}</p>}
              </div>
              {selectedRx.diagnosis && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('crm.prescriptions.diagnosis')}</p>
                  <p className="text-sm font-medium text-gray-800">{selectedRx.diagnosis}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.prescriptions.medications')}</p>
                <div className="space-y-2">
                  {selectedRx.medications.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-teal-500" />{m.name}</p>
                      {(m.dosage || m.duration) && (
                        <div className="flex items-center gap-3 mt-1">
                          {m.dosage && <span className="text-[11px] text-gray-500">{t('crm.prescriptions.dosage')}: <strong className="text-gray-700">{m.dosage}</strong></span>}
                          {m.duration && <span className="text-[11px] text-gray-500">{t('crm.prescriptions.duration')}: <strong className="text-gray-700">{m.duration}</strong></span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {selectedRx.notes && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('common.notes')}</p>
                  <p className="text-sm text-gray-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">{selectedRx.notes}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => handleDownloadPdf(selectedRx.id)} disabled={downloadingId === selectedRx.id} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50">
                {downloadingId === selectedRx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMPrescriptions;
