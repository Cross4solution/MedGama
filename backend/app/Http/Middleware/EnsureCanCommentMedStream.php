<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * MedStream yorum kapısı.
 *
 * Doğrulanmamış bir doktor yayın yapamıyordu ama yorum yazabiliyordu — ve
 * yorumu adının yanında "doktor" ibaresiyle görünüyordu. Doğrulanmamış bir
 * hesabın tıbbi görüş bildirmesi, okuyan hasta açısından doğrulanmış bir
 * doktorun görüşünden ayırt edilemez. Yayınla aynı kurala tabi tutuluyor.
 *
 * Hastalar ve klinikler etkilenmez; kural yalnızca doktor rolündeki
 * doğrulanmamış hesaplar içindir.
 *
 * Usage: ->middleware('medstream.comment')
 */
class EnsureCanCommentMedStream
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role_id === 'doctor' && !$user->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is under review. Admin approval is required before you can comment.',
                'code'    => 'DOCTOR_NOT_VERIFIED',
            ], 403);
        }

        return $next($request);
    }
}
