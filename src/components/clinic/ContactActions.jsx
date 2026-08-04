import React from 'react';
import { Video, CalendarCheck, MessageCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2.5">
      {/* Primary CTA — Book Appointment */}
      <button
        onClick={onBook}
        className="group w-full pl-3 pr-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/25 transition-all duration-200 font-semibold text-sm flex items-center gap-3 shadow-sm shadow-teal-500/20 hover:shadow-md hover:shadow-teal-500/30"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 flex-shrink-0">
          <CalendarCheck className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 text-left">{t('clinicDetail.bookAppointment')}</span>
        <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Secondary — Telehealth Consultation (doktor sayfasıyla aynı yumuşak yüzey) */}
      <button
        onClick={onTelehealth}
        className="group w-full pl-3 pr-4 py-3 bg-indigo-50 hover:bg-indigo-100/80 ring-1 ring-indigo-100 hover:ring-indigo-200 text-indigo-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all duration-200 font-semibold text-sm flex items-center gap-3"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/70 text-indigo-600 flex-shrink-0">
          <Video className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 text-left">{t('clinicDetail.onlineConsultation')}</span>
      </button>

      {/* Tertiary — Send Message */}
      <button
        onClick={onMessage}
        className="group w-full pl-3 pr-4 py-3 bg-violet-50 hover:bg-violet-100/80 ring-1 ring-violet-100 hover:ring-violet-200 text-violet-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-500/15 transition-all duration-200 font-semibold text-sm flex items-center gap-3"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/70 text-violet-600 flex-shrink-0">
          <MessageCircle className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 text-left">{t('clinicDetail.sendMessage')}</span>
      </button>
    </div>
  );
}
