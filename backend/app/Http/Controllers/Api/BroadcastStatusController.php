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
        if ($request->query('key') !== config('app.init_db_key')) {
            return response()->json(['error' => 'unauthorized'], 403);
        }

        $surucu = config('broadcasting.default');

        return response()->json([
            'surucu'          => $surucu,
            'reverb_host'     => config('broadcasting.connections.reverb.options.host'),
            'reverb_port'     => config('broadcasting.connections.reverb.options.port'),
            'reverb_scheme'   => config('broadcasting.connections.reverb.options.scheme'),
            'app_key_tanimli' => (bool) config('broadcasting.connections.reverb.key'),
            'app_id_tanimli'  => (bool) config('broadcasting.connections.reverb.app_id'),
            'secret_tanimli'  => (bool) config('broadcasting.connections.reverb.secret'),
            'queue'           => config('queue.default'),
        ]);
    }
}
