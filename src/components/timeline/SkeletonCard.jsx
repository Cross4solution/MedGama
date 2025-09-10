import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="h-40 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-6 bg-gray-100 rounded w-1/3 mt-3" />
        <div className="h-8 bg-gray-100 rounded w-1/2 ml-auto" />
      </div>
    </div>
  );
}
