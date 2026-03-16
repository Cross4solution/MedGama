<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Add cache-control headers for API responses.
 * Public, cacheable endpoints (e.g. doctor list, clinic list, catalog)
 * get a short cache window; authenticated endpoints get no-store.
 */
class CacheHeaders
{
    public function handle(Request $request, Closure $next, string $type = 'private'): Response
    {
        $response = $next($request);

        if ($type === 'public') {
            // Public data — cache for 5 minutes at CDN level, 2 min browser
            $response->headers->set('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
        } elseif ($type === 'static') {
            // Static assets (images, sitemap) — cache for 1 hour
            $response->headers->set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600');
        } else {
            // Authenticated / private — no cache
            $response->headers->set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        }

        return $response;
    }
}
