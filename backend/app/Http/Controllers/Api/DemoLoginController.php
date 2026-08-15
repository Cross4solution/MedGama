<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Şifresiz demo girişi — CRM'i denemek için.
 *
 * Bu, kasıtlı olarak açılmış bir kimlik doğrulama atlaması. Bağlantıyı eline
 * geçiren herkes ilgili hesaba girer; bu yüzden üç sınırla çevrildi:
 *
 *  1. Yalnızca `is_demo` işaretli hesaplar açılır. Gerçek bir kullanıcıya bu
 *     işaret konulmamalı — konursa o hesap herkese açık demektir.
 *  2. Sunucuda DEMO_LOGIN_KEY tanımlı değilse uç nokta hiç çalışmaz. Ayarı
 *     silmek bağlantıyı anında kapatır; kapatma yolu budur.
 *  3. Her kullanım kayda geçer (kim, nereden, hangi hesap).
 *
 * Teslimden önce DEMO_LOGIN_KEY sunucudan kaldırılmalı.
 */
class DemoLoginController extends Controller
{
    public function __invoke(Request $request, string $rol)
    {
        $anahtar = (string) env('DEMO_LOGIN_KEY', '');

        // Ayar yoksa uç nokta yok sayılır: yanlışlıkla açık kalmasın.
        if ($anahtar === '' || !hash_equals($anahtar, (string) $request->query('key'))) {
            abort(404);
        }

        $kullanici = User::where('is_demo', true)
            ->where('role_id', $this->rolEslestir($rol))
            ->where('is_active', true)
            ->first();

        if (!$kullanici) {
            return response()->json([
                'message' => 'Bu rol için demo hesabı tanımlı değil.',
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
        // tarayıcı geçmişinde jeton kalmasın.
        $hedef = rtrim((string) env('FRONTEND_URL', 'https://medagama.com'), '/')
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
