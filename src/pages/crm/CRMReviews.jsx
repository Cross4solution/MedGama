import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Send, Loader2, ChevronLeft, ChevronRight, CheckCircle, Clock, EyeOff, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorAPI } from 'lib/api';

const STATUS_CONFIG = {
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  pending:  { label: 'Pending',  icon: Clock,       color: 'text-amber-600 bg-amber-50 border-amber-200' },
  rejected: { label: 'Rejected', icon: XCircle,     color: 'text-red-600 bg-red-50 border-red-200' },
  hidden:   { label: 'Hidden',   icon: EyeOff,      color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function CRMReviews() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Response form
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  const loadReviews = useCallback((p = 1) => {
    setLoading(true);
    doctorAPI.myReviews({ per_page: 15, page: p }).then(res => {
      const data = res?.data || res;
      setReviews(data?.data || []);
      setLastPage(data?.last_page || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadReviews(page); }, [page, loadReviews]);

  const handleRespond = (reviewId) => {
    if (!responseText.trim()) return;
    setResponding(true);
    doctorAPI.respondToReview(reviewId, responseText.trim())
      .then(() => {
        setRespondingId(null);
        setResponseText('');
        loadReviews(page);
      })
      .catch(() => {})
      .finally(() => setResponding(false));
  };

  // Stats
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('crmReviews.title', 'Patient Reviews')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('crmReviews.subtitle', 'View and respond to patient reviews on your profile')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 font-medium">{t('crmReviews.totalReviews', 'Total Reviews')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.length > 0 ? (lastPage > 1 ? `${reviews.length}+` : reviews.length) : '0'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 font-medium">{t('crmReviews.avgRating', 'Avg Rating')}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 font-medium">{t('crmReviews.pending', 'Pending')}</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{reviews.filter(r => r.moderation_status === 'pending').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 font-medium">{t('crmReviews.responded', 'Responded')}</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{reviews.filter(r => r.doctor_response).length}</p>
        </div>
      </div>

      {/* Review List */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('crmReviews.noReviews', 'No reviews yet')}</p>
          </div>
        ) : (
          reviews.map(review => {
            const patient = review.patient || {};
            const statusCfg = STATUS_CONFIG[review.moderation_status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;

            return (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center ring-1 ring-teal-100 flex-shrink-0">
                      <span className="text-sm font-bold text-teal-700">{patient.fullname?.[0] || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{patient.fullname || 'Patient'}</span>
                        <StarDisplay rating={review.rating} />
                        {review.treatment_type && (
                          <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">{review.treatment_type}</span>
                        )}
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{review.comment}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}>
                      <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Existing doctor response */}
                {review.doctor_response && (
                  <div className="mt-3 ml-13 pl-3 border-l-2 border-teal-200 bg-teal-50/40 rounded-r-lg p-3">
                    <p className="text-[10px] font-bold text-teal-700 mb-1">{t('crmReviews.yourResponse', 'Your Response')}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.doctor_response}</p>
                    {review.doctor_response_at && (
                      <p className="text-[9px] text-gray-400 mt-1">{new Date(review.doctor_response_at).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                {/* Response form */}
                {!review.doctor_response && review.moderation_status === 'approved' && (
                  respondingId === review.id ? (
                    <div className="mt-3 ml-13 flex items-start gap-2">
                      <textarea
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        placeholder={t('crmReviews.responsePlaceholder', 'Write your professional response...')}
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none"
                      />
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handleRespond(review.id)} disabled={!responseText.trim() || responding}
                          className="px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 flex items-center gap-1">
                          {responding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        </button>
                        <button onClick={() => { setRespondingId(null); setResponseText(''); }}
                          className="px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-50">
                          {t('common.cancel', 'Cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setRespondingId(review.id)}
                      className="mt-3 ml-13 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> {t('crmReviews.respond', 'Respond')}
                    </button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-500 px-2 py-1.5">{page}/{lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-50">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
