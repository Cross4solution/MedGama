import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, Phone, Mail, Check, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { branchAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const emptyBranch = { name: '', address: '', city: '', country: '', latitude: '', longitude: '', phone: '', email: '', is_active: true };

export default function CRMBranches() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyBranch);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchAPI.list();
      setBranches(res?.data || []);
    } catch {
      notify({ type: 'error', title: t('common.error', 'Error'), message: t('crm.branches.fetchError', 'Failed to load branches.') });
    }
    setLoading(false);
  }, [notify, t]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openCreate = () => { setEditId(null); setForm(emptyBranch); setShowModal(true); };
  const openEdit = (b) => { setEditId(b.id); setForm({ name: b.name || '', address: b.address || '', city: b.city || '', country: b.country || '', latitude: b.latitude || '', longitude: b.longitude || '', phone: b.phone || '', email: b.email || '', is_active: b.is_active ?? true }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null };
      if (editId) {
        await branchAPI.update(editId, payload);
        notify({ type: 'success', title: t('common.success', 'Success'), message: t('crm.branches.updated', 'Branch updated.') });
      } else {
        await branchAPI.create(payload);
        notify({ type: 'success', title: t('common.success', 'Success'), message: t('crm.branches.created', 'Branch created.') });
      }
      setShowModal(false);
      fetchBranches();
    } catch (err) {
      notify({ type: 'error', title: t('common.error', 'Error'), message: err?.message || 'Failed to save.' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await branchAPI.remove(deleteId);
      notify({ type: 'success', title: t('common.success', 'Success'), message: t('crm.branches.deleted', 'Branch deleted.') });
      setDeleteId(null);
      fetchBranches();
    } catch (err) {
      notify({ type: 'error', title: t('common.error', 'Error'), message: err?.message || 'Failed to delete.' });
    }
  };

  const Field = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('crm.branches.title', 'Branches')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('crm.branches.subtitle', 'Manage your hospital branch locations across the network.')}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          {t('crm.branches.add', 'Add Branch')}
        </button>
      </div>

      {/* Branch List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('crm.branches.empty', 'No branches yet')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('crm.branches.emptyHint', 'Add your first branch to start building your network.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map(b => (
            <div key={b.id} className={`relative bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${!b.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{b.name}</h3>
                    {b.city && <p className="text-xs text-gray-400">{b.city}{b.country ? `, ${b.country}` : ''}</p>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                </span>
              </div>

              {b.address && (
                <div className="flex items-start gap-2 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{b.address}</span>
                </div>
              )}
              {b.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {b.phone}
                </div>
              )}
              {b.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {b.email}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(b)} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                  <Edit2 className="w-3.5 h-3.5" /> {t('common.edit', 'Edit')}
                </button>
                <button onClick={() => setDeleteId(b.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium ml-auto">
                  <Trash2 className="w-3.5 h-3.5" /> {t('common.delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? t('crm.branches.editTitle', 'Edit Branch') : t('crm.branches.addTitle', 'Add Branch')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label={t('crm.branches.name', 'Branch Name')} name="name" placeholder="e.g. Downtown Branch" />
              <Field label={t('crm.branches.address', 'Address')} name="address" placeholder="Full street address" />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('crm.branches.city', 'City')} name="city" placeholder="Istanbul" />
                <Field label={t('crm.branches.country', 'Country')} name="country" placeholder="Turkey" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('crm.branches.latitude', 'Latitude')} name="latitude" type="number" placeholder="41.0082" />
                <Field label={t('crm.branches.longitude', 'Longitude')} name="longitude" type="number" placeholder="28.9784" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('crm.branches.phone', 'Phone')} name="phone" placeholder="+90 212 ..." />
                <Field label={t('crm.branches.email', 'Email')} name="email" type="email" placeholder="branch@hospital.com" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <label htmlFor="is_active" className="text-sm text-gray-700">{t('crm.branches.isActive', 'Active branch')}</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? t('common.save', 'Save') : t('common.create', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('crm.branches.deleteTitle', 'Delete Branch?')}</h3>
            <p className="text-sm text-gray-500 mb-5">{t('crm.branches.deleteConfirm', 'This action cannot be undone.')}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel', 'Cancel')}</button>
              <button onClick={handleDelete} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">{t('common.delete', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
