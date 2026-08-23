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

        // NOT: Bu sınırlayıcılar ->response(...) kullandığı için Laravel yanıtı
        // HttpResponseException ile taşıyor. bootstrap/app.php'deki "her şeyi
        // yakala" bloğu bir dönem onu da yakalayıp 500'e çeviriyordu; sınırı
        // aşan kullanıcı "sunucu hatası" görüyordu. Orada artık ayrıksı tutuluyor.
        //
        // Yanıtlar Laravel'in verdiği başlıkları ($basliklar) aynen taşıyor:
        // Retry-After olmadan istemci ne zaman yeniden deneyeceğini bilemez.

        // Rate limiter: general API — 120 req/min.
        // Authenticated → keyed by user id; anonymous → keyed by IP.
        // Generous enough for normal use + parallel frontend requests,
        // tight enough to deter scraping / DoS. Auth throttles below stay stricter.
        //
        // Sayı `config/app.php` üzerinden yapılandırılabilir — env() BURADA
        // çağrılamaz, yapılandırma önbelleğe alındığında null döner ve sınır
        // 0 olurdu (yani her istek engellenirdi). Varsayılan yine 120.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute((int) config('app.api_rate_limit', 120))
                ->by($request->user()?->id ?: $request->ip())
                ->response(function ($istek, array $basliklar) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many requests. Please try again later.',
                        'code'    => 'RATE_LIMIT_EXCEEDED',
                    ], 429, $basliklar);
                });
        });

        // Rate limiter: CSP ihlal raporları — IP başına dakikada 30.
        // Tarayıcı bir sayfada onlarca ihlal bildirebilir; sınır bunu
        // karşılayacak kadar geniş ama log'u sele boğduramayacak kadar dar.
        RateLimiter::for('csp-report', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip())->response(function ($istek, array $basliklar) {
                return response()->noContent(429, $basliklar);
            });
        });

        // Rate limiter: login — 5 attempts per minute per IP
        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function ($istek, array $basliklar) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many login attempts. Please try again in a minute.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429, $basliklar);
            });
        });

        // Rate limiter: register — 3 attempts per minute per IP
        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip())->response(function ($istek, array $basliklar) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many registration attempts. Please try again in a minute.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429, $basliklar);
            });
        });

        // Rate limiter: password reset — 3 attempts per minute per IP
        RateLimiter::for('auth-password', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip())->response(function ($istek, array $basliklar) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many attempts. Please try again in a minute.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429, $basliklar);
            });
        });

        // Rate limiter: e-posta doğrulama — kullanıcı başına dakikada 5.
        //
        // Doğrulama kodu 6 haneli ve SÜRESİZ. Kendine özel bir sınır yokken
        // yalnızca genel sınır (dakikada 120) geçerliydi; bu, tüm kod
        // uzayının birkaç günde taranabilmesi demekti. Doğrulamanın amacı
        // adresin gerçekten kişiye ait olduğunu göstermek olduğundan,
        // kodun denenerek bulunabilmesi doğrulamayı anlamsız kılıyordu:
        // başkasının adresiyle kayıt olup "doğrulanmış" görünmek mümkündü.
        //
        // Kullanıcı başına anahtarlanıyor — oturum gerektiren bir uç,
        // ve paylaşılan IP'deki kullanıcılar birbirini kilitlememeli.
        RateLimiter::for('auth-verify', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function ($istek, array $basliklar) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many verification attempts. Please try again in a minute.',
                        'code'    => 'RATE_LIMIT_EXCEEDED',
                    ], 429, $basliklar);
                });
        });
    }
}
