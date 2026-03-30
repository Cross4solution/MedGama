import React from 'react';
import { Video, CalendarCheck, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4 space-y-2.5">
      {/* Primary — Book Appointment */}
      <button
        onClick={onBook}
        className="w-full min-h-[46px] bg-[#065f46] text-white py-3 px-4 rounded-xl hover:bg-[#054f3a] focus:ring-4 focus:ring-emerald-200 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
      >
        <CalendarCheck className="w-4.5 h-4.5" />
        <span>{t('clinicDetail.bookAppointment')}</span>
      </button>

      {/* Secondary — Telehealth */}
      <button
        onClick={onTelehealth}
        className="w-full min-h-[46px] bg-[#4338ca] text-white py-3 px-4 rounded-xl hover:bg-[#3730a3] focus:ring-4 focus:ring-indigo-200 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
      >
        <Video className="w-4.5 h-4.5" />
        <span>{t('clinicDetail.onlineConsultation')}</span>
      </button>

      {/* Tertiary — Send Message */}
      <button
        onClick={onMessage}
        className="w-full min-h-[46px] bg-transparent text-slate-600 border-2 border-slate-300 py-3 px-4 rounded-xl hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{t('clinicDetail.sendMessage')}</span>
      </button>
    </div>
  );
}
