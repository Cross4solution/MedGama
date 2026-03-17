import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings2, ToggleLeft, ToggleRight, Loader2, Blocks, Server, Palette,
  Save, Hash, Globe, Shield, AlertTriangle, Type, Image, Mail, Paintbrush,
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const GROUP_META = {
  modules:  { label: 'Module Toggles',     labelKey: 'admin.settings.modules',     icon: Blocks,   description: 'Enable or disable platform modules globally',  descKey: 'admin.settings.modulesDesc',  color: 'purple' },
  platform: { label: 'Platform Settings',   labelKey: 'admin.settings.platform',    icon: Server,   description: 'Core platform configuration',                  descKey: 'admin.settings.platformDesc', color: 'blue' },
  branding: { label: 'Branding & Meta',     labelKey: 'admin.settings.branding',    icon: Palette,  description: 'Site title, logo, SEO meta and brand settings', descKey: 'admin.settings.brandingDesc', color: 'amber' },
};

const SETTING_ICONS = {
  'module.health_tourism':    Globe,
  'module.vasco_ai':          Shield,
  'module.telehealth':        Globe,
  'module.medstream':         Globe,
  'module.patient_documents': Globe,
  'module.online_payment':    Globe,
  'platform.maintenance_mode': AlertTriangle,
  'platform.registration':    Globe,
  'platform.max_upload_mb':   Hash,
  'branding.site_title':      Type,
  'branding.site_description': Type,
  'branding.site_logo_url':   Image,
  'branding.primary_color':   Paintbrush,
  'branding.support_email':   Mail,
};

function ToggleSwitch({ enabled, onChange, loading }) {
  return (
    <button
      type="button"
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function IntegerInput({ value, onChange, loading }) {
  const [val, setVal] = useState(value);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setVal(value); setDirty(false); }, [value]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="number"
          value={val}
          onChange={e => { setVal(e.target.value); setDirty(true); }}
          className="w-24 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>
      {dirty && (
        <button
          onClick={() => { onChange(parseInt(val) || 0); setDirty(false); }}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
        </button>
      )}
    </div>
  );
}

