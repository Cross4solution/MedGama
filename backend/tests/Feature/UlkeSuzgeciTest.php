<?php

namespace Tests\Feature;

use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Akışın ülke süzgeci — tam eşleşme, alt dize değil.
 *
 * Süzgeç `country LIKE '%TR%'` kuruyordu. Sütun ISO kodu tutan bir
 * `varchar(5)`; alt dize aramanın anlamı yok ve baştan joker hiçbir indeksi
 * kullanamıyor. Ölçüldü: "Table scan on users" — üstelik bu, akışın her
 * isteğinde koşan bir alt sorgu.
 *
 * Anlam tarafı da kırılgandı: alt dize eşleşmesi, kodun değil ADIN saklandığı
 * bir kurulumda `%TR%` ile AUSTRIA'yı da getirirdi.
 *
 * Tam eşleşme + indeks: "Covering index lookup", maliyet 5.15'ten 1.08'e.
 */
class UlkeSuzgeciTest extends TestCase
{
    use RefreshDatabase;

    private function yazarVeGonderi(?string $ulke): MedStreamPost
    {
        $yazar = User::factory()->create(['role_id' => 'doctor', 'country' => $ulke]);

        return MedStreamPost::factory()->create([
            'author_id' => $yazar->id,
            'is_active' => true,
        ]);
    }

    public function test_yalnizca_o_ulkenin_gonderileri_geliyor(): void
    {
        $turkiye = $this->yazarVeGonderi('TR');
        $almanya = $this->yazarVeGonderi('DE');

        $yanit = $this->getJson('/api/medstream/posts?country=TR')->assertOk()->json();
        $kimlikler = collect($yanit['data'] ?? $yanit)->pluck('id');

        $this->assertContains($turkiye->id, $kimlikler->all());
        $this->assertNotContains($almanya->id, $kimlikler->all());
    }

    public function test_alt_dize_eslesmesi_yapilmiyor(): void
    {
        // Kodun değil adın saklandığı bir kurulumda `%TR%` AUSTRIA'yı da
        // getirirdi. Süzgeç artık tam eşleşme olduğu için getirmiyor.
        $avusturya = $this->yazarVeGonderi('AUSTR');

        $yanit = $this->getJson('/api/medstream/posts?country=TR')->assertOk()->json();
        $kimlikler = collect($yanit['data'] ?? $yanit)->pluck('id');

        $this->assertNotContains(
            $avusturya->id,
            $kimlikler->all(),
            'alt dize eşleşmesi başka ülkenin gönderisini getiriyor',
        );
    }

    public function test_kucuk_harfli_kod_da_calisiyor(): void
    {
        // Kodlar büyük harf saklanıyor; adres çubuğundan küçük harf gelebilir.
        $gonderi = $this->yazarVeGonderi('TR');

        $yanit = $this->getJson('/api/medstream/posts?country=tr')->assertOk()->json();

        $this->assertContains($gonderi->id, collect($yanit['data'] ?? $yanit)->pluck('id')->all());
    }

    public function test_ulke_sutunu_indeksli(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('İndeks yalnız gerçek sürücüde ölçülebilir.');
        }

        $var = DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', 'users')
            ->where('column_name', 'country')
            ->exists();

        $this->assertTrue($var, 'users.country indekssiz — akış süzgeci tabloyu baştan tarar');
    }
}
