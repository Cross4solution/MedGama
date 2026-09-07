<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\User;
use App\Support\Fiyat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Fiyat aralığı süzgeci — doktor ve klinik listesi, seçilen para biriminde.
 *
 * Karar (müşteri, 7 Eylül 2026): birimler KARIŞTIRILMAZ. 500'lük bir TRY
 * aralığına EUR fiyat giren doktor düşmemeli; kur çevirisi yok. Bu yüzden
 * en düşük fiyatın yanında birimi de saklanıyor ve süzgeç yalnız o birimde
 * çalışıyor. Simge (₺ € $) ve kod (TRY EUR USD) aynı şeydir.
 */
class FiyatAraligiSuzgeciTest extends TestCase
{
    use RefreshDatabase;

    private function doktor(string $ad, ?array $prices): void
    {
        $u = User::factory()->create(['role_id' => 'doctor', 'fullname' => $ad, 'is_active' => true, 'is_verified' => true]);
        DoctorProfile::create(['user_id' => $u->id, 'specialty' => 'Kardiyoloji', 'slug' => 'dr-' . substr($u->id, 0, 8), 'prices' => $prices]);
    }

    private function klinik(string $ad, ?array $priceRanges): Clinic
    {
        $sahip = User::factory()->create(['role_id' => 'clinicOwner', 'is_active' => true]);
        // Sınanan şey kanca; fillable listesi değil. forceCreate kancayı yine çalıştırır.
        return Clinic::forceCreate([
            'name' => $ad, 'codename' => strtolower(str_replace(' ', '-', $ad)) . '-' . substr($sahip->id, 0, 6),
            'fullname' => $ad, 'owner_id' => $sahip->id, 'is_active' => true, 'price_ranges' => $priceRanges,
        ]);
    }

    public function test_sutunlar_var(): void
    {
        foreach (['doctor_profiles' => 'price_currency', 'clinics' => 'min_price'] as $tablo => $sutun) {
            $this->assertTrue(Schema::hasColumn($tablo, $sutun), "$tablo.$sutun yok");
        }
    }

    public function test_yardimci_simgeyi_koda_cevirir_ve_en_ucuzun_birimini_secer(): void
    {
        $this->assertSame(['min' => 250.0, 'currency' => 'EUR'],
            Fiyat::asgari([['min' => 800, 'currency' => '₺'], ['min' => 250, 'currency' => '€']]));
        $this->assertSame(['min' => 800.0, 'currency' => 'TRY'],
            Fiyat::asgari([['min' => 800]]), 'birim yazılmamışsa TRY sayılmalı');
        $this->assertSame(['min' => null, 'currency' => null], Fiyat::asgari([]));
        $this->assertSame('USD', Fiyat::birim('$'));
        $this->assertSame('TRY', Fiyat::birim('bilinmeyen'));
    }

    public function test_doktor_suzgeci_yalniz_secilen_birimde_calisir(): void
    {
        $this->doktor('Ucuz TRY', [['label' => 'Muayene', 'min' => 400, 'currency' => 'TRY']]);
        $this->doktor('Orta TRY', [['label' => 'Muayene', 'min' => 900, 'currency' => '₺']]);
        $this->doktor('Pahalı TRY', [['label' => 'Muayene', 'min' => 5000, 'currency' => 'TRY']]);
        $this->doktor('Avro', [['label' => 'Muayene', 'min' => 600, 'currency' => 'EUR']]);
        $this->doktor('Fiyatsız', null);

        $adlar = fn (string $sorgu) => array_column(
            $this->getJson('/api/doctors?' . $sorgu)->assertOk()->json('data'), 'fullname');

        // 600 EUR, 300–1000 TRY aralığına DÜŞMEMELİ.
        $this->assertEqualsCanonicalizing(['Ucuz TRY', 'Orta TRY'], $adlar('price_min=300&price_max=1000&currency=TRY'));
        $this->assertSame(['Avro'], $adlar('price_min=300&price_max=1000&currency=EUR'));
        // Birim verilmezse TRY.
        $this->assertEqualsCanonicalizing(['Ucuz TRY', 'Orta TRY'], $adlar('price_min=300&price_max=1000'));
        // Yalnız üst sınır; fiyatsız doktor aralığa girmez.
        $this->assertSame(['Ucuz TRY'], $adlar('price_max=500'));
        // Süzgeç yokken herkes.
        $this->assertCount(5, $adlar('per_page=10'));
    }

    public function test_klinik_kancasi_ve_suzgeci(): void
    {
        $k = $this->klinik('Ucuz Klinik', [['service' => 'Muayene', 'min' => 1500, 'max' => 3000, 'currency' => 'TRY']]);
        $this->klinik('Avro Klinik', [['service' => 'İmplant', 'min' => 700, 'currency' => '€']]);
        $this->klinik('Pahalı Klinik', [['service' => 'Check-up', 'min' => 9000, 'currency' => 'TRY']]);
        $this->klinik('Fiyatsız Klinik', null);

        $this->assertSame(1500.0, $k->fresh()->min_price);
        $this->assertSame('TRY', $k->fresh()->price_currency);

        $adlar = fn (string $sorgu) => array_column(
            $this->getJson('/api/clinics?' . $sorgu)->assertOk()->json('data'), 'name');

        $this->assertSame(['Ucuz Klinik'], $adlar('price_min=1000&price_max=2000&currency=TRY'));
        $this->assertSame(['Avro Klinik'], $adlar('price_max=1000&currency=EUR'));
        $this->assertSame(['Ucuz Klinik', 'Pahalı Klinik', 'Avro Klinik', 'Fiyatsız Klinik'], $adlar('sort=price_asc'),
            'artan: 1500 TRY, 9000 TRY, 700 EUR (ayrı birim, ada göre sonra), fiyatsız en sonda');

        $k->update(['price_ranges' => []]);
        $this->assertNull($k->fresh()->min_price, 'fiyat silinince sütun boşalmalı');
    }
}
