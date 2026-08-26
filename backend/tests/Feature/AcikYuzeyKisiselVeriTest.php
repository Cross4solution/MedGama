<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Kimliksiz açılabilen hiçbir uç kişisel veri döndürmemeli.
 *
 * Bu ölçüt tek tek uç denetlemenin yerine geçiyor: rota tablosunu OKUYOR ve
 * kimlik istemeyen her GET ucunu çağırıp yanıtta kişisel veri alanı arıyor.
 * Yeni bir herkese açık uç eklendiğinde kendiliğinden kapsama giriyor — elle
 * yazılmış bir liste, tam da unutulan uçta sessiz kalırdı.
 *
 * Aranan şey alan ADI değil, tohumda ekilen GERÇEK DEĞERLER: e-posta, telefon,
 * doğum tarihi. Alan adı aramak yanıltıcı olurdu — `email` anahtarı bir
 * kliniğin herkese açık iletişim adresi de olabilir; sızıntı olan, bir KİŞİNİN
 * verisinin dönmesi.
 *
 * `/medstream/u/{username}` ucunun ad soyad döndürdüğü biliniyor ve bu
 * bilinçli (handle sistemi); ölçüt orada da e-posta ve telefon arıyor.
 */
class AcikYuzeyKisiselVeriTest extends TestCase
{
    use RefreshDatabase;

    private const EPOSTA   = 'sizinti-olcumu@ornek.test';
    private const TELEFON  = '+905559998877';
    private const DOGUM    = '1985-03-17';

    /** Yanıtta görünmemesi gereken gerçek değerler. */
    private array $izler = [];

    private User $hasta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create([
            'username'      => 'sizinti_olcumu',
            'email'         => self::EPOSTA,
            'mobile'        => self::TELEFON,
            'date_of_birth' => self::DOGUM,
        ]);

        $this->izler = [self::EPOSTA, self::TELEFON, self::DOGUM];
    }

    /** Kimlik istemeyen GET rotalarının somut adresleri. */
    private function acikAdresler(): array
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id, 'is_active' => true]);
        $hekim = User::factory()->doctor()->create(['is_verified' => true, 'is_active' => true]);

        $yerine = [
            '{username}'  => 'sizinti_olcumu',
            '{codename}'  => $klinik->codename,
            '{id}'        => $hekim->id,
            '{clinicId}'  => $klinik->id,
        ];

        $adresler = [];

        foreach (Route::getRoutes() as $rota) {
            if (!in_array('GET', $rota->methods(), true)) continue;

            $uri = $rota->uri();
            if (!str_starts_with($uri, 'api/')) continue;

            $ara = implode(' ', $rota->gatherMiddleware());
            if (str_contains($ara, 'Authenticate')) continue;
            if (str_contains($ara, 'TeshisAnahtari')) continue;

            // Yol parametresi çözülemiyorsa uç sınanamaz; atlanıyor.
            $cozulmus = strtr($uri, $yerine);
            if (str_contains($cozulmus, '{')) continue;

            $adresler[] = '/' . $cozulmus;
        }

        return array_values(array_unique($adresler));
    }

    public function test_acik_uclar_kisisel_veri_dondurmuyor(): void
    {
        $adresler = $this->acikAdresler();

        $this->assertGreaterThan(
            10,
            count($adresler),
            'açık uç listesi boş çıktı — rota taraması bozulmuş olabilir',
        );

        $sizdiran = [];

        foreach ($adresler as $adres) {
            try {
                $yanit = $this->getJson($adres);
            } catch (\Throwable $e) {
                // Dış servise çıkan ya da yapılandırma isteyen uçlar
                // (geo vekilleri gibi) burada sınanamıyor.
                continue;
            }

            if ($yanit->status() >= 400) {
                continue;
            }

            $govde = $yanit->getContent();

            foreach ($this->izler as $iz) {
                if (str_contains($govde, $iz)) {
                    $sizdiran[] = "$adres → $iz";
                }
            }
        }

        $this->assertSame([], $sizdiran, 'kimliksiz açılan uç kişisel veri döndürüyor');
    }
}
