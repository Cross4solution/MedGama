import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Loader2, Search, Pill, AlertTriangle, Stethoscope, Heart, Activity } from 'lucide-react';
import { catalogAPI } from '../../lib/api';

/**
 * GlobalSuggest — Reusable autocomplete input with tag system.
 *
 * Props:
 *  - type       : 'disease' | 'allergy' | 'medication' | 'specialty' | 'symptom' | 'procedure'
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
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

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
      return;
    }
    const newTag = { code: item?.code || undefined, name, category: item?.category || undefined };
    const next = multi ? [...tags, newTag] : [newTag];
    emit(next);
    setInput('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard ──
  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        addTag(results[activeIndex]);
      } else if (allowCustom && input.trim()) {
        addTag({ name: input.trim() });
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // ── Icon per type ──
  const TypeIcon = useMemo(() => {
    switch (type) {
      case 'medication': return Pill;
      case 'allergy': return AlertTriangle;
      case 'specialty': return Stethoscope;
      case 'disease': return Heart;
      case 'symptom':
      case 'procedure': return Activity;
      default: return Search;
    }
  }, [type]);

  // ── Tag color per type ──
  const tagColors = useMemo(() => {
    switch (type) {
      case 'medication': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'allergy': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'specialty': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'disease': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'symptom':
      case 'procedure': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, [type]);

  const hoverColor = useMemo(() => {
    switch (type) {
      case 'medication': return 'bg-purple-50/60';
      case 'allergy': return 'bg-amber-50/60';
      case 'specialty': return 'bg-blue-50/60';
      default: return 'bg-teal-50/60';
    }
  }, [type]);

  // Filter out already-selected items from results
  const filteredResults = useMemo(() => {
    return results.filter((r) => !tags.some((t) =>
      (t.code && t.code === r.code) || (t.name || '').toLowerCase() === (r.name || '').toLowerCase()
    ));
  }, [results, tags]);

  const defaultPlaceholder = useMemo(() => {
    switch (type) {
      case 'disease': return 'Search diseases (e.g., Diabetes, Hypertension...)';
      case 'allergy': return 'Search allergies (e.g., Penicillin, Pollen...)';
      case 'medication': return 'Search medications (e.g., Ibuprofen, Amoxicillin...)';
      case 'specialty': return 'Search specialties (e.g., Cardiology, ENT...)';
      case 'symptom':
      case 'procedure': return 'Search symptoms or procedures...';
      default: return 'Type to search...';
    }
  }, [type]);

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
            className={`inline-flex items-center gap-1 border rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${tagColors}`}
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
                className="ml-0.5 p-0.5 rounded hover:bg-black/5 transition-colors"
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
            {tags.length === 0 && <TypeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setOpen(true); setActiveIndex(-1); }}
              onFocus={() => { if (input.trim().length >= 1) setOpen(true); }}
              onKeyDown={onKeyDown}
              onBlur={() => {
                // Small delay so click events on dropdown fire first
                setTimeout(() => {
                  if (allowCustom && input.trim() && multi) {
                    addTag({ name: input.trim() });
                  }
                }, 150);
              }}
              disabled={disabled}
              placeholder={tags.length === 0 ? (placeholder || defaultPlaceholder) : (multi ? 'Add more...' : '')}
              autoComplete="off"
              className="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400 disabled:cursor-not-allowed"
            />
            {loading && <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin flex-shrink-0" />}
          </div>
        )}
      </div>

      {/* ═══ Dropdown ═══ */}
      {open && input.trim().length >= 1 && (filteredResults.length > 0 || loading) && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200/80 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {loading && filteredResults.length === 0 && (
            <div className="px-4 py-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
          {filteredResults.map((item, idx) => (
            <button
              key={item.id || item.code || idx}
              type="button"
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => addTag(item)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                activeIndex === idx ? hoverColor : 'hover:bg-gray-50'
              }`}
            >
              <TypeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                {item.category && (
                  <p className="text-[11px] text-gray-400 capitalize">{item.category}{item.form ? ` · ${item.form}` : ''}</p>
                )}
              </div>
              {item.code && (
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  {item.code}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && input.trim().length >= 1 && !loading && filteredResults.length === 0 && results.length === 0 && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200/80 rounded-xl shadow-xl p-3 text-center">
          <p className="text-xs text-gray-400">
            No matches found.{allowCustom ? ' Press Enter to add custom entry.' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
