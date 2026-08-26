<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fatura hasta araması, hekimin KENDİ hastalarıyla sınırlı olmalı.
 *
 * `GET /api/doctor/billing/patient-search?q=` sorgusu şuydu:
 *
 *     User::where('role_id', 'patient')
 *         ->where(fn ($s) => $s->where('fullname', 'like', "%$q%")
 *                              ->orWhere('email',  'like', "%$q%"))
 *         ->select('id', 'fullname', 'email', 'avatar')
 *         ->limit(15)
 *
 * Hiçbir ilişki koşulu yok. Rota `role:doctor` arkasında, yani sistemdeki
 * herhangi bir hekim, hiç görmediği hastaları adının parçasıyla arayıp
 * E-POSTA ADRESLERİNİ alabiliyordu. Boş `q` ile desen `%%` olduğu için ilk on
 * beş hasta süzgeçsiz dönüyordu — yani arama değil, listeleme.
 *
 * Bir sağlık platformunda kişinin burada hesabı olması, tedavi arıyor olduğunu
 * ima eder; bu yüzden isim + e-posta eşleşmesinin kendisi hassas.
 *
 * Arama artık hekimin randevusu olduğu hastalarla sınırlı.
 */
class HastaAramaKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $hekim;
    private User $kendiHastasi;
    private User $yabanciHasta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hekim = User::factory()->doctor()->create(['is_verified' => true]);

        $this->kendiHastasi = User::factory()->patient()->create([
            'fullname' => 'Ayse Benimki',
            'email'    => 'ayse.benimki@ornek.test',
        ]);

        $this->yabanciHasta = User::factory()->patient()->create([
            'fullname' => 'Ayse Yabanci',
            'email'    => 'ayse.yabanci@ornek.test',
        ]);

        Appointment::factory()->create([
            'doctor_id'  => $this->hekim->id,
            'patient_id' => $this->kendiHastasi->id,
            'status'     => 'completed',
        ]);

        // Yabancı hastanın randevusu BAŞKA bir hekimle.
        Appointment::factory()->create([
            'doctor_id'  => User::factory()->doctor()->create(['is_verified' => true])->id,
            'patient_id' => $this->yabanciHasta->id,
            'status'     => 'completed',
        ]);
    }

    private function ara(string $q): array
    {
        $jeton = $this->hekim->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/doctor/billing/patient-search?q=' . urlencode($q))
            ->assertOk()
            ->json();
    }

    public function test_kendi_hastasini_buluyor(): void
    {
        $kimlikler = array_column($this->ara('Ayse'), 'id');

        $this->assertContains($this->kendiHastasi->id, $kimlikler, 'hekim kendi hastasını bulamıyor');
    }

    public function test_baskasinin_hastasini_bulamiyor(): void
    {
        $sonuc = $this->ara('Ayse');

        $this->assertNotContains(
            $this->yabanciHasta->id,
            array_column($sonuc, 'id'),
            'hekim hiç görmediği bir hastayı arayabiliyor',
        );

        $this->assertStringNotContainsString(
            'ayse.yabanci@ornek.test',
            json_encode($sonuc),
            'yabancı hastanın e-posta adresi dönüyor',
        );
    }

    public function test_bos_sorgu_hasta_listelemiyor(): void
    {
        // `%%` deseni her kaydı eşliyordu: arama kutusu boşken uç, sistemdeki
        // ilk on beş hastayı döndürüyordu.
        $this->assertNotContains(
            $this->yabanciHasta->id,
            array_column($this->ara(''), 'id'),
            'boş sorgu yabancı hastaları listeliyor',
        );
    }
}
