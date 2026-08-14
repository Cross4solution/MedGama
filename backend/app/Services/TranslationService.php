<?php

namespace App\Services;

use App\Models\ContentTranslation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Free, provider-agnostic machine translation with DB caching.
 *
 * Providers (env TRANSLATE_PROVIDER):
 *   - 'mymemory'      (default) — free public API, no key, no server (daily quota)
 *   - 'libretranslate'          — self-hosted/free; set LIBRETRANSLATE_URL (compliant)
 *
 * Swap providers via env without touching callers/UI. Cache keyed by
 * sha256(source)+target_lang so repeated views cost nothing.
 */
class TranslationService
{
    private string $provider;
    private string $defaultSource;

    public function __construct()
    {
        $this->provider = env('TRANSLATE_PROVIDER', 'mymemory');
        $this->defaultSource = env('TRANSLATE_DEFAULT_SOURCE', 'tr');
    }

    /**
     * @return array{translated_text:string, source_lang:?string, provider:string, cached:bool}
     */
    public function translate(string $text, string $target, ?string $source = null): array
    {
        $text = trim($text);
        $target = strtolower(substr($target, 0, 2));

        if ($text === '' || mb_strlen($text) > 5000) {
            return ['translated_text' => $text, 'source_lang' => $source, 'provider' => 'noop', 'cached' => false];
        }

        $hash = hash('sha256', $text);

        $cached = ContentTranslation::where('source_hash', $hash)
            ->where('target_lang', $target)
            ->first();
        if ($cached) {
            return [
                'translated_text' => $cached->translated_text,
                'source_lang'     => $cached->source_lang,
                'provider'        => $cached->provider,
                'cached'          => true,
            ];
        }

        try {
            [$translated, $detected] = $this->callProvider($text, $target, $source);
        } catch (\Throwable $e) {
            Log::warning('Translation failed: ' . $e->getMessage());
            return ['translated_text' => $text, 'source_lang' => $source, 'provider' => $this->provider, 'cached' => false];
        }

        // No-op when source already equals target → keep original.
        if ($detected && strtolower(substr($detected, 0, 2)) === $target) {
            $translated = $text;
        }

        ContentTranslation::create([
            'id'              => (string) Str::uuid(),
            'source_hash'     => $hash,
            'target_lang'     => $target,
            'source_lang'     => $detected,
            'translated_text' => $translated,
            'provider'        => $this->provider,
        ]);

        return ['translated_text' => $translated, 'source_lang' => $detected, 'provider' => $this->provider, 'cached' => false];
    }

    /** @return array{0:string,1:?string} [translatedText, detectedSourceLang] */
    private function callProvider(string $text, string $target, ?string $source): array
    {
        if ($this->provider === 'libretranslate') {
            return $this->libreTranslate($text, $target, $source);
        }
        return $this->myMemory($text, $target, $source);
    }

    private function myMemory(string $text, string $target, ?string $source): array
    {
        $src = $source ?: $this->defaultSource;
        $email = env('MYMEMORY_EMAIL'); // raises the free quota when set
        $out = [];
        foreach ($this->chunk($text, 480) as $chunk) {
            $params = ['q' => $chunk, 'langpair' => $src . '|' . $target];
            if ($email) {
                $params['de'] = $email;
            }
            $res = Http::timeout(8)->get('https://api.mymemory.translated.net/get', $params);
            $out[] = $res->json('responseData.translatedText') ?? $chunk;
        }
        return [implode(' ', $out), $src];
    }

    private function libreTranslate(string $text, string $target, ?string $source): array
    {
        $base = rtrim((string) env('LIBRETRANSLATE_URL', ''), '/');
        $payload = ['q' => $text, 'source' => $source ?: 'auto', 'target' => $target, 'format' => 'text'];
        if ($key = env('LIBRETRANSLATE_API_KEY')) {
            $payload['api_key'] = $key;
        }
        $res = Http::timeout(10)->asForm()->post($base . '/translate', $payload);
        $detected = $res->json('detectedLanguage.language') ?: $source;
        return [$res->json('translatedText') ?? $text, $detected];
    }

    /** Split text into <= $max-byte chunks on sentence/space boundaries. */
    private function chunk(string $text, int $max): array
    {
        if (strlen($text) <= $max) {
            return [$text];
        }
        $parts = preg_split('/(?<=[.!?])\s+/u', $text) ?: [$text];
        $chunks = [];
        $buf = '';
        foreach ($parts as $p) {
            if (strlen($buf) + strlen($p) + 1 > $max) {
                if ($buf !== '') {
                    $chunks[] = $buf;
                }
                if (strlen($p) > $max) {
                    foreach (str_split($p, $max) as $piece) {
                        $chunks[] = $piece;
                    }
                    $buf = '';
                    continue;
                }
                $buf = $p;
            } else {
                $buf = $buf === '' ? $p : $buf . ' ' . $p;
            }
        }
        if ($buf !== '') {
            $chunks[] = $buf;
        }
        return $chunks;
    }
}
