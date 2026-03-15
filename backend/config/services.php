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

    'sms' => [
        'provider' => env('SMS_PROVIDER', 'log'),

        'twilio' => [
            'sid'   => env('TWILIO_SID'),
            'token' => env('TWILIO_AUTH_TOKEN'),
            'from'  => env('TWILIO_FROM_NUMBER'),
        ],

        'infobip' => [
            'api_key'  => env('INFOBIP_API_KEY'),
            'base_url' => env('INFOBIP_BASE_URL'),
            'from'     => env('INFOBIP_FROM', 'MedGama'),
        ],

        'vonage' => [
            'api_key'    => env('VONAGE_API_KEY'),
            'api_secret' => env('VONAGE_API_SECRET'),
            'from'       => env('VONAGE_FROM', 'MedGama'),
        ],
    ],

];
