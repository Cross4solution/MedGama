import React, { useRef, useEffect } from 'react';

export default function Tabs({ tabs = [], active, onChange }) {
  const containerRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // İlk render'da scroll yapma
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Tab değiştiğinde container'a scroll yap
    if (containerRef.current) {
      const headerHeight = 80; // Header yüksekliği (top-20 = 80px)
      const elementTop = containerRef.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementTop - headerHeight - 20; // 20px ekstra boşluk

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [active]);

  return (
    <div ref={containerRef} className="px-4 sm:px-6 pt-1 border-b border-gray-100">
      <nav className="flex overflow-x-auto gap-1 scrollbar-hide -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
              active === tab.id
                ? 'text-teal-700 border-teal-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
