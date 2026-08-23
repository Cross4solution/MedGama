<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Username;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kullanıcı handle'ları — akışta kimlik taklidinin önündeki tek engel.
 *
 * MedStream'de gönderiler `@handle` ile görünüyor. `@admin`, `@medagama`
 * ya da `@support` gibi bir handle resmî hesap gibi okunur; hasta o hesabın
 * söylediğine platformun sözü gibi güvenir.
 *
 * Bulunan hata: rezerve liste YALNIZCA elle seçimde uygulanıyordu.
 * `generate()` sadece çakışmaya bakıyordu, dolayısıyla adı "Admin" olan bir
 * hasta @admin, adı "Medagama" olan bir klinik @medagama alıyordu — elle
 * seçilmesi engellenen handle'lar otomatik veriliyordu. Ölçüldü:
 *
 *     Admin      -> @admin      (rezerve, elle: reserved)
 *     Medagama   -> @medagama   (rezerve, elle: reserved)
 *
 * Hekimler `dr_` öneki yüzünden kazara korunuyordu; hasta ve klinikler
 * korunmuyordu.
 */
class HandleGuvenligiTest extends TestCase
{
    use RefreshDatabase;

    // ── Otomatik üretim ──

    public function test_uretilen_handle_rezerve_olamiyor(): void
    {
        // Asıl regresyon. Rol farkı önemli: hekimde `dr_` öneki riski
        // gizliyordu, o yüzden hasta ve klinik ayrı ayrı sınanıyor.
        $denemeler = [
            ['Admin', 'patient', null],
            ['Support', 'patient', null],
            ['Medagama', 'clinicOwner', 'Medagama'],
            ['MedStream', 'clinicOwner', 'MedStream'],
            ['Official', 'patient', null],
            ['Security', 'patient', null],
        ];

        foreach ($denemeler as [$ad, $rol, $klinik]) {
            $uretilen = Username::generate($ad, $rol, $klinik);

            $this->assertNotContains(
                $uretilen,
                Username::RESERVED,
                "otomatik üretim rezerve handle verdi: {$ad} -> @{$uretilen}",
            );
        }
    }

    public function test_uretilen_handle_elle_de_secilebilir_olmali(): void
    {
        // Tutarlılık: sistemin verdiği bir handle, kuralları da geçmeli.
        // Aksi hâlde kullanıcı kendi handle'ını profilinden doğrulayamaz.
        foreach ([['Admin', 'patient', null], ['Medagama', 'clinicOwner', 'Medagama']] as [$ad, $rol, $klinik]) {
            $uretilen = Username::generate($ad, $rol, $klinik);

            $this->assertNull(
                Username::availability($uretilen),
                "üretilen handle elle seçilemez durumda: @{$uretilen}",
            );
        }
    }

    public function test_uretilen_handle_mevcutla_cakismiyor(): void
    {
        User::factory()->patient()->create(['username' => 'ayse_kaya']);

        $ikinci = Username::generate('Ayşe Kaya', 'patient');

        $this->assertNotSame('ayse_kaya', $ikinci, 'aynı handle iki kez verildi');
    }

    public function test_turkce_harfler_handle_uretiminde_donusturuluyor(): void
    {
        // Handle adrese giriyor; Türkçe harf kalırsa bağlantı bozulur.
        $uretilen = Username::generate('Çiğdem Şahin Öztürk', 'patient');

        $this->assertMatchesRegularExpression('/^[a-z0-9._]+$/', $uretilen, "ASCII dışı karakter kaldı: {$uretilen}");
    }

    // ── Elle seçim ──

    public function test_rezerve_handle_elle_alinamiyor(): void
    {
        foreach (['admin', 'medagama', 'support', 'official', 'system'] as $handle) {
            $this->assertSame('reserved', Username::availability($handle), "rezerve handle alınabildi: {$handle}");
        }
    }

    public function test_buyuk_harfle_rezerve_atlatilamiyor(): void
    {
        // Denetim küçük harfe çevirdikten sonra yapılmalı.
        foreach (['Admin', 'ADMIN', 'MedAgama'] as $handle) {
            $this->assertSame('reserved', Username::availability($handle), "büyük harfle atlatıldı: {$handle}");
        }
    }

    public function test_alinmis_handle_tekrar_verilmiyor(): void
    {
        User::factory()->patient()->create(['username' => 'benim_handle']);

        $this->assertSame('taken', Username::availability('benim_handle'));
    }

    public function test_kullanici_kendi_handleini_koruyabiliyor(): void
    {
        // Profil güncellemede kendi handle'ı "alınmış" sayılırsa kullanıcı
        // adını hiç değiştiremez hale gelir.
        $kullanici = User::factory()->patient()->create(['username' => 'kendi_handle']);

        $this->assertNull(Username::availability('kendi_handle', $kullanici->id));
    }

    // ── Biçim ──

    public function test_gecersiz_bicimler_reddediliyor(): void
    {
        $gecersizler = [
            'ab',                       // çok kısa
            str_repeat('a', 31),        // çok uzun
            '_baslangic',               // alt çizgiyle başlıyor
            'bitis.',                   // noktayla bitiyor
            'iki..nokta',               // arka arkaya nokta
            'iki__altcizgi',            // arka arkaya alt çizgi
            'bosluk var',
            'tire-var',
            'çiğdem',                   // ASCII dışı
            'a@b',
        ];

        foreach ($gecersizler as $handle) {
            $this->assertSame('invalid', Username::availability($handle), "geçersiz biçim kabul edildi: {$handle}");
        }
    }

    public function test_gecerli_bicimler_kabul_ediliyor(): void
    {
        // Ters uç: kural fazla sıkı olursa kullanıcılar handle seçemez ve bu,
        // yalnız ret testleriyle gizlenirdi.
        foreach (['abc', 'dr_ayse', 'ayse.kaya', 'user123', str_repeat('a', 30)] as $handle) {
            $this->assertNull(Username::availability($handle), "geçerli handle reddedildi: {$handle}");
        }
    }
}
