import React, { useState, useEffect, useCallback } from 'react';
import { blockNonNumericInt } from '../../utils/numericInput';
import {
  Stethoscope, MapPin, FileText, Plus, Pencil, Trash2, X, Save,
  Search, ChevronLeft, ChevronRight, Loader2, Globe,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import LangFlag from '../../components/ui/LangFlag';

// Supported languages for multi-language catalog entries
const LANGS = [
  { code: 'en', label: 'English', countryCode: 'gb' },
  { code: 'tr', label: 'Türkçe', countryCode: 'tr' },
  { code: 'de', label: 'Deutsch', countryCode: 'de' },
  { code: 'fr', label: 'Français', countryCode: 'fr' },
  { code: 'ar', label: 'العربية', countryCode: 'sa' },
  { code: 'ru', label: 'Русский', countryCode: 'ru' },
  { code: 'es', label: 'Español', countryCode: 'es' },
  { code: 'nl', label: 'Nederlands', countryCode: 'nl' },
  { code: 'it', label: 'Italiano', countryCode: 'it' },
  { code: 'pt', label: 'Português', countryCode: 'pt' },
];

const TABS = [
  { key: 'specialties', label: 'Specialties', icon: Stethoscope },
  { key: 'cities', label: 'Cities', icon: MapPin },
  { key: 'diseases', label: 'Diseases (ICD-10)', icon: FileText },
];

// ─── Multi-language name input ───
function MultiLangInput({ value, onChange, label }) {
  const [expanded, setExpanded] = useState(false);
  const val = value || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-1">
          <Globe className="w-3 h-3" /> {expanded ? 'Less' : `${LANGS.length} languages`}
        </button>
      </div>
      {/* Always show EN + TR */}
      <div className="grid grid-cols-2 gap-2 mb-1">
        {LANGS.slice(0, 2).map(lang => (
          <div key={lang.code} className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2"><LangFlag lang={lang} size={16} /></span>
            <input
              type="text"
              placeholder={`${lang.label} *`}
              value={val[lang.code] || ''}
              onChange={e => onChange({ ...val, [lang.code]: e.target.value })}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
          </div>
        ))}
      </div>
      {/* Other languages */}
      {expanded && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          {LANGS.slice(2).map(lang => (
            <div key={lang.code} className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2"><LangFlag lang={lang} size={14} /></span>
              <input
                type="text"
                placeholder={lang.label}
                value={val[lang.code] || ''}
                onChange={e => onChange({ ...val, [lang.code]: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit modal ───
function CatalogModal({ type, item, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    code: item?.code || '',
    name: item?.name || {},
    description: item?.description || {},
    country_id: item?.country_id || 1,
    display_order: item?.display_order || 0,
    recommended_specialty_ids: item?.recommended_specialty_ids || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name?.en || !form.name?.tr) {
      setError('English and Turkish names are required.');
      return;
    }
    if (!isEdit && !form.code) {
      setError('Code is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (type === 'specialties') {
        if (isEdit) await adminAPI.updateSpecialty(item.id, payload);
        else await adminAPI.createSpecialty(payload);
      } else if (type === 'cities') {
        if (isEdit) await adminAPI.updateCity(item.id, payload);
        else await adminAPI.createCity(payload);
      } else if (type === 'diseases') {
        if (isEdit) await adminAPI.updateDisease(item.id, payload);
        else await adminAPI.createDisease(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Check inputs.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? 'Edit' : 'Create'} {type === 'specialties' ? 'Specialty' : type === 'cities' ? 'City' : 'Disease'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Code */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Code *</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              disabled={isEdit}
              placeholder={type === 'diseases' ? 'e.g. J06.9' : 'e.g. cardiology'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Name (multi-lang) */}
          <MultiLangInput label="Name *" value={form.name} onChange={name => setForm(f => ({ ...f, name }))} />

          {/* Description (multi-lang) — for specialties & diseases */}
          {type !== 'cities' && (
            <MultiLangInput label="Description" value={form.description} onChange={description => setForm(f => ({ ...f, description }))} />
          )}

          {/* Country ID — for cities */}
          {type === 'cities' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Country ID</label>
              <input
                type="number"
                value={form.country_id}
                onChange={e => setForm(f => ({ ...f, country_id: parseInt(e.target.value) || 1 }))}
                onKeyDown={blockNonNumericInt}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>
          )}

          {/* Display Order — for specialties */}
          {type === 'specialties' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                onKeyDown={blockNonNumericInt}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Get display name ───
function getName(item, lang = 'en') {
  if (!item?.name) return item?.code || '—';
  if (typeof item.name === 'string') return item.name;
  return item.name[lang] || item.name.en || item.name.tr || item.code || '—';
}

// ─── Main Component ───
export default function AdminCatalog() {
  const [activeTab, setActiveTab] = useState('specialties');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [displayLang, setDisplayLang] = useState('en');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'specialties') res = await adminAPI.specialties();
      else if (activeTab === 'cities') res = await adminAPI.cities();
      else res = await adminAPI.diseases();

      const data = res?.data || res;
      setItems(data?.specialties || data?.cities || data?.diseases || data?.data || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setSearch(''); }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this item?')) return;
    setDeleteLoading(id);
    try {
      if (activeTab === 'specialties') await adminAPI.deleteSpecialty(id);
      else if (activeTab === 'cities') await adminAPI.deleteCity(id);
      // diseases don't have delete in backend
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {}
    setDeleteLoading(null);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const filtered = items.filter(item => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const name = getName(item, displayLang).toLowerCase();
    return name.includes(s) || (item.code || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catalog Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage specialties, cities, and diseases (ICD-10)</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Language selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4 text-gray-400" />
          <select
            value={displayLang}
            onChange={e => setDisplayLang(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-purple-500/20"
          >
            {LANGS.map(l => (
              <option key={l.code} value={l.code}>{l.countryCode.toUpperCase()} {l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No items found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name ({displayLang.toUpperCase()})</th>
                  {activeTab !== 'cities' && <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>}
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Languages</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => {
                  const nameObj = typeof item.name === 'object' ? item.name : {};
                  const langCount = Object.keys(nameObj).filter(k => nameObj[k]).length;
                  const descObj = typeof item.description === 'object' ? item.description : {};

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{item.code}</code>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{getName(item, displayLang)}</td>
                      {activeTab !== 'cities' && (
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                          {descObj[displayLang] || descObj.en || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Globe className="w-2.5 h-2.5" /> {langCount}/{LANGS.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {activeTab !== 'diseases' && (
                            deleteLoading === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                            ) : (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Deactivate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} item(s) shown
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CatalogModal
          type={activeTab}
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={fetchItems}
        />
      )}
    </div>
  );
}
