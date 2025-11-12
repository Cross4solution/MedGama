/* Lightweight performance observer (dev-only usage recommended) */
export function setupPerformanceObserver() {
  if (typeof PerformanceObserver === 'undefined') return () => {};
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      try {
        // eslint-disable-next-line no-console
        console.log(`[perf] ${entry.entryType}:${entry.name} -> ${Math.round(entry.duration)}ms`);
      } catch {}
    });
  });
  try {
    observer.observe({ entryTypes: ['navigation', 'paint', 'measure'] });
  } catch {}
  return () => {
    try { observer.disconnect(); } catch {}
  };
}
