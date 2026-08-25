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

        try {
            $kullanici = $this->demo->hazirla($rolId);
        } catch (\Throwable $e) {
            // Canlıda günlüklere bakmak kolay değil; demo hesabında gerçek
            // veri olmadığı için sebebi doğrudan söylüyoruz. Aksi hâlde
            // "DATABASE_ERROR" deyip susmak teşhisi imkânsızlaştırıyor.
            Log::error('Demo hesabı kurulamadı', ['hata' => $e->getMessage()]);

            return response()->json([
                'message' => 'Demo hesabı kurulamadı.',
                'reason'  => substr($e->getMessage(), 0, 300),
            ], 500);
        }

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

        $taban = rtrim((string) config('demo.frontend_url'), '/');

        // Jeton adres çubuğunda taşınıyor; hedef bize ait değilse jetonu
        // üçüncü bir tarafa göndermiş oluruz. Yanlış yapılandırılmış bir
        // adrese jeton vermektense hiç girmemek doğrusu.
        if (!$this->guvenliHedef($taban)) {
            Log::error('Demo girişi hedefi izinli değil', ['hedef' => $taban]);

            return response()->json([
                'message' => 'Demo yönlendirme adresi yapılandırılmamış.',
            ], 500);
        }

        $token = $kullanici->createToken('demo-login')->plainTextToken;

        // Jetonu arayüze taşıyıp adres çubuğundan hemen sildiriyoruz:
        // tarayıcı geçmişinde ve paylaşılan ekran görüntüsünde kalmasın.
        // Hasta CRM'e giremez; akışa düşer.
        $hedefYol = $kullanici->role_id === 'patient' ? '/tr/medstream' : '/tr/crm';

        return redirect()->away($taban . $hedefYol . '?demo_token=' . urlencode($token));
    }

    /** Hedef, bize ait bilinen arayüz adreslerinden biri mi. */
    private function guvenliHedef(string $adres): bool
    {
        $host = parse_url($adres, PHP_URL_HOST);
        if (!$host) {
            return false;
        }

        $host = strtolower($host);

        // CORS için zaten bir izinli köken listesi tutuluyor; ikinci bir
        // liste tutmak ikisinin ayrışmasına davetiye çıkarır.
        $izinli = collect(config('cors.allowed_origins'))
            ->map(fn ($o) => strtolower((string) parse_url(trim($o), PHP_URL_HOST)))
            ->filter()
            ->all();

        $izinli[] = 'localhost';
        $izinli[] = '127.0.0.1';

        return in_array($host, $izinli, true) || str_ends_with($host, '.vercel.app');
    }

    private function rolEslestir(string $rol): string
    {
        return match ($rol) {
            'doktor', 'doctor' => 'doctor',
            'klinik', 'clinic' => 'clinicOwner',
            'hasta', 'patient' => 'patient',
            // Hastane (L4) hiç denenememişti: demo girişi yalnızca üç rol
            // veriyordu, dolayısıyla hastaneye özel ekranlar — şube yönetimi,
            // her zaman açık CRM — bir kez bile oturum açılmış hâlde
            // görülmemişti. superAdmin bilinçli olarak DIŞARIDA kalıyor.
            'hastane', 'hospital' => 'hospital',
            default            => 'yok',
        };
    }
}
