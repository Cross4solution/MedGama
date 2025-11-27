import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BeforeAfterModal({ 
  photos, 
  currentIndex, 
  isOpen, 
  onClose, 
  onPrev, 
  onNext,
  sliderPosition,
  setSliderPosition 
}) {
  if (!isOpen) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="fixed inset-0 z-0 bg-black/70 backdrop-blur-lg" onClick={onClose} />
      <div className="relative z-[101] flex items-center justify-center">
        {/* Image comparison box */}
        <div className="relative w-[88vw] h-[88vw] md:w-[70vh] md:h-[70vh] max-w-[800px] max-h-[800px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20">
          {/* Before Image (full width) */}
          <img
            src={currentPhoto.before}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* After Image (clipped by slider) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={currentPhoto.after}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {/* Slider control */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              const container = e.currentTarget.parentElement;
              const onMove = (moveEvent) => {
                const rect = container.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                setSliderPosition(percent);
              };
              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
            onTouchStart={(e) => {
              const container = e.currentTarget.parentElement;
              const onMove = (touchEvent) => {
                const touch = touchEvent.touches[0];
                if (!touch) return;
                const rect = container.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                setSliderPosition(percent);
              };
              const onEnd = () => {
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
                document.removeEventListener('touchcancel', onEnd);
              };
              document.addEventListener('touchmove', onMove, { passive: false });
              document.addEventListener('touchend', onEnd);
              document.addEventListener('touchcancel', onEnd);
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="flex gap-1">
                <ChevronLeft className="w-3 h-3 text-gray-700" />
                <ChevronRight className="w-3 h-3 text-gray-700" />
              </div>
            </div>
          </div>
          {/* Labels */}
          <span className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-lg">Before</span>
          <span className="absolute top-4 right-4 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg">After</span>
          {/* Title */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm font-medium rounded-lg backdrop-blur">
            {currentPhoto.title}
          </div>
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 h-10 w-10 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Prev */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[120%] h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {/* Next */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[120%] h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/25 backdrop-blur text-white hover:bg-white/35 flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
