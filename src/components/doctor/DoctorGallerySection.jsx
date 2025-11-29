import React from 'react';

export default function DoctorGallerySection({ gallery = [], onImageClick }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Gallery</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {gallery.map((src, idx) => (
          <button
            key={`g-${idx}`}
            type="button"
            className="relative w-full pb-[100%] bg-gray-100 rounded-xl overflow-hidden ring-1 ring-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            onClick={() => onImageClick?.(idx)}
          >
            <img
              src={src}
              alt={`Gallery ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
