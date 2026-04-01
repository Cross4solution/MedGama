import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check } from 'lucide-react';

/**
 * AccreditationsDropdown — Multi-select searchable dropdown for clinic accreditations
 * Props:
 *   - selected: Array of selected accreditation IDs
 *   - onChange: Callback when selection changes
 *   - disabled: Boolean to disable the dropdown
 */
export default function AccreditationsDropdown({ selected = [], onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [accreditations, setAccreditations] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch available accreditations from backend
  useEffect(() => {
    const fetchAccreditations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/accreditations');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setAccreditations(data.data || []);
      } catch (error) {
        console.error('Error fetching accreditations:', error);
        setAccreditations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccreditations();
  }, []);

  // Filter accreditations based on search term
  const filteredAccreditations = accreditations.filter((acc) =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle selection toggle
  const handleToggle = (accId) => {
    const newSelected = selected.includes(accId)
      ? selected.filter((id) => id !== accId)
      : [...selected, accId];
    onChange(newSelected);
  };

  // Get selected accreditation objects
  const selectedAccreditations = accreditations.filter((acc) => selected.includes(acc.id));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-left transition-all flex items-center justify-between ${
          isOpen ? 'border-teal-500 bg-teal-50' : 'hover:border-gray-300 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="text-sm text-gray-600">
          {selected.length === 0
            ? 'Sertifika seç...'
            : `${selected.length} sertifika seçildi`}
        </span>
        <Search className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-teal-500 rounded-xl shadow-lg z-50">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Sertifika adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 text-sm"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Yükleniyor...</div>
            ) : filteredAccreditations.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Sonuç bulunamadı</div>
            ) : (
              filteredAccreditations.map((acc) => {
                const isSelected = selected.includes(acc.id);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleToggle(acc.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{acc.name}</div>
                      {acc.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {acc.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Badges */}
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedAccreditations.map((acc) => (
            <div
              key={acc.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium"
            >
              <span>{acc.name}</span>
              <button
                type="button"
                onClick={() => handleToggle(acc.id)}
                className="hover:text-teal-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
