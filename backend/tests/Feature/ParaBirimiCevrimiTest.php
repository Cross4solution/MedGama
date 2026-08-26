<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Para birimi çevrimi — `POST /api/finance/convert`.
 *
 * Kapsanmayan yazma uçlarındandı. Çevrimin kendisi ŞU AN SİMÜLASYON: kurlar
 * `FinanceService::CURRENCY_RATES` içinde sabit ve yanıt bunu `note` alanında
 * açıkça söylüyor. Uç arayüzde hiçbir ekrandan çağrılmıyor, yani bugün kimseye
 * yanlış bir tutar göstermiyor. Bu ölçüt kurların doğruluğunu sınamıyor —
 * sınayamaz, çünkü sabitler.
 *
 * Sınadığı şey, uca gelen SORUNUN yanıtsız kalmaması: tanınmayan bir para
 * birimi eskiden `?? 1.0` ile EUR'yla birebir kabul ediliyordu. Yani "XYZ"
 * yazan biri 200 ve kendinden emin bir sayı alıyordu. Parada sessiz varsayılan
 * olmaz; bilinmeyen kod artık reddediliyor.
 */
class ParaBirimiCevrimiTest extends TestCase
{
    use RefreshDatabase;

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function cevir(array $govde)
    {
        // Uçta `crm.access` var: aboneliksiz hekim 403 alıyor. Ölçülen şey
        // çevrimin kendisi olduğu için aktörün kapıdan geçmesi gerekiyor.
        $hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $hekim->forceFill([
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ])->save();

        return $this->olarak($hekim)->postJson('/api/finance/convert', $govde);
    }

    public function test_bilinen_para_birimleri_ceviriliyor(): void
    {
        $yanit = $this->cevir(['amount' => 100, 'from' => 'EUR', 'to' => 'USD'])->assertOk();

        // Kur sabit (1.08); ölçülen şey aritmetiğin uygulanması.
        $this->assertSame(108.0, (float) $yanit->json('converted_amount'));
        $this->assertSame('USD', $yanit->json('target_currency'));
    }

    public function test_ayni_para_birimi_tutari_degistirmiyor(): void
    {
        $yanit = $this->cevir(['amount' => 250.75, 'from' => 'TRY', 'to' => 'TRY'])->assertOk();

        $this->assertSame(250.75, (float) $yanit->json('converted_amount'));
    }

    public function test_tanimayan_para_birimi_sessizce_kabul_edilmiyor(): void
    {
        // Asıl mesele bu: eskiden 200 ve "100" dönüyordu.
        foreach ([['XYZ', 'EUR'], ['EUR', 'XYZ'], ['ABC', 'DEF']] as [$kaynak, $hedef]) {
            $this->cevir(['amount' => 100, 'from' => $kaynak, 'to' => $hedef])
                ->assertStatus(422);
        }
    }

    public function test_negatif_tutar_kabul_edilmiyor(): void
    {
        $this->cevir(['amount' => -50, 'from' => 'EUR', 'to' => 'USD'])->assertStatus(422);
    }

    public function test_yanit_simulasyon_oldugunu_soyluyor(): void
    {
        // Kurlar gerçek bir kaynaktan gelmiyor. Yanıtın bunu söylemesi, sayıyı
        // kullanacak olan tarafın yanlış bir güven kurmasını engelliyor.
        $this->assertStringContainsStringIgnoringCase(
            'simulated',
            (string) $this->cevir(['amount' => 10, 'from' => 'EUR', 'to' => 'TRY'])->json('note'),
            'çevrim simülasyon olduğunu artık söylemiyor: ya gerçek kur bağlandı ya da uyarı düştü',
        );
    }

    public function test_oturumsuz_erisim_yok(): void
    {
        $this->postJson('/api/finance/convert', ['amount' => 10, 'from' => 'EUR', 'to' => 'USD'])
            ->assertStatus(401);
    }
}
