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
    //
    // JOKER (*) KABUL EDİLMEZ.
    //
    // Canlıda bu değişkene "*" yazılmıştı ve kodun beyaz listesini tamamen
    // iptal ediyordu: sunucu her kaynağa izin veriyordu, saldırgan siteler
    // dahil. Hasta verisi sızmıyordu (jeton tarayıcı deposunda, başka site
    // okuyamaz) ama API herkese sınırsız taranabilir haldeydi.
    //
    // Panel ayarı yanlışsa kod devreye girip güvenli listeye düşüyor. Bu tür
    // bir ayarın tek bir yanlış değerle açılabilmesi, sağlık verisi taşıyan
    // bir sistemde kabul edilebilir değil.
    //
    // Not: ön yüz bu kapıyı ZATEN kullanmıyor — tarayıcı Vercel'e istek
    // atıyor, Vercel sunucu tarafında backend'e gidiyor. Yani kısıtlamanın
    // uygulamaya etkisi yok.
    'allowed_origins' => (function (): array {
        $varsayilan = 'https://med-gama.vercel.app,https://medagama.com,https://www.medagama.com,http://localhost:3000';

        $liste = array_values(array_filter(
            array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', $varsayilan))),
            fn ($kaynak) => $kaynak !== '' && $kaynak !== '*',
        ));

        // Süzgeçten sonra liste boşaldıysa (ör. değişken sadece "*" idi)
        // güvenli varsayılana dön — aksi hâlde meşru site de kilitlenirdi.
        return $liste ?: array_map('trim', explode(',', $varsayilan));
    })(),

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
