import React, { useState, useEffect, useCallback } from 'react';
import { Star, CheckCircle, Shield, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clinicAPI } from '../../../lib/api';
import resolveStorageUrl from '../../../utils/resolveStorageUrl';

function StarRating({ rating, size = 'w-4 h-4', interactive, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star className={`${size} ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

function ClinicReviewCard({ review, t }) {
  const patient = review.patient || {};
  return (
    <div className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
      <div className="flex items-start gap-3">
        <img src={resolveStorageUrl(patient.avatar)} alt={patient.fullname}
          className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
          onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 truncate">{patient.fullname || 'Patient'}</span>
              {review.is_verified && (
                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                  {t('clinicDetail.verifiedReview', 'Verified')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {review.treatment_type && (
                <span className="text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">{review.treatment_type}</span>
              )}
              <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <StarRating rating={review.rating} size="w-3 h-3" />
          {review.comment && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{review.comment}</p>}

          {/* Clinic Response */}
          {review.clinic_response && (
            <div className="mt-3 ml-2 pl-3 border-l-2 border-teal-200 bg-teal-50/40 rounded-r-lg p-2.5">
              <p className="text-[10px] font-bold text-teal-700 mb-1">{t('clinicDetail.clinicResponse', "Clinic's Response")}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{review.clinic_response}</p>
              {review.clinic_response_at && (
                <p className="text-[9px] text-gray-400 mt-1">{new Date(review.clinic_response_at).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewsTab({ clinicId, guardAction }) {
  const { t } = useTranslation();

  // Review stats
  const [reviewStats, setReviewStats] = useState({ average_rating: null, review_count: 0, can_review: false });
  // Review list
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLastPage, setReviewLastPage] = useState(1);
  const [reviewSort, setReviewSort] = useState('newest');
  // Review form
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newTreatmentType, setNewTreatmentType] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Load stats
  useEffect(() => {
    if (!clinicId) return;
    clinicAPI.reviewStats(clinicId).then(r => {
      const data = r?.data || r;
      setReviewStats({
        average_rating: data?.average_rating || null,
        review_count: data?.review_count || 0,
        can_review: !!data?.can_review,
      });
    }).catch(() => {});
  }, [clinicId]);

  // Load reviews
  const loadReviews = useCallback((page, sort) => {
    if (!clinicId) return;
    setReviewsLoading(true);
    clinicAPI.reviews(clinicId, { per_page: 10, page, sort }).then(r => {
      const data = r?.data || r;
      setReviews(data?.data || []);
      setReviewLastPage(data?.last_page || 1);
    }).catch(() => {}).finally(() => setReviewsLoading(false));
  }, [clinicId]);

  useEffect(() => {
    loadReviews(reviewPage, reviewSort);
  }, [reviewPage, reviewSort, loadReviews]);

  // Submit review
  const handleReviewSubmit = () => {
    if (newRating < 1 || newComment.trim().length < 10) return;
    setReviewSubmitting(true);
    setReviewError(null);
    clinicAPI.submitReview(clinicId, { rating: newRating, comment: newComment, treatment_type: newTreatmentType || undefined })
      .then(() => {
        setReviewSuccess(true);
        setNewRating(0);
        setNewComment('');
        setNewTreatmentType('');
        loadReviews(1, reviewSort);
        // Refresh stats
        clinicAPI.reviewStats(clinicId).then(r => {
          const data = r?.data || r;
          setReviewStats({
            average_rating: data?.average_rating || null,
            review_count: data?.review_count || 0,
            can_review: false,
          });
        }).catch(() => {});
      })
      .catch((err) => {
        const status = err?.response?.status || err?.status;
        if (status === 403) setReviewError(t('clinicDetail.reviewNeedAppointment', 'You must have a completed appointment to review this clinic.'));
        else if (status === 409) setReviewError(t('clinicDetail.reviewAlreadyExists', 'You have already reviewed this clinic.'));
        else if (status === 429) setReviewError(t('clinicDetail.reviewFloodLimit', 'Please wait 24 hours between reviews.'));
        else setReviewError(t('clinicDetail.reviewSubmitError', 'Failed to submit review. Please try again.'));
      })
      .finally(() => setReviewSubmitting(false));
  };

  return (
    <div className="space-y-5">
      {/* Rating summary */}
      {reviewStats.average_rating && (
        <div className="flex items-center gap-4 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-gray-900">{reviewStats.average_rating}</div>
            <StarRating rating={Math.round(reviewStats.average_rating)} size="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-600">
            {t('clinicDetail.basedOnReviews', { count: reviewStats.review_count, defaultValue: `Based on ${reviewStats.review_count} reviews` })}
          </p>
        </div>
      )}

      {/* Sort filter */}
      <div className="flex items-center gap-2">
        {['newest', 'highest', 'lowest'].map(s => (
          <button key={s} onClick={() => { setReviewSort(s); setReviewPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${reviewSort === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {t(`clinicDetail.sort_${s}`, s === 'newest' ? 'Newest' : s === 'highest' ? 'Highest Rating' : 'Lowest Rating')}
          </button>
        ))}
      </div>

      {/* Review form */}
      {reviewSuccess ? (
        <div className="p-5 border border-teal-200 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-teal-600" />
          </div>
          <p className="text-sm font-bold text-teal-800 mb-1">{t('clinicDetail.reviewSuccess', 'Thank you for your review!')}</p>
          <p className="text-xs text-teal-600">{t('clinicDetail.reviewSuccessDesc', 'Your review has been submitted and will be visible after moderation.')}</p>
        </div>
      ) : reviewStats.can_review ? (
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <h4 className="text-sm font-bold text-gray-800 mb-2">{t('clinicDetail.writeReview', 'Write a Review')}</h4>
          <StarRating rating={newRating} size="w-5 h-5" interactive onChange={setNewRating} />
          <input value={newTreatmentType} onChange={e => setNewTreatmentType(e.target.value)}
            placeholder={t('clinicDetail.treatmentTypePlaceholder', 'Treatment type (e.g. Dental Cleaning)')}
            className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
          />
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder={t('clinicDetail.reviewPlaceholder', 'Share your experience (min. 10 characters)...')} rows={3}
            className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none outline-none"
          />
          {newComment.length > 0 && newComment.trim().length < 10 && (
            <p className="text-[10px] text-amber-600 mt-1">{t('clinicDetail.reviewMinChars', 'Please write at least 10 characters.')}</p>
          )}
          {reviewError && (
            <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{reviewError}</p>
            </div>
          )}
          <button onClick={guardAction ? guardAction(handleReviewSubmit) : handleReviewSubmit}
            disabled={newRating < 1 || newComment.trim().length < 10 || reviewSubmitting}
            className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 flex items-center gap-1.5 transition-colors">
            {reviewSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
            <Send className="w-3 h-3" /> {t('clinicDetail.submitReview', 'Submit Review')}
          </button>
        </div>
      ) : (
        <div className="relative p-5 border border-gray-200 rounded-xl bg-gray-50/80 backdrop-blur-sm text-center overflow-hidden">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{t('clinicDetail.reviewGateTitle', 'Verified Reviews Only')}</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              {t('clinicDetail.reviewGateDesc', 'Only patients who have completed an appointment at this clinic can share their experience. Complete your appointment and come back to leave a review.')}
            </p>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviewsLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border border-gray-100 rounded-xl animate-pulse">
            <div className="flex gap-3"><div className="w-9 h-9 rounded-full bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/3" /><div className="h-2 bg-gray-100 rounded w-full" /></div></div>
          </div>
        ))}</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(r => <ClinicReviewCard key={r.id} review={r} t={t} />)}
          {reviewLastPage > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-xs text-gray-500 px-2 py-1.5">{reviewPage}/{reviewLastPage}</span>
              <button disabled={reviewPage >= reviewLastPage} onClick={() => setReviewPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-600">{t('clinicDetail.noReviewsYet', 'No reviews yet')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('clinicDetail.noReviewsHint', 'Be the first to share your experience.')}</p>
        </div>
      )}
    </div>
  );
}
