<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Deepgram live transcription service (skeleton).
 *
 * When DEEPGRAM_API_KEY is not set, operates in "simulation mode"
 * returning random medical sentences for testing the subtitle UI.
 */
class DeepgramService
{
    private ?string $apiKey;
    private string $baseUrl;

    // Mock medical sentences for simulation mode
    private const MOCK_SENTENCES = [
        'The patient reports intermittent chest pain for the last three days.',
        'Blood pressure is currently 130 over 85 millimeters of mercury.',
        'I recommend an ECG and a complete blood count panel.',
        'Have you experienced any shortness of breath or dizziness?',
        'The MRI results show no significant abnormalities.',
        'Let me prescribe a low-dose aspirin and a beta blocker.',
        'Your hemoglobin A1C level is within the normal range.',
        'We should schedule a follow-up appointment in two weeks.',
        'Are you currently taking any other medications or supplements?',
        'The surgical wound is healing well with no signs of infection.',
        'I would like to refer you to a cardiologist for further evaluation.',
        'Please continue the prescribed antibiotics for the full course.',
        'Your cholesterol levels have improved since the last visit.',
        'The ultrasound shows normal organ structure and blood flow.',
        'Let us discuss the treatment plan and expected recovery timeline.',
        'Hasta son üç gündür aralıklı göğüs ağrısı bildiriyor.',
        'Tansiyon şu anda 130/85 mmHg seviyesinde.',
        'EKG ve tam kan sayımı paneli öneriyorum.',
        'Nefes darlığı veya baş dönmesi yaşadınız mı?',
        'MR sonuçları önemli bir anormallik göstermiyor.',
    ];

    public function __construct()
    {
        $this->apiKey  = config('services.deepgram.api_key');
        $this->baseUrl = config('services.deepgram.base_url', 'https://api.deepgram.com/v1');
    }

    /**
     * Is the service running in production mode?
     */
    public function isLive(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Get WebSocket URL for live transcription streaming.
     *
     * In dev mode returns null — frontend should use simulation instead.
     */
    public function getStreamingUrl(array $options = []): ?string
    {
        if (!$this->isLive()) {
            return null;
        }

        $params = http_build_query(array_merge([
            'model'       => 'nova-2-medical',
            'language'    => $options['language'] ?? 'en',
            'punctuate'   => 'true',
            'smart_format' => 'true',
            'interim_results' => 'true',
            'endpointing' => '300',
        ], $options['query'] ?? []));

        return "wss://api.deepgram.com/v1/listen?{$params}";
    }

    /**
     * Get a temporary API key for client-side WebSocket auth.
     *
     * In dev mode returns a mock token.
     */
    public function createTemporaryKey(int $ttlSeconds = 600): array
    {
        if (!$this->isLive()) {
            return [
                'key'  => 'dev-deepgram-key-' . bin2hex(random_bytes(8)),
                'mode' => 'simulation',
                'ttl'  => $ttlSeconds,
            ];
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => "Token {$this->apiKey}",
                'Content-Type'  => 'application/json',
            ])->post("{$this->baseUrl}/keys", [
                'comment'    => 'MedGama telehealth session',
                'scopes'     => ['usage:write'],
                'time_to_live_in_seconds' => $ttlSeconds,
            ]);

            if ($response->successful()) {
                return [
                    'key'  => $response->json('key'),
                    'mode' => 'production',
                    'ttl'  => $ttlSeconds,
                ];
            }

            Log::error('DeepgramService: Key creation failed', ['body' => $response->body()]);
        } catch (\Throwable $e) {
            Log::error('DeepgramService: Exception', ['error' => $e->getMessage()]);
        }

        // Fallback to simulation if production key creation fails
        return [
            'key'  => null,
            'mode' => 'simulation',
            'ttl'  => $ttlSeconds,
        ];
    }

    /**
     * Return mock transcript chunks for simulation mode.
     *
     * @param  int  $count  Number of sentences to return
     * @return array<int, array{text: string, confidence: float, timestamp: float}>
     */
    public function simulateTranscript(int $count = 1): array
    {
        $results = [];
        $sentences = self::MOCK_SENTENCES;

        for ($i = 0; $i < $count; $i++) {
            $results[] = [
                'text'       => $sentences[array_rand($sentences)],
                'confidence' => round(mt_rand(85, 99) / 100, 2),
                'timestamp'  => microtime(true),
                'is_final'   => true,
            ];
        }

        return $results;
    }
}
