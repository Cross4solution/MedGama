import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Mail, Phone, Loader2, CheckCircle, Copy, Lock, Eye, EyeOff,
  Building2, Briefcase, Power, Target,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { leadAPI } from '../../lib/api';
import CRMModal, { ModalLabel, ModalInput, ModalPrimaryButton, ModalCancelButton } from '../../components/crm/CRMModal';

// ═══════════════════════════════════════════════════
// Add Salesperson Modal
// ═══════════════════════════════════════════════════
const AddSalespersonModal = ({ isOpen, onClose, onCreated }) => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [form, setForm] = useState({ fullname: '', email: '', password: '', mobile: '' });
  const [creating, setCreating] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [creds, setCreds] = useState(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, password: pass }));
    setShowPass(true);
  };

  const handleCreate = async () => {
    if (!form.fullname.trim()) { notify({ type: 'error', message: t('crm.salespeople.fullnameRequired', 'Full name is required.') }); return; }
    if (!form.email.trim()) { notify({ type: 'error', message: t('crm.salespeople.emailRequired', 'Email is required.') }); return; }
    if (form.password && form.password.length < 6) { notify({ type: 'error', message: t('crm.salespeople.passwordMin', 'Password must be at least 6 characters.') }); return; }
    setCreating(true);
    try {
      const res = await leadAPI.createSalesperson({
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim() || undefined,
        password: form.password || undefined,
      });
      const c = res?.credentials || res?.data?.credentials;
      setCreds({ email: c?.email || form.email, password: c?.password, name: form.fullname });
      notify({ type: 'success', message: t('crm.salespeople.created', 'Salesperson account created!') });
      onCreated?.();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.salespeople.createFailed', 'Could not create salesperson.') });
    } finally {
      setCreating(false);
    }
  };

  const copyCreds = () => {
    if (!creds) return;
    navigator.clipboard?.writeText(`${t('common.email', 'Email')}: ${creds.email}\n${t('crm.salespeople.password', 'Password')}: ${creds.password}`).then(() => {
      notify({ type: 'success', message: t('crm.salespeople.copied', 'Copied!') });
    });
  };

  const handleClose = () => {
    setForm({ fullname: '', email: '', password: '', mobile: '' });
    setCreds(null);
    setShowPass(false);
    onClose();
  };

  return (
    <CRMModal
      isOpen={isOpen}
      onClose={handleClose}
      title={creds ? t('crm.salespeople.accountCreated', 'Account Created!') : t('crm.salespeople.newSalesperson', 'New Salesperson')}
      subtitle={creds ? t('crm.salespeople.shareCreds', 'Share these details with the salesperson.') : t('crm.salespeople.createDesc', 'Create a salesperson account under your clinic')}
      icon={creds ? CheckCircle : UserPlus}
      footer={!creds ? (
        <>
          <ModalCancelButton onClick={handleClose}>{t('common.cancel', 'Cancel')}</ModalCancelButton>
          <ModalPrimaryButton onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {creating ? t('crm.salespeople.creating', 'Creating...') : t('crm.salespeople.createAccount', 'Create Account')}
          </ModalPrimaryButton>
        </>
      ) : null}
    >
      {creds ? (
        <div className="px-7 py-7 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.salespeople.name', 'Name')}</span>
              <span className="text-sm font-semibold text-gray-900">{creds.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('common.email', 'Email')}</span>
              <span className="text-sm font-medium text-gray-900">{creds.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('crm.salespeople.password', 'Password')}</span>
              <span className="text-sm font-mono font-semibold text-gray-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">{creds.password}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <ModalPrimaryButton onClick={copyCreds} className="flex-1"><Copy className="w-4 h-4" /> {t('crm.salespeople.copyCreds', 'Copy Details')}</ModalPrimaryButton>
            <ModalCancelButton onClick={handleClose}>{t('common.close', 'Close')}</ModalCancelButton>
          </div>
        </div>
      ) : (
        <div className="px-7 py-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ModalLabel required icon={Users}>{t('crm.salespeople.fullname', 'Full Name')}</ModalLabel>
              <ModalInput value={form.fullname} onChange={(e) => setForm(f => ({ ...f, fullname: e.target.value }))} placeholder="Mehmet Demir" />
            </div>
            <div>
              <ModalLabel required icon={Mail}>{t('common.email', 'Email')}</ModalLabel>
              <ModalInput type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="satisci@email.com" />
            </div>
          </div>
          <div>
            <ModalLabel icon={Lock}>{t('crm.salespeople.password', 'Password')} <span className="text-gray-400 font-normal">({t('crm.salespeople.passwordAutoHint', 'auto-generated if left empty')})</span></ModalLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ModalInput type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder={t('crm.salespeople.min6chars', 'Min 6 characters')} className="pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <button type="button" onClick={generatePassword} className="px-4 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 whitespace-nowrap">{t('crm.salespeople.generate', 'Generate')}</button>
            </div>
          </div>
          <div>
            <ModalLabel icon={Phone}>{t('common.phone', 'Phone')} <span className="text-gray-400 font-normal">({t('crm.salespeople.optional', 'optional')})</span></ModalLabel>
            <ModalInput type="tel" value={form.mobile} onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+90 5XX XXX XXXX" />
          </div>
        </div>
      )}
    </CRMModal>
  );
};

