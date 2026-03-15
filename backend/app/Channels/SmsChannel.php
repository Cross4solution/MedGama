<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Modular SMS notification channel.
 *
 * Supports multiple providers (Twilio, Infobip, Vonage) via config.
 * Set SMS_PROVIDER and corresponding API keys in .env to activate.
 *
 * Provider adapters are resolved from the container so you can
 * swap implementations without changing notification classes.
 */
class SmsChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toSms')) {
            return;
        }

        $smsData = $notification->toSms($notifiable);

        $phone = $smsData['to'] ?? $notifiable->routeNotificationFor('sms') ?? $notifiable->phone ?? null;

        if (!$phone) {
            Log::debug('SmsChannel: No phone number for notifiable #' . ($notifiable->id ?? '?'));
            return;
        }

        $message = $smsData['message'] ?? '';
        if (empty($message)) {
            return;
        }

        $provider = config('services.sms.provider', 'log');

        try {
            match ($provider) {
                'twilio'  => $this->sendViaTwilio($phone, $message),
                'infobip' => $this->sendViaInfobip($phone, $message),
                'vonage'  => $this->sendViaVonage($phone, $message),
                default   => $this->logSms($phone, $message),
            };
        } catch (\Throwable $e) {
            Log::error('SmsChannel: Failed to send SMS', [
                'provider' => $provider,
                'phone'    => substr($phone, 0, 6) . '****',
                'error'    => $e->getMessage(),
            ]);
        }
    }

    /**
     * Twilio SMS provider.
     */
    private function sendViaTwilio(string $phone, string $message): void
    {
        $sid   = config('services.sms.twilio.sid');
        $token = config('services.sms.twilio.token');
        $from  = config('services.sms.twilio.from');

        if (!$sid || !$token || !$from) {
            Log::warning('SmsChannel: Twilio credentials not configured');
            return;
        }

        $client = new \GuzzleHttp\Client();
        $client->post(
            "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json",
            [
                'auth'        => [$sid, $token],
                'form_params' => [
                    'To'   => $phone,
                    'From' => $from,
                    'Body' => $message,
                ],
            ]
        );

        Log::info('SmsChannel: Twilio SMS sent', ['to' => substr($phone, 0, 6) . '****']);
    }

    /**
     * Infobip SMS provider.
     */
    private function sendViaInfobip(string $phone, string $message): void
    {
        $apiKey  = config('services.sms.infobip.api_key');
        $baseUrl = config('services.sms.infobip.base_url');
        $from    = config('services.sms.infobip.from', 'MedGama');

        if (!$apiKey || !$baseUrl) {
            Log::warning('SmsChannel: Infobip credentials not configured');
            return;
        }

        $client = new \GuzzleHttp\Client();
        $client->post("{$baseUrl}/sms/2/text/advanced", [
            'headers' => [
                'Authorization' => "App {$apiKey}",
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
            'json' => [
                'messages' => [[
                    'from'         => $from,
                    'destinations' => [['to' => $phone]],
                    'text'         => $message,
                ]],
            ],
        ]);

        Log::info('SmsChannel: Infobip SMS sent', ['to' => substr($phone, 0, 6) . '****']);
    }

    /**
     * Vonage (Nexmo) SMS provider.
     */
    private function sendViaVonage(string $phone, string $message): void
    {
        $apiKey    = config('services.sms.vonage.api_key');
        $apiSecret = config('services.sms.vonage.api_secret');
        $from      = config('services.sms.vonage.from', 'MedGama');

        if (!$apiKey || !$apiSecret) {
            Log::warning('SmsChannel: Vonage credentials not configured');
            return;
        }

        $client = new \GuzzleHttp\Client();
        $client->post('https://rest.nexmo.com/sms/json', [
            'json' => [
                'from'       => $from,
                'text'       => $message,
                'to'         => $phone,
                'api_key'    => $apiKey,
                'api_secret' => $apiSecret,
            ],
        ]);

        Log::info('SmsChannel: Vonage SMS sent', ['to' => substr($phone, 0, 6) . '****']);
    }

    /**
     * Log-only fallback (development / no provider configured).
     */
    private function logSms(string $phone, string $message): void
    {
        Log::info('SmsChannel [LOG]: Would send SMS', [
            'to'      => $phone,
            'message' => $message,
        ]);
    }
}
