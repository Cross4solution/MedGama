import React, { useState } from 'react';
import ImageGalleryModal from 'components/clinic/modals/ImageGalleryModal';

export default function CertificatesTab({ certificates = [] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!certificates.length) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Certificates & Licences</h3>
        <p className="text-gray-500 text-sm">No certificates have been added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Certificates & Licences</h3>
      <div className="flex flex-wrap gap-3">
        {certificates.map((src, idx) => (
          <button
            key={`cert-${idx}`}
            type="button"
            className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500"
            onClick={() => { setIndex(idx); setOpen(true); }}
          >
            <img
              src={src}
              alt={`Certificate ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <ImageGalleryModal
        images={certificates}
        currentIndex={index}
        isOpen={open}
        onClose={() => setOpen(false)}
        onPrev={() => setIndex((i) => (i - 1 + certificates.length) % certificates.length)}
        onNext={() => setIndex((i) => (i + 1) % certificates.length)}
      />
    </div>
  );
}
