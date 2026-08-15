<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DemoAccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Şifresiz demo girişi — CRM'i denemek için.
 *
 * Bu, kasıtlı olarak açılmış bir kimlik doğrulama atlaması. Bağlantıyı eline
 * geçiren herkes demo hesabına girer. Sınırlar:
 *
 *  1. Yalnızca ayarda adı geçen demo adresleri açılır. Bu adresler bu iş için
 *     ayrılmıştır; gerçek bir kullanıcı hesabı bu yoldan açılmaz. Adres başka
 *     bir role aitse hiçbir şey yapılmaz.
 *  2. Hesap ve verisi yoksa kendisi kurulur — deneme için hazırlık gerekmesin.
 *     Kurulan her şey demo işaretlidir.
 *  3. DEMO_LOGIN_ENABLED=false yapılması bağlantıyı kapatır. Teslimden önce
 *     kapatılmalı.
 *
 * Her kullanım kayda geçer.
 */
class DemoLoginController extends Controller
{
    public function __construct(
        private readonly DemoAccountService $demo,
    ) {}

    public function __invoke(Request $request, string $rol)
    {
        if (!config('demo.enabled')) {
            abort(404);
        }

        // Anahtar isteğe bağlı: tanımlıysa bağlantıda da bulunmalı.
        $anahtar = (string) config('demo.login_key', '');
        if ($anahtar !== '' && !hash_equals($anahtar, (string) $request->query('key'))) {
            abort(404);
        }

        $rolId = $this->rolEslestir($rol);
        if ($rolId === 'yok') {
            abort(404);
        }

        $kullanici = $this->demo->hazirla($rolId);

        if (!$kullanici) {
            return response()->json([
                'message' => 'Bu rol için demo hesabı kurulamadı.',
            ], 404);
        }

        Log::warning('Demo girişi kullanıldı', [
            'user_id' => $kullanici->id,
            'role'    => $kullanici->role_id,
            'ip'      => $request->ip(),
            'agent'   => substr((string) $request->userAgent(), 0, 200),
        ]);

        $token = $kullanici->createToken('demo-login')->plainTextToken;

        // Jetonu arayüze taşıyıp adres çubuğundan hemen sildiriyoruz:
        // tarayıcı geçmişinde ve paylaşılan ekran görüntüsünde kalmasın.
        $hedef = rtrim((string) config('demo.frontend_url'), '/')
            . '/tr/crm?demo_token=' . urlencode($token);

        return redirect()->away($hedef);
    }

    private function rolEslestir(string $rol): string
    {
        return match ($rol) {
            'doktor', 'doctor' => 'doctor',
            'klinik', 'clinic' => 'clinicOwner',
            default            => 'yok',
        };
    }
}
