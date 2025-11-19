import React from 'react';
import BeforeAfterModal from 'components/clinic/modals/BeforeAfterModal';

export default function BeforeAfterTab({ 
  beforeAfterPhotos, 
  beforeAfterIndex, 
  setBeforeAfterIndex, 
  beforeAfterOpen, 
  setBeforeAfterOpen,
  sliderPosition,
  setSliderPosition 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Before & After Photos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beforeAfterPhotos.map((item, idx) => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setBeforeAfterIndex(idx); setBeforeAfterOpen(true); setSliderPosition(50); }}
          >
            <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="relative pb-[100%] bg-gray-100 rounded-lg overflow-hidden">
                <img src={item.before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">Before</span>
              </div>
              <div className="relative pb-[100%] bg-gray-100 rounded-lg overflow-hidden">
                <img src={item.after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-teal-600 text-white text-xs rounded">After</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>

      <BeforeAfterModal
        photos={beforeAfterPhotos}
        currentIndex={beforeAfterIndex}
        isOpen={beforeAfterOpen}
        onClose={() => setBeforeAfterOpen(false)}
        onPrev={() => { setBeforeAfterIndex((i) => (i - 1 + beforeAfterPhotos.length) % beforeAfterPhotos.length); setSliderPosition(50); }}
        onNext={() => { setBeforeAfterIndex((i) => (i + 1) % beforeAfterPhotos.length); setSliderPosition(50); }}
        sliderPosition={sliderPosition}
        setSliderPosition={setSliderPosition}
      />
    </div>
  );
}
