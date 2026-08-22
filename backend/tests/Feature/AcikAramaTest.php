<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * /api/search/live — GİRİŞ GEREKTİRMEYEN otomatik tamamlama.
 *
 * Uç herkese açık ve `users` tablosunda arama yapıyor. İki ayrı şey
 * kanıtlanmak zorunda:
 *
 *   1. KİM görünüyor — yalnız aktif doktorlar ve aktif klinikler. Hastanın
 *      adının burada çıkması, giriş bile yapmamış birinin platformdaki
 *      hastaları listeleyebilmesi demek.
 *   2. NE görünüyor — seçilen sütunlar. Bugün e-posta/telefon seçilmiyor;
 *      ama `select()` listesine dokunan biri bunu farkında olmadan açar ve
 *      hata sessizdir: uç çalışmaya devam eder, sadece fazla veri döner.
 *
 * Türkçe katlama da burada sınanıyor: kullanıcı "Cigdem" yazıp "Çiğdem"i
 * bulamazsa arama pratikte kırıktır ama hiçbir yerde hata görünmez.
 */
class AcikAramaTest extends TestCase
{
    use RefreshDatabase;

    private function doktor(string $ad, array $ek = []): User
    {
        $u = User::factory()->doctor()->create(array_merge(['fullname' => $ad], $ek));
        // DoctorProfileFactory yok; profil elle kuruluyor.
        DoctorProfile::create([
            'user_id'   => $u->id,
            'specialty' => 'Kardiyoloji',
            'slug'      => 'dr-' . substr($u->id, 0, 8),
        ]);

        return $u;
    }

    private function ara(string $q): array
    {
        return $this->getJson('/api/search/live?q=' . urlencode($q))->assertOk()->json();
    }

    private function isimler(array $sonuc, string $kume = 'doctors'): array
    {
        return array_column($sonuc[$kume] ?? [], 'name');
    }

    // ── Pozitif kontrol ──

    public function test_aktif_doktor_bulunuyor(): void
    {
        // Bu geçmezse aşağıdaki "şu kişi çıkmıyor" testleri, arama hiç
        // çalışmadığı için de geçerdi.
        $this->doktor('Ahmet Yilmaz');

        $this->assertContains('Ahmet Yilmaz', $this->isimler($this->ara('Ahmet')));
    }

    // ── Kim görünmemeli ──

    public function test_hasta_acik_aramada_cikmiyor(): void
    {
        // En ağır sızıntı: giriş yapmamış biri hasta adı toplayabilir.
        User::factory()->patient()->create(['fullname' => 'Zeynep Hastaoglu']);

        $sonuc = $this->ara('Zeynep');

        $this->assertNotContains('Zeynep Hastaoglu', $this->isimler($sonuc));
        $this->assertStringNotContainsString('Hastaoglu', json_encode($sonuc), JSON_UNESCAPED_UNICODE);
    }

    public function test_pasif_doktor_cikmiyor(): void
    {
        $this->doktor('Pasif Doktor', ['is_active' => false]);

        $this->assertNotContains('Pasif Doktor', $this->isimler($this->ara('Pasif')));
    }

    public function test_silinmis_doktor_cikmiyor(): void
    {
        // Yumuşak silme: kayıt tabloda duruyor. Genel kapsam düşerse hesabını
        // kapatmış doktor aramada geri gelir.
        $d = $this->doktor('Silinmis Doktor');
        $d->delete();

        $this->assertNotContains('Silinmis Doktor', $this->isimler($this->ara('Silinmis')));
    }

    public function test_klinik_sahibi_doktor_listesinde_cikmiyor(): void
    {
        User::factory()->clinicOwner()->create(['fullname' => 'Sahip Kisi']);

        $this->assertNotContains('Sahip Kisi', $this->isimler($this->ara('Sahip')));
    }

    public function test_pasif_klinik_cikmiyor(): void
    {
        Clinic::factory()->create(['name' => 'Kapali Klinik', 'fullname' => 'Kapali Klinik', 'is_active' => false]);

        $this->assertNotContains('Kapali Klinik', $this->isimler($this->ara('Kapali'), 'clinics'));
    }

    public function test_aktif_klinik_cikiyor(): void
    {
        Clinic::factory()->create(['name' => 'Acik Klinik', 'fullname' => 'Acik Klinik', 'is_active' => true]);

        $this->assertContains('Acik Klinik', $this->isimler($this->ara('Acik'), 'clinics'));
    }

    // ── Ne görünmemeli ──

    public function test_iletisim_bilgisi_sizmiyor(): void
    {
        // Doktor gerçekten bulunuyor olmalı, yoksa "e-posta yok" sonucu
        // yalnızca hiçbir şey dönmediğini gösterirdi.
        $d = $this->doktor('Bulunan Doktor', [
            'email'  => 'gizli.adres@ornek.test',
            'mobile' => '05551112233',
        ]);

        $sonuc = $this->ara('Bulunan');
        $this->assertContains('Bulunan Doktor', $this->isimler($sonuc));

        $ham = json_encode($sonuc, JSON_UNESCAPED_UNICODE);
        $this->assertStringNotContainsString('gizli.adres@ornek.test', $ham, 'e-posta sızdı');
        $this->assertStringNotContainsString('05551112233', $ham, 'telefon sızdı');
        $this->assertStringNotContainsString($d->password ?? '', $ham !== '' ? $ham : 'x');
    }

