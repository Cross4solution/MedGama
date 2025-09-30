import React from 'react';
import TimelineShareBox from './TimelineShareBox';
import TimelineCard from 'components/timeline/TimelineCard';
import { generateExploreStyleItems } from './feedMock';
import { useAuth } from '../../context/AuthContext';

// This component renders ONLY the main timeline content (share box + posts + professional review)
// It is reused in both the full Timeline page and the PatientHome preview.
export default function TimelineFeed() {
  const { user } = useAuth();
  // Explore sayfasındaki ile aynı içerik yapısı
  const posts = generateExploreStyleItems(12);

  return (
    <div className="space-y-6">
      {/* Posts rendered with Explore-style TimelineCard data (compact + centered) */}
      {posts.map((item) => (
        <div
          key={item.id}
          id={`post-${item.id}`}
          className="w-full sm:max-w-2xl mx-auto px-2 sm:px-0"
          onClick={() => {
            try { sessionStorage.setItem('lastPostId', String(item.id)); } catch {}
          }}
        >
          <TimelineCard item={item} disabledActions={false} view={'list'} compact={true} />
        </div>
      ))}
    </div>
  );
}
