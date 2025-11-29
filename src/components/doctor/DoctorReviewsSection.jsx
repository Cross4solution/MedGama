import React from 'react';
import { CheckCircle, Star } from 'lucide-react';

export default function DoctorReviewsSection({ reviews = [] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{review.name}</span>
                  {review.verified && <CheckCircle className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="text-sm text-gray-500">{review.date}</div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {review.service}
              </span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
            <div className="mt-2 text-sm text-gray-500">{review.helpful} helpful</div>
          </div>
        ))}
      </div>
    </div>
  );
}
