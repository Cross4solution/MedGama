<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attempt to authenticate via Sanctum Bearer token without returning 401.
 * If a valid Bearer token is present, $request->user() will be populated.
 * If not, the request proceeds as a guest (user = null).
 */
class OptionalAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $bearer = $request->bearerToken();
            if ($bearer) {
                $accessToken = PersonalAccessToken::findToken($bearer);
                if ($accessToken) {
                    $user = $accessToken->tokenable;
                    if ($user) {
                        auth()->setUser($user);
                        $request->setUserResolver(fn () => $user);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Silently ignore — proceed as guest
        }

        return $next($request);
    }
}
