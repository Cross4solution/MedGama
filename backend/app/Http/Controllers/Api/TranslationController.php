<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranslationController extends Controller
{
    public function __construct(private TranslationService $translator) {}

    /**
     * POST /api/translate — on-demand machine translation (cached).
     * Body: { text, target, source? }
     */
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text'   => 'required|string|max:5000',
            'target' => 'required|string|max:8',
            'source' => 'nullable|string|max:8',
        ]);

        $result = $this->translator->translate(
            $validated['text'],
            $validated['target'],
            $validated['source'] ?? null,
        );

        return response()->json($result);
    }

    /**
     * GET /api/translation/status
     *
     * Arayüz, toplu çeviri düğmesini buna göre gösterir. `messages_allowed`
     * ayrı bir alan: çeviri dışarıdaki bir servisle yapılıyorsa hasta
     * mesajları çevrilmez — herkese açık gönderiler için sakınca yok, özel
     * yazışma için var.
     */
    public function status(Request $request): JsonResponse
    {
        $saglayici = config('translation.provider');
        $kendiSunucumuz = $saglayici === 'libretranslate' && config('translation.libretranslate.url');

        $user = $request->user();

        return response()->json([
            'available'        => true,
            'provider'         => $saglayici,
            'self_hosted'      => (bool) $kendiSunucumuz,
            // Mesaj çevirisi yalnızca çeviri kendi sunucumuzda yapılıyorsa açık.
            'messages_allowed' => (bool) $kendiSunucumuz,
            'language'         => $user?->preferred_language ?? 'en',
            'enabled'          => $user
                ? \App\Support\NotificationPreferences::ister($user, 'translate_content')
                : false,
        ]);
    }

    /**
     * POST /api/translation/batch
     *
     * Bir akış sayfasındaki içerikleri tek istekte çevirir; kayıt başına ayrı
     * çağrı onlarca istek demek olurdu. Önbellek metnin özetine bağlı olduğu
     * için aynı metin ikinci kez ücret/istek üretmez.
     *
     * Gövde: { items: [{key, text, lang?}], target? }
     */
    public function batch(Request $request): JsonResponse
    {
        $veri = $request->validate([
            'items'         => 'required|array|max:50',
            'items.*.key'   => 'required|string|max:128',
            'items.*.text'  => 'required|string|max:5000',
            'items.*.lang'  => 'sometimes|nullable|string|max:8',
            'items.*.kind'  => 'sometimes|string|in:post,comment,message',
            'target'        => 'sometimes|string|max:8',
        ]);

        $hedef = $veri['target'] ?? $request->user()?->preferred_language ?? 'en';
        $dısServis = config('translation.provider') !== 'libretranslate';

        // Duvar-saati bütçesi: bkz. config/translation.php. Bütçe dolduğunda
        // kalanlar çevrilmeden dönüyor — içerik özgün dilinde kalır ama akış
        // ayakta kalır. Alternatifi, bir işçiyi dakikalarca tutup sayfanın
        // tamamını düşürmek.
        $butce = (float) config('translation.batch_budget', 6.0);
        $baslangic = microtime(true);

        $sonuc = [];
        foreach ($veri['items'] as $k) {
            if (microtime(true) - $baslangic >= $butce) {
                $sonuc[$k['key']] = ['text' => $k['text'], 'translated' => false, 'reason' => 'budget'];
                continue;
            }

            // Hasta mesajı dışarıdaki bir servise gönderilmez.
            if ($dısServis && ($k['kind'] ?? 'post') === 'message') {
                $sonuc[$k['key']] = ['text' => $k['text'], 'translated' => false, 'reason' => 'private'];
                continue;
            }

            $r = $this->translator->translate($k['text'], $hedef, $k['lang'] ?? null);
            $sonuc[$k['key']] = [
                'text'       => $r['translated_text'],
                'translated' => $r['translated_text'] !== $k['text'],
            ];
        }

        return response()->json(['target' => $hedef, 'items' => $sonuc]);
    }
}
