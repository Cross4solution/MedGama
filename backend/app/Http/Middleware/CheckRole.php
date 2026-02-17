<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Usage: ->middleware('role:doctor,clinicOwner,superAdmin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!in_array($user->role_id, $roles)) {
            return response()->json([
                'message' => 'Forbidden. Required role(s): ' . implode(', ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
