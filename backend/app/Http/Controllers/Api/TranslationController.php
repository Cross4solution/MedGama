<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TranslationService;
use App\Support\NotificationPreferences;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * İçerik çevirisi.
 *
 * Arayüz, ekrandaki içerikleri tek istekte gönderir; kayıt başına ayrı istek
 * atmak bir akış sayfasında onlarca çağrı demek olurdu.
 */
class TranslationController extends Controller
{
    public function __construct(
        private readonly TranslationService $translations,
    ) {}

    /**
     * GET /api/translation/status
     * Arayüz, toplu çeviri düğmesini buna göre aktif/pasif gösterir.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'available' => $this->translations->kullanilabilir(),
            'language'  => $user?->preferred_language ?? 'en',
            'enabled'   => $user
                ? NotificationPreferences::ister($user, 'translate_content')
                : false,
            'languages' => config('translation.languages'),
            'warn_on_messages' => (bool) config('translation.warn_on_messages'),
        ]);
    }

    /**
     * POST /api/translation/batch
     *
     * Gövde: { items: [{type, id, field, text, lang?}], target?: "de" }
     * Yanıt: { items: { "post:uuid:body": {text, translated} } }
     *
     * Çeviri kapalıysa veya motor yoksa özgün metinler döner — arayüz aynı
     * kodla çalışmaya devam eder, "çeviri yok" diye ayrı bir dal gerekmez.
     */
    public function batch(Request $request): JsonResponse
    {
        $veri = $request->validate([
            'items'          => 'required|array|max:100',
            'items.*.type'   => 'required|string|in:post,comment,message',
            'items.*.id'     => 'required|string|max:64',
            'items.*.field'  => 'sometimes|string|max:32',
            'items.*.text'   => 'required|string|max:20000',
            'items.*.lang'   => 'sometimes|nullable|string|max:8',
            'target'         => 'sometimes|string|in:' . implode(',', config('translation.languages')),
        ]);

        $user = $request->user();
        $hedef = $veri['target'] ?? $user?->preferred_language ?? 'en';

        $kayitlar = array_map(fn ($k) => [
            'type'  => $k['type'],
            'id'    => $k['id'],
            'field' => $k['field'] ?? 'body',
            'text'  => $k['text'],
            'lang'  => $k['lang'] ?? null,
        ], $veri['items']);

        // Mesajlar tıbbi yazışma sayılır: motora terimleri koruması söylenir.
        $tibbi = (bool) config('translation.medical_context')
            && collect($kayitlar)->contains(fn ($k) => $k['type'] === 'message');

        return response()->json([
            'target' => $hedef,
            'items'  => $this->translations->topluCevir($kayitlar, $hedef, $tibbi),
        ]);
    }
}
