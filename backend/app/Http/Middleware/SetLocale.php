<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Supported locales (Doc §11.1 — 10 primary languages).
     */
    private const SUPPORTED = [
        'tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'it', 'az', 'uz',
    ];

    private const FALLBACK = 'en';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolve($request);

        App::setLocale($locale);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    private function resolve(Request $request): string
    {
        // 1. Explicit query param  ?lang=tr
        $lang = $request->query('lang');
        if ($lang && $this->isSupported($lang)) {
            return $lang;
        }

        // 2. Cookie set by frontend i18next (key: "i18next")
        $cookie = $request->cookie('i18next');
        if ($cookie && $this->isSupported($cookie)) {
            return $cookie;
        }

        // 3. Accept-Language header — pick first supported (handles variants like en-US → en)
        $preferred = $request->getPreferredLanguage(self::SUPPORTED);
        if ($preferred && $this->isSupported($preferred)) {
            return $preferred;
        }

        // 4. Try raw Accept-Language base language (e.g. "fr-FR" → "fr")
        $raw = $request->header('Accept-Language', '');
        if ($raw) {
            $base = strtolower(substr($raw, 0, 2));
            if ($this->isSupported($base)) {
                return $base;
            }
        }

        // 5. Fallback
        return self::FALLBACK;
    }

    private function isSupported(string $locale): bool
    {
        return in_array(strtolower($locale), self::SUPPORTED, true);
    }
}
