<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Daily.co video room management service.
 *
 * When DAILY_API_KEY is not set, operates in "development mode"
 * returning mock room URLs (https://medgama.daily.co/test-room-{id}).
 */
class DailyService
{
    private ?string $apiKey;
    private string $baseUrl;
    private string $domain;

    public function __construct()
    {
        $this->apiKey  = config('services.daily.api_key');
        $this->baseUrl = config('services.daily.base_url', 'https://api.daily.co/v1');
        $this->domain  = config('services.daily.domain', 'medgama');
    }

    /**
     * Is the service running in production mode (API key present)?
     */
    public function isLive(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Create a Daily.co room for a telehealth appointment.
     *
     * @param  string  $appointmentId  Used to generate a unique room name
     * @param  array   $options        Extra room properties (exp, max_participants, etc.)
     * @return array{room_name: string, room_url: string, meeting_id: string}
     */
    public function createRoom(string $appointmentId, array $options = []): array
    {
        $roomName = 'medgama-' . Str::limit(Str::slug($appointmentId), 40, '');

        // ── Development mode (no API key) ──────────────────────────
        if (!$this->isLive()) {
            Log::info('DailyService [DEV]: Mock room created', ['room' => $roomName]);

            return [
                'meeting_id' => 'dev-' . Str::random(12),
                'room_name'  => $roomName,
                'room_url'   => "https://{$this->domain}.daily.co/{$roomName}",
                'mode'       => 'development',
            ];
        }

        // ── Production mode ────────────────────────────────────────
        try {
            $payload = array_merge([
                'name'       => $roomName,
                'privacy'    => 'private',
                'properties' => [
                    'max_participants'    => $options['max_participants'] ?? 4,
                    'enable_chat'         => true,
                    'enable_screenshare'  => true,
                    'exp'                 => $options['exp'] ?? now()->addHours(2)->timestamp,
                    'eject_at_room_exp'   => true,
                    'enable_recording'    => $options['enable_recording'] ?? 'cloud',
                ],
            ], $options['room_overrides'] ?? []);

            $response = Http::withToken($this->apiKey)
                ->timeout(10)
                ->post("{$this->baseUrl}/rooms", $payload);

            if ($response->failed()) {
                Log::error('DailyService: Room creation failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                throw new \RuntimeException('Daily.co room creation failed: ' . $response->body());
            }

            $data = $response->json();

            return [
                'meeting_id' => $data['id'] ?? $data['name'],
                'room_name'  => $data['name'],
                'room_url'   => $data['url'],
                'mode'       => 'production',
            ];
        } catch (\Throwable $e) {
            Log::error('DailyService: Exception creating room', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Delete a Daily.co room.
     */
    public function deleteRoom(string $roomName): bool
    {
        if (!$this->isLive()) {
            Log::info('DailyService [DEV]: Mock room deleted', ['room' => $roomName]);
            return true;
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(10)
                ->delete("{$this->baseUrl}/rooms/{$roomName}");

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('DailyService: Exception deleting room', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Create a meeting token for a participant (required for private rooms).
     */
    public function createMeetingToken(string $roomName, array $properties = []): ?string
    {
        if (!$this->isLive()) {
            return 'dev-token-' . Str::random(24);
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(10)
                ->post("{$this->baseUrl}/meeting-tokens", [
                    'properties' => array_merge([
                        'room_name'        => $roomName,
                        'is_owner'         => false,
                        'exp'              => now()->addHours(2)->timestamp,
                        'enable_recording' => 'cloud',
                    ], $properties),
                ]);

            return $response->json('token');
        } catch (\Throwable $e) {
            Log::error('DailyService: Token creation failed', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
