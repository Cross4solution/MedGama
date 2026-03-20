import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings2, Loader2, Blocks, Server, Palette, Save,
  Hash, Globe, Shield, AlertTriangle, Type, Image, Mail, Paintbrush,
  Lock, Megaphone, CreditCard, Percent, Eye, CheckCircle2, X,
  RefreshCw,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';
import { blockNonNumericInt } from '../../utils/numericInput';

// ─── Reusable Toggle ─────────────────────────────────────────
function ToggleSwitch({ enabled, onChange, loading, size = 'md' }) {
  const sizes = {
    md: { track: 'h-6 w-11', dot: 'h-4 w-4', on: 'translate-x-6', off: 'translate-x-1' },
    lg: { track: 'h-8 w-14', dot: 'h-6 w-6', on: 'translate-x-7', off: 'translate-x-1' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <button
      type="button"
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex ${s.track} items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span className={`inline-block ${s.dot} transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? s.on : s.off}`} />
    </button>
  );
}

// ─── Success Toast ───────────────────────────────────────────
function SuccessToast({ message, show, onClose }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-[100] lg:right-[calc(50%-8rem+1.5rem)] animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-emerald-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ─── Group card configs ──────────────────────────────────────
const GROUP_META = {
  modules:  { label: 'Module Toggles',   labelKey: 'admin.settings.modules',   icon: Blocks,  description: 'Enable or disable platform modules globally',    descKey: 'admin.settings.modulesDesc',  color: 'purple' },
  platform: { label: 'Platform Controls', labelKey: 'admin.settings.platform',  icon: Server,  description: 'Core platform configuration & master switches',   descKey: 'admin.settings.platformDesc', color: 'blue' },
  branding: { label: 'Branding & Meta',   labelKey: 'admin.settings.branding',  icon: Palette, description: 'Site title, logo, SEO meta and brand settings',   descKey: 'admin.settings.brandingDesc', color: 'amber' },
};

const SETTING_ICONS = {
  'module.health_tourism': Globe, 'module.vasco_ai': Shield, 'module.telehealth': Globe,
  'module.medstream': Globe, 'module.patient_documents': Globe, 'module.online_payment': Globe,
  'platform.maintenance_mode': AlertTriangle, 'platform.registration': Globe, 'platform.max_upload_mb': Hash,
  'platform.global_announcement': Megaphone, 'platform.pro_monthly_price': CreditCard,
  'platform.pro_annual_price': CreditCard, 'platform.commission_rate': Percent,
  'branding.site_title': Type, 'branding.site_description': Type, 'branding.site_logo_url': Image,
  'branding.primary_color': Paintbrush, 'branding.support_email': Mail,
};

/* ═══════════════════════════════════════════
   MAIN: System Settings — Government Center
   ═══════════════════════════════════════════ */
export default function AdminSystemSettings() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Critical controls (local state, saved together or individually) ──
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcementDirty, setAnnouncementDirty] = useState(false);
  const [proMonthly, setProMonthly] = useState('');
  const [proAnnual, setProAnnual] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [pricingDirty, setPricingDirty] = useState(false);
  const [commissionDirty, setCommissionDirty] = useState(false);

  const showSuccess = (msg) => { setToastMsg(msg); setShowToast(true); };

  const fetchToggles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.featureToggles();
      const data = res?.data?.data || res?.data || {};
      setGroups(data);

      // Extract critical controls from platform group
      const pf = data.platform || [];
      const find = (key) => pf.find(s => s.key === key);
      setMaintenanceMode(!!find('platform.maintenance_mode')?.value);
      setAnnouncement(find('platform.global_announcement')?.value || '');
      setProMonthly(String(find('platform.pro_monthly_price')?.value ?? ''));
      setProAnnual(String(find('platform.pro_annual_price')?.value ?? ''));
      setCommissionRate(String(find('platform.commission_rate')?.value ?? ''));
      setAnnouncementDirty(false);
      setPricingDirty(false);
      setCommissionDirty(false);
    } catch {
      setGroups({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchToggles(); }, [fetchToggles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchToggles();
    setRefreshing(false);
  };

  // ── Generic update (used for module toggles / branding / other platform items) ──
  const handleUpdate = async (key, value) => {
    setUpdating(key);
    try {
      await adminAPI.updateFeatureToggle(key, value);
      setGroups(prev => {
        const updated = { ...prev };
        for (const group of Object.keys(updated)) {
          updated[group] = updated[group].map(s =>
            s.key === key ? { ...s, value } : s
          );
        }
        return updated;
      });
      showSuccess('Setting updated');
    } catch {
      fetchToggles();
    }
    setUpdating(null);
  };

  // ── Critical control handlers ──
  const handleMaintenanceToggle = async (v) => {
    setMaintenanceMode(v);
    await handleUpdate('platform.maintenance_mode', v);
  };

  const handleSaveAnnouncement = async () => {
    setUpdating('platform.global_announcement');
    try {
      await adminAPI.updateFeatureToggle('platform.global_announcement', announcement);
      setAnnouncementDirty(false);
      showSuccess('Global announcement updated');
      // Update local groups state
      setGroups(prev => {
        const updated = { ...prev };
        if (updated.platform) {
          updated.platform = updated.platform.map(s =>
            s.key === 'platform.global_announcement' ? { ...s, value: announcement } : s
          );
        }
        return updated;
      });
    } catch { fetchToggles(); }
    setUpdating(null);
  };

  const handleSavePricing = async () => {
    setUpdating('pricing');
    try {
      await Promise.all([
        adminAPI.updateFeatureToggle('platform.pro_monthly_price', parseFloat(proMonthly) || 0),
        adminAPI.updateFeatureToggle('platform.pro_annual_price', parseFloat(proAnnual) || 0),
      ]);
      setPricingDirty(false);
      showSuccess('Package pricing updated');
    } catch { fetchToggles(); }
    setUpdating(null);
  };

  const handleSaveCommission = async () => {
    setUpdating('platform.commission_rate');
    try {
      await adminAPI.updateFeatureToggle('platform.commission_rate', parseFloat(commissionRate) || 0);
      setCommissionDirty(false);
      showSuccess('Commission rate updated');
    } catch { fetchToggles(); }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Filter out critical keys from generic platform rendering ──
  const CRITICAL_KEYS = new Set([
    'platform.maintenance_mode', 'platform.global_announcement',
    'platform.pro_monthly_price', 'platform.pro_annual_price', 'platform.commission_rate',
  ]);

  const platformOther = (groups.platform || []).filter(s => !CRITICAL_KEYS.has(s.key));

  // Order: modules → remaining platform → branding
  const groupOrder = ['modules'];
  if (platformOther.length > 0) groupOrder.push('platform');
  groupOrder.push('branding');
  const sortedKeys = groupOrder.filter(k => groups[k]);
  Object.keys(groups).forEach(k => {
    if (!sortedKeys.includes(k) && k !== 'platform') sortedKeys.push(k);
  });

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <SuccessToast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-600" />
            {t('admin.settings.title', 'System Settings')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('admin.settings.subtitle', 'Master controls, critical configuration & branding')}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ════════════════════════════════════════
         SECTION 1: CRITICAL PLATFORM CONTROLS
         ════════════════════════════════════════ */}

      {/* A — Maintenance Mode */}
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        maintenanceMode ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200/60'
      }`}>
        <div className={`px-5 py-4 border-b ${maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-gray-50/40 border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                maintenanceMode ? 'bg-red-100 border-red-300' : 'bg-amber-50 border-amber-200'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${maintenanceMode ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <h2 className={`text-sm font-bold ${maintenanceMode ? 'text-red-800' : 'text-gray-900'}`}>
                  Maintenance Mode
                </h2>
                <p className="text-xs text-gray-500">Show maintenance page to all non-admin users</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {maintenanceMode ? 'ACTIVE' : 'OFF'}
              </span>
              <ToggleSwitch
                enabled={maintenanceMode}
                onChange={handleMaintenanceToggle}
                loading={updating === 'platform.maintenance_mode'}
                size="lg"
              />
            </div>
          </div>
        </div>
        {maintenanceMode && (
          <div className="px-5 py-3 bg-red-50/50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                <span className="font-bold">Warning:</span> All doctors and patients are currently seeing a "System Under Maintenance" page. 
                The admin panel is <span className="font-semibold">not affected</span>. Disable this switch to restore normal access.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* B — Global Announcement */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-blue-50 border-blue-200">
              <Megaphone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Global Announcement</h2>
              <p className="text-xs text-gray-500">Broadcast a banner message to all user dashboards</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <textarea
            value={announcement}
            onChange={e => { setAnnouncement(e.target.value); setAnnouncementDirty(true); }}
            rows={3}
            placeholder="Type an announcement to broadcast to all users... (leave empty to hide banner)"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none resize-none transition-all"
          />
          {/* Live preview */}
          {announcement.trim() && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Live Preview
              </p>
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg px-4 py-2.5 text-white">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium">{announcement}</span>
                </div>
                <span className="text-white/60 text-xs ml-3">✕</span>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleSaveAnnouncement}
              disabled={!announcementDirty || updating === 'platform.global_announcement'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {updating === 'platform.global_announcement' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Announcement
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
         SECTION 2: FINANCIALS
         ════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-emerald-50 border-emerald-200">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Financials</h2>
              <p className="text-xs text-gray-500">Package pricing & platform commission</p>
            </div>
          </div>
        </div>

        {/* C — Package Pricing */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            Package Pricing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Pro Monthly Price ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={proMonthly}
                  onChange={e => { setProMonthly(e.target.value); setPricingDirty(true); }}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Pro Annual Price ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={proAnnual}
                  onChange={e => { setProAnnual(e.target.value); setPricingDirty(true); }}
                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          {proMonthly && proAnnual && parseFloat(proAnnual) < parseFloat(proMonthly) * 12 && (
            <p className="text-[10px] text-emerald-600 mt-2">
              Annual plan saves users <span className="font-bold">${(parseFloat(proMonthly) * 12 - parseFloat(proAnnual)).toFixed(2)}/year</span> ({Math.round((1 - parseFloat(proAnnual) / (parseFloat(proMonthly) * 12)) * 100)}% off)
            </p>
          )}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSavePricing}
              disabled={!pricingDirty || updating === 'pricing'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {updating === 'pricing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Pricing
            </button>
          </div>
        </div>

        {/* D — Commission Rate */}
        <div className="px-5 py-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-amber-500" />
            Commission Rate
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Per Appointment (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={e => { setCommissionRate(e.target.value); setCommissionDirty(true); }}
                  className="w-32 pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
              </div>
            </div>
            <button
              onClick={handleSaveCommission}
              disabled={!commissionDirty || updating === 'platform.commission_rate'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {updating === 'platform.commission_rate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Rate
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            This rate is applied to every appointment and reflected in the Financials dashboard revenue calculations.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
         SECTION 3: MODULE TOGGLES + PLATFORM + BRANDING (generic)
         ════════════════════════════════════════ */}
      {sortedKeys.map(groupKey => {
        const meta = GROUP_META[groupKey] || { label: groupKey, icon: Settings2, description: '', color: 'gray' };
        const GroupIcon = meta.icon;
        // For platform group, show only non-critical items
        const items = groupKey === 'platform' ? platformOther : (groups[groupKey] || []);
        if (items.length === 0) return null;

        const colorClasses = {
          purple: { iconBg: 'bg-purple-50 border-purple-200', iconText: 'text-purple-600' },
          blue:   { iconBg: 'bg-blue-50 border-blue-200',     iconText: 'text-blue-600' },
          amber:  { iconBg: 'bg-amber-50 border-amber-200',   iconText: 'text-amber-600' },
          gray:   { iconBg: 'bg-gray-50 border-gray-200',     iconText: 'text-gray-600' },
        };
        const cc = colorClasses[meta.color] || colorClasses.gray;

        return (
          <div key={groupKey} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cc.iconBg}`}>
                  <GroupIcon className={`w-4 h-4 ${cc.iconText}`} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{t(meta.labelKey, meta.label)}</h2>
                  <p className="text-xs text-gray-500">{t(meta.descKey, meta.description)}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map(setting => {
                const SettingIcon = SETTING_ICONS[setting.key] || Settings2;
                const isColor = setting.key === 'branding.primary_color';

                return (
                  <div key={setting.key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <SettingIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-900">{setting.label || setting.key}</p>
                        <code className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono hidden sm:inline">{setting.key}</code>
                      </div>
                      {setting.description && <p className="text-xs text-gray-500 mt-0.5 ml-5.5">{setting.description}</p>}
                      {setting.updated_at && (
                        <p className="text-[10px] text-gray-400 mt-1 ml-5.5">Last updated: {new Date(setting.updated_at).toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {setting.type === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${setting.value ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {setting.value ? 'Enabled' : 'Disabled'}
                          </span>
                          <ToggleSwitch
                            enabled={!!setting.value}
                            onChange={(v) => handleUpdate(setting.key, v)}
                            loading={updating === setting.key}
                          />
                        </div>
                      ) : setting.type === 'integer' ? (
                        <InlineInput
                          value={setting.value}
                          type="number"
                          onSave={(v) => handleUpdate(setting.key, parseInt(v) || 0)}
                          loading={updating === setting.key}
                        />
                      ) : (
                        <InlineInput
                          value={setting.value}
                          type={isColor ? 'color' : 'text'}
                          onSave={(v) => handleUpdate(setting.key, v)}
                          loading={updating === setting.key}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ════════════════════════════════════════
         AUDIT NOTICE — polished
         ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-blue-50/60 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {t('admin.settings.auditTitle', 'All Changes Are Audited')}
            </p>
            <p className="text-xs text-purple-700/80 mt-0.5">
              {t('admin.settings.auditDesc', 'Every setting change is recorded in Audit Logs with timestamp and admin identity (e.g., "Admin [Name] changed Pro Price from $199 to $299"). Changes take effect immediately across the entire platform.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Input (for generic string/integer settings) ──────
function InlineInput({ value, type, onSave, loading }) {
  const [val, setVal] = useState(value ?? '');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setVal(value ?? ''); setDirty(false); }, [value]);

  return (
    <div className="flex items-center gap-2">
      {type === 'color' && (
        <input type="color" value={val} onChange={e => { setVal(e.target.value); setDirty(true); }}
          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0" />
      )}
      <input
        type={type === 'color' ? 'text' : type}
        value={val}
        onChange={e => { setVal(e.target.value); setDirty(true); }}
        onKeyDown={type === 'number' ? blockNonNumericInt : undefined}
        className={`${type === 'number' ? 'w-24' : 'w-64 max-w-full'} px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all`}
      />
      {dirty && (
        <button
          onClick={() => { onSave(val); setDirty(false); }}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
        </button>
      )}
    </div>
  );
}
