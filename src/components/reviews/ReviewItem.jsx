import React from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { toEnglishTimestamp } from 'utils/i18n';

export default function ReviewItem({ review }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center ring-1 ring-teal-100">
            <span className="text-sm font-bold text-teal-700">{review.name?.[0]}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900">{review.name}</span>
              {review.verified && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </div>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {review.service && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{review.service}</span>
          )}
          <span className="text-[11px] text-gray-400">{toEnglishTimestamp(review.date) || 'Just now'}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
    </div>
  );
}
