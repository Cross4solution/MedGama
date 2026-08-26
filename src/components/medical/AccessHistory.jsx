import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Loader2, Eye, Download, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { healthAccessLogAPI } from '../../lib/api';

/**
 * "Sağlık verime kim baktı?" — hastaya şeffaflık paneli.
 * KVKK/GDPR erişim hakkı: hasta, verisine kimin ne zaman neye eriştiğini görür.
 */
export default function AccessHistory() {
  const { t, i18n } = useTranslation();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await healthAccessLogAPI.list({ per_page: 25 });
      setLogs(res?.data?.data || res?.data || []);
      setLoaded(true);
    } catch {
      setError(t('erisimGecmisi.couldNotLoadAccessHistory', 'Could not load access history.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open && !loaded && !loading) load();
  }, [open, loaded, loading, load]);

  const formatWhen = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString((i18n.language || 'tr-TR'), {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  const roleLabel = (roleId) => {
    // Rol adları iki dilde sabitti; ortak `roles.*` anahtarları zaten var.
    const anahtar = {
      doctor: 'doctor', clinicOwner: 'clinic', clinic: 'clinic',
      hospital: 'hospital', superAdmin: 'admin', saasAdmin: 'admin',
    }[roleId];
    return anahtar ? t(`erisimGecmisi.role_${anahtar}`) : '';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
          </span>
          <span>
            <span className="block text-sm font-bold text-gray-900">
              {t('erisimGecmisi.accessHistory', 'Access History')}
            </span>
            <span className="block text-[11px] text-gray-400 mt-0.5">
              {t('erisimGecmisi.whoViewedYourHealthData', 'Who viewed your health data, when, and what')}
            </span>
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('erisimGecmisi.loading', 'Loading...')}
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 py-2">{error}</p>
          ) : logs.length === 0 ? (
            <div className="py-6 text-center">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {t('erisimGecmisi.nobodyHasAccessedYourData', 'Nobody has accessed your data yet.')}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 bg-gray-50/70 rounded-xl px-3.5 py-3">
                  <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {log.resource_type === 'medical_document_downloaded'
                      ? <Download className="w-3.5 h-3.5 text-teal-600" />
                      : <Eye className="w-3.5 h-3.5 text-teal-600" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{log.accessor?.name}</span>
                      {roleLabel(log.accessor?.role_id) && (
                        <span className="text-gray-400 font-normal"> · {roleLabel(log.accessor.role_id)}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{log.what}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatWhen(log.accessed_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
            {t('erisimGecmisi.everyAccessIsLoggedAutomatically', 'Every access is logged automatically. Only you and the provider you booked can access your data.')}
          </p>
        </div>
      )}
    </div>
  );
}
