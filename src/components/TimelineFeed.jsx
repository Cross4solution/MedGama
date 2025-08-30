import React from 'react';
import TimelineShareBox from './TimelineShareBox';
import TimelinePostCard from './TimelinePostCard';
import TimelineProReviewCard from './TimelineProReviewCard';
import { posts as sharedPosts, professionalReview as sharedPro } from './timelineData';

// This component renders ONLY the main timeline content (share box + posts + professional review)
// It is reused in both the full Timeline page and the PatientHome preview.
export default function TimelineFeed() {
  const posts = sharedPosts;
  const professionalReview = sharedPro;

  return (
    <div className="space-y-6">
      {/* Share Box */}
      <TimelineShareBox />

      {/* Posts */}
      {posts.map((post) => (
        <TimelinePostCard key={post.id} post={post} />
      ))}

      {/* Professional Review */}
      <TimelineProReviewCard professionalReview={professionalReview} />
    </div>
  );
}
