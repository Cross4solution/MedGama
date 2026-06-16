import React, { useState, useEffect, useCallback } from 'react';
import { blockNonNumericInt } from '../../utils/numericInput';
import {
  Stethoscope, MapPin, FileText, Plus, Pencil, Trash2, X, Save, Tag,
  Search, Loader2, Globe, RefreshCw, CheckCircle2, Hash, ArrowUpDown,
  Heart, Brain, Bone, Eye as EyeIcon, Ear, Baby, Shield, Pill, Scissors, Zap,
  Activity, Microscope, Syringe, Thermometer, Dna, ScanFace, Radiation, Droplets,
  XCircle,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import LangFlag from '../../components/ui/LangFlag';

// ─── Supported languages ─────────────────────────────────────
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
  { key: 'specialties', label: 'Specialties', icon: Stethoscope, color: 'purple' },
  { key: 'cities', label: 'Cities', icon: MapPin, color: 'blue' },
  { key: 'treatments', label: 'Treatments & Symptoms', icon: Tag, color: 'emerald' },
];

// ─── Specialty icon mapping ──────────────────────────────────
const SPECIALTY_ICONS = {
  heart: Heart, brain: Brain, bone: Bone, eye: EyeIcon, ear: Ear, baby: Baby,
  shield: Shield, pill: Pill, scissors: Scissors, zap: Zap, activity: Activity,
  microscope: Microscope, syringe: Syringe, thermometer: Thermometer, dna: Dna,
  scan: ScanFace, radiation: Radiation, droplets: Droplets, stethoscope: Stethoscope,
};
const ICON_OPTIONS = Object.keys(SPECIALTY_ICONS);

function getSpecialtyIcon(code) {
  const map = {
    cardiology: 'heart', neurology: 'brain', orthopedics: 'bone', ophthalmology: 'eye',
    otolaryngology: 'ear', pediatrics: 'baby', dermatology: 'scan', oncology: 'radiation',
    urology: 'droplets', psychiatry: 'brain', radiology: 'radiation', surgery: 'scissors',
    anesthesiology: 'syringe', pathology: 'microscope', endocrinology: 'dna',
    gastroenterology: 'pill', pulmonology: 'activity', gynecology: 'baby',
    rheumatology: 'thermometer', immunology: 'shield',
  };
  const iconKey = map[code?.toLowerCase()] || 'stethoscope';
  return SPECIALTY_ICONS[iconKey] || Stethoscope;
}

