<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\Invoice;
use App\Models\MedStreamPost;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Uç sağlığı: hiçbir GET ucu sunucu hatası vermemeli.
 *
 * Bu test dokuz kırık ucu ortaya çıkardı. Hepsinin sebebi aynıydı: koda
 * PostgreSQL'e özgü SQL serpilmişti (TO_CHAR, ILIKE, ::timestamp) ve canlıdaki
 * TiDB bunları anlamıyordu. Hiçbiri testlerde de çalışmadığı için yıllarca
 * görünmediler — gelir raporu, klinik yönetimi ve okunmamış mesaj sayacı
 * canlıda 500 veriyordu.
 *
 * Rotalar tablodan OKUNUYOR, elle listelenmiyor: yarın eklenen bir uç bu
 * korumaya kendiliğinden dahil olur.
 *
 * Ölçüt bilinçli olarak gevşek: 401/403/404/422 hepsi geçerli yanıtlar —
 * yalnızca 5xx kabul edilmez. Sınanan şey "uç doğru veriyi döndürüyor mu"
 * değil, "çöküyor mu".
 *
 * ── Sonradan kapatılan İKİ DELİK ───────────────────────────────────────
 *
 * Bu koruma varken canlıda yine iki uç 500 veriyordu. Sebep testin kendisiydi:
 *
 * 1. PARAMETRELİ UÇLAR HİÇ SINANMIYORDU. "{" içeren yol atlanıyordu, yani
 *    61 GET ucu — hepsinin üçte biri — korumanın tamamen dışındaydı.
 *    /clinics/{id}/staff böyle kaçtı: olmayan bir sütunu seçiyordu.
 *
 * 2. KURULUMDA DOKTOR PROFİLİ YOKTU. İlişki yüklemesi yalnızca ortada kayıt
 *    varken çözülüyor; profil olmadığı için hatalı ilişki adı hiç çağrılmadı.
 *    /doctors/reviewable-appointments böyle kaçtı: var olmayan "specialty"
 *    ilişkisini yüklüyordu.
 *
 * Ders: boş tabloya sorulan soru her zaman "tamam" der. Koruma ancak
 * gerçekten veri varken ve gerçek kimliklerle çalışırken koruma sayılır.
 */
class UcSagligiTest extends TestCase
{
    use RefreshDatabase;

    /** Yan etkisi olan veya uzun süren uçlar kapsam dışı. */
    private const ATLANACAK = ['init-db', 'demo-login', 'mail-preview', 'mail-status'];

    public function test_hicbir_get_ucu_sunucu_hatasi_vermiyor(): void
    {
        [$roller, $veri] = $this->ortamiKur();

        $bozuk = [];
        foreach ($this->getUclari() as $yol) {
            foreach ($roller as $rolAdi => $kullanici) {
                if ($kullanici) {
                    $this->actingAs($kullanici, 'sanctum');
                } else {
                    app('auth')->forgetGuards();
                }

                try {
                    $kod = $this->getJson($yol)->getStatusCode();
                } catch (\Throwable $e) {
                    $bozuk[] = "{$yol} [{$rolAdi}] → " . get_class($e) . ': ' . substr($e->getMessage(), 0, 120);
                    continue;
                }

                if ($kod >= 500) {
                    $bozuk[] = "{$yol} [{$rolAdi}] → HTTP {$kod}";
                }
            }
        }

        $this->assertSame(
            [],
            $bozuk,
            "Sunucu hatası veren uçlar:\n" . implode("\n", $bozuk),
        );
    }

    /**
     * Parametreli uçlar da 5xx vermemeli.
     *
     * Eskiden bu uçlar tamamen atlanıyordu — GET uçlarının üçte biri korumasız
     * kalıyordu. Kimlikler kurulumdaki gerçek kayıtlardan geliyor; uydurma
     * kimlik 404 döndürüp ucu hiç çalıştırmadan "sağlam" gösteriyordu.
     */
    public function test_parametreli_get_uclari_sunucu_hatasi_vermiyor(): void
    {
        [$roller, $kimlikler] = $this->ortamiKur();

        $bozuk = [];
        $cozulemeyen = [];

        foreach ($this->getUclari(true) as $desen) {
            $yol = $this->kimlikleriYerlestir($desen, $kimlikler);
            if ($yol === null) {
                $cozulemeyen[] = $desen;
                continue;
            }

            foreach ($roller as $rolAdi => $kullanici) {
                if ($kullanici) {
                    $this->actingAs($kullanici, 'sanctum');
                } else {
                    app('auth')->forgetGuards();
                }

                try {
                    $kod = $this->getJson($yol)->getStatusCode();
                } catch (\Throwable $e) {
                    $bozuk[] = "{$yol} [{$rolAdi}] → " . get_class($e) . ': ' . substr($e->getMessage(), 0, 160);
                    continue;
                }

                if ($kod >= 500) {
                    $bozuk[] = "{$yol} [{$rolAdi}] → HTTP {$kod}";
                }
            }
        }

        // Kapsam dışı kalanlar SESSİZCE atlanmıyor: hangi ucun neden
        // sınanmadığı görünmezse, kapsanmamış bir uç kapsanmış sanılır.
        if ($cozulemeyen) {
            fwrite(STDERR, "\nKimliği çözülemediği için atlanan uçlar (" . count($cozulemeyen) . "):\n  "
                . implode("\n  ", $cozulemeyen) . "\n");
        }

        $this->assertSame(
            [],
            $bozuk,
            "Sunucu hatası veren parametreli uçlar:\n" . implode("\n", $bozuk),
        );
    }

