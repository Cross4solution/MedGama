'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authAPI } from '../../lib/api';
import { useTranslation } from 'react-i18next';

/**
 * Bildirim tercihleri.
 *
 * Tercihler veritabanında tutuluyordu ama hiçbir ekrandan değiştirilemiyordu
 * (yalnızca CRM panelinde, o da klinikler için). Hasta ve doktorun kendi
 * tercihini yönetebileceği yer burası.
 *
 * Randevu bildirimleri listede YOK — bilinçli. Onay, iptal ve hatırlatma
 * hizmetin kendisine ait; kapatılırsa hasta randevusundan habersiz kalır.
 * Bu yüzden sunucu da o bildirimleri tercihe bakmadan gönderiyor; burada
 * kapatılabilir gibi göstermek yanıltıcı olurdu.
 */
// İçerik çevirisi tercihi burada DEĞİL: kullanıcı açısından bir dil ayarı,
// bildirim ayarı değil. Profil ekranında, dil seçiminin hemen altında duruyor.
const AYARLAR = [
  { key: 'email_review_received', tr: 'Yeni değerlendirme geldiğinde e-posta', en: 'Email me about new reviews' },
  { key: 'email_review_response', tr: 'Değerlendirmeme yanıt verilince e-posta', en: 'Email me when someone replies to my review' },
  { key: 'email_support',         tr: 'Destek talebime yanıt gelince e-posta', en: 'Email me about support replies' },
  { key: 'inapp_social',          tr: 'Beğeni ve yorum bildirimleri', en: 'Likes and comments' },
];

export default function NotificationPrefsCard() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  // Kullanıcı bir tercihi değiştirdikten sonra gelen "ilk yükleme" cevabı
  // ekrandakini eski değere geri çeviriyordu: sunucu yavaşken cevap tıktan
  // sonra ulaşıyor, kullanıcı kapattığı bildirimi açık görüyor ve ikinci
  // tıkta aynı isteği tekrar gönderiyordu. Dokunulduktan sonra gelen yükleme
  // cevabı yok sayılır — ekrandaki değer artık kullanıcınındır.
  const dokunuldu = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await authAPI.getNotificationPrefs();
      if (dokunuldu.current) return;
      setPrefs(res?.data?.preferences || res?.preferences || {});
    } catch {
      if (dokunuldu.current) return;
      setPrefs({});
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key) => {
    const next = { ...prefs, [key]: !(prefs?.[key] ?? true) };
    dokunuldu.current = true;
    setPrefs(next);           // önce ekranda göster, istek arkada gitsin
    setSaving(key);
    setError('');
    try {
      await authAPI.updateNotificationPrefs({ [key]: next[key] });
    } catch {
      setPrefs(prefs);        // başarısızsa eski hâline dön
      setError(isTr ? 'Kaydedilemedi, tekrar deneyin.' : 'Could not save, please try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/95 shadow-lg shadow-gray-200/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
          {isTr ? 'Bildirim Tercihleri' : 'Notification Settings'}
        </div>
      </div>

      <div className="p-3 space-y-1">
        {prefs === null ? (
          <div className="flex items-center justify-center py-6 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            {AYARLAR.map(({ key, tr, en }) => {
              const acik = prefs?.[key] ?? true;
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  disabled={saving === key}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-xl text-left hover:bg-gray-50/80 transition-colors disabled:opacity-60"
                >
                  <span className="text-[13px] text-gray-700 leading-snug">{isTr ? tr : en}</span>
                  <span
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${acik ? 'bg-teal-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${acik ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                  </span>
                </button>
              );
            })}

            {error && <p className="px-2.5 text-xs text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
