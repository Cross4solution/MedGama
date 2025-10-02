import React, { useEffect, useRef, useState } from 'react';

// Dinamik olarak OpenLayers (ol) kütüphanesini CDN'den yükler
const OL_VERSION = '7.5.2';
const CDN_CANDIDATES = [
  {
    js: `https://unpkg.com/ol@${OL_VERSION}/dist/ol.js`,
    css: `https://unpkg.com/ol@${OL_VERSION}/dist/ol.css`,
  },
  {
    js: `https://cdn.jsdelivr.net/npm/ol@${OL_VERSION}/dist/ol.js`,
    css: `https://cdn.jsdelivr.net/npm/ol@${OL_VERSION}/dist/ol.css`,
  },
];

function loadOpenLayers() {
  return new Promise((resolve, reject) => {
    if (window['ol']) { resolve(window['ol']); return; }

    let idx = 0;
    const tryNext = () => {
      if (idx >= CDN_CANDIDATES.length) { reject(new Error('CDN load failed')); return; }
      const { js, css } = CDN_CANDIDATES[idx++];

      // CSS
      if (!document.querySelector(`link[href="${css}"]`)) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = css;
        document.head.appendChild(l);
      }
      // JS
      const exist = document.querySelector(`script[src="${js}"]`);
      if (exist) {
        exist.addEventListener('load', () => resolve(window['ol']));
        exist.addEventListener('error', tryNext);
        return;
      }
      const s = document.createElement('script');
      s.src = js;
      s.async = true;
      s.onload = () => resolve(window['ol']);
      s.onerror = tryNext;
      document.body.appendChild(s);
    };

    tryNext();
  });
}

/**
 * OSMInteractiveMap: API anahtarsız, mobil pan/zoom tam etkileşimli harita
 * @param {{ address?: string, center?: [number, number], zoom?: number, height?: string }} props
 */
export default function OSMInteractiveMap({ address = '', center, zoom = 15, height = '320px' }) {
  const containerRef = useRef(null);
  const [err, setErr] = useState('');
  const [pos, setPos] = useState(center || null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let mapInstance = null;
    let markerLayer = null;
    let timeoutId;

    async function init() {
      try {
        // harita kütüphanesini 6sn içinde yükleyemezsek embed fallback'a düş
        timeoutId = window.setTimeout(() => {
          if (!cancelled) { setUseFallback(true); }
        }, 6000);

        const ol = await loadOpenLayers();
        if (cancelled) return;
        window.clearTimeout(timeoutId);

        // Koordinat
        let lat = 41.0082, lon = 28.9784; // Istanbul fallback
        if (Array.isArray(center)) {
          lat = Number(center[0]); lon = Number(center[1]);
        } else if (address) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
            }
          } catch {}
        }
        setPos([lat, lon]);

        const target = containerRef.current;
        if (!target) return;

        // View ve Map
        const view = new ol.View({
          center: ol.proj.fromLonLat([lon, lat]),
          zoom,
        });

        mapInstance = new ol.Map({
          target,
          view,
          layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
          controls: ol.control.defaults(),
          interactions: ol.interaction.defaults({
            mouseWheelZoom: true,
            dragPan: true,
            pinchZoom: true,
          }),
        });

        // Marker
        const feature = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])) });
        markerLayer = new ol.layer.Vector({
          source: new ol.source.Vector({ features: [feature] }),
          style: new ol.style.Style({
            image: new ol.style.Circle({ radius: 6, fill: new ol.style.Fill({ color: '#2563eb' }), stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }) })
          })
        });
        mapInstance.addLayer(markerLayer);
      } catch (e) {
        if (!cancelled) {
          setErr('Harita yüklenemedi');
          setUseFallback(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      // OpenLayers map destroy
      try {
        if (containerRef.current && containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      } catch {}
    };
  }, [address, center, zoom]);

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden relative">
      {!useFallback ? (
        <div ref={containerRef} style={{ height: '100%', width: '100%', touchAction: 'auto' }} />
      ) : (
        // Fallback: OSM embed (mobil panning destekler)
        (() => {
          const c = Array.isArray(pos) ? pos : [41.0082, 28.9784];
          const [lat, lon] = c;
          const d = 0.01;
          const bbox = [lon - d, lat - d, lon + d, lat + d].join('%2C');
          const marker = `${lat}%2C${lon}`;
          const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
          return (
            <iframe
              title="Konum haritası"
              src={src}
              className="w-full h-full"
              style={{ border: 0, touchAction: 'manipulation' }}
              loading="lazy"
            />
          );
        })()
      )}
      {err && (
        <div className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded bg-white/90 border shadow">{err}</div>
      )}
    </div>
  );
}
