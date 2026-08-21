<?php

namespace Tests\Feature;

use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * MedStream akışı yazarın handle'ını taşımalı.
 *
 * Profil adresi /@username ile çözülüyor. Akış yanıtında yazar
 * "author:id,fullname,avatar,role_id" ile yükleniyordu — username seçilmediği
 * için yanıtta HER ZAMAN null görünüyordu, veritabanında dolu olsa bile.
 * Sonuç: akıştaki hiçbir yazar bağlantısı kurulamıyordu.
 *
 * Not: bu, "hesapların handle'ı yok" sorunundan farklı. Handle'lar yerinde;
 * taşınmıyorlardı. İkisi dışarıdan aynı görünüyor, sebepleri ayrı.
 */
class AkistaHandleTest extends TestCase
{
    use RefreshDatabase;

    public function test_akis_yazarin_handle_ini_donduruyor(): void
    {
        $doktor = User::factory()->doctor()->create(['fullname' => 'Dr. Ayşe Yılmaz']);
        MedStreamPost::factory()->create(['author_id' => $doktor->id]);

        $this->assertNotEmpty($doktor->username, 'Kurulum hatalı: hesapta handle yok');

        $yanit = $this->getJson('/api/medstream/posts?per_page=5')->assertOk();

        $yazar = $yanit->json('data.0.author');
        $this->assertNotNull($yazar, 'Yanıtta yazar yok');
        $this->assertSame(
            $doktor->username,
            $yazar['username'] ?? null,
            'Akış yazarın handle\'ını taşımıyor — profil bağlantısı kurulamaz',
        );
    }
}
