import React, { useMemo } from 'react';

/**
 * MapboxView (Spec-compliant premium map)
 * Master Brief Requirements: Transition from OSM to Mapbox.
 * @param {{ address?: string, center?: [number, number], zoom?: number, height?: string, theme?: 'light' | 'dark' | 'streets' | 'satellite' }} props
 */
export default function MapboxView({ 
  address = '', 
  center, 
  zoom = 15, 
  height = '350px',
  theme = 'streets' 
}) {
  const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || '';

  const mapData = useMemo(() => {
    // Falls back to Istanbul center if no coordinates provided
    const lat = center ? center[0] : 41.0082;
    const lon = center ? center[1] : 28.9784;
    
    const style = theme === 'dark' ? 'dark-v11' : theme === 'satellite' ? 'satellite-v9' : 'streets-v12';
    
    // Premium Dynamic Map URL (Iframe approach for zero-dependency portability)
    const src = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/pin-s+2563eb(${lon},${lat})/${lon},${lat},${zoom}/800x600?access_token=${mapboxToken}`;
    
    // Interactive Map Link
    const link = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`; // Fallback to Google Maps for user navigation
    const mapboxLink = `https://www.mapbox.com/map-feedback/#/${lon}/${lat}/${zoom}`;

    return { src, link, mapboxLink, lat, lon };
  }, [center, zoom, theme, mapboxToken]);

  return (
    <div style={{ height, width: '100%' }} className="relative group overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-50">
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/5 to-transparent z-10 pointer-events-none" />
      
      {/* Map Image / Background */}
      <img
        src={mapData.src}
        alt="Location"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        <a
          href={mapData.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-xs font-medium text-slate-700 shadow-lg hover:bg-white hover:text-blue-600 transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          Get Directions
        </a>
      </div>

      {/* Coordinates / Address Tooltip (Visual) */}
      <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-[10px] text-white font-mono border border-white/10 shadow-2xl">
          {address || `${mapData.lat.toFixed(4)}, ${mapData.lon.toFixed(4)}`}
        </div>
      </div>

      {/* Spec Compliance Label */}
      <div className="absolute bottom-1 left-2 z-10 text-[9px] text-slate-400 font-medium">
        Mapbox © High-Performance Visualization
      </div>

      {/* Decorative Border Glow */}
      <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
    </div>
  );
}
