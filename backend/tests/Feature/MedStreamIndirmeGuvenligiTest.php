<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * /api/medstream/download — GİRİŞ GEREKTİRMEYEN dosya indirme.
 *
 * Uç, istekten gelen bir YOLU alıp diskten okuyor. Kimlik doğrulaması yok
 * (gönderiler zaten herkese açık), dolayısıyla korumanın tamamı iki
 * kuraldan ibaret: yol `medstream/` ile başlamalı ve `..` içermemeli.
 *
 * Kullanıcıdan yol alan her uç aynı sınıf hataya açık; buradaki fark,
 * yanlış giderse .env ya da başka bir kullanıcının dosyası dışarı
 * çıkabilmesi ve bunun için hesap bile gerekmemesi.
 *
 * `filename` de kullanıcıdan geliyor ve Content-Disposition başlığına
 * giriyor — ayrıca sınanıyor.
 */
class MedStreamIndirmeGuvenligiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::disk('public')->put('medstream/gonderi.jpg', 'GONDERI GORSELI');
        // Korunması gereken komşu: medstream/ dışında, aynı diskte.
        Storage::disk('public')->put('gizli/ayar.txt', 'GIZLI ICERIK');
    }

    private function indir(array $sorgu)
    {
        return $this->get('/api/medstream/download?' . http_build_query($sorgu));
    }

    // ── Pozitif kontrol ──

    public function test_medstream_dosyasi_indirilebiliyor(): void
    {
        // Olmazsa aşağıdaki ret testleri, uç hiç çalışmadığı için de geçerdi.
        $yanit = $this->indir(['path' => 'medstream/gonderi.jpg'])->assertOk();

        $this->assertSame('GONDERI GORSELI', $yanit->streamedContent());
    }

    public function test_storage_onekli_yol_da_calisiyor(): void
    {
        // Ön yüz yolları "/storage/..." biçiminde tutuyor; önek soyuluyor.
        $this->indir(['path' => '/storage/medstream/gonderi.jpg'])->assertOk();
    }

    // ── Dizin dışına çıkma ──

    public function test_ust_dizine_cikilamiyor(): void
    {
        $this->indir(['path' => 'medstream/../gizli/ayar.txt'])->assertStatus(403);
    }

    public function test_kodlanmis_ust_dizin_de_engelleniyor(): void
    {
        // %2e%2e sorgu çözülürken ".." haline geliyor; denetim çözülmüş
        // değerin üzerinde olmalı, ham dizgenin değil.
        $yanit = $this->get('/api/medstream/download?path=medstream/%2e%2e/gizli/ayar.txt');

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'kodlanmış üst dizin geçti');
        $this->assertStringNotContainsString('GIZLI ICERIK', $yanit->getContent());
    }

    public function test_derin_ust_dizin_zinciri_engelleniyor(): void
    {
        $yanit = $this->indir(['path' => 'medstream/../../../../../../etc/passwd']);

        $this->assertContains($yanit->getStatusCode(), [403, 404]);
        $this->assertStringNotContainsString('root:', $yanit->getContent());
    }

    public function test_medstream_disindaki_yol_reddediliyor(): void
    {
        $yanit = $this->indir(['path' => 'gizli/ayar.txt']);

        $yanit->assertStatus(403);
        $this->assertStringNotContainsString('GIZLI ICERIK', $yanit->getContent());
    }

    public function test_mutlak_yol_reddediliyor(): void
    {
        // SINIR: `Storage::fake` gerçek dosya sistemini devre dışı bırakıyor,
        // yani bu senaryo korumalar kaldırılsa da 404 verirdi. Gerçek dizin
        // dışına çıkmayı ölçen testler sahte diskteki `gizli/` komşusunu
        // kullananlar; bu ise yalnız uç noktanın böyle bir girdide veri
        // döndürmediğini kaydediyor.
        $yanit = $this->indir(['path' => '/etc/passwd']);

        $this->assertContains($yanit->getStatusCode(), [403, 404]);
        $this->assertStringNotContainsString('root:', $yanit->getContent());
    }

    public function test_onek_benzeri_isim_kabul_edilmiyor(): void
    {
        // "medstream" ile BAŞLAYAN başka bir dizin — `str_starts_with`
        // yalnız öneke baktığı için "medstream-gizli/" de geçebilir.
        Storage::disk('public')->put('medstream-gizli/sir.txt', 'SIR');

        $yanit = $this->indir(['path' => 'medstream-gizli/sir.txt']);

        $this->assertContains(
            $yanit->getStatusCode(),
            [403, 404],
            'medstream ile başlayan komşu dizin okundu',
        );
        $this->assertStringNotContainsString('SIR', $yanit->getContent());
    }

    // ── filename başlığı ──

    public function test_dosya_adina_satir_sonu_enjekte_edilemiyor(): void
    {
        // `filename` kullanıcıdan gelip Content-Disposition başlığına giriyor.
        // Ham CR/LF geçerse yanıta yeni başlık eklenebilir.
        $yanit = $this->indir([
            'path'     => 'medstream/gonderi.jpg',
            'filename' => "zararsiz.jpg\r\nX-Enjekte: evet",
        ]);

        $this->assertNull($yanit->headers->get('X-Enjekte'), 'başlık enjekte edildi');

        $disposition = (string) $yanit->headers->get('Content-Disposition');
        $this->assertStringNotContainsString("\r", $disposition, 'başlıkta ham CR kaldı');
        $this->assertStringNotContainsString("\n", $disposition, 'başlıkta ham LF kaldı');
    }

    // ── Girdi doğrulama ──

    public function test_yol_zorunlu(): void
    {
        $this->getJson('/api/medstream/download')->assertStatus(422);
    }

    public function test_olmayan_dosya_404_veriyor(): void
    {
        // 403 değil 404: `medstream/` altında olmayan bir dosya ile var olan
        // ama erişilemeyen bir yol aynı yanıtı vermemeli, aksi hâlde dizin
        // içeriği yoklanabilir hale gelir.
        $this->indir(['path' => 'medstream/yok.jpg'])->assertStatus(404);
    }
}
