import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Search, Phone, Mail, Globe, Edit2, Trash2,
  Loader2, X, CheckCircle, XCircle, Building2, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { branchAPI } from '../../lib/api';
import CRMModal, {
  ModalLabel, ModalInput, ModalPrimaryButton, ModalCancelButton,
} from '../../components/crm/CRMModal';

// ─── Branch Form Modal ───────────────────────────────────────────────────────
const BranchFormModal = ({ isOpen, onClose, onSaved, branch = null }) => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const isEdit = !!branch;

  const emptyForm = {
    name: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    country: '',
    lat: '',
    lng: '',
    is_active: true,
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (branch) {
      setForm({
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        city: branch.city || '',
        country: branch.country || '',
        lat: branch.coordinates?.lat ?? '',
        lng: branch.coordinates?.lng ?? '',
        is_active: branch.is_active ?? true,
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, branch]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify({ type: 'error', message: t('branches.nameRequired', 'Branch name is required.') });
      return;
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      is_active: form.is_active,
    };

    if (form.lat && form.lng) {
      payload.coordinates = { lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
    }

    setSaving(true);
    try {
      let result;
      if (isEdit) {
        result = await branchAPI.update(branch.id, payload);
      } else {
        result = await branchAPI.create(payload);
      }
      notify({
        type: 'success',
        message: isEdit
          ? t('branches.updated', 'Branch updated successfully.')
          : t('branches.created', 'Branch created successfully.'),
      });
      onSaved?.(result?.data);
      onClose();
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Failed to save branch.';
      notify({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <CRMModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('branches.editBranch', 'Edit Branch') : t('branches.addBranch', 'Add New Branch')}
    >
      <div className="space-y-4">
        <div>
          <ModalLabel>{t('branches.name', 'Branch Name')} *</ModalLabel>
          <ModalInput
            placeholder={t('branches.namePlaceholder', 'e.g. Downtown Clinic')}
            value={form.name}
            onChange={set('name')}
          />
        </div>

        <div>
          <ModalLabel>{t('branches.address', 'Address')}</ModalLabel>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            rows={2}
            placeholder={t('branches.addressPlaceholder', 'Full street address')}
            value={form.address}
            onChange={set('address')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <ModalLabel>{t('branches.city', 'City')}</ModalLabel>
            <ModalInput
              placeholder="Istanbul"
              value={form.city}
              onChange={set('city')}
            />
          </div>
          <div>
            <ModalLabel>{t('branches.country', 'Country')}</ModalLabel>
            <ModalInput
              placeholder="Turkey"
              value={form.country}
              onChange={set('country')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <ModalLabel>{t('branches.phone', 'Phone')}</ModalLabel>
            <ModalInput
              placeholder="+90 212 000 0000"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>
          <div>
            <ModalLabel>{t('branches.email', 'Email')}</ModalLabel>
            <ModalInput
              type="email"
              placeholder="branch@hospital.com"
              value={form.email}
              onChange={set('email')}
            />
          </div>
        </div>

        {/* Map coordinates */}
        <div>
          <ModalLabel className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-500" />
            {t('branches.coordinates', 'Map Coordinates')}
          </ModalLabel>
          <div className="grid grid-cols-2 gap-3">
            <ModalInput
              type="number"
              step="any"
              placeholder={t('branches.latitude', 'Latitude')}
              value={form.lat}
              onChange={set('lat')}
            />
            <ModalInput
              type="number"
              step="any"
              placeholder={t('branches.longitude', 'Longitude')}
              value={form.lng}
              onChange={set('lng')}
            />
          </div>
          {form.lat && form.lng && (
            <a
              href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-teal-600 hover:underline"
            >
              <Globe className="w-3 h-3" />
              {t('branches.previewMap', 'Preview on map')}
            </a>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              form.is_active ? 'bg-teal-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                form.is_active ? 'translate-x-4' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {form.is_active
              ? t('branches.active', 'Active')
              : t('branches.inactive', 'Inactive')}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ModalCancelButton onClick={onClose} disabled={saving} />
          <ModalPrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.saving', 'Saving...')}
              </span>
            ) : isEdit ? (
              t('common.saveChanges', 'Save Changes')
            ) : (
              t('branches.createBranch', 'Create Branch')
            )}
          </ModalPrimaryButton>
        </div>
      </div>
    </CRMModal>
  );
};

// ─── Branch Card ─────────────────────────────────────────────────────────────
const BranchCard = ({ branch, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const hasCoords = branch.coordinates?.lat && branch.coordinates?.lng;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{branch.name}</h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  branch.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {branch.is_active ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {branch.is_active ? t('branches.active', 'Active') : t('branches.inactive', 'Inactive')}
              </span>
            </div>
            {(branch.city || branch.country) && (
              <p className="text-xs text-gray-500 mt-0.5">
                {[branch.city, branch.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(branch)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            title={t('common.edit', 'Edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(branch)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title={t('common.delete', 'Delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-1.5">
        {branch.address && (
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-2">{branch.address}</span>
          </p>
        )}
        {branch.phone && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            {branch.phone}
          </p>
        )}
        {branch.email && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{branch.email}</span>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          <span>{branch.clinics_count ?? 0} {t('branches.clinics', 'clinics')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          <span>{branch.doctors_count ?? 0} {t('branches.doctors', 'doctors')}</span>
        </div>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps?q=${branch.coordinates.lat},${branch.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-teal-600 hover:underline"
          >
            {t('branches.viewMap', 'View on map')}
            <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirmModal = ({ branch, onClose, onConfirm, deleting }) => {
  const { t } = useTranslation();
  if (!branch) return null;

  return (
    <CRMModal isOpen onClose={onClose} title={t('branches.deleteBranch', 'Delete Branch')}>
      <p className="text-sm text-gray-600 mb-6">
        {t('branches.deleteConfirm', 'Are you sure you want to delete')}{' '}
        <strong>{branch.name}</strong>?{' '}
        {t('branches.deleteWarning', 'This action cannot be undone.')}
      </p>
      <div className="flex justify-end gap-2">
        <ModalCancelButton onClick={onClose} disabled={deleting} />
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('common.delete', 'Delete')}
        </button>
      </div>
    </CRMModal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CRMBranches() {
  const { t } = useTranslation();
  const { notify } = useToast();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formModal, setFormModal] = useState({ open: false, branch: null });
  const [deleteModal, setDeleteModal] = useState({ branch: null, deleting: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchAPI.list();
      setBranches(res?.data ?? []);
    } catch (err) {
      notify({ type: 'error', message: t('branches.loadError', 'Failed to load branches.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved) => {
    load();
  };

  const handleDelete = async () => {
    setDeleteModal((d) => ({ ...d, deleting: true }));
    try {
      await branchAPI.delete(deleteModal.branch.id);
      notify({ type: 'success', message: t('branches.deleted', 'Branch deleted.') });
      setBranches((prev) => prev.filter((b) => b.id !== deleteModal.branch.id));
      setDeleteModal({ branch: null, deleting: false });
    } catch (err) {
      notify({ type: 'error', message: t('branches.deleteError', 'Failed to delete branch.') });
      setDeleteModal((d) => ({ ...d, deleting: false }));
    }
  };

  const filtered = branches.filter((b) =>
    !search ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            {t('branches.title', 'Branch Management')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('branches.subtitle', 'Manage your hospital\'s branch locations')}
          </p>
        </div>
        <button
          onClick={() => setFormModal({ open: true, branch: null })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('branches.addBranch', 'Add Branch')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('branches.searchPlaceholder', 'Search branches by name, city or address...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {search
              ? t('branches.noResults', 'No branches match your search.')
              : t('branches.empty', 'No branches yet. Add your first location.')}
          </p>
          {!search && (
            <button
              onClick={() => setFormModal({ open: true, branch: null })}
              className="mt-4 px-4 py-2 rounded-xl border border-teal-200 text-teal-600 text-sm font-medium hover:bg-teal-50 transition-colors"
            >
              {t('branches.addFirst', '+ Add First Branch')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={(b) => setFormModal({ open: true, branch: b })}
              onDelete={(b) => setDeleteModal({ branch: b, deleting: false })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <BranchFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, branch: null })}
        onSaved={handleSaved}
        branch={formModal.branch}
      />
      <DeleteConfirmModal
        branch={deleteModal.branch}
        onClose={() => setDeleteModal({ branch: null, deleting: false })}
        onConfirm={handleDelete}
        deleting={deleteModal.deleting}
      />
    </div>
  );
}