    /**
     * Yoldaki {param} yerlerine gerçek kimlik koyar.
     *
     * Hangi kimliğin konacağı parametrenin adından değil, ondan ÖNCEKİ yol
     * parçasından anlaşılıyor: "{id}" tek başına anlamsız, ama
     * "clinics/{id}" ile "invoices/{id}" farklı şeyler.
     */
    private function kimlikleriYerlestir(string $yol, array $kimlikler): ?string
    {
        $parcalar = explode('/', trim($yol, '/'));

        foreach ($parcalar as $i => $parca) {
            if (!str_starts_with($parca, '{')) {
                continue;
            }

            $ad = trim($parca, '{}?');
            $onceki = $parcalar[$i - 1] ?? '';

            $deger = match (true) {
                $ad === 'codename'                              => $kimlikler['codename'],
                $ad === 'username'                              => $kimlikler['username'],
                str_contains($ad, 'appointment')                => $kimlikler['appointment'],
                str_contains($ad, 'clinic')                     => $kimlikler['clinic'],
                str_contains($ad, 'doctor')                     => $kimlikler['doctor'],
                str_contains($ad, 'patient')                    => $kimlikler['patient'],
                str_contains($ad, 'user')                       => $kimlikler['user'],
                $ad === 'post'                                  => $kimlikler['post'],
                $onceki === 'clinics'                           => $kimlikler['clinic'],
                $onceki === 'doctors'                           => $kimlikler['doctor'],
                $onceki === 'patients'                          => $kimlikler['patient'],
                $onceki === 'invoices'                          => $kimlikler['invoice'],
                $onceki === 'appointments'                      => $kimlikler['appointment'],
                $onceki === 'posts'                             => $kimlikler['post'],
                $onceki === 'users'                             => $kimlikler['user'],
                default                                         => null,
            };

            if ($deger === null) {
                return null;
            }

            $parcalar[$i] = (string) $deger;
        }

        return '/' . implode('/', $parcalar);
    }

    /** @return string[] */
    private function getUclari(bool $parametreli = false): array
    {
        $uclar = [];

        foreach (Route::getRoutes() as $rota) {
            if (!in_array('GET', $rota->methods(), true)) {
                continue;
            }

            $uri = $rota->uri();

            if (!str_starts_with($uri, 'api/')) {
                continue;
            }

            // İki test aynı listeyi paylaşıyor: biri parametresiz, diğeri
            // parametreli uçları alıyor.
            if (str_contains($uri, '{') !== $parametreli) {
                continue;
            }

            foreach (self::ATLANACAK as $atla) {
                if (str_contains($uri, $atla)) {
                    continue 2;
                }
            }

            $uclar[] = '/' . $uri;
        }

        return array_values(array_unique($uclar));
    }

    /** @return array{0: array<string,?User>, 1: array<string,mixed>} */
    private function ortamiKur(): array
    {
        $klinik = Clinic::factory()->create([
            'is_crm_active' => true, 'crm_expires_at' => now()->addYear(),
        ]);

        $doktor = User::factory()->doctor()->create([
            'clinic_id' => $klinik->id, 'is_crm_active' => true, 'crm_expires_at' => now()->addYear(),
        ]);
        $klinikSahibi = User::factory()->clinicOwner()->create([
            'clinic_id' => $klinik->id, 'is_crm_active' => true, 'crm_expires_at' => now()->addYear(),
        ]);
        $hasta = User::factory()->patient()->create();
        $yonetici = User::factory()->admin()->create();

        // Doktor profili ŞART: ilişki yüklemeleri yalnızca ortada kayıt varken
        // çözülüyor. Profil olmadığı sürece hatalı yazılmış bir ilişki adı
        // hiç çağrılmıyor, dolayısıyla test onu göremiyordu.
        $uzmanlik = Specialty::create([
            'code'          => 'kardiyoloji',
            'name'          => ['tr' => 'Kardiyoloji', 'en' => 'Cardiology'],
            'description'   => ['tr' => 'Kalp ve damar.', 'en' => 'Heart and vessels.'],
            'display_order' => 1,
        ]);

        DoctorProfile::create([
            'user_id'      => $doktor->id,
            'clinic_id'    => $klinik->id,
            'specialty'    => 'Kardiyoloji',
            'specialty_id' => $uzmanlik->id,
        ]);

        // Uçlar boş tabloda değil gerçek veriyle sınanmalı: bir toplama
        // sorgusunun bozuk olduğu ancak satır varken anlaşılır.
        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
            'status' => 'completed', 'starts_at' => now()->subDay(), 'timezone' => 'Europe/Istanbul',
        ]);

        $fatura = Invoice::create([
            'invoice_number' => 'US-1', 'patient_id' => $hasta->id, 'doctor_id' => $doktor->id,
            'clinic_id' => $klinik->id, 'subtotal' => 100, 'grand_total' => 100, 'paid_amount' => 100,
            'currency' => 'EUR', 'status' => 'paid', 'paid_at' => now(), 'issue_date' => now()->toDateString(),
        ]);

        $gonderi = MedStreamPost::factory()->create(['author_id' => $doktor->id]);

        return [[
            'misafir'  => null,
            'hasta'    => $hasta,
            'doktor'   => $doktor,
            'klinik'   => $klinikSahibi,
            'yonetici' => $yonetici,
        ], [
            // Parametreli uçlarda yerine konacak GERÇEK kimlikler. Uydurma
            // kimlik 404 döner ve uç hiç çalışmadan "sağlam" görünür.
            'clinic'      => $klinik->id,
            'codename'    => $klinik->codename,
            'doctor'      => $doktor->id,
            'patient'     => $hasta->id,
            'user'        => $hasta->id,
            'appointment' => $randevu->id,
            'invoice'     => $fatura->id,
            'post'        => $gonderi->id,
            'username'    => $hasta->username ?? $hasta->id,
        ]];
    }
}
