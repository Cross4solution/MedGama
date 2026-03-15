import { useState, useEffect, useRef, useCallback } from 'react';
import { telehealthAPI } from '../lib/api';

/**
 * useTelehealth hook — manages telehealth session state,
 * mock video frames, and Deepgram transcript simulation.
 */
export default function useTelehealth(appointmentId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState('pending');
  const [elapsed, setElapsed] = useState(0);

  const simulationRef = useRef(null);
  const timerRef = useRef(null);

  // ── Fetch session info ──
  const fetchSession = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await telehealthAPI.session(appointmentId);
      const data = res?.data || res;
      setSession(data);
      setMeetingStatus(data?.appointment?.meeting_status || 'created');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load session';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // ── Start session ──
  const startSession = useCallback(async () => {
    try {
      await telehealthAPI.updateStatus(appointmentId, 'in_progress');
      setMeetingStatus('in_progress');
      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  }, [appointmentId]);

  // ── End session ──
  const endSession = useCallback(async () => {
    try {
      await telehealthAPI.updateStatus(appointmentId, 'completed');
      setMeetingStatus('completed');
      stopTranscription();
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [appointmentId]);

  // ── Start transcription simulation ──
  const startTranscription = useCallback(() => {
    setIsTranscribing(true);
    setTranscripts([]);

    // Poll the simulation endpoint every 3–5 seconds
    const poll = async () => {
      try {
        const res = await telehealthAPI.simulateTranscript(appointmentId, 1);
        const data = res?.data || res;
        if (data?.results?.length) {
          setTranscripts(prev => {
            const next = [...prev, ...data.results];
            // Keep last 50 transcripts
            return next.slice(-50);
          });
        }
      } catch {
        // Silent — simulation may fail during dev
      }
    };

    // First immediate call
    poll();
    simulationRef.current = setInterval(poll, 3000 + Math.random() * 2000);
  }, [appointmentId]);

  // ── Stop transcription ──
  const stopTranscription = useCallback(() => {
    setIsTranscribing(false);
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Format elapsed time ──
  const formatElapsed = useCallback((secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return {
    session,
    loading,
    error,
    meetingStatus,
    transcripts,
    isTranscribing,
    elapsed,
    formattedElapsed: formatElapsed(elapsed),
    fetchSession,
    startSession,
    endSession,
    startTranscription,
    stopTranscription,
  };
}
