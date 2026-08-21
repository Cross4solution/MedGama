<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Gönderi görsellerinde betik taşıyan dosya kabul edilmemeli.
 *
 * SVG, betik çalıştırabilen tek görsel biçimi. Buradaki risk teorik değildi:
 *
 *   • Gönderi görselleri "public" diskte tutuluyor ve /storage/... adresinden
 *     doğrudan sunuluyor.
 *   • Ön yüz /storage yolunu arka uca yönlendiriyor, yani dosya
 *     UYGULAMAYLA AYNI KÖKENDEN açılıyor.
 *   • Oturum jetonu localStorage'da duruyor.
 *
 * Üçü birleşince, içine <script> gömülmüş bir SVG'yi açan kullanıcının
 * oturumu okunabiliyordu. Sohbet eklerinde SVG zaten dışlanmıştı; gönderi
 * yüklemesinde atlanmıştı.
 */
class GorselYuklemeGuvenligiTest extends TestCase
{
    use RefreshDatabase;

    private function dogrulanmisDoktor(): User
    {
        $klinik = Clinic::factory()->create();

        return User::factory()->doctor()->create([
            'clinic_id'   => $klinik->id,
            'is_verified' => true,
        ]);
    }

    public function test_betik_iceren_svg_reddediliyor(): void
    {
        Storage::fake('public');
        $doktor = $this->dogrulanmisDoktor();

        // Gerçek bir saldırı dosyası: açıldığında betik çalışır.
        $zararli = UploadedFile::fake()->createWithContent(
            'zararsiz-gorunumlu.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.domain)</script></svg>',
        );

        $this->actingAs($doktor, 'sanctum')
            ->postJson('/api/medstream/posts', [
                'content'   => 'Deneme gönderisi',
                'post_type' => 'image',
                'photos'    => [$zararli],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('photos.0');

        $this->assertEmpty(
            Storage::disk('public')->allFiles(),
            'Reddedilen dosya yine de diske yazılmış',
        );
    }

    public function test_normal_gorsel_kabul_ediliyor(): void
    {
        Storage::fake('public');
        $doktor = $this->dogrulanmisDoktor();

        $yanit = $this->actingAs($doktor, 'sanctum')
            ->postJson('/api/medstream/posts', [
                'content'   => 'Deneme gönderisi',
                'post_type' => 'image',
                'photos'    => [UploadedFile::fake()->image('gorsel.jpg', 800, 600)],
            ]);

        // Kural SVG'yi keserken meşru görselleri de kesmemeli.
        $this->assertNotSame(
            422,
            $yanit->getStatusCode(),
            'Sıradan bir JPEG reddedildi — kural fazla dar',
        );
    }
}
