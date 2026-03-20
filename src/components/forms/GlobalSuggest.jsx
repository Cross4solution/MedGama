import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Loader2, Search, Pill, AlertTriangle, Stethoscope, Heart, Activity, TrendingUp, Globe } from 'lucide-react';
import { catalogAPI } from '../../lib/api';
import { useTranslation } from 'react-i18next';

/**
 * GlobalSuggest — Reusable autocomplete input with tag system.
 *
 * Props:
 *  - type       : 'disease' | 'allergy' | 'medication' | 'specialty' | 'symptom' | 'procedure' | 'medical_history' | 'language'
 *  - value      : comma-separated string  OR  array of { code, name } objects
 *  - onChange    : (newValue) => void  — emits same shape as value
 *  - multi      : boolean (default true) — allow multiple tags
 *  - placeholder : string
 *  - disabled   : boolean
 *  - className  : extra wrapper class
 *  - inputClassName : extra input class
 *  - allowCustom : boolean (default true) — allow free-text entries not in catalog
 *  - maxTags    : number (default 20)
 *  - label      : string — optional label above the input
 */
export default function GlobalSuggest({
  type = 'disease',
  value = '',
  onChange,
  multi = true,
  placeholder,
  disabled = false,
  className = '',
  inputClassName = '',
  allowCustom = true,
  maxTags = 20,
  label,
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const popularFetched = useRef(false);
  const justSelectedRef = useRef(false);

  // ── Fetch popular items once ──
  useEffect(() => {
    if (popularFetched.current) return;
    popularFetched.current = true;
    catalogAPI.popular(type, 5)
      .then((res) => {
        const data = res?.data || res;
        setPopularItems(data.results || []);
      })
      .catch(() => setPopularItems([]));
  }, [type]);

  // ── Parse value into tags array ──
  const tags = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    // comma-separated string
    return value.split(',').map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s }));
  }, [value]);

  // ── Emit ──
  const emit = useCallback((newTags) => {
    if (!onChange) return;
    if (typeof value === 'string' || value === '') {
      // emit comma-separated string
      onChange(newTags.map((t) => t.name).join(', '));
    } else {
      // emit array
      onChange(newTags);
    }
  }, [onChange, value]);

  // ── Add tag ──
  const addTag = useCallback((item) => {
    if (disabled) return;
    const name = item?.name || item?.code || String(item).trim();
    if (!name) return;
    if (tags.length >= maxTags) return;
    // Avoid duplicates
    if (tags.some((t) => (t.name || '').toLowerCase() === name.toLowerCase())) {
      setInput('');
      justSelectedRef.current = true;
      return;
    }
    const newTag = { code: item?.code || undefined, name, category: item?.category || undefined, sourceType: item?.sourceType || undefined };
    const next = multi ? [...tags, newTag] : [newTag];
    emit(next);
    setInput('');
    setResults([]);
    setOpen(false);
    setShowPopular(false);
    setActiveIndex(-1);
    justSelectedRef.current = true;
  }, [tags, multi, maxTags, disabled, emit]);

  // ── Remove tag ──
  const removeTag = useCallback((idx) => {
    if (disabled) return;
    emit(tags.filter((_, i) => i !== idx));
  }, [tags, disabled, emit]);

  // ── Debounced API search ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = input.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setShowPopular(false);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      catalogAPI.search(type, q)
        .then((res) => {
          const data = res?.data || res;
          setResults(data.results || []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [input, type]);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setShowPopular(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard ──
  const displayItems = useMemo(() => {
    if (showPopular && !input.trim()) return popularItems;
    return results;
  }, [showPopular, input, popularItems, results]);

  const onKeyDown = (e) => {
    if (disabled) return;
    const items = filteredDisplayItems;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        addTag(items[activeIndex]);
      } else if (allowCustom && input.trim()) {
        addTag({ name: input.trim() });
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setShowPopular(false);
    }
  };

  // ── Icon helpers ──
  const getIconForSourceType = (sourceType) => {
    switch (sourceType) {
      case 'medication': return Pill;
      case 'allergy': return AlertTriangle;
      case 'disease': return Heart;
      default: return null;
    }
  };

  const TypeIcon = useMemo(() => {
    switch (type) {
      case 'medication': return Pill;
      case 'allergy': return AlertTriangle;
      case 'specialty': return Stethoscope;
      case 'language': return Globe;
      case 'disease': return Heart;
      case 'medical_history': return Search;
      case 'symptom':
      case 'procedure': return Activity;
      default: return Search;
    }
  }, [type]);

  // ── Tag color — supports per-item sourceType for medical_history ──
  const getTagColor = useCallback((tag) => {
    const st = tag?.sourceType || type;
    switch (st) {
      case 'medication': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'allergy': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'specialty': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'language': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'disease': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'medical_history': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'symptom':
      case 'procedure': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, [type]);

  const getHoverColor = useCallback((item) => {
    const st = item?.sourceType || type;
    switch (st) {
      case 'medication': return 'bg-purple-50/60';
      case 'allergy': return 'bg-amber-50/60';
      case 'specialty': return 'bg-blue-50/60';
      case 'language': return 'bg-indigo-50/60';
      default: return 'bg-teal-50/60';
    }
  }, [type]);

  // ── Source type badge ──
  const sourceTypeBadge = (sourceType) => {
    if (!sourceType || type !== 'medical_history') return null;
    const labels = { disease: t('common.disease', 'Disease'), allergy: t('common.allergy', 'Allergy'), medication: t('common.medication', 'Medication') };
    const colors = { disease: 'bg-teal-100 text-teal-700', allergy: 'bg-amber-100 text-amber-700', medication: 'bg-purple-100 text-purple-700' };
    return (
      <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${colors[sourceType] || 'bg-gray-100 text-gray-600'}`}>
        {labels[sourceType] || sourceType}
      </span>
    );
  };

  // Filter out already-selected items
  const filteredDisplayItems = useMemo(() => {
    return displayItems.filter((r) => !tags.some((t) =>
      (t.code && t.code === r.code) || (t.name || '').toLowerCase() === (r.name || '').toLowerCase()
    ));
  }, [displayItems, tags]);

  const defaultPlaceholder = useMemo(() => {
    switch (type) {
      case 'disease': return 'Search diseases (e.g., Diabetes, Hypertension...)';
      case 'allergy': return 'Search allergies (e.g., Penicillin, Pollen...)';
      case 'medication': return 'Search medications (e.g., Ibuprofen, Amoxicillin...)';
      case 'medical_history': return t('auth.medicalHistorySearch', 'Search diseases, allergies, medications...');
      case 'specialty': return 'Search specialties (e.g., Cardiology, ENT...)';
      case 'language': return t('onboarding.searchLanguages', 'Search languages (e.g., Turkish, English...)');
      case 'symptom':
      case 'procedure': return 'Search symptoms or procedures...';
      default: return 'Type to search...';
    }
  }, [type, t]);

  const isDropdownOpen = open && (
    (input.trim().length >= 1 && (filteredDisplayItems.length > 0 || loading)) ||
    (showPopular && !input.trim() && filteredDisplayItems.length > 0)
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div
        className={`flex flex-wrap items-center gap-1.5 min-h-[44px] w-full border rounded-xl px-3 py-2 transition-all cursor-text ${
          disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
            : 'bg-white border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400'
        } ${inputClassName}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Tags */}
        {tags.map((tag, idx) => (
          <span
            key={`${tag.code || tag.name}-${idx}`}
            className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-[13px] font-medium leading-snug transition-all whitespace-nowrap ${getTagColor(tag)}`}
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
                className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
                aria-label={`Remove ${tag.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        {(multi || tags.length === 0) && (
          <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setOpen(true); setShowPopular(false); setActiveIndex(-1); }}
              onFocus={() => {
                if (input.trim().length >= 1) {
                  setOpen(true);
                } else if (popularItems.length > 0) {
                  setShowPopular(true);
                  setOpen(true);
                }
              }}
              onKeyDown={onKeyDown}
              onBlur={() => {
                // Small delay so click events on dropdown fire first
                setTimeout(() => {
                  // Skip if a dropdown item was just selected (prevents stale partial text being added)
                  if (justSelectedRef.current) {
                    justSelectedRef.current = false;
                    return;
                  }
                  if (allowCustom && input.trim() && multi) {
                    addTag({ name: input.trim() });
                  }
                }, 150);
              }}
              disabled={disabled}
              placeholder={tags.length === 0 ? (placeholder || defaultPlaceholder) : (multi ? 'Add more...' : '')}
              autoComplete="off"
              className="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400 disabled:cursor-not-allowed pl-4"
            />
            {loading && <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin flex-shrink-0" />}
          </div>
        )}
      </div>

      {/* ═══ Dropdown ═══ */}
      {isDropdownOpen && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200/80 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {/* Popular header */}
          {showPopular && !input.trim() && filteredDisplayItems.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">
                {t('auth.frequentlySeen', 'Frequently Seen')}
              </span>
            </div>
          )}
          {loading && filteredDisplayItems.length === 0 && (
            <div className="px-4 py-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('common.searching', 'Searching...')}</span>
            </div>
          )}
          {filteredDisplayItems.map((item, idx) => {
            return (
              <button
                key={item.id || item.code || idx}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => addTag(item)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                  activeIndex === idx ? getHoverColor(item) : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  {item.category && (
                    <p className="text-[11px] text-gray-400 capitalize">{item.category}{item.form ? ` · ${item.form}` : ''}</p>
                  )}
                </div>
                {sourceTypeBadge(item.sourceType)}
                {item.code && !item.sourceType && (
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                    {item.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {open && input.trim().length >= 1 && !loading && filteredDisplayItems.length === 0 && results.length === 0 && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200/80 rounded-xl shadow-xl p-3 text-center">
          <p className="text-xs text-gray-400">
            {t('common.noMatchesFound', 'No matches found.')}{allowCustom ? ` ${t('common.pressEnterCustom', 'Press Enter to add custom entry.')}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
