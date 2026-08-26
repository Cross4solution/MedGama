<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\DiseaseCondition;
use App\Models\SymptomSpecialtyMapping;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Katalog ve duyuru yazmaları: kim yazabiliyor, yazınca ne oluyor.
 *
 * Hastalık ve belirti kataloğu, Vasco'nun semptomdan uzmanlığa yönlendirmesini
 * besliyor. Yanlış eşleme, göğüs ağrısı yazan bir hastayı kardiyoloji yerine
 * başka bir yere gönderir — bu yüzden yazma yetkisinin sızmadığını ölçüyoruz.
 *
 * Uçlar hem `catalog/*` hem `admin/catalog/*` önekinde ikiz duruyor. İkisi de
 * aynı denetleyici gövdesine gidiyor ve ikisi de superAdmin/saasAdmin kapısı
 * taşıyor; ölçüt ikisini birden tutuyor, çünkü birini sertleştirip diğerini
 * unutmak sessiz bir açık bırakır.
 *
 * Aynı dosya duyuru güncelleme/silmesini de kapsıyor: silme gerçekten satırı
 * kaldırmalı — katalog silmelerinde çıkan "200 döndürüp hiçbir şey silmemek"
 * hatasının (KatalogSilmeTest) burada tekrarlanmadığının kanıtı.
 */
class KatalogYazmaUclariTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): User
    {
        return User::factory()->create(['role_id' => 'superAdmin']);
    }

    private function hastalik(): DiseaseCondition
    {
        return DiseaseCondition::create([
            'code' => 'test-kod-' . uniqid(),
            'name' => ['en' => 'Test condition', 'tr' => 'Deneme durumu'],
        ]);
    }

    // ── Yetki ──────────────────────────────────────────────────────────────

    public static function yazmaUclari(): array
    {
        return [
            'hastalık ekle'      => ['post', 'catalog/diseases'],
            'hastalık ekle (yön)' => ['post', 'admin/catalog/diseases'],
        ];
    }

    /** @dataProvider yazmaUclari */
    public function test_hasta_katalogu_yazamiyor(string $yontem, string $uc): void
    {
        $hasta = User::factory()->create(['role_id' => 'patient']);

        $this->actingAs($hasta, 'sanctum')
            ->{$yontem . 'Json'}('/api/' . $uc, [
                'code' => 'sahte',
                'name' => ['en' => 'x', 'tr' => 'x'],
            ])
            ->assertStatus(403);
    }

    public function test_hekim_de_katalogu_yazamiyor(): void
    {
        // Hekim kendi alanında uzman, ama katalog bütün yönlendirmeyi besliyor.
        $hekim = User::factory()->create(['role_id' => 'doctor']);
        $hastalik = $this->hastalik();

        $this->actingAs($hekim, 'sanctum')
            ->putJson("/api/catalog/diseases/{$hastalik->id}", [
                'name' => ['en' => 'değişti', 'tr' => 'değişti'],
            ])
            ->assertStatus(403);

        $this->assertSame('Test condition', $hastalik->fresh()->getTranslation('name', 'en'));
    }

    public function test_oturumsuz_yazamiyor(): void
    {
        $this->postJson('/api/catalog/diseases', [
            'code' => 'sahte',
            'name' => ['en' => 'x', 'tr' => 'x'],
        ])->assertStatus(401);
    }

    // ── Yazma gerçekten oluyor mu ──────────────────────────────────────────

    public function test_yonetici_hastalik_ekliyor_ve_liste_gosteriyor(): void
    {
        $kod = 'kod-' . uniqid();

        $this->actingAs($this->yonetici(), 'sanctum')
            ->postJson('/api/catalog/diseases', [
                'code' => $kod,
                'name' => ['en' => 'New condition', 'tr' => 'Yeni durum'],
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('disease_conditions', ['code' => $kod]);
    }

    public function test_ekleme_onbellegi_dusuruyor(): void
    {
        // Genel liste bir SAAT önbellekleniyor. Yazma önbelleği düşürmezse
        // yönetici eklediği hastalığı bir saat boyunca göremez, eklemenin
        // işlemediğini sanıp tekrar dener.
        //
        // Ölçütün sırası önemli: önce listeyi çekip önbelleği DOLDURUYORUZ.
        // Bu adım olmadan önbellek zaten boş olur, sonraki okuma tazeyi
        // getirir ve ölçüt düşürme kaldırılsa bile yeşil kalır.
        $this->getJson('/api/catalog/diseases')->assertOk();

        $kod = 'kod-' . uniqid();
        $this->actingAs($this->yonetici(), 'sanctum')
            ->postJson('/api/catalog/diseases', [
                'code' => $kod,
                'name' => ['en' => 'Fresh condition', 'tr' => 'Taze durum'],
            ])
            ->assertStatus(201);

        $liste = $this->getJson('/api/catalog/diseases')->assertOk()->json();
        $this->assertStringContainsString(
            $kod,
            json_encode($liste),
            'yeni hastalık listede yok — önbellek düşürülmemiş',
        );
    }

    public function test_ayni_kod_iki_kez_eklenemiyor(): void
    {
        $hastalik = $this->hastalik();

        $this->actingAs($this->yonetici(), 'sanctum')
            ->postJson('/api/catalog/diseases', [
                'code' => $hastalik->code,
                'name' => ['en' => 'x', 'tr' => 'x'],
            ])
            ->assertStatus(422);
    }

    public function test_ingilizce_ad_zorunlu(): void
    {
        // Ad çok dilli; İngilizce yedek dil. Boş kalırsa katalog bazı
        // kullanıcılarda adsız görünür.
        $this->actingAs($this->yonetici(), 'sanctum')
            ->postJson('/api/catalog/diseases', [
                'code' => 'kod-' . uniqid(),
                'name' => ['tr' => 'yalnız Türkçe'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name.en');
    }

    public function test_yonetici_hastaligi_guncelliyor(): void
    {
        $hastalik = $this->hastalik();

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/catalog/diseases/{$hastalik->id}", [
                'name' => ['en' => 'Renamed', 'tr' => 'Yeniden adlandı'],
            ])
            ->assertOk();

        $this->assertSame('Renamed', $hastalik->fresh()->getTranslation('name', 'en'));
    }

    public function test_belirti_eslemesi_guncelleniyor(): void
    {
        $belirti = SymptomSpecialtyMapping::create([
            'symptom' => 'deneme-belirti-' . uniqid(),
            'name'    => ['en' => 'Test symptom', 'tr' => 'Deneme belirtisi'],
            'specialty_ids' => [],
        ]);

        $this->actingAs($this->yonetici(), 'sanctum')
            ->putJson("/api/catalog/symptoms/{$belirti->id}", [
                'name' => ['en' => 'Updated symptom', 'tr' => 'Güncellendi'],
            ])
            ->assertOk();

        $this->assertSame('Updated symptom', $belirti->fresh()->getTranslation('name', 'en'));
    }

    // ── Tedavi etiketi araması ─────────────────────────────────────────────

    public function test_bos_sorgu_butun_etiketleri_dokmuyor(): void
    {
        $this->getJson('/api/catalog/treatment-tags/search?q=')
            ->assertOk()
            ->assertJsonPath('results', []);
    }

    // ── Duyurular ──────────────────────────────────────────────────────────

    public function test_duyuru_silme_satiri_gercekten_kaldiriyor(): void
    {
        $yonetici = $this->yonetici();
        $duyuru = Announcement::create([
            'created_by' => $yonetici->id,
            'title'      => 'Bakım duyurusu',
            'body'       => 'Cumartesi gecesi kısa kesinti olacak.',
            'type'       => 'info',
        ]);

        $this->actingAs($yonetici, 'sanctum')
            ->deleteJson("/api/admin/announcements/{$duyuru->id}")
            ->assertOk();

        $this->assertDatabaseMissing('announcements', ['id' => $duyuru->id]);
    }

    public function test_duyuru_guncelleniyor(): void
    {
        $yonetici = $this->yonetici();
        $duyuru = Announcement::create([
            'created_by' => $yonetici->id,
            'title'      => 'Eski başlık',
            'body'       => 'Gövde',
            'type'       => 'info',
        ]);

        $this->actingAs($yonetici, 'sanctum')
            ->putJson("/api/admin/announcements/{$duyuru->id}", [
                'title' => 'Yeni başlık',
                'type'  => 'warning',
            ])
            ->assertOk();

        $taze = $duyuru->fresh();
        $this->assertSame('Yeni başlık', $taze->title);
        $this->assertSame('warning', $taze->type);
    }

    public function test_hasta_duyuru_silemiyor(): void
    {
        $duyuru = Announcement::create([
            'created_by' => $this->yonetici()->id,
            'title'      => 'Duyuru',
            'body'       => 'Gövde',
            'type'       => 'info',
        ]);
        $hasta = User::factory()->create(['role_id' => 'patient']);

        $this->actingAs($hasta, 'sanctum')
            ->deleteJson("/api/admin/announcements/{$duyuru->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('announcements', ['id' => $duyuru->id]);
    }
}
