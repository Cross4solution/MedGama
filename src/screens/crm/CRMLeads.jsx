import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target, Plus, Search, Phone, Mail, User, Loader2, X, DollarSign,
  Stethoscope, UserCheck, Clock, MessageSquare, PhoneCall, ArrowRight,
  Trash2, CheckCircle2, Activity, Tag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { leadAPI } from '../../lib/api';
import CRMModal, { ModalLabel, ModalInput, ModalPrimaryButton, ModalCancelButton } from '../../components/crm/CRMModal';

// ── Pipeline definition (fixed) ──
const STAGES = [
  { key: 'new',       labelKey: 'crm.leads.stageNew',       color: 'bg-slate-100 text-slate-700',  dot: 'bg-slate-400' },
  { key: 'contacted', labelKey: 'crm.leads.stageContacted', color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  { key: 'proposal',  labelKey: 'crm.leads.stageProposal',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  { key: 'won',       labelKey: 'crm.leads.stageWon',       color: 'bg-teal-100 text-teal-700',    dot: 'bg-teal-500' },
  { key: 'lost',      labelKey: 'crm.leads.stageLost',      color: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500' },
];

const formatMoney = (v) =>
  v == null ? '—' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v);

// ═══════════════════════════════════════════════════
// New Lead Modal
// ═══════════════════════════════════════════════════
const NewLeadModal = ({ isOpen, onClose, onCreated, salespeople, isManager }) => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', source: 'manual', treatment_interest: '', estimated_value: '', assigned_to: '' });
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({ full_name: '', email: '', phone: '', source: 'manual', treatment_interest: '', estimated_value: '', assigned_to: '' });

  const handleSave = async () => {
    if (!form.full_name.trim()) { notify({ type: 'error', message: t('crm.leads.nameRequired') }); return; }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        source: form.source.trim() || undefined,
        treatment_interest: form.treatment_interest.trim() || undefined,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        assigned_to: isManager && form.assigned_to ? form.assigned_to : undefined,
      };
      const res = await leadAPI.create(payload);
      notify({ type: 'success', message: t('crm.leads.created') });
      onCreated?.(res?.lead || res?.data?.lead);
      reset();
      onClose();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.createError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CRMModal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title={t('crm.leads.newLead')}
      subtitle={t('crm.leads.newLeadSubtitle')}
      icon={Plus}
      footer={
        <>
          <ModalCancelButton onClick={() => { reset(); onClose(); }}>{t('common.cancel')}</ModalCancelButton>
          <ModalPrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? t('common.saving') : t('crm.leads.create')}
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="px-7 py-7 space-y-5">
        <div>
          <ModalLabel required icon={User}>{t('crm.leads.fullName')}</ModalLabel>
          <ModalInput value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder={t('crm.leads.fullNamePlaceholder')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ModalLabel icon={Mail}>{t('common.email')}</ModalLabel>
            <ModalInput type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@email.com" />
          </div>
          <div>
            <ModalLabel icon={Phone}>{t('common.phone')}</ModalLabel>
            <ModalInput type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90 5XX XXX XXXX" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ModalLabel icon={Stethoscope}>{t('crm.leads.treatmentInterest')}</ModalLabel>
            <ModalInput value={form.treatment_interest} onChange={(e) => setForm(f => ({ ...f, treatment_interest: e.target.value }))} placeholder={t('crm.leads.treatmentInterestPlaceholder')} />
          </div>
          <div>
            <ModalLabel icon={DollarSign}>{t('crm.leads.estimatedValue')}</ModalLabel>
            <ModalInput type="number" value={form.estimated_value} onChange={(e) => setForm(f => ({ ...f, estimated_value: e.target.value }))} placeholder="0" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ModalLabel icon={Tag}>{t('crm.leads.source')}</ModalLabel>
            <ModalInput value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value }))} placeholder="web / referral / manual" />
          </div>
          {isManager && (
            <div>
              <ModalLabel icon={UserCheck}>{t('crm.leads.assignToSalesperson')}</ModalLabel>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              >
                <option value="">{t('crm.leads.unassigned')}</option>
                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.fullname}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </CRMModal>
  );
};

