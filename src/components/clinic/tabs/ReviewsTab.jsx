import React from 'react';
import ReviewItem from 'components/reviews/ReviewItem';

export default function ReviewsTab({ reviews }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
