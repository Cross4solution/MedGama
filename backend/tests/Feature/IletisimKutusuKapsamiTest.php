<?php

namespace Tests\Feature;

use App\Models\Clinic;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * İletişim kutusu yalnız kendi mesajlarını göstermeli.
 *
 * `inbox()` şöyle dallanıyordu:
 *
 *     clinicOwner / clinic → kendi kliniklerine gelenler
 *     doctor              → kendisine gelenler
 *     else                → "superAdmin — see all"   (SÜZGEÇ YOK)
 *
 * Ama `/contact-messages` rota grubunda ROL SÜZGECİ YOK, yalnız
 * `auth:sanctum`. Yani son dal süper yöneticiye ayrılmış gibi yazılmış olsa da
 * oraya düşen HERKES sistemdeki bütün mesajları görüyordu: hasta, hastane
 * hesabı, satışçı.
 *
 * Dönen kayıt gönderenin adını, E-POSTASINI ve eklerini taşıyor. Bu mesajlar
 * hastaların hekimlere yazdığı sağlık soruları.
 *
 * `unreadCount()` aynı dallanmayı taşıyordu: süzgeçsiz sorgunun sayısını
 * döndürüyordu — mesajların içeriği değil ama SİSTEM GENELİNDEKİ okunmamış
 * sayısı sızıyordu.
 *
 * Tekil okuma (`show`) doğruydu: `erisebilirMesaj()` gönderen/alıcı/yönetici
 * kontrolü yapıyor. Kusur yalnız liste ve sayaçtaydı.
 */
class IletisimKutusuKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $hekim;
    private ContactMessage $mesaj;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $gonderen = User::factory()->patient()->create(['fullname' => 'Gizli Gonderen']);

        $this->mesaj = ContactMessage::create([
            'sender_id'     => $gonderen->id,
            'receiver_id'   => $this->hekim->id,
            'receiver_type' => 'doctor',
            'subject'       => 'Gizli konu',
            'body'          => 'Tahlil sonuçlarım hakkında bir sorum var.',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** Kutuya bakması beklenmeyen roller. */
    private function yabancilar(): array
    {
        $hastaneSahibi = User::factory()->create(['role_id' => 'hospital']);
        $klinikSahibi = User::factory()->clinicOwner()->create();
        $klinik = Clinic::factory()->create(['owner_id' => $klinikSahibi->id]);
        $klinikSahibi->forceFill(['clinic_id' => $klinik->id])->save();

        return [
            'hasta'          => User::factory()->patient()->create(),
            'hastane'        => $hastaneSahibi,
            'satisci'        => User::factory()->create(['role_id' => 'salesperson']),
            'baska_hekim'    => User::factory()->doctor()->create(['is_verified' => true]),
            'ilgisiz_klinik' => $klinikSahibi,
        ];
    }

    public function test_alici_kendi_mesajini_goruyor(): void
    {
        $veri = $this->olarak($this->hekim)
            ->getJson('/api/contact-messages/inbox')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $veri, 'hekim kendisine gelen mesajı görmüyor');
    }

    public function test_yabancilar_kutuda_hicbir_mesaj_gormuyor(): void
    {
        foreach ($this->yabancilar() as $ad => $yabanci) {
            $yanit = $this->olarak($yabanci)->getJson('/api/contact-messages/inbox');

            $this->assertContains($yanit->status(), [200, 403], "$ad beklenmeyen durum");

            if ($yanit->status() !== 200) {
                continue;
            }

            $this->assertSame([], $yanit->json('data') ?? [], "$ad başkasının mesajlarını görüyor");
            $this->assertStringNotContainsString(
                'Gizli konu',
                $yanit->getContent(),
                "$ad mesaj içeriğini okuyabiliyor",
            );
        }
    }

    public function test_okunmamis_sayaci_baskasinin_mesajlarini_saymiyor(): void
    {
        foreach ($this->yabancilar() as $ad => $yabanci) {
            $yanit = $this->olarak($yabanci)->getJson('/api/contact-messages/unread-count');

            if ($yanit->status() !== 200) {
                continue;
            }

            $this->assertSame(0, (int) $yanit->json('count'), "$ad sistem genelindeki sayıyı görüyor");
        }
    }

    public function test_tekil_okuma_zaten_korunuyor(): void
    {
        // Bu dal doğruydu; gerileme olmadığını kaydediyoruz.
        foreach ($this->yabancilar() as $ad => $yabanci) {
            $this->olarak($yabanci)
                ->getJson("/api/contact-messages/{$this->mesaj->id}")
                ->assertStatus(403);
        }
    }
}
