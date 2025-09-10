import React from 'react';
import { CheckCircle, Star } from 'lucide-react';
import Badge from 'components/Badge';
import { toEnglishTimestamp } from 'utils/i18n';

export default function ReviewItem({ review }) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="font-semibold text-blue-600">{review.name?.[0]}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{review.name}</span>
              {review.verified && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{review.service}</span>
              <span>•</span>
              <span>{toEnglishTimestamp(review.date) || 'Just now'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
      </div>
      <p className="text-gray-700 mb-3">{review.comment}</p>
      <div className="flex items-center justify-end text-sm">
        {review.verified && <Badge label="Verified Patient" variant="green" size="sm" rounded="full" />}
      </div>
    </div>
  );
}
