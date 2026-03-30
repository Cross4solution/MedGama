/**
 * Mapbox Configuration
 * Global configuration for Mapbox integration across MedGama platform
 */

export const MAPBOX_CONFIG = {
  // Access token - should be set in .env as REACT_APP_MAPBOX_ACCESS_TOKEN
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWVkYWdhbWEiLCJhIjoiY204NWV0Znp6MG1jdzJpcXJvNHRscGgxeSJ9.fXy5X_3Z_0_0_0_0_0_placeholder',
  
  // Default map styles
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  },
  
  // Default center (Istanbul, Turkey)
  defaultCenter: {
    lng: 28.9784,
    lat: 41.0082,
  },
  
  // Default zoom level
  defaultZoom: 15,
  
  // API endpoints
  geocodingAPI: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  staticAPI: 'https://api.mapbox.com/styles/v1',
  
  // Marker colors
  markerColors: {
    primary: '2563eb', // blue
    success: '10b981', // green
    danger: 'ef4444', // red
    warning: 'f59e0b', // amber
    info: '06b6d4', // cyan
  },
};

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<{lng: number, lat: number, place_name: string} | null>}
 */
export async function geocodeAddress(address) {
  if (!address || address.trim().length === 0) return null;
  
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `${MAPBOX_CONFIG.geocodingAPI}/${encodedAddress}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=TR&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return {
        lng,
        lat,
        place_name: data.features[0].place_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Search for places with autocomplete
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>}
 */
export async function searchPlaces(query, options = {}) {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const country = options.country || 'TR';
    const limit = options.limit || 5;
    const types = options.types || 'address,poi';
    
    const url = `${MAPBOX_CONFIG.geocodingAPI}/${encodedQuery}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=${country}&limit=${limit}&types=${types}&language=tr`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Generate static map URL
 * @param {object} options - Map options
 * @returns {string}
 */
export function getStaticMapURL(options = {}) {
  const {
    lng = MAPBOX_CONFIG.defaultCenter.lng,
    lat = MAPBOX_CONFIG.defaultCenter.lat,
    zoom = MAPBOX_CONFIG.defaultZoom,
    width = 800,
    height = 600,
    style = 'streets-v12',
    marker = true,
    markerColor = MAPBOX_CONFIG.markerColors.primary,
  } = options;
  
  const markerOverlay = marker ? `pin-s+${markerColor}(${lng},${lat})/` : '';
  return `${MAPBOX_CONFIG.staticAPI}/mapbox/${style}/static/${markerOverlay}${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_CONFIG.accessToken}`;
}

/**
 * Generate directions URL (Google Maps)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string}
 */
export function getDirectionsURL(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Check if coordinates are valid
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}
