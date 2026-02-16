import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Search, Eye, Edit3, Trash2, X, Download, Printer,
  ChevronLeft, ChevronRight, User, Calendar, Pill, AlertTriangle, CheckCircle2,
  Clock, FileText, Copy,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MOCK_PRESCRIPTIONS = [
  { id: 1, date: '2026-02-16', patient: 'Zeynep Kaya', age: 34, diagnosis: 'Seasonal Allergies', medications: [{ name: 'Cetirizine 10mg', dosage: '1x daily', duration: '14 days' }, { name: 'Fluticasone Nasal Spray', dosage: '2 puffs/nostril daily', duration: '30 days' }], status: 'active', notes: 'Avoid allergens. Follow-up in 2 weeks.' },
  { id: 2, date: '2026-02-16', patient: 'Ali Yilmaz', age: 45, diagnosis: 'Post-Op Pain Management', medications: [{ name: 'Ibuprofen 400mg', dosage: '3x daily after meals', duration: '7 days' }, { name: 'Omeprazole 20mg', dosage: '1x daily before breakfast', duration: '7 days' }], status: 'active', notes: 'Monitor for GI symptoms.' },
  { id: 3, date: '2026-02-15', patient: 'Fatma Koc', age: 61, diagnosis: 'Type 2 Diabetes', medications: [{ name: 'Metformin 1000mg', dosage: '2x daily with meals', duration: '90 days' }, { name: 'Glimepiride 2mg', dosage: '1x daily before breakfast', duration: '90 days' }, { name: 'Atorvastatin 20mg', dosage: '1x daily at bedtime', duration: '90 days' }], status: 'active', notes: 'HbA1c check in 3 months.' },
  { id: 4, date: '2026-02-14', patient: 'Mehmet Ozkan', age: 52, diagnosis: 'Hypertension', medications: [{ name: 'Amlodipine 5mg', dosage: '1x daily', duration: '30 days' }, { name: 'Lisinopril 10mg', dosage: '1x daily', duration: '30 days' }], status: 'active', notes: 'BP monitoring daily. Target <140/90.' },
  { id: 5, date: '2026-02-10', patient: 'Ayse Demir', age: 38, diagnosis: 'Migraine', medications: [{ name: 'Sumatriptan 50mg', dosage: 'As needed, max 2/day', duration: '30 days' }, { name: 'Propranolol 40mg', dosage: '2x daily', duration: '30 days' }], status: 'active', notes: 'Headache diary recommended.' },
  { id: 6, date: '2026-02-05', patient: 'Elif Arslan', age: 42, diagnosis: 'Hypothyroidism', medications: [{ name: 'Levothyroxine 75mcg', dosage: '1x daily on empty stomach', duration: '90 days' }], status: 'active', notes: 'TSH recheck in 6 weeks.' },
  { id: 7, date: '2026-01-20', patient: 'Deniz Korkmaz', age: 33, diagnosis: 'Anxiety Disorder', medications: [{ name: 'Sertraline 50mg', dosage: '1x daily', duration: '60 days' }], status: 'expired', notes: 'Needs renewal. Follow-up scheduled.' },
  { id: 8, date: '2026-01-15', patient: 'Pinar Dogan', age: 47, diagnosis: 'Cardiac Arrhythmia', medications: [{ name: 'Bisoprolol 5mg', dosage: '1x daily', duration: '30 days' }, { name: 'Aspirin 100mg', dosage: '1x daily', duration: '30 days' }], status: 'expired', notes: 'ECG follow-up needed.' },
];

const PrescriptionStatusBadge = ({ status }) => {
  const c = { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', expired: 'bg-red-50 text-red-600 border-red-200', draft: 'bg-gray-100 text-gray-500 border-gray-200' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${c[status] || c.active}`}>{status}</span>;
};

const CRMPrescriptions = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRx, setSelectedRx] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_PRESCRIPTIONS.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery && !p.patient.toLowerCase().includes(searchQuery.toLowerCase()) && !p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: MOCK_PRESCRIPTIONS.length,
    active: MOCK_PRESCRIPTIONS.filter(p => p.status === 'active').length,
    expired: MOCK_PRESCRIPTIONS.filter(p => p.status === 'expired').length,
  }), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.prescriptions.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.prescriptions.subtitle')}</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" /> {t('crm.prescriptions.newPrescription')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('common.total'), value: stats.total, bg: 'bg-gray-50 border-gray-200', color: 'text-gray-900' },
          { label: t('crm.prescriptions.active'), value: stats.active, bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700' },
          { label: t('crm.prescriptions.expired'), value: stats.expired, bg: 'bg-red-50 border-red-200', color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder={t('crm.prescriptions.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
          </div>
          <div className="flex items-center gap-1.5">
            {['all', 'active', 'expired'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50'}`}>{s === 'all' ? t('common.all') : s}</button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('common.noResults')}</p>
            </div>
          ) : (
            filtered.map((rx) => (
              <div key={rx.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {rx.patient.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{rx.patient}</p>
                        <PrescriptionStatusBadge status={rx.status} />
                        <span className="text-[11px] text-gray-400">{rx.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 font-medium">{rx.diagnosis}</p>
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
                    <button onClick={() => setSelectedRx(rx)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><Printer className="w-3.5 h-3.5" /></button>
                    <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><Copy className="w-3.5 h-3.5" /></button>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-gray-900">{selectedRx.patient}</p>
                  <p className="text-xs text-gray-500">Age {selectedRx.age} · {selectedRx.date}</p>
                </div>
                <PrescriptionStatusBadge status={selectedRx.status} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('crm.prescriptions.diagnosis')}</p>
                <p className="text-sm font-medium text-gray-800">{selectedRx.diagnosis}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('crm.prescriptions.medications')}</p>
                <div className="space-y-2">
                  {selectedRx.medications.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-teal-500" />{m.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-500">{t('crm.prescriptions.dosage')}: <strong className="text-gray-700">{m.dosage}</strong></span>
                        <span className="text-[11px] text-gray-500">{t('crm.prescriptions.duration')}: <strong className="text-gray-700">{m.duration}</strong></span>
                      </div>
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
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> {t('common.print')}</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> {t('crm.prescriptions.duplicate')}</button>
              {selectedRx.status === 'expired' && (
                <button className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">{t('crm.prescriptions.renewPrescription')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{t('crm.prescriptions.newPrescription')}</h2>
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.patient')} *</label>
                <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder={t('crm.patients.searchPlaceholder')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('crm.prescriptions.diagnosis')} *</label>
                <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g. Type 2 Diabetes" />
              </div>
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Medication #1</p>
                <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Medication name & strength" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Dosage (e.g. 2x daily)" />
                  <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Duration (e.g. 30 days)" />
                </div>
              </div>
              <button className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {t('crm.prescriptions.addMedication')}</button>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('common.notes')}</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" placeholder="Additional instructions..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">{t('common.cancel')}</button>
              <button className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">{t('crm.prescriptions.newPrescription')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMPrescriptions;
