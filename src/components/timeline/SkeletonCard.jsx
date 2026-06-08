import React from 'react';

const SkeletonCard = React.memo(function SkeletonCard() {
  return (
    <div className="relative rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Shimmer overlay — sweeps left to right */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded-full w-36" />
          <div className="h-3 bg-gray-100 rounded-full w-24" />
        </div>
      </div>

      {/* Text lines */}
      <div className="px-4 pt-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-5/6" />
        <div className="h-3 bg-gray-100 rounded-full w-3/4" />
      </div>

      {/* Image block */}
      <div className="mt-3 h-48 bg-gradient-to-b from-gray-100 to-gray-50" />

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50">
        <div className="h-3 bg-gray-100 rounded-full w-16" />
        <div className="h-3 bg-gray-100 rounded-full w-20" />
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