// ═══════════════════════════════════════════════════
// Salesperson Card
// ═══════════════════════════════════════════════════
const SalespersonCard = ({ person, onToggle, busy }) => {
  const { t } = useTranslation();
  return (
  <div className="bg-white rounded-xl border border-gray-200/80 p-4 hover:shadow-md transition-all">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-5 h-5 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-900 truncate">{person.fullname}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{person.email}</p>
        {person.mobile && <p className="text-xs text-gray-400 mt-0.5">{person.mobile}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <Target className="w-3 h-3" />{t('crm.salespeople.activeLeads', '{{count}} active lead(s)', { count: person.active_leads_count ?? 0 })}
      </span>
      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${person.is_active ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
        {person.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
      </span>
      <button onClick={() => onToggle(person)} disabled={busy} className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-teal-700 disabled:opacity-50">
        <Power className="w-3.5 h-3.5" />{person.is_active ? t('crm.salespeople.deactivate', 'Deactivate') : t('crm.salespeople.activate', 'Activate')}
      </button>
    </div>
  </div>
  );
};

// ═══════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════
const CRMSalespeople = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notify } = useToast();

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadAPI.listSalespeople();
      setPeople(res?.salespeople || res?.data?.salespeople || []);
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.salespeople.loadFailed', 'Could not load salespeople.') });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const toggle = async (person) => {
    setBusy(true);
    try {
      await leadAPI.toggleSalesperson(person.id);
      fetchPeople();
    } catch (err) {
      notify({ type: 'error', message: err?.message || t('crm.salespeople.updateFailed', 'Could not update.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" /> {t('crm.salespeople.title', 'Salespeople')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('crm.salespeople.subtitle', 'Manage your sales team')}
            {people.length > 0 && <span className="ml-1 text-teal-600 font-semibold">({people.length})</span>}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm">
          <UserPlus className="w-4 h-4" /> {t('crm.salespeople.newSalesperson', 'New Salesperson')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
      ) : people.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal-50 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-teal-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{t('crm.salespeople.emptyTitle', 'No salespeople yet')}</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{t('crm.salespeople.emptyDesc', 'Add your first salesperson to build your sales team.')}</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700">
            <UserPlus className="w-4 h-4" /> {t('crm.salespeople.addFirst', 'Add First Salesperson')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {people.map(p => <SalespersonCard key={p.id} person={p} onToggle={toggle} busy={busy} />)}
        </div>
      )}

      <AddSalespersonModal isOpen={showAdd} onClose={() => setShowAdd(false)} onCreated={fetchPeople} />
    </div>
  );
};

export default CRMSalespeople;
