'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from '@/compat/router';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { telehealthAPI } from '../lib/api';
import { getEcho } from '../lib/echo';
import resolveStorageUrl from '../utils/resolveStorageUrl';

// Phase 1 self-hosted 1:1 WebRTC call. Signaling via Echo private-channel whispers
// (Reverb). Media is P2P + E2E-encrypted (DTLS-SRTP). No recording.
export default function TelehealthCallRoom() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const appointmentId = params.appointmentId || params.id;

  const [phase, setPhase] = useState('consent'); // consent | connecting | live | ended | error
  const [errorMsg, setErrorMsg] = useState('');
  const [peer, setPeer] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteActive, setRemoteActive] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  const echoRef = useRef(null);
  const makingOfferRef = useRef(false);

  const cleanup = useCallback((updateStatus = false) => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    try { localStreamRef.current?.getTracks().forEach((tr) => tr.stop()); } catch {}
    localStreamRef.current = null;
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

  const start = useCallback(async () => {
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

    const echo = getEcho();
    if (!echo) {
      setErrorMsg(t('telehealth.errSignaling', 'Görüşme sunucusuna bağlanılamadı. (Reverb yapılandırması eksik)'));
      setPhase('error');
      return;
    }
    echoRef.current = echo;

    // 1) Local media
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (e) {
      setErrorMsg(t('telehealth.errMedia', 'Kamera/mikrofon erişimi reddedildi.'));
      setPhase('error');
      return;
    }
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    // 2) Peer connection
    const pc = new RTCPeerConnection({ iceServers: cfg.ice_servers || [] });
    pcRef.current = pc;
    stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));

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
      if (st === 'connected') setPhase('live');
      if (st === 'failed' || st === 'disconnected') {
        // keep UI; let user retry/hang up
      }
    };

    const isCaller = !!cfg.is_caller;
    const makeOffer = async () => {
      if (makingOfferRef.current) return;
      makingOfferRef.current = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send({ kind: 'offer', sdp: pc.localDescription });
      } finally {
        makingOfferRef.current = false;
      }
    };

    // 3) Signaling channel (private) + whisper handlers
    const channel = echo.private(`telehealth.${appointmentId}`);
    channelRef.current = channel;

    channel.listenForWhisper('signal', async (msg) => {
      try {
        if (msg.kind === 'ready') {
          // peer joined → caller (re)sends the offer
          if (isCaller) makeOffer();
        } else if (msg.kind === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ kind: 'answer', sdp: pc.localDescription });
        } else if (msg.kind === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        } else if (msg.kind === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
      } catch (e) { /* ignore malformed/late signals */ }
    });

    // Announce readiness once subscribed; both sides ping, caller offers on ready.
    const announce = () => send({ kind: 'ready' });
    if (channel.subscribed) announce();
    channel.subscribed ? announce() : channel.on?.('pusher:subscription_succeeded', announce);
    // Fallback: also announce after a short delay in case the event was missed.
    setTimeout(announce, 800);

    telehealthAPI.updateStatus(appointmentId, 'in_progress').catch(() => {});
  }, [appointmentId, send, t]);

  useEffect(() => () => cleanup(false), [cleanup]);

  const toggleMic = () => {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    const next = !micOn;
    tracks.forEach((tr) => { tr.enabled = next; });
    setMicOn(next);
  };
  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    const next = !camOn;
    tracks.forEach((tr) => { tr.enabled = next; });
    setCamOn(next);
  };
  const hangUp = () => {
    cleanup(true);
    setPhase('ended');
  };

  // ── Consent gate ──
  if (phase === 'consent') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
            <button onClick={start} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
              {t('telehealth.consentAccept', 'Kabul et ve katıl')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <PhoneOff className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-1">{t('telehealth.ended', 'Görüşme sona erdi')}</h1>
          <button onClick={() => navigate('/telehealth')} className="mt-4 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
            {t('common.done', 'Tamam')}
          </button>
        </div>
      </div>
    );
  }

  // connecting | live
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
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
        <button onClick={hangUp} className="w-14 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
