<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Provider (Twilio / Infobip / Vonage)
    |--------------------------------------------------------------------------
    |
    | Set SMS_PROVIDER to 'twilio', 'infobip', or 'vonage' and provide the
    | corresponding credentials. Default is 'log' (dev mode — no real SMS).
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Daily.co — Telehealth Video Rooms (§4.4)
    |--------------------------------------------------------------------------
    |
    | Set DAILY_API_KEY to enable production mode. Without it the service
    | returns mock room URLs for development / testing.
    |
    */

    'daily' => [
        'api_key'  => env('DAILY_API_KEY'),
        'base_url' => env('DAILY_BASE_URL', 'https://api.daily.co/v1'),
        'domain'   => env('DAILY_DOMAIN', 'medgama'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Deepgram — Live Transcription / Subtitles (§4.4)
    |--------------------------------------------------------------------------
    |
    | Set DEEPGRAM_API_KEY for production. Without it the service runs in
    | simulation mode, returning random medical sentences for UI testing.
    |
    */

    'deepgram' => [
        'api_key'  => env('DEEPGRAM_API_KEY'),
        'base_url' => env('DEEPGRAM_BASE_URL', 'https://api.deepgram.com/v1'),
    ],

    /*
     * Ters-geocode (koordinat → şehir/ülke). Sunucu tarafında çağrılır ki hastanın
     * tarayıcısı 3. taraf servise bağlanmasın. Kendi sunucumuzda Nominatim ayağa
     * kalkınca bu değeri o adrese çevirmek yeterli — 3. taraf tamamen biter.
     */
    'geo' => [
        'reverse_url' => env('GEO_REVERSE_URL', 'https://nominatim.openstreetmap.org/reverse'),
        'forward_url' => env('GEO_FORWARD_URL', 'https://geocoding-api.open-meteo.com/v1/search'),
    ],

];
