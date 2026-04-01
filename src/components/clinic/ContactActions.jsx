import React from 'react';
import { Video, CalendarCheck, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
      {/* Primary — Book Appointment */}
      <button
        onClick={onBook}
        className="w-full py-2.5 px-6 bg-[#065f46] text-white rounded-none hover:bg-[#054f3a] focus:ring-4 focus:ring-emerald-200 focus:ring-inset transition-all duration-200 font-medium text-sm flex items-center gap-3 shadow-none"
      >
        <CalendarCheck className="w-4 h-4 flex-shrink-0" />
        <span>{t('clinicDetail.bookAppointment')}</span>
      </button>

      {/* Secondary — Telehealth */}
      <button
        onClick={onTelehealth}
        className="w-full py-2.5 px-6 bg-[#4338ca] text-white rounded-none hover:bg-[#3730a3] focus:ring-4 focus:ring-indigo-200 focus:ring-inset transition-all duration-200 font-medium text-sm flex items-center gap-3 shadow-none"
      >
        <Video className="w-4 h-4 flex-shrink-0" />
        <span>{t('clinicDetail.onlineConsultation')}</span>
      </button>

      {/* Tertiary — Send Message */}
      <button
        onClick={onMessage}
        className="w-full py-2.5 px-6 bg-gray-50 text-gray-700 border-none rounded-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 focus:ring-inset transition-all duration-200 font-medium text-sm flex items-center gap-3 shadow-none"
      >
        <MessageCircle className="w-4 h-4 flex-shrink-0 text-gray-500" />
        <span>{t('clinicDetail.sendMessage')}</span>
      </button>
    </div>
  );
}
