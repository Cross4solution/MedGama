import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Loader2, MessageCircleQuestion } from 'lucide-react';
import { doctorAPI } from '../../lib/api';
import { useTranslation } from 'react-i18next';

export default function DoctorFaqSection({ doctorId }) {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    doctorAPI.faqs(doctorId)
      .then(res => {
        const d = res?.data?.data || res?.data || [];
        setFaqs(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!faqs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageCircleQuestion className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">{t('doctorProfile.noFaqs', 'No frequently asked questions yet.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">{t('doctorProfile.faq', 'Frequently Asked Questions')}</h3>
      <div className="space-y-2">
        {faqs.map(faq => (
          <div key={faq.id} className="border border-gray-200/60 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-3 bg-white hover:bg-gray-50/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-teal-600" />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-900">{faq.question}</span>
              {openId === faq.id
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {openId === faq.id && (
              <div className="px-5 pb-4 pt-0 bg-gray-50/30 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-11">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
