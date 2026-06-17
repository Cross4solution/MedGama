<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    // Explicit allow-list. Env-driven (CORS_ALLOWED_ORIGINS, comma-separated,
    // set in render.yaml). Safe default covers production Vercel app, custom
    // domains and local dev so an empty env never locks out legitimate origins.
    'allowed_origins' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        'https://med-gama.vercel.app,https://medagama.com,https://www.medagama.com,http://localhost:3000'
    )))),

    'allowed_origins_patterns' => [
        // Project-specific Vercel preview deployments ONLY (e.g.
        // med-gama-git-feature-team.vercel.app). NOT every *.vercel.app.
        '#^https://med-gama-[\w-]+\.vercel\.app$#',
        // Optional extra pattern via env (e.g. a custom preview scheme).
        ...(env('CORS_ALLOWED_PATTERN') ? ['#' . env('CORS_ALLOWED_PATTERN') . '#'] : []),
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];