function StringInput({ value, onChange, loading, isColor = false }) {
  const [val, setVal] = useState(value || '');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setVal(value || ''); setDirty(false); }, [value]);

  return (
    <div className="flex items-center gap-2">
      {isColor && (
        <input
          type="color"
          value={val}
          onChange={e => { setVal(e.target.value); setDirty(true); }}
          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0"
        />
      )}
      <input
        type="text"
        value={val}
        onChange={e => { setVal(e.target.value); setDirty(true); }}
        className="w-64 max-w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
      />
      {dirty && (
        <button
          onClick={() => { onChange(val); setDirty(false); }}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: System Settings
   ═══════════════════════════════════════════ */
export default function AdminSystemSettings() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchToggles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.featureToggles();
      setGroups(res?.data?.data || res?.data || {});
    } catch {
      setGroups({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchToggles(); }, [fetchToggles]);

  const handleUpdate = async (key, value) => {
    setUpdating(key);
    try {
      await adminAPI.updateFeatureToggle(key, value);
      setGroups(prev => {
        const updated = { ...prev };
        for (const group of Object.keys(updated)) {
          updated[group] = updated[group].map(s =>
            s.key === key ? { ...s, value: typeof value === 'boolean' ? value : value } : s
          );
        }
        return updated;
      });
    } catch {
      fetchToggles();
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Order groups: modules → platform → branding
  const groupOrder = ['modules', 'platform', 'branding'];
  const sortedKeys = groupOrder.filter(k => groups[k]);
  // Add any remaining groups not in order
  Object.keys(groups).forEach(k => { if (!sortedKeys.includes(k)) sortedKeys.push(k); });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          {t('admin.settings.title', 'System Settings')}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {t('admin.settings.subtitle', 'Master controls, feature toggles and branding configuration')}
        </p>
      </div>

      {/* Maintenance Mode Banner */}
      {groups.platform?.find(s => s.key === 'platform.maintenance_mode' && s.value) && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">{t('admin.settings.maintenanceActive', 'Maintenance Mode is ACTIVE')}</p>
            <p className="text-xs text-red-600 mt-0.5">
              {t('admin.settings.maintenanceActiveDesc', 'The platform is showing a maintenance page to all visitors. Disable it below to restore access.')}
            </p>
          </div>
        </div>
      )}

      {sortedKeys.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">{t('admin.settings.noSettings', 'No settings found.')}</div>
      ) : (
        sortedKeys.map(groupKey => {
          const meta = GROUP_META[groupKey] || { label: groupKey, icon: Settings2, description: '', color: 'gray' };
          const GroupIcon = meta.icon;
          const items = groups[groupKey] || [];
          const colorClasses = {
            purple: { iconBg: 'bg-purple-50 border-purple-200', iconText: 'text-purple-600' },
            blue:   { iconBg: 'bg-blue-50 border-blue-200',     iconText: 'text-blue-600' },
            amber:  { iconBg: 'bg-amber-50 border-amber-200',   iconText: 'text-amber-600' },
            gray:   { iconBg: 'bg-gray-50 border-gray-200',     iconText: 'text-gray-600' },
          };
          const cc = colorClasses[meta.color] || colorClasses.gray;

          return (
            <div key={groupKey} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cc.iconBg}`}>
                    <GroupIcon className={`w-4.5 h-4.5 ${cc.iconText}`} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{t(meta.labelKey, meta.label)}</h2>
                    <p className="text-xs text-gray-500">{t(meta.descKey, meta.description)}</p>
                  </div>
                </div>
              </div>

              {/* Settings list */}
              <div className="divide-y divide-gray-100">
                {items.map(setting => {
                  const SettingIcon = SETTING_ICONS[setting.key] || Settings2;
                  const isMaintenance = setting.key === 'platform.maintenance_mode';
                  const isColor = setting.key === 'branding.primary_color';

                  return (
                    <div
                      key={setting.key}
                      className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors ${
                        isMaintenance && setting.value ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <SettingIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isMaintenance && setting.value ? 'text-red-500' : 'text-gray-400'}`} />
                          <p className={`text-sm font-semibold ${isMaintenance && setting.value ? 'text-red-800' : 'text-gray-900'}`}>
                            {setting.label || setting.key}
                          </p>
                          <code className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono hidden sm:inline">{setting.key}</code>
                        </div>
                        {setting.description && (
                          <p className="text-xs text-gray-500 mt-0.5 ml-5.5">{setting.description}</p>
                        )}
                        {setting.updated_at && (
                          <p className="text-[10px] text-gray-400 mt-1 ml-5.5">
                            {t('admin.settings.lastUpdated', 'Last updated')}: {new Date(setting.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {setting.type === 'boolean' ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${setting.value ? (isMaintenance ? 'text-red-600' : 'text-emerald-600') : 'text-gray-400'}`}>
                              {setting.value
                                ? (isMaintenance ? t('admin.settings.on', 'ON') : t('admin.settings.enabled', 'Enabled'))
                                : t('admin.settings.disabled', 'Disabled')
                              }
                            </span>
                            <ToggleSwitch
                              enabled={!!setting.value}
                              onChange={(v) => handleUpdate(setting.key, v)}
                              loading={updating === setting.key}
                            />
                          </div>
                        ) : setting.type === 'integer' ? (
                          <IntegerInput
                            value={setting.value}
                            onChange={(v) => handleUpdate(setting.key, v)}
                            loading={updating === setting.key}
                          />
                        ) : (
                          <StringInput
                            value={setting.value}
                            onChange={(v) => handleUpdate(setting.key, v)}
                            loading={updating === setting.key}
                            isColor={isColor}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Audit notice */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">{t('admin.settings.auditTitle', 'All Changes Are Audited')}</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              {t('admin.settings.auditDesc', 'Every toggle and setting change is recorded in Audit Logs with timestamp and admin identity. Changes take effect immediately across the entire platform.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
