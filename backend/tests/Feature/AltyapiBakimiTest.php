<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sadece büyüyen tabloların bakımı zamanlayıcıda olmalı.
 *
 * Bu tablolar hiç küçülmüyor: her giriş `personal_access_tokens`'a bir satır,
 * her başarısız iş `failed_jobs`'a bir satır bırakıyor. Ölçüldü — demo
 * veritabanında 801 jeton birikmişti ve 83'ünün süresi çoktan dolmuştu;
 * `sanctum:prune-expired` bunları tek çalıştırmada temizledi. Komut vardı,
 * zamanlayıcıda yoktu.
 *
 * `personal_access_tokens` her kimlikli istekte okunuyor. Büyümesinin bedeli
 * doğrudan gecikmeye yazılıyor, yani bu bir yer sorunu değil hız sorunu.
 *
 * Arıza sessiz: hiçbir şey hata vermez, tablolar yavaşça büyür ve aylar sonra
 * "site yavaşladı" diye görünür.
 *
 * DENETİM KAYITLARI VE BİLDİRİMLER BİLEREK DIŞARIDA. Onların saklama süresi
 * hukuki bir karar; buradaki dört komutun hiçbirinin öyle bir ağırlığı yok.
 */
class AltyapiBakimiTest extends TestCase
{
    use RefreshDatabase;

    /** @return string[] Zamanlayıcıdaki komut satırları. */
    private function zamanlananlar(): array
    {
        return collect(app(Schedule::class)->events())
            ->map(fn ($olay) => (string) $olay->command)
            ->all();
    }

    public static function bakimKomutlari(): array
    {
        return [
            'süresi dolmuş jetonlar' => ['sanctum:prune-expired'],
            'başarısız işler'        => ['queue:prune-failed'],
            'iş yığınları'           => ['queue:prune-batches'],
            'şifre sıfırlamaları'    => ['auth:clear-resets'],
        ];
    }

    /** @dataProvider bakimKomutlari */
    public function test_bakim_komutu_zamanlayicida(string $komut): void
    {
        $bulundu = collect($this->zamanlananlar())
            ->contains(fn ($satir) => str_contains($satir, $komut));

        $this->assertTrue(
            $bulundu,
            "`{$komut}` zamanlayıcıda değil: tablo sadece büyür, kimse fark etmez",
        );
    }

    public function test_saklama_budamasi_da_yerinde(): void
    {
        // Aynı dosyada duruyorlar; biri eklenirken diğeri düşerse fark
        // edilmesin diye ikisi de tutuluyor.
        $bulundu = collect($this->zamanlananlar())
            ->contains(fn ($satir) => str_contains($satir, 'model:prune'));

        $this->assertTrue($bulundu, 'saklama süresi budaması zamanlayıcıdan düşmüş');
    }

    public function test_jeton_budamasi_sureyi_veriyor(): void
    {
        // Saatsiz çağrılırsa Sanctum varsayılanı kullanır ve niyet kaynakta
        // görünmez olur.
        $satir = collect($this->zamanlananlar())
            ->first(fn ($s) => str_contains($s, 'sanctum:prune-expired'));

        $this->assertStringContainsString('--hours', (string) $satir);
    }
}
