import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

const OVERSCAN = 600; // px above/below viewport to keep rendered
const PLACEHOLDER_HEIGHT = 420; // estimated card height for unrendered items

/**
 * VirtualizedFeedItem — renders children only when near the viewport.
 * Once measured, it remembers its height so the placeholder doesn't jump.
 */
const VirtualizedFeedItem = memo(function VirtualizedFeedItem({ children, index, onHeightChange }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Use a generous margin so items render before they scroll into view
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: `${OVERSCAN}px 0px ${OVERSCAN}px 0px` }
    );

    observerRef.current.observe(el);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Measure actual height when content is rendered
  useEffect(() => {
    if (!isVisible || !ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height;
        if (h > 0) {
          setMeasuredHeight(h);
          if (onHeightChange) onHeightChange(index, h);
        }
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [isVisible, index, onHeightChange]);

  const placeholderH = measuredHeight || PLACEHOLDER_HEIGHT;

  return (
    <div ref={ref} style={!isVisible ? { height: placeholderH, minHeight: placeholderH } : undefined}>
      {isVisible ? children : (
        <div
          className="bg-white rounded-lg border border-gray-200/60 animate-pulse"
          style={{ height: placeholderH }}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-2.5 bg-gray-100 rounded w-full" />
              <div className="h-2.5 bg-gray-100 rounded w-4/5" />
            </div>
            <div className="h-40 bg-gray-100 rounded-lg mt-2" />
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * VirtualizedFeed — wraps a list of items and only renders those near the viewport.
 * 
 * Props:
 *  - items: array of feed items
 *  - renderItem: (item, index) => ReactNode
 *  - keyExtractor: (item) => string
 *  - gap: CSS gap between items (default '1rem')
 */
export default function VirtualizedFeed({ items, renderItem, keyExtractor, gap = '1rem' }) {
  const heightsRef = useRef({});

  const handleHeightChange = useCallback((index, height) => {
    heightsRef.current[index] = height;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {items.map((item, index) => (
        <VirtualizedFeedItem
          key={keyExtractor ? keyExtractor(item) : item.id || index}
          index={index}
          onHeightChange={handleHeightChange}
        >
          {renderItem(item, index)}
        </VirtualizedFeedItem>
      ))}
    </div>
  );
}
