import React from 'react';

const SkeletonLoader = ({ lines = 3 }) => {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full" />
      ))}
    </div>
  );
};

export default SkeletonLoader;
