<?php

namespace App\Http\Resources\Concerns;

/**
 * Shared helper to resolve relative storage paths into absolute URLs.
 *
 * DB stores: /storage/avatars/uuid_medium.webp  (relative)
 * API returns: https://medagama-production.up.railway.app/storage/avatars/uuid_medium.webp  (absolute)
 */
trait ResolvesMediaUrls
{
    /**
     * Convert any stored media path to a relative /storage/... URL.
     *
     * The frontend resolveStorageUrl() handles origin resolution:
     *   - Vercel: /storage/… → rewrite proxy to Railway
     *   - Localhost: BACKEND_ORIGIN + /storage/…
     *   - Already absolute: pass through as-is
     */
    protected static function resolveMediaUrl(?string $path): ?string
    {
        if (!$path) return null;

        // Already absolute — pass through (e.g. external URL)
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            // Extract relative /storage/ path from absolute APP_URL-based URLs
            $appUrl = rtrim(config('app.url'), '/');
            if ($appUrl && str_starts_with($path, $appUrl . '/storage/')) {
                $path = substr($path, strlen($appUrl));
            } elseif (str_starts_with($path, 'http')) {
                // External URL (e.g. gravatar) — keep as-is
                return $path;
            }
        }

        // Normalize: ensure /storage/ prefix
        $clean = ltrim($path, '/');
        if (!str_starts_with($clean, 'storage/')) {
            $clean = 'storage/' . $clean;
        }
        // Deduplicate /storage/storage/ if legacy data
        $clean = preg_replace('#^storage/storage/#', 'storage/', $clean);

        return '/' . $clean;
    }
}
