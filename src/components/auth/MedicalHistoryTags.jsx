import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Tag-based input for medical history.
 * Typing text and pressing comma (or Enter) converts it into a tag chip.
 * The `value` prop is a comma-separated string; `onChange` emits the updated string.
 */
export default function MedicalHistoryTags({ value = '', onChange }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  // Parse comma-separated string into array of tags
  const tags = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const addTag = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Avoid duplicates (case-insensitive)
    if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setInput('');
      return;
    }
    const next = [...tags, trimmed].join(', ');
    onChange(next);
    setInput('');
  };

  const removeTag = (idx) => {
    const next = tags.filter((_, i) => i !== idx).join(', ');
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
    // Backspace on empty input removes last tag
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[44px] w-full border border-gray-300 rounded-xl px-3 py-2 bg-white hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-all cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1 text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
            className="ml-0.5 p-0.5 rounded hover:bg-teal-100 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? 'e.g., Diabetes Type 2, Penicillin allergy...' : ''}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
}
