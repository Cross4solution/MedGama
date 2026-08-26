<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\ClinicVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Kimliği ADRESTEN alan uçlar — başkasının kimliğiyle çağrılabiliyor mu.
 *
 * Depoda korumalı ama rol süzgeci OLMAYAN 73 okuma ucu var; kapsamın tamamı
 * denetleyicinin kendi kontrolüne bağlı. Bunların en keskin alt kümesi, hangi
 * kaydın okunacağını ADRESTEN öğrenenler: kontrol atlanırsa istemcinin
 * yazdığı kimlik doğrudan sorguya giriyor.
 *
 * Bu ölçüt o alt kümenin testi olmayan iki üyesini tutuyor:
 *
 *   /analytics/clinic/{clinicId}/*        kliniğin cirosu, hekim başına başarım
 *   /clinic-verifications/{id}/document/{field}
 *                                          ruhsat, vergi levhası, YETKİLİ KİMLİĞİ
 *
 * İkisi de şu an doğru: analitik `isClinicOwner() && clinic_id === $clinicId`
 * istiyor, belge ucu alan beyaz listesi + yönetici/sahip kontrolü yapıyor ve
 * dosyayı özel diskten veriyor. Ölçüt kusur bildirmiyor — o kontrollerin
 * kalkması hâlinde ADRESTEKİ KİMLİĞİN doğrudan geçeceğini kaydediyor.
 */
class AdresKimligiKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $sahip;
    private Clinic $klinik;
    private User $yabanciSahip;

    protected function setUp(): void
    {
        parent::setUp();

        [$this->sahip, $this->klinik] = $this->klinikKur();
        [$this->yabanciSahip] = $this->klinikKur();
    }

    /** @return array{0: User, 1: Clinic} */
    private function klinikKur(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        return [$sahip, $klinik];
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private const ANALITIK = ['summary', 'doctors', 'engagement', 'appointment-trend'];

    public function test_klinik_sahibi_kendi_analitigini_goruyor(): void
    {
        foreach (self::ANALITIK as $uc) {
            $this->olarak($this->sahip)
                ->getJson("/api/analytics/clinic/{$this->klinik->id}/{$uc}")
                ->assertOk();
        }
    }

    public function test_baska_kliniğin_analitigi_adresten_okunamiyor(): void
    {
        // Adresteki kimlik başkasının: kontrol kalkarsa bu istek o kliniğin
        // ciro ve başarım rakamlarını döndürür.
        foreach (self::ANALITIK as $uc) {
            $this->olarak($this->yabanciSahip)
                ->getJson("/api/analytics/clinic/{$this->klinik->id}/{$uc}")
                ->assertStatus(403);
        }
    }

    public function test_hasta_ve_hekim_klinik_analitigine_giremiyor(): void
    {
        foreach ([
            User::factory()->patient()->create(),
            User::factory()->doctor()->create(['is_verified' => true]),
        ] as $yabanci) {
            $this->olarak($yabanci)
                ->getJson("/api/analytics/clinic/{$this->klinik->id}/summary")
                ->assertStatus(403);
        }
    }

    public function test_dogrulama_belgesi_yalnizca_sahibine_aciliyor(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('dogrulama/ruhsat.pdf', 'sahte-belge');

        $dogrulama = ClinicVerification::create([
            'clinic_id'         => $this->klinik->id,
            'operating_license' => 'dogrulama/ruhsat.pdf',
            'status'            => 'pending',
        ]);

        $this->olarak($this->sahip)
            ->get("/api/clinic-verifications/{$dogrulama->id}/document/operating_license")
            ->assertOk();

        // Bu belgeler ruhsat, vergi levhası ve YETKİLİ KİMLİĞİ.
        foreach ([$this->yabanciSahip, User::factory()->patient()->create()] as $yabanci) {
            $this->olarak($yabanci)
                ->get("/api/clinic-verifications/{$dogrulama->id}/document/operating_license")
                ->assertStatus(403);
        }
    }

    public function test_belge_alani_beyaz_listeyle_sinirli(): void
    {
        // Alan adı doğrudan modele veriliyor (`$verification->{$field}`);
        // beyaz liste kalkarsa istemci hangi sütunu okuyacağını seçer.
        $dogrulama = ClinicVerification::create([
            'clinic_id' => $this->klinik->id,
            'status'    => 'pending',
        ]);

        foreach (['status', 'clinic_id', 'id', 'uydurma_alan'] as $alan) {
            $this->olarak($this->sahip)
                ->get("/api/clinic-verifications/{$dogrulama->id}/document/{$alan}")
                ->assertStatus(404);
        }
    }
}
