import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, CreditCard, Banknote, Building2, Plus, Search, Filter,
  ChevronLeft, ChevronRight, X, Check, AlertTriangle, Clock,
  TrendingUp, Users, FileText, Download, Loader2,
  Wallet, CircleDollarSign, Eye, CalendarPlus, CalendarDays,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { billingAPI, patientAPI } from '../../lib/api';
import ProTeaser from '../../components/crm/ProTeaser';
import { blockNonNumeric } from '../../utils/numericInput';
import CRMModal, { ModalLabel, ModalInput, ModalSelect, ModalTextarea, ModalPrimaryButton, ModalCancelButton } from '../../components/crm/CRMModal';

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (v, currency = 'EUR') => {
  const sym = { EUR: '€', USD: '$', TRY: '₺', GBP: '£' }[currency] || currency + ' ';
  return `${sym}${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatusBadge = ({ status }) => {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    partial: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, bg, iconColor, border }) => (
  <div className={`bg-white rounded-2xl border ${border} p-4 sm:p-5 hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
    <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

// ─── Create Invoice Modal ────────────────────────────────────
const CreateInvoiceModal = ({ onClose, onCreated, t }) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [form, setForm] = useState({
    patient_id: '',
    tax_rate: '0',
    discount_amount: '0',
    currency: 'EUR',
    payment_method: '',
    notes: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
  });
  const [items, setItems] = useState([{ description: '', category: '', quantity: 1, unit_price: '' }]);

  useEffect(() => {
    setPatientsLoading(true);
    patientAPI.list({ per_page: 200 })
      .then(res => {
        const data = res?.data || res;
        setPatients(data.data || []);
      })
      .catch(() => {})
      .finally(() => setPatientsLoading(false));
  }, []);

  const addItem = () => setItems(prev => [...prev, { description: '', category: '', quantity: 1, unit_price: '' }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 1) * (Number(it.unit_price) || 0), 0);
  const taxAmount = subtotal * (Number(form.tax_rate) || 0) / 100;
  const discount = Number(form.discount_amount) || 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);

  const canSubmit = form.patient_id && items.length > 0 && items.every(it => it.description && Number(it.unit_price) > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await billingAPI.createInvoice({
        ...form,
        tax_rate: Number(form.tax_rate) || 0,
        discount_amount: Number(form.discount_amount) || 0,
        items: items.map(it => ({
          description: it.description,
          category: it.category || null,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price),
        })),
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create invoice error:', err);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CRMModal
      isOpen={true}
      onClose={onClose}
      title={t('crm.billing.createInvoice', 'Create Invoice')}
      subtitle={t('crm.billing.createInvoiceDesc', 'Add items, set pricing and generate an invoice')}
      icon={Receipt}
      maxWidth="max-w-2xl"
      footer={
        <>
          <ModalCancelButton onClick={onClose}>{t('common.cancel')}</ModalCancelButton>
          <ModalPrimaryButton onClick={handleSubmit} disabled={loading || !canSubmit}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            {t('crm.billing.createInvoice', 'Create Invoice')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="px-7 py-7 space-y-6">
        {/* Patient */}
        <div>
          <ModalLabel required icon={Users}>{t('common.patient', 'Patient')}</ModalLabel>
          {patientsLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 h-10"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading patients...</div>
          ) : (
            <ModalSelect value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">{t('crm.billing.selectPatient', 'Select patient...')}</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullname} — {p.email || p.mobile || ''}</option>)}
            </ModalSelect>
          )}
        </div>

        {/* Service Items — Table Style */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <ModalLabel required icon={FileText}>{t('crm.billing.serviceItems', 'Service Items')}</ModalLabel>
            <button onClick={addItem} className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 hover:bg-teal-50 px-2 py-1 rounded-lg transition-colors">
              <Plus className="w-3 h-3" /> {t('crm.billing.addItem', 'Add Item')}
            </button>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 mb-1.5">
            <span className="col-span-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</span>
            <span className="col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Category</span>
            <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Qty</span>
            <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Price</span>
            <span className="col-span-1" />
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" placeholder="Description *" value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    className="col-span-12 sm:col-span-4 h-9 px-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white" />
                  <input type="text" placeholder="Category" value={item.category}
                    onChange={e => updateItem(i, 'category', e.target.value)}
                    className="col-span-6 sm:col-span-3 h-9 px-3 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white" />
                  <input type="number" min="1" placeholder="1" value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                    onKeyDown={blockNonNumeric}
                    className="col-span-3 sm:col-span-2 h-9 px-2 text-xs border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white" />
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    onKeyDown={blockNonNumeric}
                    className="col-span-3 sm:col-span-2 h-9 px-2 text-xs border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none bg-white" />
                  <div className="col-span-12 sm:col-span-1 flex items-center justify-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <ModalLabel icon={CircleDollarSign}>Currency</ModalLabel>
            <ModalSelect value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
              {['EUR', 'USD', 'TRY', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
            </ModalSelect>
          </div>
          <div>
            <ModalLabel>{t('crm.billing.taxRate', 'Tax Rate')} (%)</ModalLabel>
            <ModalInput type="number" min="0" max="100" step="0.01" value={form.tax_rate}
              onChange={e => setForm({ ...form, tax_rate: e.target.value })}
              onKeyDown={blockNonNumeric}
              className="text-right" />
          </div>
          <div>
            <ModalLabel>{t('crm.billing.discount', 'Discount')}</ModalLabel>
            <ModalInput type="number" min="0" step="0.01" value={form.discount_amount}
              onChange={e => setForm({ ...form, discount_amount: e.target.value })}
              onKeyDown={blockNonNumeric}
              className="text-right" />
          </div>
          <div>
            <ModalLabel icon={CreditCard}>{t('crm.billing.paymentMethod', 'Payment')}</ModalLabel>
            <ModalSelect value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option value="">—</option>
              <option value="cash">{t('crm.billing.cash', 'Cash')}</option>
              <option value="credit_card">{t('crm.billing.creditCard', 'Credit Card')}</option>
              <option value="bank_transfer">{t('crm.billing.bankTransfer', 'Bank Transfer')}</option>
            </ModalSelect>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ModalLabel icon={CalendarDays}>{t('crm.billing.issueDate', 'Issue Date')}</ModalLabel>
            <ModalInput type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
          </div>
          <div>
            <ModalLabel icon={CalendarDays}>{t('crm.billing.dueDate', 'Due Date')}</ModalLabel>
            <ModalInput type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <ModalLabel icon={FileText}>{t('common.notes', 'Notes')}</ModalLabel>
          <ModalTextarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
            placeholder="Additional notes for the invoice..." />
        </div>

        {/* Totals Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl px-5 py-4 space-y-2 border border-gray-200/60">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-700">{fmt(subtotal, form.currency)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Tax ({form.tax_rate}%)</span><span className="font-semibold text-gray-700">{fmt(taxAmount, form.currency)}</span></div>
          {discount > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Discount</span><span className="font-semibold text-red-500">-{fmt(discount, form.currency)}</span></div>}
          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2.5 mt-1">
            <span className="text-gray-900">Grand Total</span>
            <span className="text-teal-700">{fmt(grandTotal, form.currency)}</span>
          </div>
        </div>
      </div>
    </CRMModal>
  );
};

// ─── Record Payment Modal ────────────────────────────────────
const PaymentModal = ({ invoice, onClose, onUpdated, t }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(invoice.payment_method || 'cash');
  const [loading, setLoading] = useState(false);

  const remaining = Number(invoice.grand_total) - Number(invoice.paid_amount);

  const handleSubmit = async () => {
    const paidAmount = Number(amount);
    if (!paidAmount || paidAmount <= 0) return;
    setLoading(true);
    try {
      const totalPaid = Number(invoice.paid_amount) + paidAmount;
      await billingAPI.updateInvoice(invoice.id, {
        paid_amount: totalPaid,
        payment_method: method,
        status: totalPaid >= Number(invoice.grand_total) ? 'paid' : 'partial',
      });
      onUpdated();
      onClose();
    } catch {
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{t('crm.billing.recordPayment', 'Record Payment')}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">{invoice.invoice_number}</p>
            <p className="text-sm font-bold text-gray-900">{invoice.patient?.fullname}</p>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-500">Grand Total: <strong>{fmt(invoice.grand_total, invoice.currency)}</strong></span>
              <span className="text-amber-600">Remaining: <strong>{fmt(remaining, invoice.currency)}</strong></span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('common.amount')} *</label>
            <input type="number" min="0.01" max={remaining} step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder={`Max: ${remaining.toFixed(2)}`}
              onKeyDown={blockNonNumeric}
              className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('crm.billing.paymentMethod', 'Payment Method')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', label: 'Cash', icon: Banknote },
                { key: 'credit_card', label: 'Card', icon: CreditCard },
                { key: 'bank_transfer', label: 'Bank', icon: Building2 },
              ].map(m => (
                <button key={m.key} onClick={() => setMethod(m.key)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                    method === m.key ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  <m.icon className="w-4 h-4" />{m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">{t('common.cancel')}</button>
            <button onClick={handleSubmit} disabled={loading || !amount || Number(amount) <= 0}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('crm.billing.recordPayment', 'Record Payment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const CRMBilling = () => {
  const { t } = useTranslation();
  const { user, isPro } = useAuth();

  const navigate = useNavigate();

  // Data
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [outstanding, setOutstanding] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;
  const searchRef = useRef(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('invoices');

  // Currency
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const availableCurrencies = stats?.available_currencies || [];

  // ── Fetch invoices ──
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: perPage, page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await billingAPI.invoices(params);
      const data = res?.data || res;
      setInvoices(data.data || []);
      setPagination({ total: data.total || 0, last_page: data.last_page || 1 });
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const params = {};
      if (selectedCurrency) params.currency = selectedCurrency;
      const res = await billingAPI.stats(params);
      setStats(res?.data || res);
    } catch {}
  }, [selectedCurrency]);

  const fetchOutstanding = useCallback(async () => {
    try {
      const res = await billingAPI.outstanding({ limit: 20 });
      setOutstanding(res?.data || res || []);
    } catch {}
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchStats(); fetchOutstanding(); }, [fetchStats, fetchOutstanding]);

  const handleSearch = (value) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setSearch(value); setPage(1); }, 400);
  };

  const handleRefresh = () => { fetchInvoices(); fetchStats(); fetchOutstanding(); };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const res = await billingAPI.invoicePdf(invoiceId);
      const blob = new Blob([res.data || res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF');
    }
  };

  const currency = stats?.currency || 'EUR';

  const tabs = [
    { key: 'invoices', label: t('crm.billing.invoices', 'Invoices'), icon: Receipt },
    { key: 'outstanding', label: t('crm.billing.outstandingBalances', 'Outstanding'), icon: AlertTriangle },
  ];

  if (user?.role_id === 'doctor' && !isPro) return <ProTeaser page="billing" />;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.billing.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.billing.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" />
          {t('crm.billing.createInvoice', 'Create Invoice')}
        </button>
      </div>

      {/* ─── KPI Stats ─── */}
      {stats && (
        <div className="space-y-3">
        {/* Currency selector */}
        {availableCurrencies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('crm.billing.currency', 'Currency')}:</span>
            <div className="flex items-center gap-1">
              {availableCurrencies.map(cur => (
                <button key={cur} onClick={() => setSelectedCurrency(cur)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    (selectedCurrency || stats.currency) === cur
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {cur}
                </button>
              ))}
            </div>
            {/* Mini per-currency summary */}
            {stats.by_currency?.length > 1 && (
              <div className="ml-auto flex items-center gap-3">
                {stats.by_currency.map(bc => (
                  <span key={bc.currency} className="text-[11px] text-gray-500">
                    <strong className="text-gray-700">{bc.currency}</strong>: {fmt(bc.total_revenue, bc.currency)} collected · {fmt(bc.receivable_amount, bc.currency)} receivable
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label={t('crm.billing.totalCollected', 'Collected')} value={fmt(stats.total_revenue, stats.currency)} icon={CircleDollarSign} bg="bg-emerald-50" iconColor="text-emerald-600" border="border-emerald-100" />
          <StatCard label={t('crm.billing.receivable', 'Receivable')} value={fmt(stats.receivable_amount, stats.currency)} icon={Wallet} bg="bg-amber-50" iconColor="text-amber-600" border="border-amber-100" />
          <StatCard label={t('crm.billing.monthlyRevenue', 'Monthly Revenue')} value={fmt(stats.monthly_revenue, stats.currency)} icon={TrendingUp} bg="bg-blue-50" iconColor="text-blue-600" border="border-blue-100" />
          <StatCard label={t('crm.billing.todayRevenue', "Today's Revenue")} value={fmt(stats.today_revenue, stats.currency)} icon={Clock} bg="bg-teal-50" iconColor="text-teal-600" border="border-teal-100" />
          <StatCard label={t('crm.billing.overdueInvoices', 'Overdue')} value={stats.overdue_count} icon={AlertTriangle} bg="bg-red-50" iconColor="text-red-600" border="border-red-100" />
        </div>
        </div>
      )}

      {/* ─── Tabs Card ─── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key ? 'border-teal-500 text-teal-700 bg-teal-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
              {tab.key === 'outstanding' && outstanding.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{outstanding.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ TAB: Invoices ═══ */}
        {activeTab === 'invoices' && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-gray-50 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input type="text" placeholder={t('crm.billing.searchInvoices', 'Search invoices...')}
                  defaultValue={search} onChange={e => handleSearch(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
              </div>
              <div className="flex items-center gap-2">
                {['', 'pending', 'partial', 'paid', 'cancelled'].map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      statusFilter === s ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    {s || t('common.all')}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('crm.billing.invoice', 'Invoice')}</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.patient')}</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.billing.date', 'Date')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.amount')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.billing.paid', 'Paid')}</th>
                    <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('common.status')}</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" /></td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">{t('common.noResults')}</p>
                      <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium">Create your first invoice</button>
                    </td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-semibold text-teal-600">{inv.invoice_number}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{inv.patient?.fullname || '—'}</p>
                        <p className="text-[11px] text-gray-400">{inv.patient?.email || ''}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-xs text-gray-700">{inv.issue_date}</p>
                        {inv.due_date && <p className="text-[10px] text-gray-400">Due: {inv.due_date}</p>}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-bold text-gray-900">{fmt(inv.grand_total, inv.currency)}</span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-medium text-emerald-600">{fmt(inv.paid_amount, inv.currency)}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDownloadPdf(inv.id)}
                            className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600" title="Download PDF">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button onClick={() => setPaymentInvoice(inv)}
                              className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-600" title="Record Payment">
                              <Wallet className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">
                  {((page - 1) * perPage) + 1}–{Math.min(page * perPage, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: Math.min(pagination.last_page, 7) }, (_, i) => {
                    let pn;
                    if (pagination.last_page <= 7) pn = i + 1;
                    else if (page <= 4) pn = i + 1;
                    else if (page >= pagination.last_page - 3) pn = pagination.last_page - 6 + i;
                    else pn = page - 3 + i;
                    return (
                      <button key={pn} onClick={() => setPage(pn)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium ${pn === page ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {pn}
                      </button>
                    );
                  })}
                  <button disabled={page === pagination.last_page} onClick={() => setPage(page + 1)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: Outstanding Balances ═══ */}
        {activeTab === 'outstanding' && (
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900">{t('crm.billing.debtorList', 'Outstanding Balances')}</h2>
                <span className="text-xs text-gray-500">({outstanding.length} patients)</span>
              </div>
            </div>
            {outstanding.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('crm.billing.noOutstanding', 'No outstanding balances')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {outstanding.map((entry, idx) => (
                  <div key={idx} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-amber-100 flex items-center justify-center text-red-600 text-sm font-bold flex-shrink-0">
                          {entry.patient?.fullname?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{entry.patient?.fullname}</p>
                          <p className="text-xs text-gray-500 mb-2">{entry.patient?.mobile || entry.patient?.email || ''}</p>
                          <div className="space-y-1.5">
                            {(entry.invoices || []).map((inv, i) => (
                              <div key={i} className="flex items-center gap-3 text-xs flex-wrap">
                                <span className="font-mono text-teal-600 font-medium">{inv.invoice_number}</span>
                                <span className="text-gray-400">{inv.issue_date}</span>
                                <span className="text-gray-500">Total: {fmt(inv.grand_total)}</span>
                                <span className="text-emerald-600">Paid: {fmt(inv.paid_amount)}</span>
                                <span className="text-red-600 font-semibold">Remaining: {fmt(inv.remaining)}</span>
                                {inv.overdue && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">OVERDUE</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-red-600">{fmt(entry.total_owed)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{entry.invoice_count} invoice(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {showCreate && (
        <CreateInvoiceModal onClose={() => setShowCreate(false)} onCreated={handleRefresh} t={t} />
      )}
      {paymentInvoice && (
        <PaymentModal invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} onUpdated={handleRefresh} t={t} />
      )}
    </div>
  );
};

export default CRMBilling;
