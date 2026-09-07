<?php

namespace Tests\Feature;

use App\Captions\TranscriptionEngine;
use App\Captions\WhisperEngine;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Canlı alt yazı — kendi sunucumuzdaki motor.
 *
 * Üç şey sınanıyor, üçü de sessizce bozulabilecek türden:
 *
 *  1. JETON. Laravel'in ürettiği jetonu Python servisi (deploy/stt/app.py)
 *     doğruluyor; biçim iki tarafta ELLE aynı tutuluyor. Birinde bir karakter
 *     kayarsa alt yazı "açıldı" görünür ama her parça 401 alır — ekranda
 *     hiçbir şey akmaz, hata da görünmez. Burada Python'daki doğrulama
 *     birebir PHP'de yeniden yazılıp jeton ona karşı sınanıyor.
 *
 *  2. KARŞI TARAFIN DİLİ. Alt yazı konuşanın değil DİNLEYENİN diline
 *     çevrilir; bunun için konuşanın tarayıcısı karşı tarafın dilini bilmeli.
 *     Bu alan eksik gelirse çeviri hiç istenmez ve iki taraf da "çalışıyor"
 *     sanır — sadece çeviri yoktur.
 *
 *  3. MOTOR YOKSA. Oturum ucu 409 dönmeli, jeton üretmemeli.
 */
class CanliAltYaziTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;
    private Appointment $randevu;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hasta = User::factory()->patient()->create(['preferred_language' => 'ar']);
        $this->doktor = User::factory()->doctor()->create(['preferred_language' => 'tr']);
        $this->randevu = Appointment::factory()->confirmed()->create([
            'patient_id'       => $this->hasta->id,
            'doctor_id'        => $this->doktor->id,
            'appointment_type' => 'online',
        ]);
        Cache::flush();
    }

    private function olarak(User $user): self
    {
        // Sanctum bekçisi çözdüğü kullanıcıyı test boyunca tutuyor; aynı
        // testte ikinci kullanıcıyla istek atınca hâlâ ilki görünüyordu.
        $this->app['auth']->forgetGuards();
        $jeton = $user->createToken('test')->plainTextToken;
        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    /** Python servisindeki `jeton_dogrula` — aynı kurallar, PHP'de. */
    private static function pythonGibiDogrula(string $secret, string $jeton): ?string
    {
        $parcalar = explode('.', $jeton, 3);
        if (count($parcalar) !== 3) return null;
        [$randevu, $exp, $imza] = $parcalar;
        if (!ctype_digit($exp) || (int) $exp < time()) return null;
        $beklenen = hash_hmac('sha256', "{$randevu}.{$exp}", $secret);
        return hash_equals($beklenen, $imza) ? $randevu : null;
    }

    public function test_jeton_python_servisinin_dogrulamasindan_gecer(): void
    {
        $jeton = WhisperEngine::jetonUret('gizli-anahtar', $this->randevu->id, time() + 600);

        $this->assertSame($this->randevu->id, self::pythonGibiDogrula('gizli-anahtar', $jeton));
        // Yanlış anahtar, süresi dolmuş, başka randevu — üçü de düşmeli.
        $this->assertNull(self::pythonGibiDogrula('baska-anahtar', $jeton));
        $this->assertNull(self::pythonGibiDogrula('gizli-anahtar',
            WhisperEngine::jetonUret('gizli-anahtar', $this->randevu->id, time() - 1)));
        $baska = str_replace($this->randevu->id, 'baska-randevu', $jeton);
        $this->assertNull(self::pythonGibiDogrula('gizli-anahtar', $baska));
    }

    public function test_oturum_ucu_katilimciya_adres_ve_jeton_verir(): void
    {
        $this->motoruBagla(hazir: true);

        $yanit = $this->olarak($this->doktor)
            ->getJson("/api/telehealth/{$this->randevu->id}/caption-session");

        $yanit->assertOk()
            ->assertJsonStructure(['url', 'token', 'expires_in', 'language'])
            ->assertJsonPath('url', 'https://stt.example/transcribe')
            ->assertJsonPath('language', 'tr'); // doktorun profil dili

        $this->assertSame(
            $this->randevu->id,
            self::pythonGibiDogrula('gizli-anahtar', $yanit->json('token')),
            'Uçtan dönen jeton servisin doğrulamasından geçmiyor.',
        );
    }

    public function test_oturum_ucu_yabanciya_kapali(): void
    {
        $this->motoruBagla(hazir: true);
        $yabanci = User::factory()->doctor()->create();

        $this->olarak($yabanci)
            ->getJson("/api/telehealth/{$this->randevu->id}/caption-session")
            ->assertForbidden();
    }

    public function test_motor_yokken_oturum_409_ve_jeton_yok(): void
    {
        $this->motoruBagla(hazir: false);

        $this->olarak($this->hasta)
            ->getJson("/api/telehealth/{$this->randevu->id}/caption-session")
            ->assertStatus(409)
            ->assertJsonMissing(['token']);
    }

    public function test_webrtc_ayari_karsi_tarafin_dilini_verir(): void
    {
        $this->motoruBagla(hazir: true);

        // Doktor (tr) sorar → karşı taraf hasta (ar). Hasta sorar → doktor (tr).
        $this->olarak($this->doktor)
            ->getJson("/api/telehealth/{$this->randevu->id}/webrtc")
            ->assertOk()
            ->assertJsonPath('captions.language', 'tr')
            ->assertJsonPath('captions.peer_language', 'ar')
            ->assertJsonPath('captions.available', true);

        $this->olarak($this->hasta)
            ->getJson("/api/telehealth/{$this->randevu->id}/webrtc")
            ->assertOk()
            ->assertJsonPath('captions.language', 'ar')
            ->assertJsonPath('captions.peer_language', 'tr');
    }

    public function test_desteklenmeyen_profil_dili_ingilizceye_duser(): void
    {
        $this->motoruBagla(hazir: true);
        $this->hasta->forceFill(['preferred_language' => 'ja'])->save();

        $this->olarak($this->doktor)
            ->getJson("/api/telehealth/{$this->randevu->id}/webrtc")
            ->assertJsonPath('captions.peer_language', 'en');
    }

    public function test_whisper_motoru_saglik_ucuna_gore_hazir_ya_da_degil(): void
    {
        // `Http::fake` çağrıları üst üste biner (ilk eşleşen kazanır); bu
        // yüzden her durum ayrı adreste.
        Http::fake([
            'https://acik.example/health'   => Http::response(['ok' => true], 200),
            'https://kapali.example/health' => Http::response('', 503),
        ]);

        $this->assertTrue((new WhisperEngine('https://acik.example', 'x'))->kullanilabilir());
        $this->assertFalse((new WhisperEngine('https://kapali.example', 'x'))->kullanilabilir());

        // Adres yoksa sunucuya hiç gitmemeli.
        Http::fake();
        $this->assertFalse((new WhisperEngine('', ''))->kullanilabilir());
        Http::assertNothingSent();
    }

    /** Gerçek servis yerine sahte motor; `hazir` → kullanılabilir mi. */
    private function motoruBagla(bool $hazir): void
    {
        $motor = new class($hazir) implements TranscriptionEngine {
            public function __construct(private bool $hazir) {}
            public function kullanilabilir(): bool { return $this->hazir; }
            public function oturumAc(string $appointmentId, string $konusmaDili): array
            {
                return [
                    'url'        => 'https://stt.example/transcribe',
                    'token'      => WhisperEngine::jetonUret('gizli-anahtar', $appointmentId, time() + 600),
                    'expires_in' => 600,
                ];
            }
            public function dosyaCevir(string $dosyaYolu, ?string $dil = null): ?array { return null; }
            public function dosyaCevirisiVarMi(): bool { return false; }
            public function diller(): array { return ['tr', 'en', 'ar']; }
            public function ad(): string { return 'sahte'; }
        };
        $this->app->instance(TranscriptionEngine::class, $motor);
    }
}
