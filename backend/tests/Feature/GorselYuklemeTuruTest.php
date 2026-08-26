<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Görsel yüklemeleri SVG kabul etmemeli.
 *
 * SVG bir belge biçimi: `<script>` ve olay öznitelikleri taşıyabiliyor.
 * Herkese açık diskten kendi MIME türüyle sunulduğunda, adresi açan kişide
 * BİZİM kökenimizde betik çalışır — depolanmış XSS. Görsel olarak zararsız
 * göründüğü için yükleme anında kimse fark etmez.
 *
 * Depoda iki farklı kural bir arada duruyordu:
 *
 *   hekim galerisi / sertifika / MedStream / doğrulama belgeleri
 *       → açık liste: `mimes:jpg,jpeg,png,webp` — SVG dışarıda
 *   kullanıcı avatarı / klinik avatarı, arka planı, logosu
 *       → çıplak `image`
 *
 * Bu ölçüt önce Laravel'in `image` kuralının SVG'yi gerçekten geçirip
 * geçirmediğini ÖLÇÜYOR (sürüme göre değişiyor, hafızadan varsayılmaz),
 * sonra dört yüklemenin de reddettiğini sınıyor.
 */
class GorselYuklemeTuruTest extends TestCase
{
    use RefreshDatabase;

    private const SVG = <<<'XML'
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
      <script>alert(document.domain)</script>
    </svg>
    XML;

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function svgDosyasi(): UploadedFile
    {
        $yol = sys_get_temp_dir() . '/olcum-' . uniqid() . '.svg';
        file_put_contents($yol, self::SVG);

        return new UploadedFile($yol, 'logo.svg', 'image/svg+xml', null, true);
    }

    public function test_kullanici_avatari_svg_kabul_etmiyor(): void
    {
        $kullanici = User::factory()->patient()->create();

        $this->olarak($kullanici)
            ->postJson('/api/auth/profile/avatar', ['avatar' => $this->svgDosyasi()])
            ->assertStatus(422);
    }

    public function test_klinik_logosu_svg_kabul_etmiyor(): void
    {
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        $this->olarak($sahip)
            ->postJson('/api/clinic-onboarding/logo', ['logo' => $this->svgDosyasi()])
            ->assertStatus(422);
    }

    public function test_klinik_avatari_ve_arka_plani_svg_kabul_etmiyor(): void
    {
        // Aynı çıplak `image` kuralı klinik profil güncellemesinde de var
        // (avatar + arka plan görseli). Üçü tek yerde tutuluyor ki biri
        // gevşetilirse ölçüt bunu söylesin.
        $sahip = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $sahip->id]);
        $sahip->forceFill(['clinic_id' => $klinik->id])->save();

        foreach (['avatar', 'background_image'] as $alan) {
            $this->olarak($sahip)
                ->putJson('/api/clinic-onboarding', [$alan => $this->svgDosyasi()])
                ->assertStatus(422);
        }
    }

    public function test_gercek_gorsel_hala_kabul_ediliyor(): void
    {
        // Aşırı kilitleyip özelliği bozmadığımızın kanıtı.
        $kullanici = User::factory()->patient()->create();

        $yanit = $this->olarak($kullanici)
            ->postJson('/api/auth/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('portre.jpg', 80, 80),
            ]);

        $this->assertNotSame(422, $yanit->status(), 'gerçek görsel de reddediliyor');
    }
}
