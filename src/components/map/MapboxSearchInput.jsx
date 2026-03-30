import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, AlertCircle } from 'lucide-react';
import { searchPlaces, MAPBOX_CONFIG } from '../../config/mapbox';

/**
 * MapboxSearchInput - Autocomplete address search with geocoding
 * @param {object} props
 * @param {string} props.value - Current address value
 * @param {function} props.onChange - Callback when address is selected: (address, coordinates) => void
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.label - Input label
 * @param {string} props.hint - Helper text below input
 * @param {boolean} props.required - Is field required
 * @param {string} props.error - Error message
 */
export default function MapboxSearchInput({
  value = '',
  onChange,
  placeholder = 'Search for an address...',
  label = 'Address',
  hint = '',
  required = false,
  error = '',
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  const hasValidToken = MAPBOX_CONFIG.accessToken && !MAPBOX_CONFIG.accessToken.includes('placeholder') && MAPBOX_CONFIG.accessToken.length > 10;

  // Update query when value prop changes (only if different to avoid loop)
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // When user types, also update parent (for plain text fallback mode)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    // In fallback mode (no token), pass text directly to parent
    if (!hasValidToken && onChange) {
      onChange(val, null);
    }
  };

  // Search for places with debounce
  useEffect(() => {
    if (!hasValidToken) return; // Skip search if no valid token
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query, { limit: 5 });
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('[MapboxSearchInput] Search error:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, hasValidToken]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (place) => {
    const [lng, lat] = place.center;
    const address = place.place_name;
    
    setQuery(address);
    setShowDropdown(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange(address, { lat, lng });
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (onChange) {
      onChange('', null);
    }
  };

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full h-11 pl-10 pr-10 border rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((place, index) => (
            <button
              key={place.id}
              onClick={() => handleSelect(place)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-teal-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {place.text}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {place.place_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500 flex items-start gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
          <span>{hint}</span>
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
