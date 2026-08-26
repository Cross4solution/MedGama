<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hekimin ret hakkı — iki saatlik pencere.
 *
 * Randevular otomatik onaylanıyor; hekimin tek çıkış yolu, saatine iki saat
 * kalana kadar reddedebilmek. Kural `Appointment::doctorCanReject()` içinde ve
 * ekranda hem "Reddet" düğmesini hem üstündeki bilgi şeridini kontrol ediyor.
 *
 * Bu kuralın DETERMİNİSTİK testi yoktu. Tek kapsam, doğru zaman aralığında
 * randevu bulamadığı için kalıcı olarak atlanan bir e2e ölçütüydü — yani
 * pratikte hiç çalışmıyordu.
 *
 * Sınırın iki tarafı da önemli ve ters yönlerde zarar veriyor:
 *
 *   pencere yanlışlıkla GENİŞLERSE  → hasta yola çıkmışken randevu düşer
 *   pencere yanlışlıkla DARALIRSA   → hekim hastasını uyaramadan kilitlenir
 */
class RetPenceresiTest extends TestCase
{
    use RefreshDatabase;

    private function randevu(string $durum, ?\Carbon\Carbon $baslangic): Appointment
    {
        $hekim = User::factory()->create(['role_id' => 'doctor']);
        $hasta = User::factory()->create(['role_id' => 'patient']);

        $randevu = Appointment::factory()->create([
            'doctor_id'  => $hekim->id,
            'patient_id' => $hasta->id,
            'status'     => $durum,
        ]);

        // `starts_at` doğrudan yazılıyor: fabrika kendi saatini üretiyor ve
        // ölçülen şey tam olarak o saatin sınıra uzaklığı.
        $randevu->forceFill(['starts_at' => $baslangic])->save();

        return $randevu->fresh();
    }

    public function test_iki_saatten_uzaksa_reddedilebiliyor(): void
    {
        $randevu = $this->randevu('confirmed', now()->addHours(3));

        $this->assertTrue($randevu->doctorCanReject());
    }

    public function test_iki_saatten_yakinsa_reddedilemiyor(): void
    {
        $randevu = $this->randevu('confirmed', now()->addHour());

        $this->assertFalse(
            $randevu->doctorCanReject(),
            'randevuya bir saat kala reddedilebiliyor — hasta yola çıkmış olabilir',
        );
    }

    public function test_tam_sinirda_reddedilebiliyor(): void
    {
        // Sınır dahil: iki saat KALA hâlâ hakkı var. Bir saniye sonrası değil.
        $randevu = $this->randevu('confirmed', now()->addHours(2)->addSeconds(5));

        $this->assertTrue($randevu->doctorCanReject(), 'sınırın kendisi dışarıda bırakılmış');
    }

    public function test_gecmis_randevu_reddedilemiyor(): void
    {
        $randevu = $this->randevu('confirmed', now()->subHour());

        $this->assertFalse($randevu->doctorCanReject());
    }

    public function test_bekleyen_randevu_da_reddedilebiliyor(): void
    {
        $randevu = $this->randevu('pending', now()->addDay());

        $this->assertTrue($randevu->doctorCanReject());
    }

    public static function kapaliDurumlar(): array
    {
        return [
            'tamamlanmış' => ['completed'],
            'iptal'       => ['cancelled'],
            'gelmedi'     => ['no_show'],
        ];
    }

    /** @dataProvider kapaliDurumlar */
    public function test_bitmis_randevu_reddedilemiyor(string $durum): void
    {
        // Saat uygun olsa bile: bitmiş bir randevuyu reddetmek anlamsız ve
        // geçmişi değiştirir.
        $randevu = $this->randevu($durum, now()->addDay());

        $this->assertFalse(
            $randevu->doctorCanReject(),
            "'{$durum}' durumundaki randevu reddedilebiliyor",
        );
    }

    public function test_saati_bilinmeyen_randevu_hekimi_kilitlemiyor(): void
    {
        /*
         * Başlangıç okunamıyorsa hekim engellenmiyor. Bilinçli bir tercih:
         * hekimi kilitlemek, geç reddedilmesinden daha kötü — hasta hiç haber
         * alamadan randevu askıda kalır.
         */
        $randevu = $this->randevu('confirmed', null);

        $this->assertTrue($randevu->doctorCanReject());
    }
}
