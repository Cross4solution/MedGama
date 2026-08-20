import React from 'react';
import BeforeAfterModal from 'components/clinic/modals/BeforeAfterModal';
import { useTranslation } from 'react-i18next';

export default function BeforeAfterTab({ 
  beforeAfterPhotos, 
  beforeAfterIndex, 
  setBeforeAfterIndex, 
  beforeAfterOpen, 
  setBeforeAfterOpen,
  sliderPosition,
  setSliderPosition 
}) {

  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">{t('beforeAfterTab.beforeAfterPhotos', "Before & After Photos")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beforeAfterPhotos.map((item, idx) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
            onClick={() => { setBeforeAfterIndex(idx); setBeforeAfterOpen(true); setSliderPosition(50); }}
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-2.5">{item.title}</h4>
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div className="relative pb-[100%] bg-gray-100 rounded-lg overflow-hidden">
                <img src={item.before} alt={t('beforeAfterTab.before', "Before")} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium rounded-md">{t('beforeAfterTab.before', "Before")}</span>
              </div>
              <div className="relative pb-[100%] bg-gray-100 rounded-lg overflow-hidden">
                <img src={item.after} alt={t('beforeAfterTab.after', "After")} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-teal-600/80 backdrop-blur-sm text-white text-[11px] font-medium rounded-md">{t('beforeAfterTab.after', "After")}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{item.description}</p>
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