// ═══════════════════════════════════════════════════
// Lead Detail Drawer
// ═══════════════════════════════════════════════════
const LeadDrawer = ({ leadId, onClose, onChanged, salespeople, isManager }) => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('note');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadAPI.show(leadId);
      setLead(res?.lead || res?.data?.lead);
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.loadOneError') });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [leadId, notify, onClose, t]);

  useEffect(() => { if (leadId) load(); }, [leadId, load]);

  const changeStage = async (stage) => {
    setBusy(true);
    try {
      let payload = { stage };
      if (stage === 'lost') {
        const reason = window.prompt(t('crm.leads.lostReasonPrompt')) || undefined;
        payload.lost_reason = reason;
      }
      const res = await leadAPI.updateStage(leadId, payload);
      setLead(res?.lead || res?.data?.lead);
      notify({ type: 'success', message: stage === 'won' ? t('crm.leads.wonConverted') : t('crm.leads.stageUpdated') });
      onChanged?.();
      load();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.stageUpdateError') });
    } finally {
      setBusy(false);
    }
  };

  const reassign = async (assigned_to) => {
    setBusy(true);
    try {
      await leadAPI.assign(leadId, { assigned_to: assigned_to || null });
      notify({ type: 'success', message: t('crm.leads.assignmentUpdated') });
      onChanged?.();
      load();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.assignError') });
    } finally {
      setBusy(false);
    }
  };

  const addActivity = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await leadAPI.addActivity(leadId, { type: noteType, description: noteText.trim() });
      setNoteText('');
      load();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.activityError') });
    } finally {
      setBusy(false);
    }
  };

  const removeLead = async () => {
    if (!window.confirm(t('crm.leads.deleteConfirm'))) return;
    setBusy(true);
    try {
      await leadAPI.remove(leadId);
      notify({ type: 'success', message: t('crm.leads.deleted') });
      onChanged?.();
      onClose();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.deleteError') });
    } finally {
      setBusy(false);
    }
  };

  const activityIcon = (type) => ({
    note: MessageSquare, call: PhoneCall, email: Mail, stage_change: ArrowRight, assignment: UserCheck,
  }[type] || Activity);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slideInRight">
        {loading || !lead ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
        ) : (
          <div>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{lead.full_name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{lead.treatment_interest || t('crm.leads.noTreatment')}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact */}
              <div className="space-y-2 text-sm">
                {lead.phone && <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-400" />{lead.phone}</div>}
                {lead.email && <div className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4 text-gray-400" />{lead.email}</div>}
                <div className="flex items-center gap-2 text-gray-700"><DollarSign className="w-4 h-4 text-gray-400" />{formatMoney(lead.estimated_value)}</div>
                {lead.converted_patient_id && (
                  <div className="flex items-center gap-2 text-teal-700 font-medium"><CheckCircle2 className="w-4 h-4" />{t('crm.leads.convertedToPatient')}</div>
                )}
              </div>

              {/* Stage selector */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('crm.leads.stage')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button
                      key={s.key}
                      disabled={busy || lead.stage === s.key}
                      onClick={() => changeStage(s.key)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${lead.stage === s.key ? s.color + ' ring-2 ring-offset-1 ring-teal-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {t(s.labelKey)}
                    </button>
                  ))}
                </div>
                {lead.lost_reason && <p className="text-xs text-rose-600 mt-2">{t('crm.leads.reason')}: {lead.lost_reason}</p>}
              </div>

              {/* Assignment (managers only) */}
              {isManager && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('crm.leads.assignedSalesperson')}</p>
                  <select
                    value={lead.assigned_to || ''}
                    disabled={busy}
                    onChange={(e) => reassign(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  >
                    <option value="">{t('crm.leads.unassigned')}</option>
                    {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.fullname}</option>)}
                  </select>
                </div>
              )}

              {/* Add activity */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('crm.leads.addActivity')}</p>
                <div className="flex gap-2 mb-2">
                  {[['note', t('crm.leads.activityNote')], ['call', t('crm.leads.activityCall')], ['email', t('common.email')]].map(([v, l]) => (
                    <button key={v} onClick={() => setNoteType(v)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${noteType === v ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{l}</button>
                  ))}
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  placeholder={t('crm.leads.descriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none"
                />
                <button onClick={addActivity} disabled={busy || !noteText.trim()} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> {t('common.add')}
                </button>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('crm.leads.timeline')}</p>
                <div className="space-y-3">
                  {(lead.activities || []).map(a => {
                    const Icon = activityIcon(a.type);
                    return (
                      <div key={a.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{a.description || a.type}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {a.user?.fullname ? a.user.fullname + ' · ' : ''}
                            {a.created_at ? new Date(a.created_at).toLocaleString('tr-TR') : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!lead.activities || lead.activities.length === 0) && <p className="text-xs text-gray-400">{t('crm.leads.noActivity')}</p>}
                </div>
              </div>

              {/* Delete */}
              <button onClick={removeLead} disabled={busy} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-rose-600 text-sm font-semibold hover:bg-rose-50 rounded-xl">
                <Trash2 className="w-4 h-4" /> {t('crm.leads.deleteLead')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// Lead Card
// ═══════════════════════════════════════════════════
const LeadCard = ({ lead, onClick }) => {
  const { t } = useTranslation();
  return (
  <button onClick={onClick} className="w-full text-left bg-white rounded-xl border border-gray-200/80 p-3 hover:shadow-md transition-all">
    <div className="flex items-start justify-between gap-2">
      <h4 className="text-sm font-bold text-gray-900 truncate">{lead.full_name}</h4>
      {lead.estimated_value != null && (
        <span className="text-[11px] font-semibold text-teal-700 whitespace-nowrap">{formatMoney(lead.estimated_value)}</span>
      )}
    </div>
    {lead.treatment_interest && <p className="text-xs text-teal-600 mt-0.5 truncate">{lead.treatment_interest}</p>}
    {lead.phone && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
    {lead.assigned_to && (
      <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
        <UserCheck className="w-3 h-3" />{lead.assigned_to_obj?.fullname || lead.assignedTo?.fullname || t('crm.leads.assigned')}
      </p>
    )}
  </button>
  );
};

// ═══════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════
const CRMLeads = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notify } = useToast();

  const role = user?.role_id || user?.role || '';
  const isManager = ['clinicOwner', 'clinic', 'hospital', 'doctor', 'superAdmin', 'saasAdmin'].includes(role);
  const canManageSalespeople = ['clinicOwner', 'hospital', 'superAdmin', 'saasAdmin'].includes(role);

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [salespeople, setSalespeople] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 200 };
      if (search) params.search = search;
      if (assignedFilter) params.assigned_to = assignedFilter;
      const [leadsRes, statsRes] = await Promise.all([leadAPI.list(params), leadAPI.stats()]);
      const data = leadsRes?.data || leadsRes;
      setLeads(Array.isArray(data) ? data : (data?.data || []));
      setStats(statsRes?.data || statsRes);
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.leads.loadError') });
    } finally {
      setLoading(false);
    }
  }, [search, assignedFilter, notify, t]);

  const fetchSalespeople = useCallback(async () => {
    if (!canManageSalespeople) return;
    try {
      const res = await leadAPI.listSalespeople();
      setSalespeople(res?.salespeople || res?.data?.salespeople || []);
    } catch { /* non-fatal */ }
  }, [canManageSalespeople]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchSalespeople(); }, [fetchSalespeople]);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach(s => { map[s.key] = []; });
    leads.forEach(l => { (map[l.stage] || (map[l.stage] = [])).push(l); });
    return map;
  }, [leads]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            {t('crm.leads.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.leads.subtitle')}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> {t('crm.leads.newLead')}
        </button>
      </div>

      {/* Stats */}
      {stats?.by_stage && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STAGES.map(s => (
            <div key={s.key} className="bg-white rounded-xl border border-gray-200/80 p-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="text-xs font-semibold text-gray-500">{t(s.labelKey)}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 mt-1">{stats.by_stage[s.key]?.count ?? 0}</p>
              <p className="text-[11px] text-gray-400">{formatMoney(stats.by_stage[s.key]?.total_value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('crm.leads.searchPlaceholder')}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white"
          />
        </div>
        {canManageSalespeople && (
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          >
            <option value="">{t('crm.leads.allSalespeople')}</option>
            {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.fullname}</option>)}
          </select>
        )}
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {STAGES.map(s => (
            <div key={s.key} className="bg-gray-50 rounded-2xl p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />{t(s.labelKey)}
                </span>
                <span className="text-[11px] font-semibold text-gray-400">{byStage[s.key]?.length || 0}</span>
              </div>
              <div className="space-y-2">
                {(byStage[s.key] || []).map(l => (
                  <LeadCard key={l.id} lead={l} onClick={() => setActiveLead(l.id)} />
                ))}
                {(byStage[s.key] || []).length === 0 && (
                  <p className="text-[11px] text-gray-400 text-center py-4">{t('crm.leads.empty')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NewLeadModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => fetchLeads()}
        salespeople={salespeople}
        isManager={canManageSalespeople}
      />
      {activeLead && (
        <LeadDrawer
          leadId={activeLead}
          onClose={() => setActiveLead(null)}
          onChanged={() => fetchLeads()}
          salespeople={salespeople}
          isManager={canManageSalespeople}
        />
      )}
    </div>
  );
};

export default CRMLeads;
