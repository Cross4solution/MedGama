<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Salt okunur hesap gerçekten hiçbir şeyi değiştiremiyor.
 *
 * Hesap müşteriye yönetim panelini göstermek için var. Alternatifleri daha
 * kötüydü: paneli şifresiz açmak adresi bulan herkese hasta kayıtlarını
 * verirdi; tam yetkili bir hesap ise tanıtım sırasında yanlışlıkla silinen
 * bir kaydı geri getirilemez kılardı.
 *
 * Koruma yöntem düzeyinde ve `api` yığınının tamamına takılı. Ölçüt bunu
 * kasten UÇ ADI VERMEDEN sınıyor: "şu uç korunuyor mu" diye sormak, yarın
 * eklenen ucu kapsamaz. Sorduğu şey, yazma yönteminin kendisinin kapalı
 * olduğu.
 */
class SaltOkunurHesapTest extends TestCase
{
    use RefreshDatabase;

    private function saltOkunurYonetici(): User
    {
        $kullanici = User::factory()->create(['role_id' => 'superAdmin']);
        $kullanici->forceFill(['salt_okunur' => true])->save();

        Sanctum::actingAs($kullanici->fresh());

        return $kullanici;
    }

    public function test_okuma_serbest(): void
    {
        $this->saltOkunurYonetici();

        $this->getJson('/api/admin/reviews/stats')->assertOk();
    }

    public function test_yazma_yontemlerinin_hepsi_kapali(): void
    {
        $this->saltOkunurYonetici();

        // Farklı denetleyicilere ait, farklı yöntemlerde gerçek yazma uçları.
        // Kısıt `api` yığınında olduğu için hepsinde aynı kapıya takılıyor.
        $denemeler = [
            ['post',   '/api/admin/announcements'],
            ['put',    '/api/admin/announcements/deneme'],
            ['delete', '/api/admin/announcements/deneme'],
            ['post',   '/api/admin/catalog/cities'],
            ['put',    '/api/admin/reviews/deneme/approve'],
        ];

        foreach ($denemeler as [$yontem, $yol]) {
            $this->json($yontem, $yol)
                ->assertStatus(403)
                ->assertJson(['code' => 'SALT_OKUNUR_HESAP']);
        }
    }

    public function test_gercek_bir_kayit_degismiyor(): void
    {
        // 403 dönmesi yetmez; asıl soru veritabanının dokunulmadan kalması.
        $kimlik = (string) \Illuminate\Support\Str::uuid();
        $yazan   = User::factory()->create(['role_id' => 'superAdmin']);

        \DB::table('announcements')->insert([
            'id'         => $kimlik,
            'created_by' => $yazan->id,
            'title'      => 'Dokunulmasın',
            'body'       => 'Bu kayıt değişmemeli.',
            'type'       => 'info',
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->saltOkunurYonetici();

        $this->deleteJson("/api/admin/announcements/{$kimlik}")->assertStatus(403);

        $this->assertDatabaseHas('announcements', ['id' => $kimlik, 'title' => 'Dokunulmasın']);
    }

    public function test_cikis_yapabiliyor(): void
    {
        $this->saltOkunurYonetici();

        // Kendi oturumunu kapatmak veri değişikliği değil; kapalı olsaydı
        // hesap oturumda kilitli kalırdı.
        $this->postJson('/api/auth/logout')->assertOk();
    }

    public function test_normal_yonetici_etkilenmiyor(): void
    {
        Sanctum::actingAs(User::factory()->create(['role_id' => 'superAdmin']));

        // Aynı istek, işaretsiz hesapta 403 DEĞİL. (Kayıt bulunamayabilir ya
        // da doğrulama hatası verebilir; önemli olan salt-okunur kapısına
        // takılmaması.)
        $yanit = $this->deleteJson('/api/admin/announcements/olmayan-kimlik');

        $this->assertNotSame(403, $yanit->status(), 'normal yönetici salt-okunur kapısına takıldı');
    }

    public function test_kullanici_kendi_kisitini_kaldiramiyor(): void
    {
        // `salt_okunur` fillable dışında: profil güncelleme isteğine bu alanı
        // eklemek işe yaramamalı. Yoksa kısıt bir istek uzağında olurdu.
        $kullanici = $this->saltOkunurYonetici();

        // Uygulama `preventSilentlyDiscardingAttributes` açık: alan sessizce
        // yok sayılmıyor, doğrudan patlıyor. Sessiz yoksayımdan daha iyi —
        // deneme fark edilir.
        $this->expectException(\Illuminate\Database\Eloquent\MassAssignmentException::class);

        $kullanici->fill(['salt_okunur' => false]);
    }
}
