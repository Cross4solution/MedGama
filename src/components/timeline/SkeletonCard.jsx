import React from 'react';

const SkeletonCard = React.memo(function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="px-4 pt-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200/80" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200/80 rounded-lg w-32" />
          <div className="h-3 bg-gray-100 rounded-lg w-24" />
        </div>
      </div>
      {/* Text skeleton */}
      <div className="px-4 pt-3 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-lg w-full" />
        <div className="h-3.5 bg-gray-100 rounded-lg w-4/5" />
      </div>
      {/* Image skeleton */}
      <div className="mt-3 h-52 bg-gradient-to-b from-gray-100 to-gray-50" />
      {/* Actions skeleton */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50">
        <div className="h-3 bg-gray-100 rounded-lg w-16" />
        <div className="h-3 bg-gray-100 rounded-lg w-20" />
      </div>
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <div className="h-8 bg-gray-50 rounded-lg" />
        <div className="h-8 bg-gray-50 rounded-lg" />
        <div className="h-8 bg-gray-50 rounded-lg" />
      </div>
    </div>
  );
});

export default SkeletonCard;