    public function test_dogum_tarihi_sizmiyor(): void
    {
        $this->doktor('Tarihli Doktor', ['date_of_birth' => '1980-03-17']);

        $this->assertStringNotContainsString(
            '1980-03-17',
            json_encode($this->ara('Tarihli'), JSON_UNESCAPED_UNICODE),
            'doğum tarihi sızdı',
        );
    }

    // ── Türkçe katlama ──

    /**
     * SQLite'ın LOWER()'ı YALNIZ ASCII katlıyor: LOWER('ÇİĞDEM') → 'ÇİĞdem'.
     * PHP tarafı mb_strtolower ile 'çiğdem' gönderdiği için yerelde hiçbir
     * Türkçe ad eşleşmiyor. Canlıdaki TiDB'de LOWER() unicode farkında ve
     * katlama ÇALIŞIYOR — canlı uca karşı ölçüldü: Ayşe/Ayse, Çelik/Celik,
     * Şahin/Sahin, Yıldız/Yildiz çiftlerinin hepsi aynı sonucu veriyor.
     *
     * Yani bu testler bir üretim hatası bildirmiyor; yerel sürücüde
     * doğrulanamıyorlar. MySQL'e karşı çalıştırıldıklarında gerçek koruma
     * sağlarlar, o yüzden silinmiyorlar.
     */
    private function katlamaSurucusuVarMi(): void
    {
        if (\DB::connection()->getDriverName() === 'sqlite') {
            $this->markTestSkipped(
                'SQLite LOWER() Türkçe harfleri katlamıyor; katlama yalnız MySQL/TiDB/Postgres üzerinde doğrulanabilir.'
            );
        }
    }

    public function test_aksansiz_yazim_aksanli_ismi_buluyor(): void
    {
        $this->katlamaSurucusuVarMi();

        // Kullanıcıların çoğu Türkçe karakter yazmıyor. Katlama olmazsa arama
        // sessizce boş döner — hata görünmez, sadece kimse bulunamaz.
        $this->doktor('Çiğdem Şahin');

        $this->assertContains('Çiğdem Şahin', $this->isimler($this->ara('Cigdem')));
    }

    public function test_aksanli_yazim_da_buluyor(): void
    {
        $this->katlamaSurucusuVarMi();

        $this->doktor('Çiğdem Şahin');

        $this->assertContains('Çiğdem Şahin', $this->isimler($this->ara('Çiğdem')));
    }

    public function test_noktasiz_i_ile_arama_calisiyor(): void
    {
        $this->katlamaSurucusuVarMi();

        // Türkçe'nin klasik tuzağı: I/ı ve İ/i. Düz lowercase bunları
        // karıştırır.
        $this->doktor('Işıl Yıldız');

        $this->assertContains('Işıl Yıldız', $this->isimler($this->ara('isil')));
    }

    public function test_buyuk_kucuk_harf_farki_onemsiz(): void
    {
        $this->doktor('Mehmet Demir');

        $this->assertContains('Mehmet Demir', $this->isimler($this->ara('MEHMET')));
    }

    public function test_uzmanlik_alanindan_da_bulunuyor(): void
    {
        $this->doktor('Uzman Kisi');

        $this->assertContains('Uzman Kisi', $this->isimler($this->ara('Kardiyoloji')));
    }

    // ── Girdi dayanıklılığı ──

    public function test_bos_sorgu_bos_sonuc_veriyor(): void
    {
        $this->doktor('Herhangi Doktor');

        $sonuc = $this->ara('');

        $this->assertSame([], $sonuc['doctors']);
        $this->assertSame([], $sonuc['clinics']);
    }

    public function test_sql_karakterleri_sorguyu_bozmuyor(): void
    {
        // Terim ham SQL'e whereRaw ile giriyor; bağlama doğru yapılmazsa
        // bu girdi ya patlar ya da tüm tabloyu döker.
        $this->doktor('Normal Doktor');

        foreach (["%", "_", "' OR '1'='1", '"; DROP TABLE users; --', '\\'] as $kotu) {
            $yanit = $this->getJson('/api/search/live?q=' . urlencode($kotu));

            $this->assertSame(200, $yanit->getStatusCode(), "sorgu patladı: {$kotu}");
        }

        // Tablo hâlâ yerinde: yıkıcı girdi işlenmemiş.
        $this->assertDatabaseHas('users', ['fullname' => 'Normal Doktor']);
    }

    public function test_joker_karakter_herkesi_dokmuyor(): void
    {
        // "%" LIKE içinde her şeye uyar. Bağlanmış parametre olarak DÜZ METİN
        // sayılmalı; sayılmazsa tek karakterle tüm doktor listesi çekilir.
        $this->doktor('Gizlenecek Doktor');

        $this->assertNotContains('Gizlenecek Doktor', $this->isimler($this->ara('%')));
    }

    public function test_sonuc_sayisi_sinirli(): void
    {
        // Sınır kalkarsa tek istekle tüm doktor listesi dışarı çıkar.
        for ($i = 0; $i < 9; $i++) {
            $this->doktor("Sinirli Doktor {$i}");
        }

        $this->assertLessThanOrEqual(5, count($this->ara('Sinirli')['doctors']));
    }
}
