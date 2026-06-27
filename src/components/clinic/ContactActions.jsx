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

      {/* Secondary — Telehealth Consultation */}
      <button
        onClick={onTelehealth}
        className="group w-full pl-3 pr-4 py-3 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50/60 text-blue-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 font-semibold text-sm flex items-center gap-3"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
          <Video className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 text-left">{t('clinicDetail.onlineConsultation')}</span>
      </button>

      {/* Tertiary — Send Message */}
      <button
        onClick={onMessage}
        className="group w-full pl-3 pr-4 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-400/15 transition-all duration-200 font-semibold text-sm flex items-center gap-3"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex-shrink-0">
          <MessageCircle className="w-[18px] h-[18px]" />
        </span>
        <span className="flex-1 text-left">{t('clinicDetail.sendMessage')}</span>
      </button>
    </div>
  );
}
