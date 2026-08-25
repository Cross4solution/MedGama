<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * /api/doctors süzgeçleri gerçekten süzmeli.
 *
 * "En az puan" süzgeci hiç çalışmıyordu ve hata iki veritabanında iki farklı
 * biçimde SESSİZDİ. Sütunun adı `avg_rating`; sorgu `average_rating` yazıyordu:
 *
 *   • SQLite (yerel): çözemediği ÇİFT TIRNAKLI tanımlayıcıyı metin sabiti
 *     sayıyor. `"average_rating" >= 99` ifadesi `'average_rating' >= 99` oluyor
 *     ve SQLite'ın tür sıralamasında metin her zaman sayıdan büyük — yani
 *     koşul her satır için doğru. Ölçüldü: `min_rating=99` on dört doktorun
 *     hepsini döndürüyordu, tek bir uyarı bile yoktu.
 *
 *   • MySQL/TiDB (canlı): aynı sorgu "Unknown column" hatası verir. Yani
 *     canlıda puan süzgecini kullanan herkes 500 alıyordu.
 *
 *   Aynı aile daha önce de yakalanmıştı: veritabanları arası SQL farkları
 *   sessiz kalıyor ve yalnız bir tarafta patlıyor.
 *
 * Bu yüzden burada iki şey ayrı ayrı kanıtlanıyor: süzgecin DAVRANIŞI (eleme
 * yapıyor mu) ve dayandığı SÜTUNUN VARLIĞI. İkincisi olmasa, sütun adı yeniden
 * yanlış yazıldığında SQLite yine sessizce yeşil yanardı.
 */
class DoktorSuzgecleriTest extends TestCase
{
    use RefreshDatabase;

    /** Verilen puanla bir doktor oluşturur. */
    private function doktor(string $ad, ?float $puan): User
    {
        $kullanici = User::factory()->create([
            'role_id' => 'doctor',
            'fullname' => $ad,
            'is_active' => true,
        ]);

        DoctorProfile::create([
            'user_id' => $kullanici->id,
            'specialty' => 'Kardiyoloji',
            'slug' => 'dr-'.substr($kullanici->id, 0, 8),
            'avg_rating' => $puan,
        ]);

        return $kullanici;
    }

    public function test_puan_sutunu_gercekten_var(): void
    {
        // Süzgecin dayandığı sütun. Adı değişirse ya da yanlış yazılırsa,
        // SQLite bunu hata saymayacağı için davranış testi tek başına yetmez.
        $this->assertTrue(
            Schema::hasColumn('doctor_profiles', 'avg_rating'),
            'doctor_profiles.avg_rating yok — puan süzgeci dayanacak sütunu kaybetti',
        );

        $this->assertFalse(
            Schema::hasColumn('doctor_profiles', 'average_rating'),
            'average_rating diye bir sütun oluşmuş; iki ad birden varsa hangisinin '
            .'dolduğunu kimse bilmez',
        );
    }

    public function test_en_az_puan_suzgeci_gercekten_eliyor(): void
    {
        $this->doktor('Yüksek Puanlı', 4.9);
        $this->doktor('Orta Puanlı', 3.2);
        $this->doktor('Puansız', null);

        $hepsi = $this->getJson('/api/doctors?per_page=50');
        $hepsi->assertOk();
        $this->assertSame(3, $hepsi->json('total'), 'süzgeçsiz liste beklenen sayıyı vermiyor');

        $yuksek = $this->getJson('/api/doctors?per_page=50&min_rating=4.5');
        $yuksek->assertOk();
        $this->assertSame(1, $yuksek->json('total'), 'min_rating eleme yapmıyor');
        $this->assertSame('Yüksek Puanlı', $yuksek->json('data.0.fullname'));
    }

    public function test_ulasilamayacak_puan_bos_liste_veriyor(): void
    {
        // Asıl belirti buydu: imkânsız bir eşik verildiğinde bile TAM liste
        // dönüyordu. Ölçüt doğrudan onu hedefliyor.
        $this->doktor('Bir Doktor', 4.9);

        $yanit = $this->getJson('/api/doctors?per_page=50&min_rating=99');

        $yanit->assertOk();
        $this->assertSame(0, $yanit->json('total'), 'imkânsız eşikte bile doktor dönüyor: süzgeç uygulanmıyor');
    }

    public function test_puansiz_doktor_esikli_aramada_cikmiyor(): void
    {
        // `NULL >= 4` yanlış olmalı; aksi hâlde hiç değerlendirilmemiş bir
        // doktor "en az 4 puan" aramasında görünür.
        $this->doktor('Puansız', null);

        $yanit = $this->getJson('/api/doctors?per_page=50&min_rating=4');

        $yanit->assertOk();
        $this->assertSame(0, $yanit->json('total'), 'puanı olmayan doktor puan süzgecinden geçiyor');
    }
}
