import React, { useState, useEffect, useCallback } from 'react';
import { ToggleLeft, ToggleRight, Loader2, Settings2, Blocks, Server, Save, Hash } from 'lucide-react';
import { adminAPI } from '../../lib/api';

const GROUP_META = {
  modules: { label: 'Module Toggles', icon: Blocks, description: 'Enable or disable platform modules globally' },
  platform: { label: 'Platform Settings', icon: Server, description: 'Core platform configuration' },
};

function ToggleSwitch({ enabled, onChange, loading }) {
  return (
    <button
      type="button"
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
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
          className="w-24 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
        />
      </div>
      {dirty && (
        <button
          onClick={() => { onChange(parseInt(val) || 0); setDirty(false); }}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      )}
    </div>
  );
}

export default function AdminFeatureToggles() {
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
      // Update local state optimistically
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
      // Revert on failure
      fetchToggles();
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  const groupKeys = Object.keys(groups);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-purple-600" />
          Feature Toggles
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Control platform-wide features and system settings</p>
      </div>

      {groupKeys.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No settings found.</div>
      ) : (
        groupKeys.map(groupKey => {
          const meta = GROUP_META[groupKey] || { label: groupKey, icon: Settings2, description: '' };
          const GroupIcon = meta.icon;
          const items = groups[groupKey] || [];

          return (
            <div key={groupKey} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center">
                    <GroupIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{meta.label}</h2>
                    {meta.description && <p className="text-xs text-gray-500">{meta.description}</p>}
                  </div>
                </div>
              </div>

              {/* Settings list */}
              <div className="divide-y divide-gray-100">
                {items.map(setting => (
                  <div key={setting.key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{setting.label || setting.key}</p>
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{setting.key}</code>
                      </div>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                      )}
                      {setting.updated_at && (
                        <p className="text-[10px] text-gray-400 mt-1">Last updated: {new Date(setting.updated_at).toLocaleString()}</p>
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
                        <IntegerInput
                          value={setting.value}
                          onChange={(v) => handleUpdate(setting.key, v)}
                          loading={updating === setting.key}
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{String(setting.value)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Info notice */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
        <div className="flex items-start gap-3">
          <Settings2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-800">System Configuration</p>
            <p className="text-xs text-purple-600 mt-0.5">
              Changes to feature toggles take effect immediately across the entire platform. 
              All changes are recorded in the Audit Logs for compliance tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
