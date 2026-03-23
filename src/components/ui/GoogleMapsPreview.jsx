import React, { useMemo } from 'react';
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react';

/**
 * Converts a standard Google Maps share link into an embeddable iframe URL.
 *
 * Supported link formats:
 *   - https://maps.google.com/maps?q=LAT,LNG
 *   - https://www.google.com/maps/place/.../@LAT,LNG,...
 *   - https://www.google.com/maps/@LAT,LNG,...
 *   - https://goo.gl/maps/...
 *   - https://maps.app.goo.gl/...
 *   - https://www.google.com/maps/embed?pb=...
 *
 * Returns { embedUrl, isValid, isShortLink }
 */
export function parseGoogleMapsUrl(url) {
  if (!url || typeof url !== 'string') return { embedUrl: null, isValid: false, isShortLink: false };

  const trimmed = url.trim();

  // Already an embed URL — pass through
  if (trimmed.includes('/maps/embed')) {
    return { embedUrl: trimmed, isValid: true, isShortLink: false };
  }

  // Short links (goo.gl) — can't embed directly, mark as short
  if (trimmed.includes('goo.gl/maps') || trimmed.includes('maps.app.goo.gl')) {
    return { embedUrl: null, isValid: true, isShortLink: true };
  }

  // Extract coordinates from standard URLs
  let lat = null, lng = null;

  // Pattern 1: ?q=LAT,LNG or ?ll=LAT,LNG
  const qMatch = trimmed.match(/[?&](?:q|ll)=([-\d.]+),([-\d.]+)/);
  if (qMatch) { lat = qMatch[1]; lng = qMatch[2]; }

  // Pattern 2: /@LAT,LNG, or /place/.../@LAT,LNG,
  if (!lat) {
    const atMatch = trimmed.match(/@([-\d.]+),([-\d.]+)/);
    if (atMatch) { lat = atMatch[1]; lng = atMatch[2]; }
  }

  // Pattern 3: /maps/place/LAT,LNG
  if (!lat) {
    const placeMatch = trimmed.match(/\/maps\/place\/([-\d.]+),([-\d.]+)/);
    if (placeMatch) { lat = placeMatch[1]; lng = placeMatch[2]; }
  }

  // Validate that it's at least a Google Maps domain
  const isGoogleMaps = /google\.(com|[a-z]{2,3})(\/maps|\/maps\/)/.test(trimmed) ||
    /maps\.google\./.test(trimmed);

  if (lat && lng) {
    const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    return { embedUrl, isValid: true, isShortLink: false };
  }

  // Has a place name in URL — try to use it as query
  const placeNameMatch = trimmed.match(/\/maps\/place\/([^/@]+)/);
  if (placeNameMatch && isGoogleMaps) {
    const query = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
    return { embedUrl, isValid: true, isShortLink: false };
  }

  // Generic Google Maps URL with search query
  const searchMatch = trimmed.match(/[?&]q=([^&]+)/);
  if (searchMatch && isGoogleMaps) {
    const embedUrl = `https://maps.google.com/maps?q=${searchMatch[1]}&z=15&output=embed`;
    return { embedUrl, isValid: true, isShortLink: false };
  }

  return { embedUrl: null, isValid: isGoogleMaps, isShortLink: false };
}

/**
 * Validates if a URL looks like a Google Maps link.
 */
export function isValidGoogleMapsUrl(url) {
  if (!url || typeof url !== 'string') return true; // empty is valid (optional field)
  const trimmed = url.trim();
  if (!trimmed) return true;
  return /google\.(com|[a-z]{2,3})(\/maps|\/maps\/)|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.google\./.test(trimmed);
}

/**
 * GoogleMapsPreview — renders an iframe preview from a Google Maps URL.
 *
 * Props:
 *   url        - The Google Maps share link
 *   height     - iframe height (default: 220)
 *   className  - additional wrapper classes
 *   compact    - smaller variant for forms (default: false)
 */
export default function GoogleMapsPreview({ url, height = 220, className = '', compact = false }) {
  const { embedUrl, isValid, isShortLink } = useMemo(() => parseGoogleMapsUrl(url), [url]);

  if (!url?.trim()) return null;

  // Invalid URL warning
  if (!isValid) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Invalid Google Maps URL. Please paste a valid link.</span>
      </div>
    );
  }

  // Short link — can't embed, show message
  if (isShortLink || !embedUrl) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 ${className}`}>
        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-700 font-medium">Map link detected</p>
          <p className="text-[11px] text-blue-500 mt-0.5">Short links can't be previewed. Use a full Google Maps URL for preview.</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 flex-shrink-0">
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 bg-gray-50 ${className}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height={compact ? 160 : height}
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps Preview"
        className="w-full"
      />
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <MapPin className="w-3 h-3" />
          Map Preview
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors">
          Open in Maps <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
