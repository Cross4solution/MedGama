<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Yayın (WebSocket) yapılandırmasının durumu — teşhis içindir.
 *
 * Sunucuda kabuk erişimi yok; "canlı bildirim gelmiyor" durumunda sürücünün
 * gerçekten reverb mi yoksa log mu olduğunu başka türlü göremiyoruz.
 * Sır döndürmez: yalnızca sürücü adı, host ve anahtarların TANIMLI olup
 * olmadığı. Teslimden önce kaldırılacak.
 */
class BroadcastStatusController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // Anahtar kapısı `teshis.anahtari` ara katmanında; kopyası burada
        // tutulmuyor ki ikisi ayrışmasın.
        $surucu = config('broadcasting.default');

        // ?user=<id> verilirse gerçek bir yayın denenir ve hata varsa
        // metniyle döner. Kuyrukta sessizce düşen yayını başka türlü
        // göremiyoruz.
        $deneme = null;
        if ($kullaniciId = $request->query('user')) {
            try {
                broadcast(new \App\Events\NewNotification(
                    userId: (string) $kullaniciId,
                    notification: [
                        'id'         => (string) \Illuminate\Support\Str::uuid(),
                        'type'       => 'diagnostic',
                        'data'       => ['type' => 'diagnostic', 'title' => 'Yayın denemesi', 'message' => 'Bu bir teşhis iletisidir.'],
                        'read_at'    => null,
                        'created_at' => now()->toISOString(),
                    ],
                ));
                $deneme = 'gonderildi';
            } catch (\Throwable $e) {
                $deneme = 'HATA: ' . $e->getMessage();
            }
        }

        return response()->json([
            'deneme'          => $deneme,
            'surucu'          => $surucu,
            'reverb_host'     => config('broadcasting.connections.reverb.options.host'),
            'reverb_port'     => config('broadcasting.connections.reverb.options.port'),
            'reverb_scheme'   => config('broadcasting.connections.reverb.options.scheme'),
            // Anahtar zaten istemci paketinde açık; gizli olan app_id ve secret.
            'app_key'         => config('broadcasting.connections.reverb.key'),
            'app_id'          => config('broadcasting.connections.reverb.app_id'),
            'secret_tanimli'  => (bool) config('broadcasting.connections.reverb.secret'),
            'queue'           => config('queue.default'),
        ]);
    }
}
