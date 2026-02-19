<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Rate limiter: login — 5 attempts per minute per IP
        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many login attempts. Please try again in a minute.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429);
            });
        });

        // Rate limiter: register — 3 attempts per minute per IP
        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many registration attempts. Please try again in a minute.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429);
            });
        });

        // Rate limiter: password reset — 3 attempts per minute per IP
        RateLimiter::for('auth-password', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many attempts. Please try again in a minute.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429);
            });
        });
    }
}
