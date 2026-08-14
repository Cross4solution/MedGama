'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Play, Save, X } from 'lucide-react';
import { medStreamAPI } from '../../lib/api';
import { vttCozumle } from '../../lib/vtt';
import { LANGUAGES } from '../../i18n';

/** 62.5 → "1:02" — ekranda saat gereksiz, videolar kısa. */
function saatEtiketi(saniye) {
  const s = Math.max(0, Math.floor(Number(saniye) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Doktorun alt yazı düzeltmesi.
 *
 * Sesten yazıya çevirme ilaç ve hastalık adlarında sık yanılıyor; yanlış
 * yazılan bir alt yazı doktorun ağzından çıkmış gibi görünüyor. Düzeltilen
 * alt yazı sunucuda işaretleniyor ve bir daha otomatik üretimle bozulmuyor.
 *
 * Satıra tıklayınca video o ana atlıyor: doktor okuduğu cümleyi duymadan
 * düzeltemez.
 */
export default function SubtitleEditor({ postId, mediaIndex = 0, lang, videoRef, onClose }) {
  const { t } = useTranslation();
  const [parcalar, setParcalar] = useState(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');
  const [aktifSatir, setAktifSatir] = useState(-1);
  const listeRef = useRef(null);

  const dilEtiketi = LANGUAGES.find((l) => l.code === lang)?.label || lang;

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const vtt = await medStreamAPI.subtitleVtt(postId, lang, mediaIndex);
        if (!iptal) setParcalar(vttCozumle(vtt));
      } catch {
        if (!iptal) {
          setParcalar([]);
          setHata(t('subtitles.loadFailed', 'Alt yazı yüklenemedi'));
        }
      }
    })();
    return () => { iptal = true; };
  }, [postId, lang, mediaIndex, t]);

  // Video ilerledikçe okunan satırı işaretle — doktor nerede olduğunu görsün.
  useEffect(() => {
    const video = videoRef?.current;
    if (!video || !parcalar) return undefined;
    const izle = () => {
      const an = video.currentTime;
      setAktifSatir(parcalar.findIndex((p) => an >= p.start && an < p.end));
    };
    video.addEventListener('timeupdate', izle);
    return () => video.removeEventListener('timeupdate', izle);
  }, [videoRef, parcalar]);

  const satiraAtla = useCallback((saniye) => {
    const video = videoRef?.current;
    if (!video) return;
    try { video.currentTime = saniye; } catch {}
    video.play?.().catch(() => {});
  }, [videoRef]);

  const metniDegistir = (i, metin) => {
    setParcalar((eski) => eski.map((p, j) => (j === i ? { ...p, text: metin } : p)));
    setBilgi('');
  };

  const kaydet = async () => {
    setKaydediliyor(true);
    setHata('');
    setBilgi('');
    try {
      await medStreamAPI.updateSubtitle(postId, lang, parcalar, mediaIndex);
      // Bu dil özgün alt yazıysa sunucu eski çevirileri siliyor; onlar
      // düzeltilmiş metinden yeniden üretilecek.
      setBilgi(t('subtitles.saved', 'Alt yazı kaydedildi'));
    } catch (err) {
      setHata(err?.message || t('subtitles.saveFailed', 'Alt yazı kaydedilemedi'));
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {t('subtitles.editTitle', 'Alt yazıyı düzenle')}
          </h3>
          <p className="text-[11px] text-gray-500">{dilEtiketi}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={kaydet}
            disabled={kaydediliyor || !parcalar?.length}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all ${
              kaydediliyor || !parcalar?.length
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
            }`}
          >
            {kaydediliyor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t('common.save', 'Kaydet')}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close', 'Kapat')}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {(hata || bilgi) && (
        <p className={`px-4 py-2 text-xs ${hata ? 'text-red-600' : 'text-emerald-600'}`}>
          {hata || bilgi}
        </p>
      )}

      <div ref={listeRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {parcalar === null && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading', 'Yükleniyor')}
          </div>
        )}

        {parcalar?.length === 0 && !hata && (
          <p className="py-10 text-center text-sm text-gray-400">
            {t('subtitles.empty', 'Bu videoda düzenlenecek alt yazı yok.')}
          </p>
        )}

        {parcalar?.map((p, i) => (
          <div
            key={`${p.start}-${i}`}
            className={`flex items-start gap-2 rounded-xl px-2 py-1.5 transition-colors ${
              i === aktifSatir ? 'bg-teal-50' : 'hover:bg-gray-50'
            }`}
          >
            <button
              type="button"
              onClick={() => satiraAtla(p.start)}
              title={t('subtitles.jump', 'Bu ana git')}
              className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-600 hover:bg-teal-100 hover:text-teal-700"
            >
              <Play className="w-3 h-3" />
              {saatEtiketi(p.start)}
            </button>
            <textarea
              value={p.text}
              onChange={(e) => metniDegistir(i, e.target.value)}
              rows={Math.min(4, Math.ceil((p.text.length || 1) / 60))}
              maxLength={1000}
              className="w-full resize-y rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm leading-snug outline-none transition-all hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
