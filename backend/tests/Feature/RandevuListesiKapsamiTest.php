<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /api/appointments — kimin hangi randevuları gördüğü.
 *
 * Randevu kaydı hasta adını, e-postasını ve muayene tarihini taşıyor;
 * listeleme ilişkisi `patient:id,fullname,avatar,email` yüklüyor. Yani
 * kapsam hatası doğrudan hasta e-postası sızdırıyor.
 *
 * Bulunan hata: kapsam zinciri yalnız doctor/patient/clinicOwner'ı ele
 * alıyordu, eşleşmeyen roller HİÇBİR kapsama girmiyordu. Hastane ve satış
 * temsilcisi hesapları platformdaki her randevuyu görüyordu — üstelik
 * `patient_id` süzgeci istekten geldiği için belirli bir kişi hedef
 * alınabiliyordu.
 *
 * Bu yüzden testler rol rol yazıldı ve "tanınmayan rol" ayrıca sınanıyor:
 * asıl kusur bir rolün yanlış kapsanması değil, HİÇ kapsanmamasıydı.
 */
class RandevuListesiKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;
    private Appointment $randevu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create([
            'fullname' => 'Gizli Hasta',
            'email'    => 'gizli.hasta@ornek.test',
        ]);
        $this->doktor = User::factory()->doctor()->create();

        $this->randevu = Appointment::factory()->confirmed()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $this->doktor->id,
        ]);
    }

    private function liste(User $user, string $ek = ''): \Illuminate\Testing\TestResponse
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/appointments' . $ek);
    }

    private function gorulenSayisi(User $user, string $ek = ''): int
    {
        return count($this->liste($user, $ek)->assertOk()->json('data') ?? []);
    }

    private function epostaSizmadi(User $user, string $senaryo, string $ek = ''): void
    {
        $this->assertStringNotContainsString(
            'gizli.hasta@ornek.test',
            $this->liste($user, $ek)->getContent(),
            "[$senaryo] hasta e-postası sızdı",
        );
    }

    // ── Pozitif kontroller ──

    public function test_hasta_kendi_randevusunu_goruyor(): void
    {
        // Olmazsa aşağıdaki "görmüyor" testleri, liste hep boş olduğu için de
        // geçerdi.
        $this->assertSame(1, $this->gorulenSayisi($this->hasta));
    }

    public function test_doktor_kendi_randevusunu_goruyor(): void
    {
        $this->assertSame(1, $this->gorulenSayisi($this->doktor));
    }

    // ── Asıl bulgu: kapsamsız roller ──

    public function test_ilgisiz_hastane_baskasinin_randevusunu_gormuyor(): void
    {
        $hastane = User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]);

        $this->assertSame(0, $this->gorulenSayisi($hastane), 'hastane ilgisiz randevuyu gördü');
        $this->epostaSizmadi($hastane, 'ilgisiz hastane');
    }

    public function test_ilgisiz_satis_temsilcisi_baskasinin_randevusunu_gormuyor(): void
    {
        $temsilci = User::factory()->salesperson()->create(['clinic_id' => null]);

        $this->assertSame(0, $this->gorulenSayisi($temsilci), 'satış temsilcisi ilgisiz randevuyu gördü');
        $this->epostaSizmadi($temsilci, 'kliniksiz satış temsilcisi');
    }

    public function test_taninmayan_rol_hicbir_randevu_gormuyor(): void
    {
        // Varsayılan reddet: ileride eklenen bir rol, kapsam yazılmadığı için
        // sessizce her şeye açılmamalı.
        $bilinmeyen = User::factory()->create(['role_id' => 'moderator', 'user_level' => 2]);

        $this->assertSame(0, $this->gorulenSayisi($bilinmeyen), 'tanınmayan rol randevu gördü');
    }

    // ── Süzgeç, kapsamı genişletemiyor ──

    public function test_baska_hastanin_kimligiyle_suzmek_veri_vermiyor(): void
    {
        // Süzgeçler kapsamın ÜSTÜNE ekleniyor; kapsamın yerine geçerse
        // hedefli sorgu yapılabilir hale gelir.
        $baskaHasta = User::factory()->patient()->create();

        $this->assertSame(
            0,
            $this->gorulenSayisi($baskaHasta, '?patient_id=' . $this->hasta->id),
            'başka hastanın kimliğiyle süzerek randevu görüldü',
        );
    }

    public function test_hastane_hasta_kimligiyle_hedefli_sorgu_yapamiyor(): void
    {
        // Bulgunun sömürü hâli: hastane hesabı belirli bir hastayı arıyor.
        $hastane = User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]);

        $this->assertSame(
            0,
            $this->gorulenSayisi($hastane, '?patient_id=' . $this->hasta->id),
            'hastane belirli bir hastanın randevusunu çekti',
        );
    }

    // ── Meşru kapsamlar çalışıyor ──

    public function test_hastane_kendi_doktorunun_randevusunu_goruyor(): void
    {
        // Ters uç: kapsam fazla dar olsaydı hastane kendi işini göremezdi ve
        // bu, yalnız güvenlik yönünü ölçen testlerle gizlenirdi.
        //
        // `hospital_id` KULLANICIYI değil `hospitals` kaydını gösteriyor:
        // hem hastane yöneticisi hem doktorlar aynı kayda bağlanır. İlk
        // yazımda kullanıcı kimliğini kullanmıştım ve test haklı olarak
        // kırıldı.
        $kayit = Hospital::create([
            'name'     => 'Deneme Hastanesi',
            'fullname' => 'Deneme Hastanesi',
            'codename' => 'deneme-hastanesi',
        ]);
        $hastane = User::factory()->create([
            'role_id'     => 'hospital',
            'user_level'  => 4,
            'hospital_id' => $kayit->id,
        ]);
        $this->doktor->forceFill(['hospital_id' => $kayit->id])->save();

        $this->assertSame(1, $this->gorulenSayisi($hastane), 'hastane kendi doktorunun randevusunu görmedi');
    }

    public function test_klinik_sahibi_kendi_kliniginin_randevusunu_goruyor(): void
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();
        $this->randevu->forceFill(['clinic_id' => $klinik->id])->save();

        $this->assertSame(1, $this->gorulenSayisi($sahip), 'klinik sahibi kendi randevusunu görmedi');
    }

    public function test_baska_klinigin_sahibi_gormuyor(): void
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $baskaKlinik = Clinic::factory()->create();
        $this->randevu->forceFill(['clinic_id' => $baskaKlinik->id])->save();

        $this->assertSame(0, $this->gorulenSayisi($sahip), 'yabancı klinik sahibi randevuyu gördü');
    }

    public function test_yonetici_hepsini_goruyor(): void
    {
        $this->assertSame(1, $this->gorulenSayisi(User::factory()->admin()->create()));
    }

    // ── Takvim ucu aynı kapsamı kullanıyor ──

    public function test_takvim_ucu_de_kapsanmis(): void
    {
        // Kural iki yerde yazılıydı; biri düzeltilip öbürü unutulursa sızıntı
        // takvim üzerinden sürer.
        $hastane = User::factory()->create(['role_id' => 'hospital', 'user_level' => 4]);

        $jeton = $hastane->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        $yanit = $this->withHeader('Authorization', 'Bearer ' . $jeton)
            ->getJson('/api/appointments/calendar-events')
            ->assertOk();

        $this->assertStringNotContainsString(
            $this->randevu->id,
            $yanit->getContent(),
            'takvim ucu ilgisiz hastaneye randevu verdi',
        );
    }
}
