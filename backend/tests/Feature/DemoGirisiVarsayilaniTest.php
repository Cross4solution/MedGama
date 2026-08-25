<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Şifresiz demo girişi, unutulursa KAPALI kalmalı.
 *
 * `/demo-login/{rol}` kasıtlı bir kimlik doğrulama atlaması: bağlantıyı eline
 * geçiren herkes demo hesabına giriyor. Denetleyicinin kendi notu "teslimden
 * önce kapatılmalı" diyor.
 *
 * Ama iki şey birden yanlıştı:
 *
 *   • `config/demo.php` varsayılanı `env('DEMO_LOGIN_ENABLED', true)` idi —
 *     yani AÇIK.
 *   • `render.yaml` bu değişkeni hiç içermiyordu.
 *
 * İkisi birlikte şu demek: o dosyadan yapılan taze bir dağıtım, kimlik atlamasını
 * açık olarak yayına alır. Kapatmak, birinin panelden elle değişken eklemeyi
 * hatırlamasına bağlıydı. Unutmanın bedeli açık kalması olmamalı.
 *
 * Varsayılan `false` oldu; yerel geliştirme `.env` ile açıkça açıyor, üretim
 * `render.yaml` ile açıkça kapatıyor. Davranış yerelde değişmedi (anahtar hâlâ
 * gerekli), değişen tek şey UNUTULDUĞUNDA ne olduğu.
 */
class DemoGirisiVarsayilaniTest extends TestCase
{
    use RefreshDatabase;

    public function test_ortam_degiskeni_yoksa_kapali(): void
    {
        // Asıl mesele bu: değişken hiç tanımlı değilken sonuç ne oluyor.
        $yapilandirma = (string) file_get_contents(config_path('demo.php'));

        $this->assertStringContainsString(
            "env('DEMO_LOGIN_ENABLED', false)",
            $yapilandirma,
            'demo girişi varsayılanı AÇIK: değişken unutulursa kimlik atlaması yayına çıkar',
        );
    }

    public function test_uretim_yapilandirmasi_acikca_kapatiyor(): void
    {
        // Varsayılana güvenmek yetmez; üretim dosyası niyetini yazmalı ki
        // sonradan bakan biri "acaba unutuldu mu" diye düşünmesin.
        $render = (string) file_get_contents(base_path('../render.yaml'));

        $this->assertMatchesRegularExpression(
            '/key:\s*DEMO_LOGIN_ENABLED\s*\n\s*value:\s*false/',
            $render,
            'render.yaml demo girişini açıkça kapatmıyor',
        );
    }

    public function test_kapaliyken_uc_yok_gibi_davraniyor(): void
    {
        // 403 değil 404: ucun VARLIĞI bile bilgi verir.
        config(['demo.enabled' => false]);

        $this->getJson('/api/demo-login/patient')->assertStatus(404);
    }

    public function test_anahtar_tanimliysa_zorunlu(): void
    {
        config(['demo.enabled' => true, 'demo.login_key' => 'gizli-anahtar']);

        $this->getJson('/api/demo-login/patient')->assertStatus(404);
        $this->getJson('/api/demo-login/patient?key=yanlis')->assertStatus(404);
    }

    public function test_bilinmeyen_rol_kabul_edilmiyor(): void
    {
        config(['demo.enabled' => true, 'demo.login_key' => '']);

        $this->getJson('/api/demo-login/superAdmin')->assertStatus(404);
        $this->getJson('/api/demo-login/olmayan-rol')->assertStatus(404);
    }
}
