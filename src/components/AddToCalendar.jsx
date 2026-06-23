'use client';
import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { googleCalendarUrl, outlookCalendarUrl, icsDataUri } from '../utils/calendarLinks';

/**
 * "Add to calendar" — one-way export (no OAuth, no backend). Google / Outlook / .ics.
 * @param {object} props.appointment { id, title, date, time, durationMin, description, location }
 */
export default function AddToCalendar({ appointment, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const google = googleCalendarUrl(appointment);
  const outlook = outlookCalendarUrl(appointment);
  const ics = icsDataUri(appointment);
  if (!google) return null;

  const item = 'block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50';

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
      >
        <CalendarPlus className="w-3.5 h-3.5" />
        {t('calendar.addToCalendar', 'Takvime Ekle')}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 right-0 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <a href={google} target="_blank" rel="noreferrer" className={item} onClick={() => setOpen(false)}>Google Calendar</a>
          <a href={outlook} target="_blank" rel="noreferrer" className={item} onClick={() => setOpen(false)}>Outlook</a>
          <a href={ics} download="randevu.ics" className={item} onClick={() => setOpen(false)}>{t('calendar.appleOther', 'Apple / .ics')}</a>
        </div>
      )}
    </div>
  );
}
