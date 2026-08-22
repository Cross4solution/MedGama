<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * CRM abonelik kapısı — aynı kural İKİ yerde yazılı.
 *
 *   • CheckCrmAccess ara katmanı  → isteği 403 ile keser
 *   • User::hasCrmSubscription()  → arayüze `has_crm_subscription` olarak
 *     döner, sidebar CRM düğmesini buna göre açar/kilitler
 *
 * İkisi ayrışırsa kullanıcı ÇALIŞMAYAN DÜĞME görür: ekran "CRM açık" der,
 * tıklayınca 403 gelir. Ya da tersi — kilitli düğme, oysa erişim var.
 *
 * Bu yüzden her senaryoda üçü birden doğrulanıyor: beklenen sonuç, ara
 * katmanın verdiği HTTP durumu ve modelin döndürdüğü bayrak.
 *
 * Ara katman kasten `role` filtresinden YALITILDI: rota gruplarının rol
 * listeleri birbirinden farklı (kimi saasAdmin'i alıyor, kimi almıyor), o
 * fark bu testin ölçtüğü şeyi gizlerdi. Burada ölçülen tek şey abonelik.
 */
class CrmAbonelikKapisiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['api', 'auth:sanctum', 'crm.access'])
            ->get('/_test/crm-kapisi', fn () => response()->json(['ok' => true]));
    }

    /** Kullanıcıyı gerçek jetonla uca sokar ve HTTP durumunu döndürür. */
    private function kapiyiDene(User $user): int
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/_test/crm-kapisi')
            ->getStatusCode();
    }

    /**
     * Tek senaryo: ara katman ile model aynı cevabı vermeli, o cevap da
     * beklenen olmalı.
     */
    private function uyumluMu(User $user, bool $beklenen, string $senaryo): void
    {
        $http = $this->kapiyiDene($user);
        $model = $user->fresh()->hasCrmSubscription();

        $this->assertSame(
            $beklenen ? 200 : 403,
            $http,
            "[$senaryo] ara katman beklenenden farklı davrandı",
        );

        $this->assertSame(
            $beklenen,
            $model,
            "[$senaryo] model bayrağı beklenenden farklı",
        );

        // Asıl kontrol: ekranın gördüğü ile isteğin gördüğü aynı mı.
        $this->assertSame(
            $http === 200,
            $model,
            "[$senaryo] ara katman ve model AYRIŞTI — kullanıcı çalışmayan düğme görür "
            . "(http=$http, model=" . var_export($model, true) . ')',
        );
    }

    private function klinik(bool $aktif, ?string $biter = null): Clinic
    {
        return Clinic::factory()->create([
            'is_crm_active'  => $aktif,
            'crm_expires_at' => $biter,
        ]);
    }

    // ── Bağımsız doktor: kendi aboneliği ──

    public function test_bagimsiz_doktor_suresiz_aktif_abonelikle_giriyor(): void
    {
        $d = User::factory()->doctor()->create();
        $d->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        $this->uyumluMu($d, true, 'bağımsız doktor / aktif / süresiz');
    }

    public function test_bagimsiz_doktor_gelecek_tarihli_abonelikle_giriyor(): void
    {
        $d = User::factory()->doctor()->create();
        $d->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addMonth()])->save();

        $this->uyumluMu($d, true, 'bağımsız doktor / aktif / gelecek tarih');
    }

    public function test_suresi_dolmus_abonelik_giremiyor(): void
    {
        // Bayrak hâlâ açık ama tarih geçmiş: yalnız bayrağa bakan bir uygulama
        // parasını ödemeyi bırakmış kullanıcıyı içeride tutardı.
        $d = User::factory()->doctor()->create();
        $d->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->subDay()])->save();

        $this->uyumluMu($d, false, 'bağımsız doktor / aktif bayrak / süresi dolmuş');
    }

    public function test_pasif_abonelik_giremiyor(): void
    {
        $d = User::factory()->doctor()->create();
        $d->forceFill(['is_crm_active' => false, 'crm_expires_at' => now()->addYear()])->save();

        $this->uyumluMu($d, false, 'bağımsız doktor / pasif bayrak / uzak tarih');
    }

    // ── Kliniğe bağlı doktor: kliniğin aboneliği geçerli ──

    public function test_klinige_bagli_doktor_kliniginin_aboneligini_kullaniyor(): void
    {
        $k = $this->klinik(true);
        $d = User::factory()->doctor()->create(['clinic_id' => $k->id]);
        // Doktorun KENDİ aboneliği kapalı: kliniğinki onu kapsamalı.
        $d->forceFill(['is_crm_active' => false, 'crm_expires_at' => null])->save();

        $this->uyumluMu($d, true, 'kliniğe bağlı doktor / klinik aktif / kendi pasif');
    }

    public function test_klinigi_pasifse_doktorun_kendi_aboneligi_kurtarmiyor(): void
    {
        // Kliniğe bağlı doktorda klinik KAZANIR. Aksi hâlde klinik aboneliğini
        // bıraktığında bağlı doktorlar erişimi sürdürürdü.
        $k = $this->klinik(false);
        $d = User::factory()->doctor()->create(['clinic_id' => $k->id]);
        $d->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addYear()])->save();

        $this->uyumluMu($d, false, 'kliniğe bağlı doktor / klinik pasif / kendi aktif');
    }

    public function test_klinigin_suresi_dolmussa_bagli_doktor_giremiyor(): void
    {
        $k = $this->klinik(true, now()->subDay());
        $d = User::factory()->doctor()->create(['clinic_id' => $k->id]);

        $this->uyumluMu($d, false, 'kliniğe bağlı doktor / kliniğin süresi dolmuş');
    }

    // ── Klinik sahibi ──

    public function test_klinik_sahibi_kendi_kliniginin_aboneligiyle_giriyor(): void
    {
        $s = User::factory()->clinicOwner()->create();
        $k = Clinic::factory()->create([
            'owner_id'       => $s->id,
            'is_crm_active'  => true,
            'crm_expires_at' => null,
        ]);
        $s->forceFill(['clinic_id' => $k->id])->save();

        $this->uyumluMu($s, true, 'klinik sahibi / klinik aktif');
    }

    public function test_kliniksiz_klinik_sahibi_giremiyor(): void
    {
        // Kayıt yarıda kalmış sahip: bakılacak abonelik yok, çökmemeli.
        $s = User::factory()->clinicOwner()->create(['clinic_id' => null]);

        $this->uyumluMu($s, false, 'klinik sahibi / kliniği yok');
    }

    // ── Hastane ──

    public function test_hastane_kendi_aboneligiyle_giriyor(): void
    {
        $h = User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]);
        $h->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        $this->uyumluMu($h, true, 'hastane / aktif');
    }

    public function test_aboneligi_olmayan_hastane_giremiyor(): void
    {
        // Hastanede CRM'in "her zaman açık" olması ARAYÜZ kuralı; kapı yine
        // aboneliğe bakıyor. İkisi ayrışırsa hastane kilitsiz düğme görür.
        $h = User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]);
        $h->forceFill(['is_crm_active' => false])->save();

        $this->uyumluMu($h, false, 'hastane / pasif');
    }

    // ── Satış temsilcisi ──

    public function test_satis_temsilcisi_kliniginin_aboneligini_devraliyor(): void
    {
        $k = $this->klinik(true);
        $t = User::factory()->salesperson()->create(['clinic_id' => $k->id]);

        $this->uyumluMu($t, true, 'satış temsilcisi / klinik aktif');
    }

    public function test_kliniksiz_satis_temsilcisi_giremiyor(): void
    {
        $t = User::factory()->salesperson()->create(['clinic_id' => null]);

        $this->uyumluMu($t, false, 'satış temsilcisi / kliniği yok');
    }

    // ── Erişimi hiç olmayan ve her zaman olan roller ──

    public function test_hasta_giremiyor(): void
    {
        $h = User::factory()->patient()->create();
        $h->forceFill(['is_crm_active' => true, 'crm_expires_at' => null])->save();

        // Bayrak elle açılsa bile rol CRM'e ait değil.
        $this->uyumluMu($h, false, 'hasta / bayrak elle açık');
    }

    public function test_yonetici_abonelik_olmadan_giriyor(): void
    {
        $y = User::factory()->admin()->create();
        $y->forceFill(['is_crm_active' => false, 'crm_expires_at' => null])->save();

        $this->uyumluMu($y, true, 'yönetici / aboneliksiz');
    }

    public function test_giris_yapmamis_istek_401_aliyor(): void
    {
        // 403 değil 401: arayüz ikisini ayırt ediyor — biri "giriş yap",
        // öbürü "abone ol" ekranına götürüyor.
        $this->getJson('/_test/crm-kapisi')->assertStatus(401);
    }
}
