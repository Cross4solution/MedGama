import React from 'react';
import { Video, CalendarCheck, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ContactActions({ onTelehealth, onBook, onMessage }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {/* Book Appointment */}
      <button
        onClick={onBook}
        className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl focus:ring-4 focus:ring-teal-200 transition-all duration-200 font-semibold text-sm flex items-center gap-3 shadow-sm hover:shadow-md"
      >
        <CalendarCheck className="w-5 h-5 flex-shrink-0" />
        <span>{t('clinicDetail.bookAppointment')}</span>
      </button>

      {/* Telehealth Consultation */}
      <button
        onClick={onTelehealth}
        className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-sm flex items-center gap-3 shadow-sm hover:shadow-md"
      >
        <Video className="w-5 h-5 flex-shrink-0" />
        <span>{t('clinicDetail.onlineConsultation')}</span>
      </button>

      {/* Send Message */}
      <button
        onClick={onMessage}
        className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-xl focus:ring-4 focus:ring-gray-300 transition-all duration-200 font-semibold text-sm flex items-center gap-3 shadow-sm hover:shadow-md"
      >
        <MessageCircle className="w-5 h-5 flex-shrink-0" />
        <span>{t('clinicDetail.sendMessage')}</span>
      </button>
    </div>
  );
}
