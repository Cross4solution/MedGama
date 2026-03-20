import { API_BASE_URL } from '../config/apiBase';

/**
 * Extract the backend origin from API_BASE_URL.
 * "http://127.0.0.1:8001/api" → "http://127.0.0.1:8001"
 * "/api" (Vercel proxy) → "" (same-origin, relative paths work via rewrite)
 */
const BACKEND_ORIGIN = (() => {
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  return (base && !base.startsWith('/')) ? base : '';
})();

const DEFAULT_AVATAR = '/images/default/default-avatar.svg';

/**
 * Resolve a storage URL from the backend into a usable image src.
 *
 * Handles all cases:
 *  - null / undefined / '' / non-string  → fallback placeholder
 *  - Already absolute (http/https)       → return as-is
 *  - Blob / data URLs                    → return as-is (preview images)
 *  - Relative /storage/... path          → prepend backend origin (localhost) or keep as-is (Vercel proxy)
 *  - Double /storage/storage/ prefix     → deduplicate before resolving
 *  - Bare filename (e.g. "avatar_123.jpg") → prepend /storage/ + backend origin
 */
export default function resolveStorageUrl(path, fallback = DEFAULT_AVATAR) {
  if (!path || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (!trimmed) return fallback;

  // Blob or data URLs (used for local previews) — return as-is
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  // Already absolute — backend model accessor resolved it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

  // Fix double /storage/storage/ prefix (defensive)
  const cleaned = trimmed.replace(/^\/storage\/storage\//, '/storage/');

  // Relative /storage/ path — needs backend origin on localhost
  if (cleaned.startsWith('/storage/')) {
    return BACKEND_ORIGIN ? BACKEND_ORIGIN + cleaned : cleaned;
  }

  // Relative path without /storage/ prefix (e.g. "avatars/uuid_medium.webp")
  if (!cleaned.startsWith('/')) {
    return BACKEND_ORIGIN
      ? `${BACKEND_ORIGIN}/storage/${cleaned}`
      : `/storage/${cleaned}`;
  }

  // Any other relative path (e.g. "/images/...")
  return cleaned || fallback;
}
