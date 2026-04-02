import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorBillingAPI } from '../lib/api';
import { useTranslation } from 'react-i18next';
import {
  Plus, FileText, Search, Filter, ChevronDown, X,
  CheckCircle, Clock, AlertCircle, XCircle, Loader2,
  DollarSign, TrendingUp, Calendar, Download,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  paid:      { label: 'Paid',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',  icon: CheckCircle  },
  pending:   { label: 'Pending',   color: 'bg-amber-100  text-amber-700  border-amber-200',    icon: Clock        },
  partial:   { label: 'Partial',   color: 'bg-blue-100   text-blue-700   border-blue-200',     icon: AlertCircle  },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100   text-gray-500   border-gray-200',     icon: XCircle      },
};

const CURRENCIES = ['EUR', 'USD', 'TRY', 'GBP'];
const PAYMENT_METHODS = ['cash', 'credit_card', 'bank_transfer', 'insurance'];

function fmt(amount, currency = 'EUR') {
  const n = typeof amount === 'number' ? amount : Number(amount) || 0;
  const symbols = { EUR: '€', USD: '$', TRY: '₺', GBP: '£' };
  return `${symbols[currency] || currency} ${n.toFixed(2)}`;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Add Invoice Modal ─────────────────────────────────────────────────────────

function AddInvoiceModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patient_id: '',
    currency: 'EUR',
    tax_rate: '0',
    discount_amount: '0',
    payment_method: '',
    notes: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    items: [{ description: '', category: 'Consultation', quantity: '1', unit_price: '' }],
  });

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateItem = (idx, key, val) =>
    setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }));

  const addItem = () =>
    setForm(p => ({ ...p, items: [...p.items, { description: '', category: 'Consultation', quantity: '1', unit_price: '' }] }));

  const removeItem = (idx) =>
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, it) => {
    const qty = parseInt(it.quantity) || 1;
    const price = parseFloat(it.unit_price) || 0;
    return s + qty * price;
  }, 0);
  const taxAmt = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const discount = parseFloat(form.discount_amount) || 0;
  const grandTotal = Math.max(0, subtotal + taxAmt - discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.patient_id.trim()) { setError('Patient ID (UUID) is required'); return; }
    if (!form.items.some(it => it.description && it.unit_price)) { setError('At least one line item is required'); return; }
    try {
      setSaving(true);
      const payload = {
        ...form,
        items: form.items
          .filter(it => it.description && it.unit_price)
          .map(it => ({
            description: it.description,
            category: it.category || null,
            quantity: parseInt(it.quantity) || 1,
            unit_price: parseFloat(it.unit_price),
          })),
      };
      await doctorBillingAPI.createInvoice(payload);
      onCreated();
      onClose();
      setForm({ patient_id: '', currency: 'EUR', tax_rate: '0', discount_amount: '0', payment_method: '', notes: '', issue_date: new Date().toISOString().slice(0, 10), due_date: '', items: [{ description: '', category: 'Consultation', quantity: '1', unit_price: '' }] });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-4 px-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">New Invoice</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Patient & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Patient ID (UUID) *</label>
              <input
                value={form.patient_id}
                onChange={e => setField('patient_id', e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
              <select value={form.currency} onChange={e => setField('currency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Issue Date *</label>
              <input type="date" value={form.issue_date} onChange={e => setField('issue_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setField('due_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Line Items *</label>
              <button type="button" onClick={addItem}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2.5">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-start">
                  <input
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="Description (e.g. Consultation)"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-16 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 text-center"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    min="0"
                    step="0.01"
                    onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                    placeholder="Price"
                    className="w-24 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 text-right"
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax / Discount / Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tax Rate (%)</label>
              <input type="number" value={form.tax_rate} min="0" max="100" step="0.01"
                onChange={e => setField('tax_rate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount</label>
              <input type="number" value={form.discount_amount} min="0" step="0.01"
                onChange={e => setField('discount_amount', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment Method</label>
              <select value={form.payment_method} onChange={e => setField('payment_method', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40">
                <option value="">— Select —</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2}
              placeholder="Optional notes for this invoice..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 resize-none" />
          </div>

          {/* Totals Summary */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>{fmt(subtotal, form.currency)}</span>
            </div>
            {taxAmt > 0 && <div className="flex justify-between text-xs text-gray-500">
              <span>Tax ({form.tax_rate}%)</span><span>{fmt(taxAmt, form.currency)}</span>
            </div>}
            {discount > 0 && <div className="flex justify-between text-xs text-gray-500">
              <span>Discount</span><span>−{fmt(discount, form.currency)}</span>
            </div>}
            <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
              <span>Grand Total</span><span className="text-teal-600">{fmt(grandTotal, form.currency)}</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-sm ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DoctorBilling() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Guard: only doctors
  useEffect(() => {
    if (user && user.role !== 'doctor') navigate('/dashboard', { replace: true });
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSearch) params.search = filterSearch;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      params.per_page = 30;

      const [invRes, statsRes] = await Promise.allSettled([
        doctorBillingAPI.invoices(params),
        doctorBillingAPI.stats(),
      ]);

      if (invRes.status === 'fulfilled') {
        const raw = invRes.value;
        setInvoices(raw?.data?.data || raw?.data || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data || statsRes.value || null);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [filterStatus, filterSearch, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await doctorBillingAPI.updateInvoice(id, { status: newStatus });
      fetchData();
    } catch { /* silent */ }
  };

  // ── Stats Cards ──
  const thisMonth = stats?.this_month ?? {};
  const totalAmount = thisMonth?.total ?? 0;
  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const currency = invoices[0]?.currency || 'EUR';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              Billing & Invoices
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your invoices and track payments</p>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Total This Month',
              value: fmt(totalAmount, currency),
              icon: TrendingUp,
              color: 'text-teal-600',
              bg: 'bg-teal-50',
            },
            {
              label: 'Pending Invoices',
              value: pendingCount,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Paid This Month',
              value: paidCount,
              icon: CheckCircle,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                placeholder="Search invoice # or patient..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40 bg-white"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showFilters && (
            <div className="px-3 pb-3 flex gap-3 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">From:</label>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">To:</label>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
              </div>
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50">
                  <X className="w-3 h-3" /> Clear dates
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Invoices Table ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No invoices yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first invoice to get started</p>
              <button
                onClick={() => setAddModal(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Invoice #</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-3">Patient</th>
                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-3">Date</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-3">Amount</th>
                    <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-3">Status</th>
                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-teal-700 font-mono">{inv.invoice_number}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {inv.patient?.fullname || inv.patient?.name || '—'}
                          </p>
                          {inv.patient?.email && (
                            <p className="text-[11px] text-gray-400">{inv.patient.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-bold text-gray-900">{fmt(inv.grand_total, inv.currency)}</span>
                        {inv.paid_amount > 0 && inv.status !== 'paid' && (
                          <p className="text-[11px] text-emerald-600 font-medium">{fmt(inv.paid_amount, inv.currency)} paid</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'paid')}
                              title="Mark as Paid"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {inv.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'cancelled')}
                              title="Cancel Invoice"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Invoice Modal */}
      <AddInvoiceModal
        open={addModal}
        onClose={() => setAddModal(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
