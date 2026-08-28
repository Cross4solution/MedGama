'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Subtitles, Check, Loader2 } from 'lucide-react';
import { medStreamAPI } from '../../lib/api';
import { LANGUAGES } from '../../i18n';

/**
 * Gönderi videolarının alt yazısı.
 *
 * Alt yazıyı tarayıcının kendi menüsüne bırakmıyoruz: her tarayıcıda başka
 * görünüyor ve "Türkçe (otomatik)" gibi bir etiket koyamıyoruz. Kendi CC
 * düğmemiz, kendi dil listemiz.
 *
 * Alt yazı hazır değilse düğme hiç çıkmaz — izleyici eksik bir şey olduğunu
 * fark etmesin, hazır olunca kendiliğinden belirsin.
 *
 * Varsayılan: videonun dili izleyicininkinden farklıysa açık gelir. Aynıysa
 * kapalı — kendi dilinde izleyen çoğu kişi için alt yazı gürültüdür.
 */
export default function VideoSubtitles({ videoRef, postId, mediaIndex = 0 }) {
  const { i18n, t } = useTranslation();
  const izleyiciDili = (i18n.language || 'en').split('-')[0];

  const [ozgunDil, setOzgunDil] = useState(null);   // videoda konuşulan dil
  const [hazirDiller, setHazirDiller] = useState([]); // sunucuda beklemeden gelenler
  const [secili, setSecili] = useState(null);        // null = kapalı
  const [yukleniyor, setYukleniyor] = useState(null); // yüklenmekte olan dil
  const [menuAcik, setMenuAcik] = useState(false);
  const [hata, setHata] = useState('');

  const trackRef = useRef(null);
  const blobRef = useRef(null);
  const menuRef = useRef(null);
  const ilkAyarYapildi = useRef(false);

  // ── Hangi diller var ──
  useEffect(() => {
    let iptal = false;
    if (!postId) return undefined;

    (async () => {
      try {
        const res = await medStreamAPI.subtitles(postId);
        if (iptal) return;
        const kayitlar = (res?.subtitles || res?.data?.subtitles || [])
          .filter((s) => Number(s.media_index) === Number(mediaIndex));
        const ozgun = kayitlar.find((s) => s.kind === 'original');
        setOzgunDil(ozgun?.language || null);
        setHazirDiller(kayitlar.map((s) => s.language));
      } catch {
        // Alt yazı bir ek değer; alınamazsa video normal oynamaya devam eder.
      }
    })();

    return () => { iptal = true; };
  }, [postId, mediaIndex]);

  // Menüde gösterilecek diller: videonun kendi dili + izleyicinin dili +
  // sunucuda zaten hazır olanlar. Sunucu istenen dili gerekirse çeviriyor,
  // o yüzden izleyicinin dilini hazır olmasa da sunabiliyoruz.
  const secenekler = useMemo(() => {
    if (!ozgunDil) return [];
    const kodlar = [...new Set([ozgunDil, izleyiciDili, ...hazirDiller])];
    return kodlar.map((kod) => ({
      kod,
      etiket: LANGUAGES.find((l) => l.code === kod)?.label || kod.toUpperCase(),
      ozgun: kod === ozgunDil,
    }));
  }, [ozgunDil, izleyiciDili, hazirDiller]);

  // ── Alt yazıyı yükle ve videoya bağla ──
  const altYaziyiAc = useCallback(async (dil) => {
    const video = videoRef?.current;
    if (!video) return;

    setHata('');
    setYukleniyor(dil);
    try {
      // Sunucu istenen dil hazır değilse özgününden çevirip saklıyor;
      // bu yüzden ilk isteyen biraz bekleyebilir, sonrakiler beklemez.
      const vtt = await medStreamAPI.subtitleVtt(postId, dil, mediaIndex);

      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      blobRef.current = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));

      if (trackRef.current) trackRef.current.remove();
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.srclang = dil;
      track.label = LANGUAGES.find((l) => l.code === dil)?.label || dil;
      track.src = blobRef.current;
      track.default = true;
      video.appendChild(track);
      trackRef.current = track;

      // Tarayıcı track'i okuyunca modunu 'showing' yapmak gerekiyor;
      // yükleme anında henüz listeye girmemiş olabiliyor.
      const goster = () => {
        for (const tt of video.textTracks) {
          tt.mode = tt.language === dil ? 'showing' : 'disabled';
        }
      };
      track.addEventListener('load', goster, { once: true });
      goster();

      setSecili(dil);
      setHazirDiller((eski) => (eski.includes(dil) ? eski : [...eski, dil]));
    } catch {
      setHata(t('subtitles.loadFailed', 'Alt yazı yüklenemedi'));
    } finally {
      setYukleniyor(null);
    }
  }, [postId, mediaIndex, videoRef, t]);

  const altYaziyiKapat = useCallback(() => {
    const video = videoRef?.current;
    if (video) {
      for (const tt of video.textTracks) tt.mode = 'disabled';
    }
    setSecili(null);
  }, [videoRef]);

  // ── Varsayılan: dil farklıysa aç ──
  useEffect(() => {
    if (ilkAyarYapildi.current || !ozgunDil) return;
    ilkAyarYapildi.current = true;
    if (ozgunDil !== izleyiciDili) altYaziyiAc(izleyiciDili);
  }, [ozgunDil, izleyiciDili, altYaziyiAc]);

  // Blob URL'i bırak — sayfa boyunca birikmesin.
  useEffect(() => () => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
  }, []);

  // Dışarı tıklayınca menü kapansın.
  useEffect(() => {
    if (!menuAcik) return undefined;
    const kapat = (e) => { if (!menuRef.current?.contains(e.target)) setMenuAcik(false); };
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, [menuAcik]);

  // Hazır alt yazı yoksa hiç görünme.
  if (secenekler.length === 0) return null;

  const durdur = (e) => e.stopPropagation();

  return (
    <div
      ref={menuRef}
      className="absolute top-2 right-2 z-20"
      onClick={durdur}
      onMouseDown={durdur}
      onPointerDown={durdur}
    >
      <button
        type="button"
        onClick={() => setMenuAcik((a) => !a)}
        aria-label={t('subtitles.button', 'Alt yazı')}
        aria-pressed={!!secili}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors ${
          secili ? 'bg-teal-600/90 text-white' : 'bg-black/60 text-white/80 hover:text-white'
        }`}
      >
        {yukleniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Subtitles className="w-4 h-4" />}
        <span className="hidden sm:inline">{t('subtitles.short', 'CC')}</span>
      </button>

      {menuAcik && (
        <div className="absolute end-0 mt-1 min-w-[11rem] rounded-xl border border-white/10 bg-black/85 backdrop-blur-md p-1 shadow-xl">
          <button
            type="button"
            onClick={() => { altYaziyiKapat(); setMenuAcik(false); }}
            className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs text-white/90 hover:bg-white/10"
          >
            {t('subtitles.off', 'Kapalı')}
            {!secili && <Check className="w-3.5 h-3.5 text-teal-400" />}
          </button>

          {secenekler.map((s) => (
            <button
              key={s.kod}
              type="button"
              disabled={yukleniyor === s.kod}
              onClick={() => { altYaziyiAc(s.kod); setMenuAcik(false); }}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs text-white/90 hover:bg-white/10 disabled:opacity-60"
            >
              <span>
                {s.etiket}
                {!s.ozgun && (
                  <span className="ml-1 text-white/45">{t('subtitles.auto', '(otomatik)')}</span>
                )}
              </span>
              {secili === s.kod && <Check className="w-3.5 h-3.5 text-teal-400" />}
            </button>
          ))}

          {hata && <p className="px-2.5 py-1.5 text-[11px] text-red-300">{hata}</p>}
        </div>
      )}
    </div>
  );
}
