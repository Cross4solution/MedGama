<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\Specialty;
use App\Models\TreatmentTag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Katalog silme gerçekten pasifleştirmeli.
 *
 * Üç uç da `$kayit->update(['is_active' => false])` yazıyordu. `is_active`
 * `Specialty` ve `City` modellerinde `$fillable` listesinde YOK, dolayısıyla
 * toplu atama koruması alanı sessizce düşürüyordu: uç 200 dönüyor, kayıt
 * listede kalıyordu. `TreatmentTag`'de alan fillable olduğu için orada
 * çalışıyordu — üç satır aynı görünüyor, ikisi çalışmıyordu.
 *
 * Yönetici panelinin ilk kez içeriden gezilmesiyle çıktı: uzmanlık yaratıp
 * silmek denendi ve katı toplu atama kipi (dea913d) istisna fırlattı. Üretimde
 * o kip istisna atmıyor, günlüğe yazıyor — yani orada hâlâ sessizdi.
 */
class KatalogSilmeTest extends TestCase
{
    use RefreshDatabase;

    private function yonetici(): self
    {
        $admin = User::factory()->create(['role_id' => 'superAdmin', 'is_active' => true]);
        $jeton = $admin->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_uzmanlik_silme_kaydi_pasiflestiriyor(): void
    {
        $uzmanlik = Specialty::create(['code' => 'olcum-uzm', 'name' => 'Ölçüm']);

        $this->yonetici()
            ->deleteJson("/api/admin/catalog/specialties/{$uzmanlik->id}")
            ->assertOk();

        $this->assertFalse(
            (bool) Specialty::withoutGlobalScopes()->find($uzmanlik->id)->is_active,
            'uzmanlık silme çağrısı hiçbir şey yapmıyor',
        );
    }

    public function test_sehir_silme_kaydi_pasiflestiriyor(): void
    {
        // `country_id` zorunlu ama `$fillable` içinde değil (sayısal ülke
        // kodu, ayrı bir tabloya işaret etmiyor) — doğrudan atanıyor.
        $sehir = new City(['code' => 'olcum-sehir', 'name' => 'Ölçüm Şehri']);
        $sehir->country_id = 1;
        $sehir->save();

        $this->yonetici()
            ->deleteJson("/api/admin/catalog/cities/{$sehir->id}")
            ->assertOk();

        $this->assertFalse(
            (bool) City::withoutGlobalScopes()->find($sehir->id)->is_active,
            'şehir silme çağrısı hiçbir şey yapmıyor',
        );
    }

    public function test_tedavi_etiketi_silme_kaydi_pasiflestiriyor(): void
    {
        // Bu üçüncüsü zaten çalışıyordu; gerileme olmadığını kaydediyoruz.
        $etiket = TreatmentTag::create([
            'name' => 'Ölçüm Etiketi',
            'slug' => 'olcum-etiketi',
            'specialty_id' => Specialty::create(['code' => 'et-uzm', 'name' => 'Etiket Uzmanlığı'])->id,
        ]);

        $this->yonetici()
            ->deleteJson("/api/admin/catalog/treatment-tags/{$etiket->id}")
            ->assertOk();

        $this->assertFalse(
            (bool) TreatmentTag::withoutGlobalScopes()->find($etiket->id)->is_active,
        );
    }
}
