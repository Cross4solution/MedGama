<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Klinik yönetimi yazmaları — çalışma saatleri ve satışçı devre dışı bırakma.
 *
 * İkisi de kapsanmayan yazma uçlarındandı ve ikisinde de dikkat çeken bir şey
 * var: `clinic-manager` rota grubunda ROL MIDDLEWARE'İ YOK, yalnız
 * `auth:sanctum`. Yani uca oturum açmış herkes erişebiliyor; korumanın tamamı
 * `resolveClinicIds()` fonksiyonunun boş dizi döndürmesine ve `whereIn(...)`
 * sorgusunun hiçbir şey eşlememesine dayanıyor.
 *
 * Bu doğru bir tasarım — kapsam belirlenemiyorsa KAPALI düşüyor — ama tümüyle
 * sessiz: fonksiyon bir gün "kapsam yoksa süzgeç de yok" tarafına kayarsa uç
 * yine 200 döner, yalnız artık bir hasta rastgele bir hekimin çalışma
 * saatlerini değiştirebilir. Çalışma saatleri randevu müsaitliğini belirliyor.
 */
class KlinikYonetimYazmalariTest extends TestCase
{
    use RefreshDatabase;

    private User $sahip;
    private Clinic $klinik;
    private User $hekim;

    private User $digerSahip;
    private Clinic $digerKlinik;

    // Doğrulama TAM yedi gün istiyor (`size:7`); eksik gönderim 404/403'ten
    // önce 422 veriyor ve ölçüt yetkiyi değil biçimi sınamış oluyordu.
    private const SAATLER = [
        'monday'    => ['09:00', '17:00'],
        'tuesday'   => ['09:00', '17:00'],
        'wednesday' => ['09:00', '17:00'],
        'thursday'  => ['09:00', '17:00'],
        'friday'    => ['09:00', '17:00'],
        'saturday'  => [],
        'sunday'    => [],
    ];

    protected function setUp(): void
    {
        parent::setUp();

        [$this->sahip, $this->klinik] = $this->klinikKur();
        [$this->digerSahip, $this->digerKlinik] = $this->klinikKur();

        $this->hekim = User::factory()->doctor()->create([
            'clinic_id'   => $this->klinik->id,
            'is_verified' => true,
        ]);
        DoctorProfile::create(['user_id' => $this->hekim->id]);
    }

    /** @return array{0: User, 1: Clinic} */
    private function klinikKur(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create([
            'owner_id'       => $sahip->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);
        $sahip->forceFill([
            'clinic_id'      => $klinik->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        return [$sahip, $klinik];
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function saatleriYaz(User $kullanici, ?string $hekimId = null)
    {
        return $this->olarak($kullanici)->putJson(
            '/api/clinic-manager/doctors/' . ($hekimId ?? $this->hekim->id) . '/hours',
            ['operating_hours' => self::SAATLER],
        );
    }

    public function test_klinik_sahibi_kendi_hekiminin_saatlerini_yazabiliyor(): void
    {
        $this->saatleriYaz($this->sahip)->assertOk();

        $kayitli = $this->hekim->doctorProfile->fresh()->operating_hours;

        // Birebir eşitlik değil: değer JSON'a gidip geliyor ve boş günler
        // dizi/nesne olarak farklı dönebiliyor. Ölçülen, saatlerin YAZILMIŞ
        // olması — eskiden `null` kalıp kalmadığı.
        $this->assertNotNull($kayitli, 'çalışma saatleri kaydedilmedi');
        $this->assertSame(['09:00', '17:00'], array_values((array) $kayitli['monday']));
    }

    public function test_baska_klinigin_sahibi_yazamiyor(): void
    {
        // 403 ya da 404 — ikisi de reddetme. Ölçülen, SAATLERİN DEĞİŞMEMESİ.
        $this->assertContains($this->saatleriYaz($this->digerSahip)->status(), [403, 404]);

        $this->assertNull($this->hekim->doctorProfile->fresh()->operating_hours);
    }

    public function test_rolu_olmayan_kullanicilar_yazamiyor(): void
    {
        // Rota grubunda rol süzgeci yok: bu kullanıcılar uca ERİŞİYOR ve
        // yalnızca boş kapsam sayesinde geri çevriliyorlar. Ölçülen şey bu.
        $yabancilar = [
            User::factory()->patient()->create(),
            User::factory()->doctor()->create(['is_verified' => true]),
            User::factory()->create(['role_id' => 'salesperson']),
        ];

        foreach ($yabancilar as $yabanci) {
            $this->assertContains($this->saatleriYaz($yabanci)->status(), [403, 404]);
        }

        $this->assertNull($this->hekim->doctorProfile->fresh()->operating_hours);
    }

    public function test_oturumsuz_yazamiyor(): void
    {
        $this->putJson("/api/clinic-manager/doctors/{$this->hekim->id}/hours", [
            'operating_hours' => self::SAATLER,
        ])->assertStatus(401);
    }

    public function test_satisci_devre_disi_birakma_klinikle_sinirli(): void
    {
        $satisci = User::factory()->create([
            'role_id'   => 'salesperson',
            'clinic_id' => $this->klinik->id,
            'is_active' => true,
        ]);

        // Kendi kliniğinin satışçısı: çalışıyor ve durumu gerçekten dönüyor.
        $this->olarak($this->sahip)
            ->putJson("/api/crm/salespeople/{$satisci->id}/toggle")
            ->assertOk();

        $this->assertFalse((bool) $satisci->fresh()->is_active, 'satışçı devre dışı bırakılmadı');

        // Başka kliniğin sahibi aynı satışçıya dokunamamalı.
        $this->olarak($this->digerSahip)
            ->putJson("/api/crm/salespeople/{$satisci->id}/toggle")
            ->assertStatus(404);

        $this->assertFalse((bool) $satisci->fresh()->is_active, 'yabancı klinik satışçının durumunu çevirdi');
    }

    public function test_satisci_kendi_durumunu_ceviremiyor(): void
    {
        $satisci = User::factory()->create([
            'role_id'   => 'salesperson',
            'clinic_id' => $this->klinik->id,
            'is_active' => false,
        ]);
        $satisci->forceFill(['is_crm_active' => true, 'crm_expires_at' => now()->addYear()])->save();

        // Devre dışı bırakılmış bir satışçının kendini geri açabilmesi,
        // devre dışı bırakmayı anlamsız kılardı.
        $yanit = $this->olarak($satisci)->putJson("/api/crm/salespeople/{$satisci->id}/toggle");

        // 401 de kabul: pasif kullanıcı zaten kimlik doğrulamasından geçemiyor,
        // ki bu daha da erken bir kapı.
        $this->assertContains($yanit->status(), [401, 403, 404]);
        $this->assertFalse((bool) $satisci->fresh()->is_active);
    }
}
