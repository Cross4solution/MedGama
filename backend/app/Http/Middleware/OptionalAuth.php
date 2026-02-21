<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attempt to authenticate via Sanctum token without returning 401.
 * If a valid Bearer token is present, $request->user() will be populated.
 * If not, the request proceeds as a guest (user = null).
 */
class OptionalAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Try to resolve user from Bearer token silently
        try {
            $guard = auth('sanctum');
            if ($guard->check()) {
                auth()->setUser($guard->user());
            }
        } catch (\Throwable $e) {
            // Silently ignore — proceed as guest
        }

        return $next($request);
    }
}
