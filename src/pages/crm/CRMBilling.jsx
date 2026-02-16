import React, { useState, useMemo } from 'react';
import {
  Receipt, CreditCard, Banknote, Building2, Plus, Search, Filter,
  ChevronLeft, ChevronRight, X, Check, AlertTriangle, Clock,
  DollarSign, TrendingUp, Users, FileText, Download, Edit3, Trash2,
  Wallet, ArrowUpRight, CircleDollarSign, BadgePercent,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Mock: Procedure Price List ────────────────────────────────
const INITIAL_PROCEDURES = [
  { id: 1, name: 'General Consultation', category: 'Consultation', price: 350, currency: '€', active: true },
  { id: 2, name: 'Follow-up Visit', category: 'Consultation', price: 200, currency: '€', active: true },
  { id: 3, name: 'Check-up Package', category: 'Check-up', price: 450, currency: '€', active: true },
  { id: 4, name: 'Blood Test Panel', category: 'Laboratory', price: 180, currency: '€', active: true },
  { id: 5, name: 'X-Ray', category: 'Imaging', price: 250, currency: '€', active: true },
  { id: 6, name: 'MRI Scan', category: 'Imaging', price: 1200, currency: '€', active: true },
  { id: 7, name: 'Ultrasound', category: 'Imaging', price: 300, currency: '€', active: true },
  { id: 8, name: 'Minor Surgery', category: 'Procedure', price: 2500, currency: '€', active: true },
  { id: 9, name: 'Dental Cleaning', category: 'Dental', price: 150, currency: '€', active: true },
  { id: 10, name: 'Physical Therapy Session', category: 'Therapy', price: 120, currency: '€', active: true },
  { id: 11, name: 'Dermatology Consultation', category: 'Consultation', price: 400, currency: '€', active: true },
  { id: 12, name: 'ECG', category: 'Cardiology', price: 200, currency: '€', active: true },
];

// ─── Mock: Payment Records ─────────────────────────────────────
const INITIAL_PAYMENTS = [
  { id: 1, date: '2026-02-16', patient: 'Zeynep Kaya', procedure: 'General Consultation', amount: 350, method: 'credit_card', status: 'completed', invoice: 'PAY-2026-0021' },
  { id: 2, date: '2026-02-16', patient: 'Ali Yilmaz', procedure: 'MRI Scan', amount: 1200, paid: 600, method: 'bank_transfer', status: 'partial', invoice: 'PAY-2026-0020' },
  { id: 3, date: '2026-02-15', patient: 'Selin Acar', procedure: 'Check-up Package', amount: 450, method: 'cash', status: 'completed', invoice: 'PAY-2026-0019' },
  { id: 4, date: '2026-02-15', patient: 'Mehmet Ozkan', procedure: 'Blood Test Panel', amount: 180, method: 'credit_card', status: 'completed', invoice: 'PAY-2026-0018' },
  { id: 5, date: '2026-02-14', patient: 'Ayse Demir', procedure: 'Minor Surgery', amount: 2500, paid: 1000, method: 'bank_transfer', status: 'partial', invoice: 'PAY-2026-0017' },
  { id: 6, date: '2026-02-14', patient: 'Fatma Koc', procedure: 'Follow-up Visit', amount: 200, method: 'cash', status: 'completed', invoice: 'PAY-2026-0016' },
  { id: 7, date: '2026-02-13', patient: 'Elif Arslan', procedure: 'Dental Cleaning', amount: 150, method: 'credit_card', status: 'completed', invoice: 'PAY-2026-0015' },
  { id: 8, date: '2026-02-13', patient: 'Can Yildiz', procedure: 'Physical Therapy Session', amount: 120, method: 'cash', status: 'completed', invoice: 'PAY-2026-0014' },
];

// ─── Mock: Outstanding Balances ────────────────────────────────
const OUTSTANDING_PATIENTS = [
  { id: 1, patient: 'Ali Yilmaz', phone: '+90 532 111 2233', totalOwed: 600, procedures: [{ name: 'MRI Scan', date: '2026-02-16', total: 1200, paid: 600, remaining: 600 }], lastPayment: '2026-02-16', daysOverdue: 0 },
  { id: 2, patient: 'Ayse Demir', phone: '+90 533 444 5566', totalOwed: 1500, procedures: [{ name: 'Minor Surgery', date: '2026-02-14', total: 2500, paid: 1000, remaining: 1500 }], lastPayment: '2026-02-14', daysOverdue: 2 },
  { id: 3, patient: 'Burak Sahin', phone: '+90 535 777 8899', totalOwed: 450, procedures: [{ name: 'Check-up Package', date: '2026-02-10', total: 450, paid: 0, remaining: 450 }], lastPayment: null, daysOverdue: 6 },
  { id: 4, patient: 'Deniz Korkmaz', phone: '+90 536 222 3344', totalOwed: 350, procedures: [{ name: 'General Consultation', date: '2026-02-08', total: 350, paid: 0, remaining: 350 }], lastPayment: null, daysOverdue: 8 },
  { id: 5, patient: 'Pinar Dogan', phone: '+90 537 555 6677', totalOwed: 200, procedures: [{ name: 'Follow-up Visit', date: '2026-02-12', total: 200, paid: 0, remaining: 200 }], lastPayment: null, daysOverdue: 4 },
];

// ─── Patients list for payment form ────────────────────────────
const PATIENT_LIST = [
  'Zeynep Kaya', 'Ali Yilmaz', 'Selin Acar', 'Mehmet Ozkan', 'Ayse Demir',
  'Fatma Koc', 'Elif Arslan', 'Can Yildiz', 'Burak Sahin', 'Deniz Korkmaz', 'Pinar Dogan',
];

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    unpaid: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels = { completed: 'Paid', partial: 'Partial', unpaid: 'Unpaid' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${styles[status] || styles.unpaid}`}>{labels[status] || status}</span>;
};

const OverdueBadge = ({ days }) => {
  if (days === 0) return <span className="text-xs text-gray-500">Today</span>;
  if (days <= 3) return <span className="text-xs text-amber-600 font-medium">{days}d</span>;
  return <span className="text-xs text-red-600 font-semibold">{days}d overdue</span>;
};

const CRMBilling = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('procedures');
  const [procedures, setProcedures] = useState(INITIAL_PROCEDURES);
  const [payments] = useState(INITIAL_PAYMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  // Procedure form state
  const [procForm, setProcForm] = useState({ name: '', category: '', price: '', currency: '€' });

  // Payment form state
  const [payForm, setPayForm] = useState({ patient: '', procedure: '', amount: '', method: 'cash', notes: '' });

  const tabs = [
    { key: 'procedures', label: t('crm.billing.procedures'), icon: Receipt },
    { key: 'payment', label: t('crm.billing.receivePayment'), icon: Wallet },
    { key: 'balances', label: t('crm.billing.outstandingBalances'), icon: Users },
  ];

  // ─── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCollected = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
    const totalPartial = payments.filter(p => p.status === 'partial').reduce((s, p) => s + (p.paid || 0), 0);
    const totalOutstanding = OUTSTANDING_PATIENTS.reduce((s, p) => s + p.totalOwed, 0);
    const todayCollected = payments.filter(p => p.date === '2026-02-16' && p.status === 'completed').reduce((s, p) => s + p.amount, 0) +
      payments.filter(p => p.date === '2026-02-16' && p.status === 'partial').reduce((s, p) => s + (p.paid || 0), 0);
    return { totalCollected: totalCollected + totalPartial, totalOutstanding, todayCollected, debtorCount: OUTSTANDING_PATIENTS.length };
  }, [payments]);

  // ─── Filtered Procedures ─────────────────────────────────────
  const categories = useMemo(() => Array.from(new Set(procedures.map(p => p.category))), [procedures]);

  const filteredProcedures = useMemo(() => {
    return procedures.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [procedures, categoryFilter, searchQuery]);

  // ─── Filtered Payments ───────────────────────────────────────
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (searchQuery && !p.patient.toLowerCase().includes(searchQuery.toLowerCase()) && !p.invoice.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [payments, searchQuery]);

  const totalPages = Math.ceil((activeTab === 'procedures' ? filteredProcedures : filteredPayments).length / perPage);
  const paginatedProcedures = filteredProcedures.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ─── Handlers ────────────────────────────────────────────────
  const handleAddProcedure = () => {
    setEditingProcedure(null);
    setProcForm({ name: '', category: '', price: '', currency: '€' });
    setShowProcedureModal(true);
  };

  const handleEditProcedure = (proc) => {
    setEditingProcedure(proc);
    setProcForm({ name: proc.name, category: proc.category, price: String(proc.price), currency: proc.currency });
    setShowProcedureModal(true);
  };

  const handleSaveProcedure = () => {
    if (!procForm.name || !procForm.category || !procForm.price) return;
    if (editingProcedure) {
      setProcedures(prev => prev.map(p => p.id === editingProcedure.id ? { ...p, name: procForm.name, category: procForm.category, price: Number(procForm.price), currency: procForm.currency } : p));
    } else {
      const newId = Math.max(...procedures.map(p => p.id), 0) + 1;
      setProcedures(prev => [...prev, { id: newId, name: procForm.name, category: procForm.category, price: Number(procForm.price), currency: procForm.currency, active: true }]);
    }
    setShowProcedureModal(false);
  };

  const handleDeleteProcedure = (id) => {
    setProcedures(prev => prev.filter(p => p.id !== id));
  };

  const handlePaymentSubmit = () => {
    if (!payForm.patient || !payForm.procedure || !payForm.amount || !payForm.method) return;
    // In production, this would POST to API
    setShowPaymentModal(true);
  };

  const resetPaymentForm = () => {
    setPayForm({ patient: '', procedure: '', amount: '', method: 'cash', notes: '' });
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.billing.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.billing.subtitle')}</p>
        </div>
        <button
          onClick={() => { window.print(); }}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{t('common.export')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: t('crm.billing.todayCollected'), value: `€${stats.todayCollected.toLocaleString()}`, icon: CircleDollarSign, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
          { label: t('crm.billing.totalCollected'), value: `€${(stats.totalCollected / 1000).toFixed(1)}k`, icon: TrendingUp, bg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
          { label: t('crm.billing.totalOutstanding'), value: `€${stats.totalOutstanding.toLocaleString()}`, icon: AlertTriangle, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
          { label: t('crm.billing.debtorPatients'), value: stats.debtorCount, icon: Users, bg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 sm:p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setCurrentPage(1); setCategoryFilter('all'); }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-700 bg-teal-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TAB 1: Procedure Price List
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'procedures' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('crm.billing.searchProcedures')}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600"
                >
                  <option value="all">{t('common.all')}</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('crm.billing.procedureName')}</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.billing.category')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.billing.price')}</th>
                    <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedProcedures.map((proc) => (
                    <tr key={proc.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{proc.name}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">{proc.category}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-bold text-gray-900">{proc.currency}{proc.price.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${proc.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {proc.active ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginatedProcedures.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">{t('common.noResults')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">
                  {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredProcedures.length)} / {filteredProcedures.length}
                </p>
                <div className="flex items-center gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-medium ${page === currentPage ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: Receive Payment
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'payment' && (
          <div className="p-5 sm:p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{t('crm.billing.newPayment')}</h2>
                  <p className="text-xs text-gray-500">{t('crm.billing.newPaymentDesc')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Patient */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('common.patient')} *</label>
                  <select
                    value={payForm.patient}
                    onChange={(e) => setPayForm({ ...payForm, patient: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                  >
                    <option value="">{t('crm.billing.selectPatient')}</option>
                    {PATIENT_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Procedure */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('crm.billing.procedure')} *</label>
                  <select
                    value={payForm.procedure}
                    onChange={(e) => {
                      const proc = procedures.find(p => p.name === e.target.value);
                      setPayForm({ ...payForm, procedure: e.target.value, amount: proc ? String(proc.price) : payForm.amount });
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                  >
                    <option value="">{t('crm.billing.selectProcedure')}</option>
                    {procedures.filter(p => p.active).map(p => <option key={p.id} value={p.name}>{p.name} — {p.currency}{p.price}</option>)}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('common.amount')} (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('crm.billing.paymentMethod')} *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'cash', label: t('crm.billing.cash'), icon: Banknote, color: 'emerald' },
                      { key: 'credit_card', label: t('crm.billing.creditCard'), icon: CreditCard, color: 'blue' },
                      { key: 'bank_transfer', label: t('crm.billing.bankTransfer'), icon: Building2, color: 'violet' },
                    ].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setPayForm({ ...payForm, method: m.key })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          payForm.method === m.key
                            ? `border-${m.color}-400 bg-${m.color}-50 shadow-sm`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <m.icon className={`w-5 h-5 ${payForm.method === m.key ? `text-${m.color}-600` : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${payForm.method === m.key ? `text-${m.color}-700` : 'text-gray-600'}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('common.notes')}</label>
                  <textarea
                    value={payForm.notes}
                    onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                    placeholder={t('crm.billing.paymentNotes')}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={!payForm.patient || !payForm.procedure || !payForm.amount}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {t('crm.billing.recordPayment')}
                  </button>
                  <button
                    onClick={resetPaymentForm}
                    className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4">{t('crm.billing.recentPayments')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('crm.billing.receipt')}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('common.patient')}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('crm.billing.procedure')}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('crm.billing.paymentMethod')}</th>
                      <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('common.amount')}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2.5"><span className="text-xs font-mono font-medium text-teal-600">{p.invoice}</span></td>
                        <td className="px-3 py-2.5"><span className="text-sm font-medium text-gray-900">{p.patient}</span></td>
                        <td className="px-3 py-2.5"><span className="text-xs text-gray-600">{p.procedure}</span></td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            {p.method === 'cash' && <Banknote className="w-3 h-3" />}
                            {p.method === 'credit_card' && <CreditCard className="w-3 h-3" />}
                            {p.method === 'bank_transfer' && <Building2 className="w-3 h-3" />}
                            {p.method === 'cash' ? t('crm.billing.cash') : p.method === 'credit_card' ? t('crm.billing.creditCard') : t('crm.billing.bankTransfer')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right"><span className="text-sm font-bold text-gray-900">€{p.status === 'partial' ? p.paid : p.amount}</span></td>
                        <td className="px-3 py-2.5"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 3: Outstanding Balances
           ═══════════════════════════════════════════════════════════ */}
        {activeTab === 'balances' && (
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900">{t('crm.billing.debtorList')}</h2>
                <span className="text-xs text-gray-500">({OUTSTANDING_PATIENTS.length} {t('crm.billing.patients')})</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('crm.billing.totalOutstanding')}</p>
                <p className="text-base font-bold text-red-600">€{stats.totalOutstanding.toLocaleString()}</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {OUTSTANDING_PATIENTS.sort((a, b) => b.totalOwed - a.totalOwed).map((patient) => (
                <div key={patient.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center text-red-600 text-sm font-bold flex-shrink-0">
                        {patient.patient[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900">{patient.patient}</p>
                          <OverdueBadge days={patient.daysOverdue} />
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{patient.phone}</p>
                        <div className="space-y-1.5">
                          {patient.procedures.map((proc, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs">
                              <span className="text-gray-600 flex-1">{proc.name}</span>
                              <span className="text-gray-400">{proc.date}</span>
                              <span className="text-gray-500">{t('common.total')}: €{proc.total}</span>
                              <span className="text-emerald-600">{t('crm.billing.paidAmount')}: €{proc.paid}</span>
                              <span className="text-red-600 font-semibold">{t('crm.billing.remaining')}: €{proc.remaining}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-red-600">€{patient.totalOwed.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {patient.lastPayment ? `${t('crm.billing.lastPayment')}: ${patient.lastPayment}` : t('crm.billing.noPaymentYet')}
                      </p>
                      <button className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-medium hover:bg-teal-700 transition-colors">
                        <Wallet className="w-3 h-3" />
                        {t('crm.billing.collectPayment')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {OUTSTANDING_PATIENTS.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('crm.billing.noOutstanding')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: Payment Success
         ═══════════════════════════════════════════════════════════ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetPaymentForm} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{t('crm.billing.paymentRecorded')}</h3>
            <p className="text-sm text-gray-500 mb-1">{payForm.patient} — {payForm.procedure}</p>
            <p className="text-2xl font-bold text-emerald-600 mb-4">€{Number(payForm.amount).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mb-4">
              {payForm.method === 'cash' ? t('crm.billing.cash') : payForm.method === 'credit_card' ? t('crm.billing.creditCard') : t('crm.billing.bankTransfer')}
            </p>
            <button onClick={resetPaymentForm} className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMBilling;
