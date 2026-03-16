import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { getFlagUrl } from '../../i18n';

/**
 * Renders a flag image from FlagCDN for a given language object.
 * Falls back to a Globe icon if the image fails to load.
 *
 * @param {object} props
 * @param {object} props.lang - Language object from LANGUAGES array (must have countryCode)
 * @param {number} [props.size=20] - Width in pixels (height auto-scaled to 3:4 ratio)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function LangFlag({ lang, size = 20, className = '' }) {
  const [error, setError] = useState(false);
  const url = getFlagUrl(lang, size <= 20 ? 24 : 40, size <= 20 ? 18 : 30);

  if (error || !url) {
    return (
      <Globe
        className={`text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={url}
      alt={lang?.label || ''}
      loading="lazy"
      onError={() => setError(true)}
      className={`inline-block object-contain rounded-[2px] ${className}`}
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}
