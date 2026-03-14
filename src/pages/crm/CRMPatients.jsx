import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Filter, Eye, Tag, X, User, Mail, Phone,
  Calendar, ChevronLeft, ChevronRight, Activity, Loader2,
  Download, RefreshCw, ArrowUpDown, Layers, Receipt,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { patientAPI } from '../../lib/api';

// ─── Helpers ─────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const TAG_COLORS = [
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-orange-50 text-orange-700 border-orange-200',
];

const tagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

// ─── Sub-components ──────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, bg, color }) => (
  <div className={`rounded-xl border px-4 py-3 ${bg}`}>
    <div className="flex items-center justify-between">
      <p className={`text-lg sm:text-xl font-bold ${color}`}>{value}</p>
      <Icon className={`w-5 h-5 ${color} opacity-40`} />
    </div>
    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</p>
  </div>
);

const TagBadge = ({ tag, onRemove }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColor(tag)}`}>
    <Tag className="w-2.5 h-2.5" />
    {tag}
    {onRemove && (
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ml-0.5 hover:opacity-70">
        <X className="w-2.5 h-2.5" />
      </button>
    )}
  </span>
);

const StageBadge = ({ stage }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
    <Layers className="w-2.5 h-2.5" />
    {stage}
  </span>
);

// ─── Add Tag Modal ───────────────────────────────────────────
const AddTagModal = ({ patientId, patientName, onClose, onAdded, t }) => {
  const [tagValue, setTagValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tagValue.trim()) return;
    setLoading(true);
    try {
      await patientAPI.addTag(patientId, tagValue.trim());
      onAdded();
      onClose();
    } catch {
      alert('Failed to add tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{t('crm.patients.addTag', 'Add Tag')} — {patientName}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <input ref={inputRef} type="text" value={tagValue} onChange={(e) => setTagValue(e.target.value)}
            placeholder="VIP, Chronic, Post-Op..." maxLength={100}
            className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">{t('common.cancel')}</button>
            <button type="submit" disabled={loading || !tagValue.trim()} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Set Stage Modal ─────────────────────────────────────────
const SetStageModal = ({ patientId, patientName, currentStage, onClose, onUpdated, t }) => {
  const [stageValue, setStageValue] = useState(currentStage || '');
  const [loading, setLoading] = useState(false);

  const STAGE_PRESETS = [
    'Initial Consultation', 'Diagnostic', 'Treatment', 'Follow-up',
    'Post-Surgery', 'Rehabilitation', 'Monitoring', 'Discharged',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stageValue.trim()) return;
    setLoading(true);
    try {
      await patientAPI.setStage(patientId, stageValue.trim());
      onUpdated();
      onClose();
    } catch {
      alert('Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{t('crm.patients.setStage', 'Set Stage')} — {patientName}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {STAGE_PRESETS.map((s) => (
              <button key={s} type="button" onClick={() => setStageValue(s)}
                className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors ${stageValue === s ? 'bg-teal-50 text-teal-700 border-teal-300' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
          <input type="text" value={stageValue} onChange={(e) => setStageValue(e.target.value)}
            placeholder="Or type a custom stage..." maxLength={100}
            className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">{t('common.cancel')}</button>
            <button type="submit" disabled={loading || !stageValue.trim()} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const CRMPatients = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, new_this_month: 0, active_this_month: 0 });
  const [filterOptions, setFilterOptions] = useState({ tags: [], stages: [] });

  // Filter & pagination state
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortBy, setSortBy] = useState('fullname');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
  const perPage = 15;

  // Modal state
  const [tagModal, setTagModal] = useState(null);
  const [stageModal, setStageModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeoutRef = useRef(null);

  // ── Fetch patients ──
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: perPage, page };
      if (search) params.search = search;
      if (tagFilter) params.tag = tagFilter;
      if (stageFilter) params.stage = stageFilter;
      if (genderFilter) params.gender = genderFilter;
      params.sort_by = sortBy;
      params.sort_dir = sortDir;

      const res = await patientAPI.list(params);
      const data = res?.data || res;
      setPatients(data.data || []);
      setPagination({ total: data.total || 0, last_page: data.last_page || 1 });
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tagFilter, stageFilter, genderFilter, sortBy, sortDir]);

  // ── Fetch stats & filter options ──
  const fetchMeta = useCallback(async () => {
    try {
      const [statsRes, filtersRes] = await Promise.all([
        patientAPI.stats(),
        patientAPI.filters(),
      ]);
      setStats(statsRes?.data || statsRes || { total: 0, new_this_month: 0, active_this_month: 0 });
      setFilterOptions(filtersRes?.data || filtersRes || { tags: [], stages: [] });
    } catch (err) {
      console.error('Failed to fetch meta:', err);
    }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Debounced search
  const handleSearch = (value) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleRefresh = () => {
    fetchPatients();
    fetchMeta();
  };

  const activeFilterCount = [tagFilter, stageFilter, genderFilter].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.patients.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.patients.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/crm/appointments')} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" />
            {t('crm.patients.bookAppointment', 'Book Appointment')}
          </button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={t('crm.patients.totalPatients')} value={stats.total} icon={Users} bg="bg-violet-50 border-violet-200" color="text-violet-700" />
        <StatCard label={t('crm.patients.activeThisMonth', 'Active This Month')} value={stats.active_this_month} icon={Activity} bg="bg-emerald-50 border-emerald-200" color="text-emerald-700" />
        <StatCard label={t('crm.patients.newThisMonth')} value={stats.new_this_month} icon={Plus} bg="bg-blue-50 border-blue-200" color="text-blue-700" />
      </div>

      {/* ─── Table Card ─── */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" placeholder={t('crm.patients.searchPlaceholder')} defaultValue={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
                <Filter className="w-3.5 h-3.5" />
                {t('common.filters', 'Filters')}
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Tag filter */}
              <select value={tagFilter} onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
                className="h-8 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <option value="">{t('crm.patients.allTags', 'All Tags')}</option>
                {filterOptions.tags.map((tg) => <option key={tg} value={tg}>{tg}</option>)}
              </select>

              {/* Stage filter */}
              <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                className="h-8 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <option value="">{t('crm.patients.allStages', 'All Stages')}</option>
                {filterOptions.stages.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>

              {/* Gender filter */}
              <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                className="h-8 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <option value="">{t('crm.patients.allGenders', 'All Genders')}</option>
                <option value="M">{t('crm.patients.male')}</option>
                <option value="F">{t('crm.patients.female')}</option>
              </select>

              {activeFilterCount > 0 && (
                <button onClick={() => { setTagFilter(''); setStageFilter(''); setGenderFilter(''); setPage(1); }}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" />{t('common.clearAll', 'Clear All')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  <button onClick={() => toggleSort('fullname')} className="flex items-center gap-1 hover:text-gray-700">
                    {t('common.patient')}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.contact')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.tags', 'Tags')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.stage', 'Stage')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.lastVisit')}</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">{t('crm.patients.visits', 'Visits')}</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">{t('common.loading', 'Loading...')}</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">{t('common.noResults')}</p>
                    <p className="text-xs text-gray-300 mt-1">Patients who book appointments will appear here</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const age = calcAge(p.date_of_birth);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Patient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.avatar ? (
                            <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex-shrink-0">
                              {getInitials(p.fullname)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{p.fullname}</p>
                            <p className="text-[11px] text-gray-400">
                              {p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : '—'}
                              {age ? `, ${age}y` : ''}
                              {p.country ? ` · ${p.country}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="px-3 py-3.5">
                        <p className="text-xs text-gray-700 truncate max-w-[160px]">{p.email || '—'}</p>
                        <p className="text-[11px] text-gray-400">{p.mobile || '—'}</p>
                      </td>
                      {/* Tags */}
                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(p.tags || []).length === 0 ? (
                            <button onClick={() => setTagModal({ id: p.id, name: p.fullname })}
                              className="text-[10px] text-gray-400 hover:text-teal-600 flex items-center gap-0.5">
                              <Plus className="w-2.5 h-2.5" /> tag
                            </button>
                          ) : (
                            <>
                              {p.tags.slice(0, 2).map((tg) => (
                                <TagBadge key={tg.id || tg.tag} tag={tg.tag} />
                              ))}
                              {p.tags.length > 2 && <span className="text-[10px] text-gray-400">+{p.tags.length - 2}</span>}
                              <button onClick={() => setTagModal({ id: p.id, name: p.fullname })}
                                className="w-4 h-4 rounded-full bg-gray-100 hover:bg-teal-100 flex items-center justify-center text-gray-400 hover:text-teal-600">
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      {/* Stage */}
                      <td className="px-3 py-3.5">
                        {p.current_stage ? (
                          <button onClick={() => setStageModal({ id: p.id, name: p.fullname, stage: p.current_stage.stage })}>
                            <StageBadge stage={p.current_stage.stage} />
                          </button>
                        ) : (
                          <button onClick={() => setStageModal({ id: p.id, name: p.fullname, stage: '' })}
                            className="text-[10px] text-gray-400 hover:text-teal-600 flex items-center gap-0.5">
                            <Plus className="w-2.5 h-2.5" /> stage
                          </button>
                        )}
                      </td>
                      {/* Last Visit */}
                      <td className="px-3 py-3.5">
                        {p.last_appointment ? (
                          <div>
                            <p className="text-xs text-gray-700">{p.last_appointment.date}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{p.last_appointment.type} · {p.last_appointment.status}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      {/* Visits */}
                      <td className="px-3 py-3.5">
                        <span className="text-xs font-semibold text-gray-700">{p.total_visits || 0}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/crm/patient-360?id=${p.id}`)}
                            className="w-8 h-8 rounded-lg hover:bg-teal-50 flex items-center justify-center text-gray-400 hover:text-teal-600 transition-colors"
                            title="Patient 360°">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/crm/appointments`)}
                            className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                            title="Book Appointment">
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/crm/billing`)}
                            className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-colors"
                            title="Create Invoice">
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              {t('common.showing', 'Showing')} {((page - 1) * perPage) + 1}–{Math.min(page * perPage, pagination.total)} {t('common.of', 'of')} {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.last_page, 7) }, (_, i) => {
                let pageNum;
                if (pagination.last_page <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= pagination.last_page - 3) {
                  pageNum = pagination.last_page - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium ${pageNum === page ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button disabled={page === pagination.last_page} onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {tagModal && (
        <AddTagModal patientId={tagModal.id} patientName={tagModal.name}
          onClose={() => setTagModal(null)} onAdded={handleRefresh} t={t} />
      )}
      {stageModal && (
        <SetStageModal patientId={stageModal.id} patientName={stageModal.name} currentStage={stageModal.stage}
          onClose={() => setStageModal(null)} onUpdated={handleRefresh} t={t} />
      )}
    </div>
  );
};

export default CRMPatients;
