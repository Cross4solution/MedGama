import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Loader2, Check, X, Info, Lock } from 'lucide-react';
import { consentAPI } from '../../lib/api';

/**
 * Verdiğim onaylar (KVKK/GDPR Art.7): kullanıcı hangi metne, hangi sürüme, ne
 * zaman onay verdiğini görür; geri alınabilir olanları buradan geri alır.
 */
export default function ConsentManager({ showToast }) {
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await consentAPI.list();
      setItems(res?.data?.data || res?.data || []);
    } catch {
      setError(t('riza.couldNotLoadConsentRecords', 'Could not load consent records.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (item) => {
    setBusy(item.type);
    try {
      if (item.granted) {
        await consentAPI.revoke(item.type);
        showToast?.(t('riza.consentWithdrawn', 'Consent withdrawn.'));
      } else {
        await consentAPI.grant(item.type);
        showToast?.(t('riza.consentRecorded', 'Consent recorded.'));
      }
      await load();
    } catch (err) {
      showToast?.(
        err?.data?.message ||
          (t('riza.couldNotCompleteTheAction', 'Could not complete the action.')),
        'error'
      );
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString((i18n.language || 'tr-TR'), {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return ''; }
  };

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
        {t('riza.myConsents', 'My Consents')}
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        {t('riza.seeWhatYouConsentedTo', 'See what you consented to and when, and withdraw the optional ones.')}
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
          <Loader2 className="w-4 h-4 animate-spin" /> {t('riza.loading', 'Loading...')}
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item.type}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                  {item.label}
                  {item.required && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-200/70 rounded px-1.5 py-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      {t('riza.required', 'Required')}
                    </span>
                  )}
                </p>
                <p className="text-[11px] mt-1 flex items-center gap-1.5">
                  {item.granted ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">
                        {t('riza.granted', 'Granted')}
                        {item.granted_at ? ` · ${formatDate(item.granted_at)}` : ''}
                      </span>
                      <span className="text-gray-400">· v{item.granted_version || item.version}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500">
                        {item.revoked_at
                          ? t('riza.withdrawnAt', { tarih: formatDate(item.revoked_at), defaultValue: 'Withdrawn · {{tarih}}' })
                          : (t('riza.notGranted', 'Not granted'))}
                      </span>
                    </>
                  )}
                </p>
                {item.needs_renewal && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {t('riza.theTextWasUpdatedPlease', 'The text was updated; please renew your consent.')}
                  </p>
                )}
              </div>

              {item.revocable ? (
                <button
                  onClick={() => toggle(item)}
                  disabled={busy === item.type}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    item.granted
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100'
                  }`}
                >
                  {busy === item.type
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : item.granted
                      ? (t('riza.withdraw', 'Withdraw'))
                      : (t('riza.grant', 'Grant'))}
                </button>
              ) : (
                <span className="flex-shrink-0 text-[11px] text-gray-400 mt-1">
                  {t('riza.requiredForService', 'Required for service')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] text-gray-400 leading-relaxed flex items-start gap-1.5">
        <ShieldCheck className="w-3 h-3 mt-0.5 flex-shrink-0" />
        {t('riza.yourConsentsAndWithdrawalsAre', 'Your consents and withdrawals are recorded with date, version and source. Required consents are necessary to provide the service; to remove them you can exercise your right to close your account.')}
      </p>
    </div>
  );
}
