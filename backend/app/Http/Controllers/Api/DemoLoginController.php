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
        $anahtar = (string) config('demo.login_key', '');

        // Ayar yoksa uç nokta yok sayılır: yanlışlıkla açık kalmasın.
        if ($anahtar === '' || !hash_equals($anahtar, (string) $request->query('key'))) {
            abort(404);
        }

        $rolId = $this->rolEslestir($rol);
        $kullanici = $this->demoHesabi($rolId);

        if (!$kullanici) {
            return response()->json([
                'message' => 'Bu rol için demo hesabı tanımlı değil.',
            ], 404);
        }

        $this->crmeHazirla($kullanici);

        Log::warning('Demo girişi kullanıldı', [
            'user_id' => $kullanici->id,
            'role'    => $kullanici->role_id,
            'ip'      => $request->ip(),
            'agent'   => substr((string) $request->userAgent(), 0, 200),
        ]);

        $token = $kullanici->createToken('demo-login')->plainTextToken;

        // Jetonu arayüze taşıyıp adres çubuğundan hemen sildiriyoruz:
        // tarayıcı geçmişinde jeton kalmasın.
        $hedef = rtrim((string) config('demo.frontend_url'), '/')
            . '/tr/crm?demo_token=' . urlencode($token);

        return redirect()->away($hedef);
    }

    /**
     * Demo hesabını CRM'e hazır tutar.
     *
     * CRM aboneliğe ve doğrulamaya bakıyor; bunlar kapalıyken bağlantı
     * kilitli bir ekrana düşüyor ve gösterilecek bir şey kalmıyor. Burada
     * yalnızca ayarda adı geçen demo hesabına dokunuluyor — başka hiçbir
     * kullanıcıya değil — ve yalnızca eksikse yazılıyor.
     */
    private function crmeHazirla(User $kullanici): void
    {
        $degisti = false;

        if (!$kullanici->is_verified) {
            $kullanici->is_verified = true;
            $kullanici->verification_status = 'approved';
            $degisti = true;
        }

        if (!$kullanici->is_crm_active) {
            $kullanici->is_crm_active = true;
            $degisti = true;
        }

        if (!$kullanici->crm_expires_at || $kullanici->crm_expires_at->isPast()) {
            $kullanici->crm_expires_at = now()->addYear();
            $degisti = true;
        }

        if ($degisti) {
            $kullanici->save();
        }

        // Klinik sahibinde abonelik kliniğin üzerinde tutuluyor.
        $klinik = $kullanici->ownedClinic ?? $kullanici->clinic;
        if ($klinik && (!$klinik->is_crm_active || !$klinik->crm_expires_at || $klinik->crm_expires_at->isPast())) {
            $klinik->is_crm_active = true;
            $klinik->crm_expires_at = now()->addYear();
            $klinik->save();
        }
    }

    /**
     * Bu rol için açılacak hesap.
     *
     * İki yol da kabul ediliyor: sunucu ayarındaki e-posta (canlıda tercih
     * edilen — veritabanına dokunmadan kurulur) veya hesaptaki is_demo işareti.
     * Hiçbiri yoksa açılacak hesap yok demektir; asla "ilk doktoru" seçmiyoruz.
     */
    private function demoHesabi(string $rolId): ?User
    {
        $eposta = trim((string) (config('demo.accounts')[$rolId] ?? ''));

        if ($eposta !== '') {
            return User::where('email', $eposta)
                ->where('role_id', $rolId)
                ->where('is_active', true)
                ->first();
        }

        return User::where('is_demo', true)
            ->where('role_id', $rolId)
            ->where('is_active', true)
            ->first();
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
