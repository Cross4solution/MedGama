import { useEffect, useRef } from 'react';
import { getEcho } from '../lib/echo';
import { useAuth } from '../context/AuthContext';

/**
 * Real-time appointment sync. Listens on the user's (and clinic's) private
 * channel for `appointment.changed` and invokes `onChange` so any open view
 * (patient, doctor, CRM, calendar) refreshes instantly. No-op until a WebSocket
 * server (Reverb/Pusher) is configured — falls back to manual refresh.
 *
 * @param {(event:object)=>void} onChange called with the broadcast payload
 */
export default function useAppointmentSync(onChange) {
  const { user } = useAuth();
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const echo = getEcho();
    if (!echo || !user?.id) return undefined;

    const handler = (e) => { try { cbRef.current?.(e); } catch {} };
    const channels = [`user.${user.id}`];
    if (user.clinic_id) channels.push(`clinic.${user.clinic_id}`);

    const subscribed = [];
    channels.forEach((name) => {
      try {
        const ch = echo.private(name);
        ch.listen('.appointment.changed', handler);
        subscribed.push({ name, ch });
      } catch {}
    });

    return () => {
      subscribed.forEach(({ ch }) => {
        try { ch.stopListening('.appointment.changed', handler); } catch {}
      });
    };
  }, [user?.id, user?.clinic_id]);
}
