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
    <div ref={containerRef} className="p-3 pb-4">
      <nav className="flex overflow-x-auto gap-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={`px-3 py-1 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id
                ? 'text-[#1C6A83] border-[#1C6A83]'
                : 'text-gray-700 border-transparent hover:text-[#1C6A83] hover:border-[#1C6A83]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
