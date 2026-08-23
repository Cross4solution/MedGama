<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ChatConversation;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Tests\TestCase;

/**
 * Canlı kanallara kimin girebildiği.
 *
 * `routes/channels.php` hiç test edilmemişti. Oysa bu dosya, yabancı birinin
 * bir hastanın görüntülü muayenesine ya da doktoruyla yazışmasına girmesini
 * engelleyen TEK kapı. Uç yetkilendirmesi (auth:sanctum, role) burada
 * geçerli değil: WebSocket aboneliği ayrı bir yoldan yetkilendiriliyor.
 *
 * Sınanan şey her kanal için aynı: tarafı olan girer, olmayan giremez.
 * Kanal geri çağırmaları doğrudan çağrılıyor — soket sunucusu gerekmiyor,
 * kural neyse o ölçülüyor.
 */
class KanalYetkilendirmeTest extends TestCase
{
    use RefreshDatabase;

    /** Kanal adına kayıtlı geri çağırmayı çalıştırır. */
    private function kanalIzniVar(string $kanal, User $kullanici, array $parametreler): bool
    {
        // Laravel kanalları "telehealth.{appointmentId}" kalıbıyla saklıyor;
        // testte kalıbın kendisiyle eşleşip geri çağırmayı elde ediyoruz.
        $kanallar = Broadcast::getChannels();
        $this->assertArrayHasKey($kanal, $kanallar, "Kanal tanımlı değil: {$kanal}");

        return (bool) $kanallar[$kanal]($kullanici, ...$parametreler);
    }

    // ── Telesağlık: 1:1 görüntülü görüşme ────────────────────────────

    public function test_randevunun_doktoru_gorusme_kanalina_girebiliyor(): void
    {
        [$randevu, $doktor, $hasta] = $this->randevuKur();

        $this->assertTrue($this->kanalIzniVar('telehealth.{appointmentId}', $doktor, [$randevu->id]));
        $this->assertTrue($this->kanalIzniVar('telehealth.{appointmentId}', $hasta, [$randevu->id]));
    }

    public function test_yabanci_gorusme_kanalina_giremiyor(): void
    {
        [$randevu] = $this->randevuKur();
        $yabanci = User::factory()->patient()->create();

        $this->assertFalse(
            $this->kanalIzniVar('telehealth.{appointmentId}', $yabanci, [$randevu->id]),
            'Randevuyla ilgisi olmayan kullanıcı görüşme kanalına girebiliyor',
        );
    }

    public function test_baska_bir_doktor_gorusme_kanalina_giremiyor(): void
    {
        [$randevu] = $this->randevuKur();
        $baskaDoktor = User::factory()->doctor()->create(['is_verified' => true]);

        // Doktor olmak yetmiyor; O randevunun doktoru olmak gerekiyor.
        $this->assertFalse(
            $this->kanalIzniVar('telehealth.{appointmentId}', $baskaDoktor, [$randevu->id]),
            'Başka bir doktor hastanın görüşmesine girebiliyor',
        );
    }

    public function test_olmayan_randevu_icin_izin_verilmiyor(): void
    {
        $hasta = User::factory()->patient()->create();

        $this->assertFalse(
            $this->kanalIzniVar('telehealth.{appointmentId}', $hasta, ['00000000-0000-4000-8000-000000000000']),
            'Var olmayan randevu kimliğiyle kanala girilebiliyor',
        );
    }

    // ── Sohbet ───────────────────────────────────────────────────────

    public function test_sohbete_yalnizca_taraflari_girebiliyor(): void
    {
        $doktor = User::factory()->doctor()->create(['is_verified' => true]);
        $hasta  = User::factory()->patient()->create();
        $yabanci = User::factory()->patient()->create();

        // Sohbet tarafları rolden bağımsız iki kullanıcı olarak tutuluyor.
        $sohbet = ChatConversation::factory()->create([
            'user_one_id' => $doktor->id,
            'user_two_id' => $hasta->id,
        ]);

        $this->assertTrue($this->kanalIzniVar('chat.{conversationId}', $doktor, [$sohbet->id]));
        $this->assertTrue($this->kanalIzniVar('chat.{conversationId}', $hasta, [$sohbet->id]));
        $this->assertFalse(
            $this->kanalIzniVar('chat.{conversationId}', $yabanci, [$sohbet->id]),
            'Sohbetin tarafı olmayan kullanıcı mesajları dinleyebiliyor',
        );
    }

    // ── Kişisel kanallar ─────────────────────────────────────────────

