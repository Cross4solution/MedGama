import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { getStaticMapURL, getDirectionsURL, geocodeAddress, isValidCoordinates } from '../../config/mapbox';

/**
 * MapboxMap - Reusable map component with geocoding support
 * @param {object} props
 * @param {string} props.address - Physical address to display
 * @param {number} props.lat - Latitude (optional if address provided)
 * @param {number} props.lng - Longitude (optional if address provided)
 * @param {number} props.zoom - Zoom level (default: 15)
 * @param {string} props.height - Height CSS value (default: '350px')
 * @param {string} props.theme - Map theme: 'streets', 'light', 'dark', 'satellite' (default: 'streets')
 * @param {boolean} props.showDirections - Show "Get Directions" button (default: true)
 * @param {boolean} props.showAddress - Show address tooltip on hover (default: true)
 */
export default function MapboxMap({
  address = '',
  lat,
  lng,
  zoom = 15,
  height = '350px',
  theme = 'streets',
  showDirections = true,
  showAddress = true,
}) {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Geocode address if coordinates not provided
  useEffect(() => {
    const loadCoordinates = async () => {
      // If we have valid coordinates, use them
      if (isValidCoordinates(lat, lng)) {
        setCoordinates({ lat, lng });
        return;
      }

      // If we have an address, geocode it
      if (address && address.trim().length > 0) {
        setLoading(true);
        setError(null);
        try {
          const result = await geocodeAddress(address);
          if (result) {
            setCoordinates({ lat: result.lat, lng: result.lng });
          } else {
            setError('Could not find location');
          }
        } catch (err) {
          setError('Failed to load map');
          console.error('Geocoding error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCoordinates();
  }, [address, lat, lng]);

  // If no coordinates and no address, show placeholder
  if (!coordinates && !address) {
    return (
      <div
        style={{ height, width: '100%' }}
        className="flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200"
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No location provided yet.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{ height, width: '100%' }}
        className="flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !coordinates) {
    return (
      <div
        style={{ height, width: '100%' }}
        className="flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200"
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{error || 'Location not available'}</p>
        </div>
      </div>
    );
  }

  const mapURL = getStaticMapURL({
    lat: coordinates.lat,
    lng: coordinates.lng,
    zoom,
    width: 800,
    height: 600,
    style: theme === 'dark' ? 'dark-v11' : theme === 'satellite' ? 'satellite-v9' : 'streets-v12',
    marker: true,
    markerColor: '2563eb',
  });

  const directionsURL = getDirectionsURL(coordinates.lat, coordinates.lng);

  return (
    <div
      style={{ height, width: '100%' }}
      className="relative group overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-gray-50"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/5 to-transparent z-10 pointer-events-none" />

      {/* Map image */}
      <img
        src={mapURL}
        alt={address || 'Location'}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      {/* Get Directions button */}
      {showDirections && (
        <div className="absolute bottom-4 right-4 z-20">
          <a
            href={directionsURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200 text-sm font-semibold text-gray-700 shadow-lg hover:bg-white hover:text-teal-600 hover:border-teal-300 transition-all"
          >
            <Navigation className="w-4 h-4" />
            Get Directions
          </a>
        </div>
      )}

      {/* Address tooltip */}
      {showAddress && address && (
        <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-3 py-2 rounded-lg bg-gray-900/90 backdrop-blur-md text-xs text-white font-medium border border-white/10 shadow-2xl max-w-xs">
            {address}
          </div>
        </div>
      )}

      {/* Mapbox attribution */}
      <div className="absolute bottom-2 left-2 z-10 text-[9px] text-gray-400 font-medium">
        © Mapbox © OpenStreetMap
      </div>

      {/* Decorative border */}
      <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
    </div>
  );
}
