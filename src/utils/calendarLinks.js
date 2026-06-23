// Build "add to calendar" links/files from an appointment — no backend, no OAuth.
// Floating local time (no Z) + ctz so it lands at the shown clock time.

const TZ = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul'; }
  catch { return 'Europe/Istanbul'; }
})();

// "2026-06-25" + "14:30" → "20260625T143000"
function fmt(dateStr, timeStr) {
  const d = String(dateStr || '').slice(0, 10).replace(/-/g, '');
  const t = String(timeStr || '00:00').slice(0, 5).replace(':', '') + '00';
  return d && d.length === 8 ? `${d}T${t}` : '';
}

function addMinutes(stamp, minutes) {
  // stamp: YYYYMMDDTHHMMSS → add minutes, return same format
  const y = +stamp.slice(0, 4), mo = +stamp.slice(4, 6) - 1, da = +stamp.slice(6, 8);
  const h = +stamp.slice(9, 11), mi = +stamp.slice(11, 13);
  const dt = new Date(y, mo, da, h, mi + minutes);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`;
}

/**
 * @param {object} appt { title, date, time, durationMin, description, location }
 */
export function calendarParts(appt) {
  const start = fmt(appt.date, appt.time);
  const end = start ? addMinutes(start, appt.durationMin || 30) : '';
  return {
    start,
    end,
    title: appt.title || 'MedaGama Randevu',
    description: appt.description || '',
    location: appt.location || '',
    valid: !!start,
  };
}

export function googleCalendarUrl(appt) {
  const p = calendarParts(appt);
  if (!p.valid) return '';
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: p.title,
    dates: `${p.start}/${p.end}`,
    details: p.description,
    location: p.location,
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export function outlookCalendarUrl(appt) {
  const p = calendarParts(appt);
  if (!p.valid) return '';
  // Outlook wants ISO local; convert YYYYMMDDTHHMMSS → YYYY-MM-DDTHH:MM:SS
  const iso = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:00`;
  const q = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: p.title,
    startdt: iso(p.start),
    enddt: iso(p.end),
    body: p.description,
    location: p.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.toString()}`;
}

export function icsDataUri(appt) {
  const p = calendarParts(appt);
  if (!p.valid) return '';
  const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedaGama//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${(appt.id || p.start)}@medagama`,
    `DTSTART:${p.start}`,
    `DTEND:${p.end}`,
    `SUMMARY:${esc(p.title)}`,
    p.description ? `DESCRIPTION:${esc(p.description)}` : '',
    p.location ? `LOCATION:${esc(p.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
}
