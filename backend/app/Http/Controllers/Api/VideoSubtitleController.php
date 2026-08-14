<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedStreamPost;
use App\Models\VideoSubtitle;
use App\Services\VideoSubtitleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gönderi videolarının alt yazıları.
 *
 * Okuma herkese açık: gönderiler zaten herkese açık, alt yazısı da öyle.
 * Düzeltme yalnızca gönderinin sahibine ve yöneticiye.
 */
class VideoSubtitleController extends Controller
{
    public function __construct(
        private readonly VideoSubtitleService $subtitles,
    ) {}

    /**
     * GET /api/medstream/posts/{post}/subtitles
     * Hangi dillerde alt yazı hazır.
     */
    public function index(MedStreamPost $post): JsonResponse
    {
        $kayitlar = VideoSubtitle::where('post_id', $post->id)
            ->where('status', VideoSubtitle::HAZIR)
            ->get(['media_index', 'language', 'kind', 'edited']);

        return response()->json([
            'subtitles' => $kayitlar,
            // Henüz yazıya dökülmediyse arayüz "hazırlanıyor" gösterebilir.
            'pending'   => VideoSubtitle::where('post_id', $post->id)
                ->where('status', VideoSubtitle::BEKLIYOR)->exists(),
        ]);
    }

    /**
     * GET /api/medstream/posts/{post}/subtitles/{lang}
     * İstenen dildeki alt yazıyı WebVTT olarak döner; yoksa özgününden
     * çevirip saklar. Oynatıcılar bu biçimi doğrudan okur.
     */
    public function show(Request $request, MedStreamPost $post, string $lang): Response|JsonResponse
    {
        $index = (int) $request->query('media', 0);
        $altyazi = $this->subtitles->getir($post, $index, $lang);

        if (!$altyazi) {
            return response()->json(['message' => 'Bu video için alt yazı henüz hazır değil.'], 404);
        }

        return response($altyazi->toVtt(), 200, [
            'Content-Type'  => 'text/vtt; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * PUT /api/medstream/posts/{post}/subtitles/{lang}
     *
     * Doktorun düzeltmesi. Sesten yazıya çevirme ilaç ve hastalık adlarında
     * sık yanılıyor; yanlış bir alt yazı doktorun ağzından çıkmış gibi
     * görünüyor. Düzeltilen kayıt bir daha otomatik üretimle değiştirilmez.
     */
    public function update(Request $request, MedStreamPost $post, string $lang): JsonResponse
    {
        $user = $request->user();

        if ($post->author_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Bu gönderinin alt yazısını düzenleyemezsiniz.'], 403);
        }

        $veri = $request->validate([
            'media'            => 'sometimes|integer|min:0',
            'segments'         => 'required|array|max:2000',
            'segments.*.start' => 'required|numeric|min:0',
            'segments.*.end'   => 'required|numeric|min:0',
            'segments.*.text'  => 'present|string|max:1000',
        ]);

        $altyazi = VideoSubtitle::where([
            'post_id'     => $post->id,
            'media_index' => $veri['media'] ?? 0,
            'language'    => $lang,
        ])->first();

        if (!$altyazi) {
            return response()->json(['message' => 'Alt yazı bulunamadı.'], 404);
        }

        $this->subtitles->duzelt($altyazi, $veri['segments'], $user);

        return response()->json(['message' => 'Alt yazı güncellendi.']);
    }
}
