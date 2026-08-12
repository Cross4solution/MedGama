'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2, ShieldCheck, AlertTriangle, WifiOff, Subtitles } from 'lucide-react';
import { telehealthAPI } from '../lib/api';
import { getEcho } from '../lib/echo';
import resolveStorageUrl from '../utils/resolveStorageUrl';

// Phase 1 self-hosted 1:1 WebRTC call. Signaling via Echo private-channel whispers
// (Reverb). Media is P2P + E2E-encrypted (DTLS-SRTP). No recording.

// Kopan bağlantı zamanlamaları. Kısa kesintiler kullanıcıya hiç yansıtılmaz:
// mobilde birkaç saniyelik dalgalanma olağan ve her seferinde uyarı göstermek
// görüşmeyi güvensiz hissettiriyor.
const UYARI_GECIKMESI_MS = 10000;   // bu süreden uzun sürerse kullanıcıya haber ver
const PES_ETME_MS = 60000;          // bu süre içinde toparlanamazsa görüşmeyi kapat
const YENIDEN_DENEME_MS = 3000;     // toparlanma denemeleri arası

export default function TelehealthCallRoom() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const appointmentId = params.appointmentId || params.id;

  const [phase, setPhase] = useState('consent'); // consent | prepare | connecting | live | ended | error
  const [errorMsg, setErrorMsg] = useState('');
  const [endNote, setEndNote] = useState('');
  const [peer, setPeer] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteActive, setRemoteActive] = useState(false);
  const [netWarn, setNetWarn] = useState(false);

  // ── Alt yazı ──
  // Motor (konuşmayı yazıya çeviren program) GPU sunucu beklediği için henüz
  // yok; burada onay akışı, şerit ve düğme kuruluyor. Motor gelince yalnızca
  // metin kaynağı bağlanacak — akış ve ekran değişmeyecek.
  //
  // kapali → izin_bekleniyor → acik   (karşı taraf onaylamazsa: kapali)
  const [captionCfg, setCaptionCfg] = useState(null);   // {available, language, requires_consent, stored}
  const [captionState, setCaptionState] = useState('kapali');
  const [captionAsk, setCaptionAsk] = useState(false);  // karşı taraf izin istedi
  const [captionLines, setCaptionLines] = useState([]); // ekranda akan son satırlar

  // Hazırlık ekranı
  const [cams, setCams] = useState([]);
  const [mics, setMics] = useState([]);
  const [camId, setCamId] = useState('');
  const [micId, setMicId] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [prepBusy, setPrepBusy] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  const echoRef = useRef(null);
  const makingOfferRef = useRef(false);
  const readyTimerRef = useRef(null);
  const rawStreamRef = useRef(null);   // donanımdan gelen ham akış (kapatırken durdurulur)
  const micCtxRef = useRef(null);      // mikrofon ses zinciri (yumuşak kısma + seviye ölçer)
  const micGainRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const chimeDoneRef = useRef({ start: false, end: false });
  const isCallerRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const giveUpTimerRef = useRef(null);

  // ── Sesler ───────────────────────────────────────────────────────────────
  // Görüşmenin başında ve sonunda çalan kısa, yumuşak ses. Ses dosyası yerine
  // tarayıcıda üretiliyor: ek istek yok, gecikme yok. Alçak seviye, uzun sönüm —
  // bildirim değil, durum bildiren bir işaret.
  const playChime = useCallback((tur) => {
    if (chimeDoneRef.current[tur]) return;
    chimeDoneRef.current[tur] = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = tur === 'end' ? 0.055 : 0.07;
      const soft = ctx.createBiquadFilter();
      soft.type = 'lowpass';
      soft.frequency.value = 2000;
      soft.connect(master);
      master.connect(ctx.destination);

      const notalar = tur === 'end'
        ? [[587.33, 0], [392.00, 0.16]]   // inen: bitti
        : [[587.33, 0], [880.00, 0.15]];  // yükselen: bağlandı

      notalar.forEach(([hz, offset]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = hz;
        const t0 = now + offset;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
        osc.connect(g);
        g.connect(soft);
        osc.start(t0);
        osc.stop(t0 + 0.95);
      });

      setTimeout(() => { try { ctx.close(); } catch {} }, 1800);
    } catch {}
  }, []);

  // ── Temizlik ─────────────────────────────────────────────────────────────
  const stopTimers = () => {
    [readyTimerRef, reconnectTimerRef].forEach((r) => {
      if (r.current) { clearInterval(r.current); r.current = null; }
    });
    [warnTimerRef, giveUpTimerRef].forEach((r) => {
      if (r.current) { clearTimeout(r.current); r.current = null; }
    });
    if (meterRafRef.current) { cancelAnimationFrame(meterRafRef.current); meterRafRef.current = null; }
  };

  const releaseMedia = () => {
    try { localStreamRef.current?.getTracks().forEach((tr) => tr.stop()); } catch {}
    localStreamRef.current = null;
    // Ham akış ayrıca durdurulmalı: kamera/mikrofon donanımını serbest bırakan o.
    try { rawStreamRef.current?.getTracks().forEach((tr) => tr.stop()); } catch {}
    rawStreamRef.current = null;
    try { micCtxRef.current?.close(); } catch {}
    micCtxRef.current = null;
    micGainRef.current = null;
    analyserRef.current = null;
  };

  const cleanup = useCallback((updateStatus = false) => {
    stopTimers();
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    releaseMedia();
    try {
      if (channelRef.current) {
        channelRef.current.stopListeningForWhisper?.('signal');
        echoRef.current?.leave?.(`telehealth.${appointmentId}`);
      }
    } catch {}
    channelRef.current = null;
    if (updateStatus) {
      telehealthAPI.updateStatus(appointmentId, 'completed').catch(() => {});
    }
  }, [appointmentId]);

  const send = useCallback((payload) => {
    try { channelRef.current?.whisper('signal', payload); } catch {}
  }, []);

  // ── Hazırlık: cihazları aç, önizleme ve mikrofon seviyesi ────────────────
  // Kullanıcı görüşmeye girmeden önce kendini görebilmeli ve mikrofonunun
  // çalıştığını doğrulayabilmeli. Aksi hâlde yanlış cihaz seçiliyse bunu ancak
  // karşı taraf bağlandıktan sonra fark ediyor.
  const cihazlariAc = useCallback(async (secilenCam, secilenMic) => {
    setPrepBusy(true);
    try {
      releaseMedia();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: secilenCam ? { deviceId: { exact: secilenCam } } : true,
        audio: secilenMic ? { deviceId: { exact: secilenMic } } : true,
      });
      rawStreamRef.current = stream;

      // Mikrofonu doğrudan göndermek yerine bir ses zincirinden geçiriyoruz.
      // Sessize alırken parçayı kapatmak (track.enabled = false) dalga formunu
      // ortasından keser; bu kesinti karşı tarafta "tık" olarak duyulur.
      // Aynı zincir seviye ölçeri de besliyor.
      let cikis = stream;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && stream.getAudioTracks().length) {
          const ctx = new AC();
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          const src = ctx.createMediaStreamSource(stream);
          const gain = ctx.createGain();
          gain.gain.value = 1;
          const dest = ctx.createMediaStreamDestination();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          src.connect(analyser);
          src.connect(gain);
          gain.connect(dest);
          micCtxRef.current = ctx;
          micGainRef.current = gain;
          analyserRef.current = analyser;
          cikis = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        }
      } catch {
        cikis = stream; // ses zinciri kurulamazsa ham akışla devam et
      }

      localStreamRef.current = cikis;
      if (localVideoRef.current) localVideoRef.current.srcObject = cikis;

      // Cihaz adları ancak izin verildikten SONRA okunabiliyor; bu yüzden
      // listeyi getUserMedia'dan sonra dolduruyoruz.
      try {
        const hepsi = await navigator.mediaDevices.enumerateDevices();
        setCams(hepsi.filter((d) => d.kind === 'videoinput'));
        setMics(hepsi.filter((d) => d.kind === 'audioinput'));
      } catch {}

      const vt = stream.getVideoTracks()[0];
      const at = stream.getAudioTracks()[0];
      if (vt?.getSettings) setCamId(vt.getSettings().deviceId || '');
      if (at?.getSettings) setMicId(at.getSettings().deviceId || '');

      return true;
    } catch (e) {
      setErrorMsg(t('telehealth.errMedia', 'Kamera/mikrofon erişimi reddedildi.'));
      setPhase('error');
      return false;
    } finally {
      setPrepBusy(false);
    }
  }, [t]);

  const hazirla = useCallback(async () => {
    setErrorMsg('');
    setPhase('prepare');
    await cihazlariAc();
  }, [cihazlariAc]);

  // Mikrofon seviye çubuğu — hazırlık ekranında çalışır.
  useEffect(() => {
    if (phase !== 'prepare') return undefined;
    const buf = new Uint8Array(256);
    let sonYazma = 0;

    const tik = () => {
      const an = analyserRef.current;
      if (an) {
        an.getByteTimeDomainData(buf);
        let toplam = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          toplam += v * v;
        }
        const rms = Math.sqrt(toplam / buf.length);
        // Her karede setState yapmak gereksiz render üretir; ~10 kare/sn yeterli.
        const simdi = performance.now();
        if (simdi - sonYazma > 100) {
          sonYazma = simdi;
          setMicLevel(Math.min(1, rms * 3));
        }
      }
      meterRafRef.current = requestAnimationFrame(tik);
    };

    meterRafRef.current = requestAnimationFrame(tik);
    return () => {
      if (meterRafRef.current) { cancelAnimationFrame(meterRafRef.current); meterRafRef.current = null; }
    };
  }, [phase]);

  const cihazDegistir = async (tur, id) => {
    if (tur === 'cam') setCamId(id); else setMicId(id);
    await cihazlariAc(tur === 'cam' ? id : camId, tur === 'mic' ? id : micId);
  };

  // ── Görüşmeye katıl ──────────────────────────────────────────────────────
  const katil = useCallback(async () => {
    setPhase('connecting');
    setErrorMsg('');

    let cfg;
    try {
      const res = await telehealthAPI.webrtc(appointmentId);
      cfg = res?.data || res;
    } catch (e) {
      setErrorMsg(t('telehealth.errAccess', 'Bu görüşmeye erişim yetkiniz yok.'));
      setPhase('error');
      return;
    }
    setPeer(cfg.peer || null);
    setCaptionCfg(cfg.captions || null);

    const echo = getEcho();
    if (!echo) {
      setErrorMsg(t('telehealth.errSignaling', 'Görüşme sunucusuna bağlanılamadı.'));
      setPhase('error');
      return;
    }
    echoRef.current = echo;

    const stream = localStreamRef.current;
    if (!stream) {
      setErrorMsg(t('telehealth.errMedia', 'Kamera/mikrofon erişimi reddedildi.'));
      setPhase('error');
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: cfg.ice_servers || [] });
    pcRef.current = pc;
    stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));

    isCallerRef.current = !!cfg.is_caller;

    const makeOffer = async () => {
      if (makingOfferRef.current) return;
      makingOfferRef.current = true;
      try {
        // Bağlantı düşmüşken yeniden teklif verirken ICE'i sıfırdan kurmak
        // gerekir; aksi hâlde artık geçerli olmayan eski ağ yolları denenir.
        const durum = pc.connectionState;
        const yenidenKur = durum === 'disconnected' || durum === 'failed';
        const offer = await pc.createOffer(yenidenKur ? { iceRestart: true } : undefined);
        await pc.setLocalDescription(offer);
        send({ kind: 'offer', sdp: pc.localDescription });
      } catch {} finally {
        makingOfferRef.current = false;
      }
    };

    // Toparlanma: arayan taraf ICE'i yeniden kurar, karşı taraf "buradayım"
    // diyerek onu tetikler. Kullanıcıya hemen bir şey gösterilmez — kısa
    // kesintiler kendiliğinden düzelir.
    const toparlanmayiBaslat = () => {
      if (reconnectTimerRef.current) return; // zaten deniyoruz
      reconnectTimerRef.current = setInterval(() => {
        const p = pcRef.current;
        if (!p || p.connectionState === 'connected' || p.connectionState === 'closed') return;
        if (isCallerRef.current) { p.restartIce?.(); makeOffer(); }
        else send({ kind: 'ready' });
      }, YENIDEN_DENEME_MS);

      if (!warnTimerRef.current) {
        warnTimerRef.current = setTimeout(() => setNetWarn(true), UYARI_GECIKMESI_MS);
      }
      if (!giveUpTimerRef.current) {
        giveUpTimerRef.current = setTimeout(() => {
          send({ kind: 'bye' });
          cleanup(true);
          setNetWarn(false);
          setEndNote(t('telehealth.endedNetwork', 'Bağlantı yeniden kurulamadı.'));
          setPhase('ended');
        }, PES_ETME_MS);
      }
    };

    const toparlanmayiDurdur = () => {
      if (reconnectTimerRef.current) { clearInterval(reconnectTimerRef.current); reconnectTimerRef.current = null; }
      if (warnTimerRef.current) { clearTimeout(warnTimerRef.current); warnTimerRef.current = null; }
      if (giveUpTimerRef.current) { clearTimeout(giveUpTimerRef.current); giveUpTimerRef.current = null; }
      setNetWarn(false);
    };

    pc.ontrack = (ev) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = ev.streams[0];
      setRemoteActive(true);
      setPhase('live');
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate) send({ kind: 'candidate', candidate: ev.candidate });
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') {
        toparlanmayiDurdur();
        setPhase('live');
      } else if (st === 'disconnected' || st === 'failed') {
        // Önceden burası boştu: kısa bir kopmada görüşme sessizce ölüyor,
        // iki taraf da baştan girmek zorunda kalıyordu.
        toparlanmayiBaslat();
      }
    };

    // 3) Signaling channel (private) + whisper handlers
    const channel = echo.private(`telehealth.${appointmentId}`);
    channelRef.current = channel;

    channel.listenForWhisper('signal', async (msg) => {
      try {
        if (msg.kind === 'ready') {
          if (isCallerRef.current) makeOffer();
        } else if (msg.kind === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ kind: 'answer', sdp: pc.localDescription });
        } else if (msg.kind === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        } else if (msg.kind === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else if (msg.kind === 'caption-request') {
          // Karşı taraf alt yazı açmak istiyor. Kendi sesimiz sunucuda yazıya
          // çevrileceği için kararı biz veriyoruz — bu yüzden soruluyor.
          setCaptionAsk(true);
        } else if (msg.kind === 'caption-accept') {
          setCaptionState('acik');
          setCaptionAsk(false);
        } else if (msg.kind === 'caption-reject') {
          setCaptionState('kapali');
          setCaptionAsk(false);
        } else if (msg.kind === 'caption-stop') {
          setCaptionState('kapali');
          setCaptionAsk(false);
          setCaptionLines([]);
        } else if (msg.kind === 'caption-line') {
          // Motor bağlanınca metin buradan akacak. Saklanmıyor: yalnızca son
          // birkaç satır ekranda tutuluyor, görüşme bitince kayboluyor.
          setCaptionLines((onceki) => [...onceki, msg.text].slice(-3));
        } else if (msg.kind === 'bye') {
          // Karşı taraf görüşmeyi sonlandırdı. Önceden hiç bildirilmiyordu;
          // bir taraf kapatınca diğerinin ekranı görüşme sürüyormuş gibi kalıyordu.
          cleanup(false);
          setPhase('ended');
        }
      } catch (e) { /* ignore malformed/late signals */ }
    });

    // Hazır olduğumuzu duyur. Tek seferlik duyuru güvenilir değil: kanala
    // katılım (yetkilendirme dahil) birkaç saniye sürebiliyor ve o süre dolmadan
    // gönderilen mesaj sessizce kayboluyor.
    const announce = () => send({ kind: 'ready' });
    announce();
    readyTimerRef.current = setInterval(() => {
      const durum = pcRef.current?.connectionState;
      if (durum === 'connected' || durum === 'closed' || !pcRef.current) {
        clearInterval(readyTimerRef.current);
        readyTimerRef.current = null;
        return;
      }
      announce();
    }, 1500);
    setTimeout(() => {
      if (readyTimerRef.current) { clearInterval(readyTimerRef.current); readyTimerRef.current = null; }
    }, 45000);

    telehealthAPI.updateStatus(appointmentId, 'in_progress').catch(() => {});
  }, [appointmentId, send, t, cleanup]);

  useEffect(() => () => cleanup(false), [cleanup]);

  // Bağlanınca ve görüşme bitince birer kez çal. Kapanış sesi yalnızca görüşme
  // gerçekten kurulduysa çalar — hiç başlamadan çıkılınca ses anlamsız olur.
  useEffect(() => {
    if (phase === 'live') playChime('start');
    if (phase === 'ended' && chimeDoneRef.current.start) playChime('end');
  }, [phase, playChime]);

  const toggleMic = () => {
    const next = !micOn;
    const gain = micGainRef.current;
    const ctx = micCtxRef.current;

    if (gain && ctx) {
      // Ani kesme "tık" sesi üretiyor; 25 ms'lik rampa duyulmuyor.
      const t0 = ctx.currentTime;
      gain.gain.cancelScheduledValues(t0);
      gain.gain.setValueAtTime(gain.gain.value, t0);
      gain.gain.linearRampToValueAtTime(next ? 1 : 0, t0 + 0.025);
    } else {
      (localStreamRef.current?.getAudioTracks() || []).forEach((tr) => { tr.enabled = next; });
    }
    setMicOn(next);
  };

  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    const next = !camOn;
    tracks.forEach((tr) => { tr.enabled = next; });
    setCamOn(next);
  };

  // Alt yazıyı açma isteği: karşı tarafa sorulur, o onaylayana kadar açılmaz.
  const captionIste = () => {
    if (!captionCfg?.available) return;
    if (captionState === 'acik') {
      send({ kind: 'caption-stop' });
      setCaptionState('kapali');
      setCaptionLines([]);
      return;
    }
    setCaptionState('izin_bekleniyor');
    send({ kind: 'caption-request' });
  };

  const captionYanit = (kabul) => {
    setCaptionAsk(false);
    send({ kind: kabul ? 'caption-accept' : 'caption-reject' });
    setCaptionState(kabul ? 'acik' : 'kapali');
  };

  const hangUp = () => {
    // Kapatmadan ÖNCE karşı tarafa haber ver — kanaldan ayrıldıktan sonra
    // gönderilen mesaj iletilmez.
    send({ kind: 'bye' });
    cleanup(true);
    setPhase('ended');
  };

  // ── Consent gate ──
  if (phase === 'consent') {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{t('telehealth.consentTitle', 'Görüşmeye Katıl')}</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {t('telehealth.consentBody', 'Görüşme uçtan uca şifrelidir ve kaydedilmez. Devam ederek kamera ve mikrofonunuzun bu görüşme için kullanılmasına izin vermiş olursunuz.')}
          </p>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              {t('common.cancel', 'Vazgeç')}
            </button>
            <button onClick={hazirla} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
              {t('telehealth.consentAccept', 'Kabul et ve devam et')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Hazırlık ekranı: kendini gör, mikrofonunu dene, cihazını seç ──
  if (phase === 'prepare') {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1 text-center">
            {t('telehealth.prepareTitle', 'Görüşmeye hazır mısınız?')}
          </h1>
          <p className="text-sm text-gray-500 mb-5 text-center">
            {t('telehealth.prepareBody', 'Kameranızı ve mikrofonunuzu kontrol edin. Konuştuğunuzda çubuk hareket etmeli.')}
          </p>

          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video mb-4">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {prepBusy && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
                <Loader2 className="w-7 h-7 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Mikrofon seviyesi */}
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-[width] duration-100"
                style={{ width: `${Math.round(micLevel * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{t('telehealth.camera', 'Kamera')}</span>
              <select
                value={camId}
                onChange={(e) => cihazDegistir('cam', e.target.value)}
                disabled={prepBusy}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white disabled:opacity-50"
              >
                {cams.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>{d.label || `${t('telehealth.camera', 'Kamera')} ${i + 1}`}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">{t('telehealth.microphone', 'Mikrofon')}</span>
              <select
                value={micId}
                onChange={(e) => cihazDegistir('mic', e.target.value)}
                disabled={prepBusy}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white disabled:opacity-50"
              >
                {mics.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>{d.label || `${t('telehealth.microphone', 'Mikrofon')} ${i + 1}`}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={() => { cleanup(false); navigate(-1); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              {t('common.cancel', 'Vazgeç')}
            </button>
            <button onClick={katil} disabled={prepBusy} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
              {t('telehealth.joinNow', 'Görüşmeye katıl')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-4">{errorMsg}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">
            {t('common.back', 'Geri dön')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <PhoneOff className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-1">{t('telehealth.ended', 'Görüşme sona erdi')}</h1>
          {endNote && <p className="text-sm text-gray-500 mt-1">{endNote}</p>}
          <button onClick={() => navigate('/telehealth')} className="mt-4 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
            {t('common.done', 'Tamam')}
          </button>
        </div>
      </div>
    );
  }

  // connecting | live
  // Görüşme ekranı, üst menünün altından sayfanın en altına kadar TAM oturur.
  return (
    <div className="fixed inset-x-0 bottom-0 top-14 sm:top-16 z-30 bg-gray-900 flex flex-col">
      <div className="relative flex-1">
        {/* Remote (main) */}
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-gray-800" />
        {!remoteActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">{t('telehealth.waitingPeer', 'Karşı taraf bekleniyor...')}</p>
            {peer && (
              <div className="mt-4 flex items-center gap-2 text-gray-400">
                <img src={resolveStorageUrl(peer.avatar)} alt="" className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
                <span className="text-sm">{peer.fullname}</span>
              </div>
            )}
          </div>
        )}

        {/* Kopma uyarısı — yalnızca kesinti uzarsa. Kısa dalgalanmalarda
            kullanıcıyı meşgul etmiyoruz, arka planda zaten toparlanıyor. */}
        {netWarn && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/95 text-white text-xs font-semibold shadow-lg">
            <WifiOff className="w-4 h-4" />
            {t('telehealth.reconnecting', 'Bağlantı yeniden kuruluyor...')}
          </div>
        )}

        {/* Karşı taraf alt yazı açmak istiyor — kendi sesimiz sunucuda yazıya
            çevrileceği için kararı biz veriyoruz. */}
        {captionAsk && (
          <div className="absolute inset-x-4 top-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[26rem] bg-white rounded-2xl shadow-2xl p-4 z-10">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {t('telehealth.captionAskTitle', 'Alt yazı açılsın mı?')}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              {t('telehealth.captionAskBody', 'Karşı taraf alt yazı kullanmak istiyor. Kabul ederseniz konuşmalar sunucumuzda yazıya çevrilir. Metin kaydedilmez, görüşme bitince silinir.')}
            </p>
            <div className="flex gap-2">
              <button onClick={() => captionYanit(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {t('telehealth.captionReject', 'Hayır')}
              </button>
              <button onClick={() => captionYanit(true)} className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
                {t('telehealth.captionAccept', 'Kabul et')}
              </button>
            </div>
          </div>
        )}

        {/* Alt yazı şeridi — motor bağlanınca metin buraya akacak. */}
        {captionState === 'acik' && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center px-4 pointer-events-none">
            <div className="max-w-2xl w-full rounded-xl bg-black/70 px-4 py-3 text-center">
              {captionLines.length === 0 ? (
                <p className="text-sm text-gray-300">
                  {t('telehealth.captionWaiting', 'Alt yazı bekleniyor...')}
                </p>
              ) : (
                captionLines.map((satir, i) => (
                  <p key={i} className={`text-sm leading-snug ${i === captionLines.length - 1 ? 'text-white' : 'text-gray-400'}`}>
                    {satir}
                  </p>
                ))
              )}
            </div>
          </div>
        )}

        {/* Local (PiP) */}
        <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-24 right-4 w-32 h-44 sm:w-40 sm:h-56 object-cover rounded-xl border-2 border-white/20 shadow-lg bg-gray-700" />
      </div>

      {/* Controls */}
      <div className="bg-gray-900/95 py-5 flex items-center justify-center gap-4">
        <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white'}`}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white'}`}>
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        {/* Alt yazı. Motor hazır değilken pasif ve sebebi yazıyor — sessizce
            çalışmayan bir düğme, kullanıcıya arıza gibi görünür. */}
        <button
          onClick={captionIste}
          disabled={!captionCfg?.available || captionState === 'izin_bekleniyor'}
          title={captionCfg?.available
            ? t('telehealth.captionToggle', 'Alt yazı')
            : t('telehealth.captionUnavailable', 'Alt yazı henüz kullanılamıyor')}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            captionState === 'acik'
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700`}
        >
          {captionState === 'izin_bekleniyor'
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Subtitles className="w-5 h-5" />}
        </button>
        <button onClick={hangUp} className="w-14 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
