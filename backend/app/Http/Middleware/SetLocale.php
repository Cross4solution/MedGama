<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Supported locales (Doc §11.1).
     */
    private const SUPPORTED = [
        'tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'it', 'az', 'uz',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolve($request);

        app()->setLocale($locale);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    private function resolve(Request $request): string
    {
        // 1. Explicit query param  ?lang=tr
        if ($request->has('lang') && in_array($request->query('lang'), self::SUPPORTED, true)) {
            return $request->query('lang');
        }

        // 2. Accept-Language header — pick first supported
        $preferred = $request->getPreferredLanguage(self::SUPPORTED);

        return $preferred && in_array($preferred, self::SUPPORTED, true)
            ? $preferred
            : config('app.locale', 'en');
    }
}
