import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DoctorGalleryModal({ gallery = [], galleryIndex, isOpen, onClose, onPrev, onNext }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, onPrev, onNext]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-lg" onClick={onClose} />
      <div className="relative z-[101] flex items-center justify-center">
        <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[1100px] max-h-[1100px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 flex items-center justify-center">
          <img
            src={gallery[galleryIndex]}
            alt={`Gallery ${galleryIndex + 1}`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] mr-5 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] ml-5 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
