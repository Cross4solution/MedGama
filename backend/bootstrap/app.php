<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Kanal yetkilendirme (görüntülü görüşme sinyali buna bağlı).
    // withRouting(channels: ...) rotayı 'web' middleware'iyle kaydediyordu; uygulama
    // ise Bearer token gönderiyor. Çerez oturumu olmadığı için kullanıcı tanınmıyor,
    // imza üretilmiyor ve iki taraf da kanala giremiyordu → görüşme hiç kurulmuyordu.
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        attributes: ['middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth'          => \App\Http\Middleware\Authenticate::class,
            'role'          => \App\Http\Middleware\CheckRole::class,
            'optional.auth' => \App\Http\Middleware\OptionalAuth::class,
            'crm.access'    => \App\Http\Middleware\CheckCrmAccess::class,
            'verified.doctor' => \App\Http\Middleware\EnsureDoctorVerified::class,
            'medstream.publish' => \App\Http\Middleware\EnsureCanPublishMedStream::class,
            'medstream.comment' => \App\Http\Middleware\EnsureCanCommentMedStream::class,
            'set.locale'    => \App\Http\Middleware\SetLocale::class,
            'cache.headers' => \App\Http\Middleware\CacheHeaders::class,
        ]);

        // CORS handled by Laravel HandleCors (default global middleware).
        // No need to prepend — it's already in the default stack.
        // Just ensure CSRF is removed from API routes (Bearer token auth only).
        $middleware->api(
            remove: [
                \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            ],
            append: [
                \App\Http\Middleware\SetLocale::class,
                // Geçici teşhis — TIMING_HEADER olmadan kapalı, teslimden önce kaldırılacak.
                \App\Http\Middleware\SureOlcer::class,
                // Varsayılan: hiçbir API yanıtı önbelleğe yazılmaz. Hasta
                // verisi taşıyan uçlar bu middleware'e tek tek bağlanmıyordu
                // ve Symfony'nin varsayılanıyla (no-cache, private) çıkıyordu
                // — paylaşılan önbelleğe girmez ama tarayıcının diske
                // yazmasını engellemez. Herkese açık uçlar kendi rotasında
                // `cache.headers:public;...` ile bunu gevşetiyor; o middleware
                // sonra çalıştığı için üstüne yazar.
                \App\Http\Middleware\CacheHeaders::class,
                // General API rate limit (120/min, user-id or IP based).
                // Stricter auth-specific throttles (login/register/password)
                // are applied per-route and remain in effect.
                'throttle:api',
            ],
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // Yakalanmayan hataları Sentry'ye bildir. Öncesinde canlıdaki hatalar
        // yalnızca sunucu log dosyasında kalıyordu; kimse bakmadığı için bir
        // şey bozulduğunda müşteri söyleyene kadar haberimiz olmuyordu.
        // Hasta verisi göndermeme ayarları config/sentry.php içinde.
        \Sentry\Laravel\Integration::handles($exceptions);

        // ── Authentication (401) ──
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                    'code'    => 'UNAUTHENTICATED',
                ], 401);
            }
        });

        // ── Authorization / Forbidden (403) ──
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'You are not authorized to perform this action.',
                    'code'    => 'FORBIDDEN',
                ], 403);
            }
        });

        // ── Model Not Found (404) ──
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $model = class_basename($e->getModel());
                return response()->json([
                    'success' => false,
                    'message' => "{$model} not found.",
                    'code'    => 'RESOURCE_NOT_FOUND',
                ], 404);
            }
        });

        // ── Route Not Found (404) ──
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'The requested endpoint does not exist.',
                    'code'    => 'ENDPOINT_NOT_FOUND',
                ], 404);
            }
        });

        // ── Validation (422) ──
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'code'    => 'VALIDATION_ERROR',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        // ── Rate Limiting (429) ──
        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Too many requests. Please try again later.',
                    'code'    => 'RATE_LIMIT_EXCEEDED',
                ], 429);
            }
        });

        // ── Database / Query Errors (500) ──
        $exceptions->render(function (QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                \Log::error('Database error', [
                    'message' => $e->getMessage(),
                    'sql'     => $e->getSql(),
                    'url'     => $request->fullUrl(),
                    'user_id' => $request->user()?->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => app()->isProduction()
                        ? 'A database error occurred. Please try again later.'
                        : $e->getMessage(),
                    'code'    => 'DATABASE_ERROR',
                ], 500);
            }
        });

        // ── Access Denied (403 from policies via AuthorizesRequests) ──
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'You are not authorized to perform this action.',
                    'code'    => 'FORBIDDEN',
                ], 403);
            }
        });

        // ── Generic HTTP Exceptions ──
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'An error occurred.',
                    'code'    => 'HTTP_ERROR',
                ], $e->getStatusCode());
            }
        });

        // ── Catch-all for unexpected errors (500) ──
        $exceptions->render(function (\Throwable $e, Request $request) {
            // HttpResponseException bir hata DEĞİL: içinde hazır bir yanıt
            // taşıyor ve Laravel onu olduğu gibi döndürmeli.
            //
            // Hız sınırlayıcı ("çok fazla istek", 429) yanıtını bu istisnayla
            // taşıyor. Aşağıdaki blok onu da yakalayıp 500'e çevirdiği için
            // sınırı aşan her istek, kullanıcıya "sunucu hatası" olarak
            // dönüyordu — canlıda aylardır görülen aralıklı 500 patlamalarının
            // sebebi buydu. Yük altında %80'e kadar çıktığı ölçüldü.
            //
            // Ayrıca hatayı gizliyordu: gerçek sebep "istek sınırı aşıldı"
            // iken loga "Unhandled exception" olarak düşüyor, istemci de
            // yeniden denemesi gerektiğini anlayamıyordu.
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) {
                return null; // Laravel kendi işlesin
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                \Log::error('Unhandled exception', [
                    'exception' => get_class($e),
                    'message'   => $e->getMessage(),
                    'file'      => $e->getFile() . ':' . $e->getLine(),
                    'url'       => $request->fullUrl(),
                    'user_id'   => $request->user()?->id,
                ]);

                $yanit = response()->json([
                    'success' => false,
                    'message' => app()->isProduction()
                        ? 'An unexpected error occurred. Please try again later.'
                        : $e->getMessage(),
                    'code'    => 'INTERNAL_ERROR',
                ], 500);

                // Geçici teşhis: canlıda ara ara 500 patlamaları oluyor ve
                // yalnızca yük altında çıktığı için hangi istisna olduğu
                // görülemedi. Sunucu loglarına erişim olmadığından sınıf adı
                // yanıta da yazılıyor — YALNIZCA sınıf adı: mesaj, dosya ve
                // yığın izi dışarı verilmez, onlar log ve Sentry tarafında.
                // Ölçüm bayrağı kapalıyken hiç eklenmez.
                // TESLİMDEN ÖNCE SureOlcer ile birlikte KALDIRILACAK.
                if (config('app.timing_header')) {
                    $yanit->headers->set('X-Hata-Sinifi', get_class($e));
                }

                return $yanit;
            }
        });

    })->create();