// ─── Success Toast ───────────────────────────────────────────
function SuccessToast({ message, show, onClose }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-emerald-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ─── Multi-language name input ───────────────────────────────
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

// ─── Create / Edit modal (sidebar-centered) ──────────────────
function CatalogModal({ type, item, onClose, onSaved, specialties = [] }) {
  const isEdit = !!item;
  const isTreatment = type === 'treatments';
  const [form, setForm] = useState({
    code: item?.code || item?.slug || '',
    name: item?.name || {},
    description: item?.description || {},
    country_id: item?.country_id || 1,
    display_order: item?.display_order || 0,
    icon_name: item?.icon_name || '',
    // Treatment-specific
    specialty_id: item?.specialty_id || '',
    aliases: item?.aliases || { en: [], tr: [] },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aliasInput, setAliasInput] = useState({ en: '', tr: '' });

  const typeLabel = type === 'specialties' ? 'Specialty' : type === 'cities' ? 'City' : 'Treatment Tag';

  const addAlias = (lang) => {
    const val = aliasInput[lang]?.trim();
    if (!val) return;
    const current = form.aliases[lang] || [];
    if (current.includes(val)) return;
    setForm(f => ({ ...f, aliases: { ...f.aliases, [lang]: [...current, val] } }));
    setAliasInput(a => ({ ...a, [lang]: '' }));
  };

  const removeAlias = (lang, idx) => {
    setForm(f => ({
      ...f,
      aliases: { ...f.aliases, [lang]: (f.aliases[lang] || []).filter((_, i) => i !== idx) },
    }));
  };

  const handleSave = async () => {
    if (!form.name?.en || !form.name?.tr) { setError('English and Turkish names are required.'); return; }
    if (!isEdit && !form.code) { setError(isTreatment ? 'Slug is required.' : 'Code is required.'); return; }
    if (isTreatment && !form.specialty_id) { setError('Please select a specialty.'); return; }

    setSaving(true);
    setError('');
    try {
      if (type === 'specialties') {
        const payload = { code: form.code, name: form.name, description: form.description, display_order: form.display_order, icon_name: form.icon_name };
        if (isEdit) await adminAPI.updateSpecialty(item.id, payload);
        else await adminAPI.createSpecialty(payload);
      } else if (type === 'cities') {
        const payload = { code: form.code, name: form.name, country_id: form.country_id };
        if (isEdit) await adminAPI.updateCity(item.id, payload);
        else await adminAPI.createCity(payload);
      } else if (isTreatment) {
        const payload = {
          slug: form.code,
          specialty_id: form.specialty_id,
          name: form.name,
          description: form.description,
          aliases: form.aliases,
          display_order: form.display_order,
        };
        if (isEdit) await adminAPI.updateTreatmentTag(item.id, payload);
        else await adminAPI.createTreatmentTag(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Check inputs.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="lg:pl-64 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/40 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                type === 'specialties' ? 'bg-purple-100 border-purple-200' :
                type === 'cities' ? 'bg-blue-100 border-blue-200' : 'bg-emerald-100 border-emerald-200'
              }`}>
                {type === 'specialties' ? <Stethoscope className="w-4 h-4 text-purple-600" /> :
                 type === 'cities' ? <MapPin className="w-4 h-4 text-blue-600" /> :
                 <Tag className="w-4 h-4 text-emerald-600" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{isEdit ? 'Edit' : 'Create New'} {typeLabel}</h3>
                <p className="text-[10px] text-gray-500">{isEdit ? `Editing ${item.code || item.slug}` : 'Fill in the details below'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Specialty selector — treatments only */}
            {isTreatment && (
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Specialty <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.specialty_id}
                  onChange={e => setForm(f => ({ ...f, specialty_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-white"
                >
                  <option value="">Select specialty...</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{getName(s, 'en')} ({s.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Code / Slug */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                {isTreatment ? 'Slug' : 'Code'} {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                disabled={isEdit}
                placeholder={isTreatment ? 'e.g. botox-treatment' : type === 'cities' ? 'e.g. istanbul' : 'e.g. cardiology'}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Icon selector — Specialties only */}
            {type === 'specialties' && (
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map(key => {
                    const Ic = SPECIALTY_ICONS[key];
                    const active = form.icon_name === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, icon_name: key }))}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                          active ? 'bg-purple-100 border-purple-400 text-purple-700 ring-2 ring-purple-300' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                        title={key}
                      >
                        <Ic className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name (multi-lang) */}
            <MultiLangInput label="Name *" value={form.name} onChange={name => setForm(f => ({ ...f, name }))} />

            {/* Description (multi-lang) — specialties & treatments */}
            {type !== 'cities' && (
              <MultiLangInput label="Description" value={form.description} onChange={description => setForm(f => ({ ...f, description }))} />
            )}

            {/* Aliases — treatments only */}
            {isTreatment && (
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                  <Hash className="w-3 h-3 text-gray-400" /> Aliases (Colloquial Terms)
                </label>
                <p className="text-[10px] text-gray-400 mb-2">Add everyday terms patients might search for, e.g. "wrinkle treatment", "kırışıklık giderme"</p>
                {['en', 'tr'].map(lang => (
                  <div key={lang} className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LangFlag lang={LANGS.find(l => l.code === lang) || { code: lang, countryCode: lang === 'en' ? 'gb' : lang }} size={14} />
                      <span className="text-[10px] font-medium text-gray-500 uppercase">{lang}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={aliasInput[lang] || ''}
                        onChange={e => setAliasInput(a => ({ ...a, [lang]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlias(lang); } }}
                        placeholder={lang === 'en' ? 'e.g. wrinkle removal' : 'e.g. kırışıklık giderme'}
                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                      <button type="button" onClick={() => addAlias(lang)} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {(form.aliases[lang] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(form.aliases[lang] || []).map((alias, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-medium">
                            {alias}
                            <button type="button" onClick={() => removeAlias(lang, idx)} className="hover:text-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Country ID — cities */}
            {type === 'cities' && (
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Country ID</label>
                <input
                  type="number"
                  value={form.country_id}
                  onChange={e => setForm(f => ({ ...f, country_id: parseInt(e.target.value) || 1 }))}
                  onKeyDown={blockNonNumericInt}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
              </div>
            )}

            {/* Display Order — specialties & treatments */}
            {(type === 'specialties' || isTreatment) && (
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-gray-400" /> Display Order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                  onKeyDown={blockNonNumericInt}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/30 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm ${
              isTreatment ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Get display name ────────────────────────────────────────
function getName(item, lang = 'en') {
  if (!item?.name) return item?.code || '—';
  if (typeof item.name === 'string') return item.name;
  return item.name[lang] || item.name.en || item.name.tr || item.code || '—';
}

function getDesc(item, lang = 'en') {
  if (!item?.description) return '';
  if (typeof item.description === 'string') return item.description;
  return item.description[lang] || item.description.en || item.description.tr || '';
}

/* ═══════════════════════════════════════════
   MAIN: Catalog & System — Data Factory
   ═══════════════════════════════════════════ */
export default function AdminCatalog() {
  const [activeTab, setActiveTab] = useState('specialties');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [displayLang, setDisplayLang] = useState('en');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [allSpecialties, setAllSpecialties] = useState([]);

  const showSuccess = (msg) => { setToastMsg(msg); setShowToast(true); };

  // Load specialties once for treatment tag modal
  useEffect(() => {
    adminAPI.specialties().then(res => {
      const data = res?.data || res;
      setAllSpecialties(data?.specialties || []);
    }).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'specialties') res = await adminAPI.specialties();
      else if (activeTab === 'cities') res = await adminAPI.cities();
      else res = await adminAPI.treatmentTags();

      const data = res?.data || res;
      setItems(data?.specialties || data?.cities || data?.treatment_tags || data?.data || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setSearch(''); }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this item?')) return;
    setDeleteLoading(id);
    try {
      if (activeTab === 'specialties') await adminAPI.deleteSpecialty(id);
      else if (activeTab === 'cities') await adminAPI.deleteCity(id);
      else if (activeTab === 'treatments') await adminAPI.deleteTreatmentTag(id);
      setItems(prev => prev.filter(i => i.id !== id));
      showSuccess('Item deactivated');
    } catch {}
    setDeleteLoading(null);
  };

  const handleEdit = (item) => { setEditItem(item); setShowModal(true); };
  const handleCreate = () => { setEditItem(null); setShowModal(true); };

  const handleSaved = () => {
    fetchItems();
    showSuccess(editItem ? 'Item updated successfully' : 'Item created successfully');
  };

  const filtered = items.filter(item => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const name = getName(item, displayLang).toLowerCase();
    const desc = getDesc(item, displayLang).toLowerCase();
    const slug = (item.slug || item.code || '').toLowerCase();
    // Also search aliases for treatments
    const aliasMatch = item.aliases ? Object.values(item.aliases).flat().some(a => (a || '').toLowerCase().includes(s)) : false;
    return name.includes(s) || slug.includes(s) || desc.includes(s) || aliasMatch;
  });

  const activeTabObj = TABS.find(t => t.key === activeTab);

  return (
    <div className="px-4 lg:px-6 space-y-5">
      <SuccessToast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            Catalog & System
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage specialties, cities, and treatment tags</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleCreate} className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all shadow-sm">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.key ? (tab.color === 'purple' ? 'text-purple-600' : tab.color === 'blue' ? 'text-blue-600' : 'text-emerald-600') : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Language selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'treatments' ? 'Search by name, slug or alias...' : `Search ${activeTab} by name or code...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl">
          <Globe className="w-4 h-4 text-gray-400" />
          <select
            value={displayLang}
            onChange={e => setDisplayLang(e.target.value)}
            className="text-xs bg-transparent border-0 outline-none focus:ring-0 font-medium text-gray-700 cursor-pointer pr-4"
          >
            {LANGS.map(l => (
              <option key={l.code} value={l.code}>{l.countryCode.toUpperCase()} {l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content — tab-specific tables */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            {activeTab === 'treatments' ? <Tag className="w-12 h-12 mb-3 opacity-30" /> :
             activeTab === 'cities' ? <MapPin className="w-12 h-12 mb-3 opacity-30" /> :
             <Stethoscope className="w-12 h-12 mb-3 opacity-30" />}
            <p className="text-sm font-medium">No {activeTab} found</p>
            <p className="text-xs mt-1">{search ? 'Try a different search term' : 'Click "+ Add New" to create one'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {/* Specialties columns */}
                  {activeTab === 'specialties' && (
                    <>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[50px]">Icon</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name ({displayLang.toUpperCase()})</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[90px]">Code</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Description</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[60px]">Order</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[80px]">Langs</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[80px]">Actions</th>
                    </>
                  )}
                  {/* Cities columns */}
                  {activeTab === 'cities' && (
                    <>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[100px]">Code</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name ({displayLang.toUpperCase()})</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[80px]">Langs</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[80px]">Actions</th>
                    </>
                  )}
                  {/* Treatments columns */}
                  {activeTab === 'treatments' && (
                    <>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs w-[120px]">Slug</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Name ({displayLang.toUpperCase()})</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Specialty</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Aliases</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[60px]">Order</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-[80px]">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => {
                  const nameObj = typeof item.name === 'object' ? item.name : {};
                  const langCount = Object.keys(nameObj).filter(k => nameObj[k]).length;

                  /* ── Specialties row ── */
                  if (activeTab === 'specialties') {
                    const SpecIcon = getSpecialtyIcon(item.code);
                    return (
                      <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                            <SpecIcon className="w-4 h-4 text-purple-600" />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{getName(item, displayLang)}</td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{item.code}</code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{getDesc(item, displayLang) || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-500 font-mono">{item.display_order ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Globe className="w-2.5 h-2.5" /> {langCount}/{LANGS.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {deleteLoading === item.id ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /> : (
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Deactivate">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  /* ── Cities row ── */
                  if (activeTab === 'cities') {
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono border border-blue-200">{item.code}</code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="font-medium text-gray-900">{getName(item, displayLang)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Globe className="w-2.5 h-2.5" /> {langCount}/{LANGS.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {deleteLoading === item.id ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /> : (
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Deactivate">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  /* ── Treatments row ── */
                  const allAliases = item.aliases ? Object.values(item.aliases).flat().filter(Boolean) : [];
                  const specName = item.specialty ? getName(item.specialty, displayLang) : '—';
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono border border-emerald-200">{item.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{getName(item, displayLang)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Stethoscope className="w-2.5 h-2.5" /> {specName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {allAliases.slice(0, 3).map((a, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{a}</span>
                          ))}
                          {allAliases.length > 3 && <span className="text-[10px] text-gray-400">+{allAliases.length - 3}</span>}
                          {allAliases.length === 0 && <span className="text-[10px] text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500 font-mono">{item.display_order ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteLoading === item.id ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /> : (
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Deactivate">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-xs text-gray-500">
              {filtered.length} of {items.length} {activeTab} shown
              {search && <span className="ml-1 text-purple-600 font-medium">— filtered by "{search}"</span>}
            </span>
            <span className="text-xs text-gray-400">
              Viewing in <span className="font-semibold text-gray-600">{LANGS.find(l => l.code === displayLang)?.label || displayLang}</span>
            </span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CatalogModal
          type={activeTab}
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={handleSaved}
          specialties={allSpecialties}
        />
      )}
    </div>
  );
}
