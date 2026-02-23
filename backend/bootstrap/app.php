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
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role'          => \App\Http\Middleware\CheckRole::class,
            'optional.auth' => \App\Http\Middleware\OptionalAuth::class,
        ]);

        // CORS is handled entirely by Nginx (add_header in every location block).
        // Do NOT add HandleCors here — dual headers cause browsers to reject responses.
        $middleware->remove(\Illuminate\Http\Middleware\HandleCors::class);

        // Token-based auth (Bearer) — no CSRF needed for API routes
        $middleware->api(remove: [
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

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
            if ($request->is('api/*') || $request->expectsJson()) {
                \Log::error('Unhandled exception', [
                    'exception' => get_class($e),
                    'message'   => $e->getMessage(),
                    'file'      => $e->getFile() . ':' . $e->getLine(),
                    'url'       => $request->fullUrl(),
                    'user_id'   => $request->user()?->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => app()->isProduction()
                        ? 'An unexpected error occurred. Please try again later.'
                        : $e->getMessage(),
                    'code'    => 'INTERNAL_ERROR',
                ], 500);
            }
        });

    })->create();
