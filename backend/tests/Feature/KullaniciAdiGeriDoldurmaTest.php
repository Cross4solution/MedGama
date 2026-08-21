<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Her hesabın bir MedStream handle'ı olmalı.
 *
 * Profil adresi /@username üzerinden çözülüyor. Handle boşsa o hesabın
 * profiline giden yol yok — akıştaki yazar bağlantısı çıkmaz oluyor.
 * Canlıda tam olarak bu vardı: MedStream'de gönderisi olan 15 yazarın
 * 15'inin de handle'ı boştu.
 *
 * İki ayrı savunma sınanıyor:
 *   1. Yeni kayıtlarda model kancası handle üretiyor mu,
 *   2. Kancadan ÖNCE yaratılmış hesapları geri doldurma göçü kurtarıyor mu.
 *
 * İkincisi şart: kanca yalnızca yaratılış anında çalışıyor, dağıtım tam
 * tohumlamayı tekrar koşmuyor ve kolonu ekleyen göçün geri doldurması bir
 * kez çalışıp bitmişti.
 */
class KullaniciAdiGeriDoldurmaTest extends TestCase
{
    use RefreshDatabase;

    public function test_yeni_hesaba_kanca_handle_uretiyor(): void
    {
        $doktor = User::factory()->doctor()->create(['fullname' => 'Dr. Ayşe Yılmaz']);

        $this->assertNotEmpty($doktor->username, 'Yeni hesapta handle üretilmedi');
        // Türkçe harfler sadeleşmeli: adres çubuğunda taşınabilir olmalı.
        $this->assertMatchesRegularExpression('/^[a-z0-9_]+$/', $doktor->username);
    }

    public function test_handle_benzersiz_kaliyor(): void
    {
        $a = User::factory()->doctor()->create(['fullname' => 'Dr. Ayşe Yılmaz']);
        $b = User::factory()->doctor()->create(['fullname' => 'Dr. Ayşe Yılmaz']);

        $this->assertNotSame($a->username, $b->username, 'Aynı isimde iki hesap aynı handle aldı');
    }

    public function test_gecmiste_handle_almamis_hesaplar_geri_dolduruluyor(): void
    {
        // Kancayı atlayarak "eski" hesap üret: canlıdaki durumun aynısı.
        $eski = User::factory()->doctor()->create();
        User::withoutEvents(function () use ($eski) {
            $eski->username = null;
            $eski->saveQuietly();
        });
        $this->assertNull($eski->fresh()->username, 'Kurulum hatalı: hesap boş handle ile durmuyor');

        // Göçün yaptığı işi doğrudan çalıştır.
        $goc = require base_path('database/migrations/2026_08_21_120000_backfill_missing_usernames.php');
        $goc->up();

        $this->assertNotEmpty($eski->fresh()->username, 'Geri doldurma boş handle bırakmış');
    }

    public function test_geri_doldurma_var_olan_handle_a_dokunmuyor(): void
    {
        $kullanici = User::factory()->doctor()->create();
        User::withoutEvents(function () use ($kullanici) {
            $kullanici->username = 'elle_secilmis_handle';
            $kullanici->saveQuietly();
        });

        $goc = require base_path('database/migrations/2026_08_21_120000_backfill_missing_usernames.php');
        $goc->up();

        $this->assertSame('elle_secilmis_handle', $kullanici->fresh()->username);
    }
}
