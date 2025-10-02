import React, { useEffect, useMemo, useState } from 'react';

/**
 * OSMEmbedMap (dependency-free, full mobile pan/zoom)
 * Adresi Nominatim ile koordine çevirir ve OpenStreetMap embed iframe üretir.
 * @param {{ address?: string, center?: [number, number], zoom?: number, height?: string }} props
 */
export default function LeafletMap({ address = '', center, zoom = 15, height = '300px' }) {
  const [pos, setPos] = useState(center || null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (center) { setPos(center); return; }
      if (!address) return;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const { lat, lon } = data[0];
          setPos([parseFloat(lat), parseFloat(lon)]);
        } else if (!cancelled) {
          setError('Konum bulunamadı');
        }
      } catch {
        if (!cancelled) setError('Konum alınamadı');
      }
    }
    run();
    return () => { cancelled = true; };
  }, [address, center]);

  const map = useMemo(() => {
    const c = pos || [41.0082, 28.9784]; // Istanbul fallback
    const lat = c[0];
    const lon = c[1];
    // küçük bir bbox; embed pürüzsüz pan/zoom destekler
    const d = 0.01;
    const bbox = [lon - d, lat - d, lon + d, lat + d].join('%2C');
    const marker = `${lat}%2C${lon}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
    const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
    return { src, link };
  }, [pos, zoom]);

  return (
    <div style={{ height, width: '100%' }} className="relative">
      <iframe
        title="Location map"
        className="w-full h-full"
        style={{ border: 0, touchAction: 'manipulation' }}
        loading="lazy"
        src={map.src}
      />
      <a
        href={map.link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded bg-white/90 border shadow hover:bg-white"
        aria-label="Open in OpenStreetMap"
      >
        OpenStreetMap
      </a>
      {error && (
        <div className="p-2 text-xs text-red-600 bg-red-50 border-t">{error}</div>
      )}
      {/* Fixed height wrapper */}
      <style>{`.leaflet-map-fixed{height:${height};}`}</style>
    </div>
  );
}