    public function test_kisisel_kanallar_yalnizca_sahibine_acik(): void
    {
        $a = User::factory()->patient()->create();
        $b = User::factory()->patient()->create();

        foreach (['notifications.{userId}', 'user.{userId}'] as $kanal) {
            $this->assertTrue($this->kanalIzniVar($kanal, $a, [$a->id]), "{$kanal}: sahibi giremiyor");
            $this->assertFalse(
                $this->kanalIzniVar($kanal, $b, [$a->id]),
                "{$kanal}: başkasının bildirimleri dinlenebiliyor",
            );
        }
    }

    // ── Klinik kanalı ────────────────────────────────────────────────

    public function test_klinik_kanalina_baska_klinik_giremiyor(): void
    {
        $klinik = Clinic::factory()->create();
        $digerKlinik = Clinic::factory()->create();

        $personel = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);
        $yabanci  = User::factory()->doctor()->create(['clinic_id' => $digerKlinik->id]);

        $this->assertTrue($this->kanalIzniVar('clinic.{clinicId}', $personel, [$klinik->id]));
        $this->assertFalse(
            $this->kanalIzniVar('clinic.{clinicId}', $yabanci, [$klinik->id]),
            'Başka kliniğin personeli bu kliniğin canlı akışını dinleyebiliyor',
        );
    }

    public function test_klinige_bagli_hasta_klinik_kanalina_giremiyor(): void
    {
        // BULUNAN SIZINTI. Klinik kanalı `AppointmentChanged` taşıyor: o
        // kliniğin BÜTÜN randevuları — hasta kimliği, doktor kimliği, tarih,
        // saat. Personel verisi.
        //
        // CRM'de müşteri adayından hastaya çevrilen kişiye kliniğin kimliği
        // yazılıyor (LeadController). Eski denetim yalnız `clinic_id`
        // karşılaştırdığı için o hasta kanala girebiliyordu. Ölçüldü: izin
        // VERİLİYORDU. Ön yüz de `clinic_id` gören herkesi abone ediyordu,
        // yani sızıntı canlıda işliyordu.
        $klinik = Clinic::factory()->create();

        $hasta = User::factory()->patient()->create([
            'clinic_id'       => $klinik->id,
            'added_by_clinic' => true,
        ]);

        $this->assertFalse(
            $this->kanalIzniVar('clinic.{clinicId}', $hasta, [$klinik->id]),
            'Kliniğe bağlı hasta, kliniğin tüm randevu trafiğini dinleyebiliyor',
        );
    }

    public function test_klinik_personeli_kendi_kanalina_girebiliyor(): void
    {
        // Ters uç: rol listesi fazla dar olursa CRM'in canlı takvimi sessizce
        // ölür ve bunu yalnız ret testleriyle fark edemezdik.
        $klinik = Clinic::factory()->create();

        foreach (['doctor', 'salesperson'] as $rol) {
            $personel = User::factory()->create([
                'role_id'   => $rol,
                'clinic_id' => $klinik->id,
            ]);

            $this->assertTrue(
                $this->kanalIzniVar('clinic.{clinicId}', $personel, [$klinik->id]),
                "{$rol} kendi kliniğinin kanalına giremiyor",
            );
        }
    }

    public function test_klinik_sahibi_clinic_id_olmadan_da_girebiliyor(): void
    {
        // Sahibin kendi `clinic_id` alanı boş olabiliyor; sahiplik ayrı yoldan
        // doğrulanıyor ve bu yol kaybolursa sahip kendi kliniğini göremez.
        $sahip = User::factory()->create(['role_id' => 'clinicOwner', 'clinic_id' => null]);
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);

        $this->assertTrue($this->kanalIzniVar('clinic.{clinicId}', $sahip, [$klinik->id]));
    }

    public function test_clinic_id_bos_olan_kullanici_hicbir_klinige_giremiyor(): void
    {
        // Tekrar eden hata sınıfı: boş kapsam değeri "hepsi" gibi davranıyor.
        // Bu projede aynı hata beş ayrı yerde çıktı.
        $klinik = Clinic::factory()->create();
        $bagimsizDoktor = User::factory()->doctor()->create(['clinic_id' => null]);

        $this->assertFalse(
            $this->kanalIzniVar('clinic.{clinicId}', $bagimsizDoktor, [$klinik->id]),
            'Kliniği olmayan hekim rastgele bir kliniğin kanalına girebiliyor',
        );
    }

    /** @return array{0: Appointment, 1: User, 2: User} */
    private function randevuKur(): array
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);
        $hasta  = User::factory()->patient()->create();

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
            'clinic_id'  => $klinik->id,
            'status'     => 'confirmed',
            'starts_at'  => now()->addHour(),
            'timezone'   => 'Europe/Istanbul',
        ]);

        return [$randevu, $doktor, $hasta];
    }
}
