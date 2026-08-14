<?php

namespace App\Providers;

use App\Listeners\BroadcastNotificationCreated;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Alt yazı motoru. Gerçek zamanlı çalışması GPU gerektiriyor; sunucu
        // gelene kadar UnavailableEngine devrede ve arayüz düğmeyi pasif tutar.
        $this->app->bind(\App\Captions\TranscriptionEngine::class, function () {
            return match (config('captions.engine')) {
                // GPU sunucu gelince buraya tek satır, örn:
                // 'whisper' => new \App\Captions\WhisperEngine(),
                default => new \App\Captions\UnavailableEngine(),
            };
        });

        // Ödeme sağlayıcısı ayardan seçilir. Seçilmediğinde tahsilat KAPALIDIR:
        // UnconfiguredProvider açık hata verir, sessizce "ödendi" saymaz.
        $this->app->bind(\App\Payments\PaymentProvider::class, function () {
            return match (config('payments.provider')) {
                // Sağlayıcı seçilince buraya tek satır eklenecek, örn:
                // 'iyzico' => new \App\Payments\IyzicoProvider(),
                default => new \App\Payments\UnconfiguredProvider(),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Broadcast database notifications via WebSocket in real-time
        Event::listen(NotificationSent::class, BroadcastNotificationCreated::class);

        // Rate limiter: general API — 120 req/min.
        // Authenticated → keyed by user id; anonymous → keyed by IP.
        // Generous enough for normal use + parallel frontend requests,
        // tight enough to deter scraping / DoS. Auth throttles below stay stricter.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many requests. Please try again later.',
                        'code'    => 'RATE_LIMIT_EXCEEDED',
                    ], 429);
                });
        });

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
