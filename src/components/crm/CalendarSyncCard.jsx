'use client';
import React, { useEffect, useState } from 'react';
import { CalendarCheck, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { calendarFeedAPI } from '../../lib/api';

// One-time calendar subscription: doctor adds the webcal URL to Google/Apple/
// Outlook and all appointments auto-sync (one-way, live). No OAuth, no infra.
export default function CalendarSyncCard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = () => {
    setLoading(true);
    calendarFeedAPI.info()
      .then((r) => setData(r?.data || r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data?.url || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const regenerate = () => {
    if (!window.confirm(t('calendar.regenConfirm', 'Mevcut abonelik bağlantısı geçersiz olacak. Devam edilsin mi?'))) return;
    setRegenerating(true);
    calendarFeedAPI.regenerate()
      .then((r) => setData(r?.data || r))
      .catch(() => {})
      .finally(() => setRegenerating(false));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <CalendarCheck className="w-4 h-4 text-teal-600" />
        <div>
          <h2 className="text-sm font-bold text-gray-900">{t('calendar.syncTitle', 'Takvim Senkronizasyonu')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('calendar.syncSubtitle', 'Randevularınız Google / Apple / Outlook takviminize otomatik düşsün — bir kez ekleyin.')}</p>
        </div>
      </div>
      <div className="px-6 py-4 space-y-3">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
        ) : !data ? (
          <p className="text-xs text-gray-400">{t('calendar.syncError', 'Bağlantı yüklenemedi.')}</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={data.url}
                onFocus={(e) => e.target.select()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 font-mono truncate"
              />
              <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-teal-300 hover:text-teal-700">
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('calendar.copied', 'Kopyalandı') : t('calendar.copy', 'Kopyala')}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={data.google} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700">
                {t('calendar.addGoogle', 'Google Takvime Ekle')}
              </a>
              <a href={data.webcal} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-teal-300">
                {t('calendar.addApple', 'Apple / Outlook (webcal)')}
              </a>
              <button onClick={regenerate} disabled={regenerating} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-red-600 disabled:opacity-50">
                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {t('calendar.regen', 'Bağlantıyı Yenile')}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              {t('calendar.syncNote', 'Bu özel bir bağlantıdır, paylaşmayın. Takvim uygulamaları birkaç dakikada bir günceller.')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
