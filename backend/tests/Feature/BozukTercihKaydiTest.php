<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\NotificationPreferences;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Çözülemeyen bir tercih kaydı hesabı kullanılamaz hâle getiriyordu.
 *
 * `notification_preferences` sütunu `encrypted:array` cast'li. Cast,
 * çözülemeyen bir değerde istisna atıyor — ve o değer sütuna birçok yoldan
 * girebiliyor: cast eklenmeden önce yazılmış düz JSON, boş dizge, ya da
 * APP_KEY değişmiş bir kurulum.
 *
 * Ölçülen sonuç, böyle bir kullanıcı için:
 *
 *     GET  /api/auth/profile/notification-preferences  → 500
 *     PUT  /api/auth/profile/notification-preferences  → 500
 *     GET  /api/auth/me                                → 500
 *     GET  /api/translation/status                     → 500
 *
 * `/auth/me` düştüğü için uygulama açılmıyor bile: kullanıcı giriş yapıyor ve
 * beyaz ekranla kalıyor. Tek bir sütun değeri hesabı bitiriyor.
 *
 * Koddaki `is_string($ham)` toleransı bu durumu karşılamak için yazılmıştı ama
 * HİÇ ÇALIŞMIYORDU: istisna o satıra gelinmeden önce atılıyor. Ham değere
 * cast atlanarak bakmak gerekiyordu.
 */
class BozukTercihKaydiTest extends TestCase
{
    use RefreshDatabase;

    /** Sütuna doğrudan, cast'i atlayarak yazar. */
    private function bozukKullanici(string $deger): User
    {
        $user = User::factory()->patient()->create();
        DB::table('users')->where('id', $user->id)->update(['notification_preferences' => $deger]);

        return $user->fresh();
    }

    /** @return array<string, string> */
    public static function bozukDegerler(): array
    {
        return [
            'cast öncesi düz JSON' => ['{"inapp_social":false}'],
            'boş dizge'            => [''],
            'bozuk şifre metni'    => ['eyJub3Rf'],
            'düz metin'            => ['bir sey'],
        ];
    }

    /** @dataProvider bozukDegerler */
    public function test_hesap_acilabiliyor(string $deger): void
    {
        // EN AĞIRI: `/auth/me` yanıtı `notification_sound` alanını bu sütundan
        // okuyor. Düşerse kullanıcı giriş yapar ama uygulama hiç açılmaz.
        $user = $this->bozukKullanici($deger);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth/me')
            ->assertOk();
    }

    /** @dataProvider bozukDegerler */
    public function test_tercihler_okunabiliyor(string $deger): void
    {
        $user = $this->bozukKullanici($deger);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth/profile/notification-preferences')
            ->assertOk()
            ->assertJsonStructure(['preferences' => ['translate_content', 'sound_enabled']]);
    }

    /** @dataProvider bozukDegerler */
    public function test_tercih_yazilabiliyor_ve_kayit_onariliyor(string $deger): void
    {
        $user = $this->bozukKullanici($deger);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/auth/profile/notification-preferences', ['translate_content' => true])
            ->assertOk();

        // Yazma işleminin kaydı ONARMASI gerekiyor: bir sonraki okuma artık
        // geçerli, şifreli bir değerden gelmeli.
        $this->assertTrue(NotificationPreferences::ister($user->fresh(), 'translate_content'));
    }

    /** @dataProvider bozukDegerler */
    public function test_ceviri_durumu_calisiyor(string $deger): void
    {
        $user = $this->bozukKullanici($deger);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/translation/status')
            ->assertOk()
            ->assertJsonPath('enabled', false);
    }

    public function test_okunamayan_kayitta_varsayilanlara_donuluyor(): void
    {
        // Tercihler kaybolursa kullanıcı varsayılanlara döner. Sinir bozucu
        // ama hesabın hiç açılmamasının yanında önemsiz — ölçüt bu.
        $user = $this->bozukKullanici('bozuk');

        $this->assertSame(NotificationPreferences::AYARLAR, NotificationPreferences::oku($user));
    }

    public function test_saglam_kayit_bozulmuyor(): void
    {
        // Ters uç: tolerans, geçerli tercihleri silip varsayılanlara
        // döndürmemeli. Bunu yalnız bozuk-kayıt testleriyle fark edemezdik.
        $user = User::factory()->patient()->create();
        NotificationPreferences::yaz($user, ['inapp_social' => false, 'translate_content' => true]);

        $okunan = NotificationPreferences::oku($user->fresh());

        $this->assertFalse($okunan['inapp_social']);
        $this->assertTrue($okunan['translate_content']);
    }
}
