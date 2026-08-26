<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Herkese açık profil ve ciro grafiği.
 *
 * `GET /medstream/u/{username}` kimlik istemiyor: kullanıcı adı bilen herkes
 * o profili çözebiliyor. Bu bilinçli — MedStream bir sosyal akış ve kullanıcı
 * adı kayıtta kişinin kendi seçtiği bir şey.
 *
 * Ölçütün tuttuğu şey, yanıtın İÇİNDE NE OLMADIĞI: e-posta, telefon, doğum
 * tarihi, adres. Bunlar bugün dönmüyor; bir gün `$user` nesnesi olduğu gibi
 * serileştirilirse dönerdi ve kimse fark etmezdi, çünkü uç yine 200 döner.
 *
 * `crm/billing/revenue-chart` ise kliniğin aylık cirosunu veriyor; kapsamı
 * `BillingService::scopeQuery` çiziyor.
 */
class HerkeseAcikProfilTest extends TestCase
{
    use RefreshDatabase;

    /** Herkese açık bir yanıtta ASLA görünmemesi gerekenler. */
    private const SIZMAMALI = ['email', 'mobile', 'phone', 'date_of_birth', 'address', 'password', 'medical_history'];

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_hasta_profili_herkese_acik_degil(): void
    {
        // Uç kimlik istemiyor. Hasta profili gerçek adı veriyordu: kullanıcı
        // adını bilen biri, o kişinin burada HASTA olduğunu ve adını
        // öğreniyordu. Bir sağlık platformunda hesabı olmak tedavi arıyor
        // olmayı ima eder.
        //
        // 404 bekleniyor, 403 değil: uç o kullanıcı adının var olduğunu bile
        // söylememeli.
        User::factory()->patient()->create([
            'username' => 'olcum_hasta',
            'fullname' => 'Gizli Kalmasi Gereken',
        ]);

        $this->getJson('/api/medstream/u/olcum_hasta')->assertStatus(404);
    }

    public function test_saglayici_profili_acik_kaliyor(): void
    {
        // Aşırı kilitleyip özelliği bozmadığımızın kanıtı: hekim, klinik ve
        // hastane profilleri hastaya gösterilmek için var.
        foreach ([
            ['doctor', 'olcum_hekim'],
            ['clinicOwner', 'olcum_klinik'],
            ['hospital', 'olcum_hastane'],
        ] as [$rol, $kullaniciAdi]) {
            User::factory()->create([
                'role_id'  => $rol,
                'username' => $kullaniciAdi,
                'is_active' => true,
            ]);

            $this->getJson("/api/medstream/u/{$kullaniciAdi}")
                ->assertOk()
                ->assertJsonPath('user.username', $kullaniciAdi);
        }
    }

    public function test_profil_kisisel_iletisim_bilgisi_sizdirmiyor(): void
    {
        $kullanici = User::factory()->create([
            'role_id'  => 'doctor',
            'username' => 'olcum_hekim2',
            'email'    => 'gizli-adres@ornek.test',
            'mobile'   => '+905550000000',
        ]);

        $yanit = $this->getJson('/api/medstream/u/olcum_hekim2')->assertOk();

        foreach (self::SIZMAMALI as $alan) {
            $this->assertArrayNotHasKey(
                $alan,
                $yanit->json('user'),
                "herkese açık profil `$alan` alanını taşıyor",
            );
        }

        $govde = $yanit->getContent();

        $this->assertStringNotContainsString('gizli-adres@ornek.test', $govde);
        $this->assertStringNotContainsString('+905550000000', $govde);

        // Aşırı kilitleyip ucu boşaltmadığımızın kanıtı.
        $this->assertSame($kullanici->id, $yanit->json('user.id'));
    }

    public function test_profil_ucu_hiz_sinirli(): void
    {
        // Kimliksiz bir uç kullanıcı adını ad soyada çeviriyor ve
        // `auth/username-available` hangi adların var olduğunu söylüyor. Hız
        // sınırı olmadan ikisi birlikte sınırsız bir kimlik hasadı yolu.
        $rotalar = (string) file_get_contents(base_path('routes/api.php'));
        $konum = strpos($rotalar, "'/u/{username}'");

        $this->assertNotFalse($konum, 'profil rotası bulunamadı — bu ölçüt güncellenmeli');
        $this->assertStringContainsString(
            'throttle:',
            substr($rotalar, $konum, 200),
            'herkese açık profil ucu hız sınırsız',
        );
    }

    public function test_olmayan_kullanici_adi_404(): void
    {
        $this->getJson('/api/medstream/u/hic-boyle-biri-yok')->assertStatus(404);
    }

    public function test_ciro_grafigi_baska_klinigin_gelirini_saymiyor(): void
    {
        [$sahip, $klinik] = $this->klinikKur();
        [$yabanciSahip] = $this->klinikKur();

        $hekim = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);

        Invoice::create([
            'invoice_number' => 'CIRO-1',
            'patient_id'     => User::factory()->patient()->create()->id,
            'doctor_id'      => $hekim->id,
            'clinic_id'      => $klinik->id,
            'status'         => 'paid',
            'issue_date'     => now()->toDateString(),
            'subtotal'       => 750,
            'grand_total'    => 750,
            'paid_amount'    => 750,
            'currency'       => 'EUR',
        ]);

        $yanit = $this->olarak($yabanciSahip)
            ->getJson('/api/crm/billing/revenue-chart')
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString(
            '750',
            $yanit,
            'başka kliniğin cirosu grafikte görünüyor',
        );
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
}
