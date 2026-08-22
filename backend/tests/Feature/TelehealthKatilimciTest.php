<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Görüntülü görüşme uçları — yalnız randevunun doktoru ve hastası.
 *
 * Beş ucun beşi de `authorizeParticipant()` çağırıyor; ara katman değil,
 * elle. Sızması hâlinde iki ayrı zarar var:
 *
 *   • `session` / `webrtc` — muayeneye üçüncü bir kişinin katılmasına yol
 *     açan sinyalleşme bilgisi, ayrıca TURN sunucusunun kimlik bilgileri
 *     (başkasının hattı üzerinden trafik aktarımı).
 *   • `transcription-token` — muayene konuşmasının çözümlemesi, yani
 *     doğrudan sağlık verisi.
 *
 * Her uç ayrı sınanıyor: biri çağrıyı düşürürse öbürleri onu gizlemesin.
 */
class TelehealthKatilimciTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $doktor;
    private User $yabanci;
    private Appointment $randevu;

    /** Katılımcı denetimi taşıyan bütün uçlar. */
    private const UCLAR = [
        ['get', 'session'],
        ['get', 'webrtc'],
        ['get', 'transcription-token'],
        ['get', 'simulate-transcript'],
        ['put', 'status'],
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create();
        $this->doktor = User::factory()->doctor()->create();
        $this->yabanci = User::factory()->doctor()->create();

        $this->randevu = Appointment::factory()->confirmed()->create([
            'patient_id'       => $this->hasta->id,
            'doctor_id'        => $this->doktor->id,
            'appointment_type' => 'online',
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function ucaGit(User $user, string $yontem, string $uc)
    {
        $yol = "/api/telehealth/{$this->randevu->id}/{$uc}";

        return $yontem === 'put'
            // Alan adı `meeting_status`; doğrulama katılımcı denetiminden ÖNCE
            // çalıştığı için geçersiz gövde 403 yerine 422 döndürür ve test
            // yetkiyi hiç ölçemez.
            ? $this->olarak($user)->putJson($yol, ['meeting_status' => 'in_progress'])
            : $this->olarak($user)->getJson($yol);
    }

    public function test_yabanci_hicbir_telehealth_ucuna_giremiyor(): void
    {
        foreach (self::UCLAR as [$yontem, $uc]) {
            $this->ucaGit($this->yabanci, $yontem, $uc)
                ->assertStatus(403, "yabancı {$uc} ucuna girdi");
        }
    }

    public function test_hasta_kendi_gorusmesine_girebiliyor(): void
    {
        // Pozitif kontrol: uçlar zaten herkese kapalı olsaydı yukarıdaki test
        // hiçbir şey kanıtlamazdı.
        $this->ucaGit($this->hasta, 'get', 'session')->assertOk();
    }

    public function test_doktor_kendi_gorusmesine_girebiliyor(): void
    {
        $this->ucaGit($this->doktor, 'get', 'session')->assertOk();
    }

    public function test_yabanciya_turn_kimlik_bilgisi_verilmiyor(): void
    {
        // TURN kimlik bilgisi sızarsa yabancı, bizim hattımız üzerinden
        // trafik aktarır — hem maliyet hem kötüye kullanım.
        $yanit = $this->ucaGit($this->yabanci, 'get', 'webrtc');

        $yanit->assertStatus(403);
        $this->assertStringNotContainsString('credential', $yanit->getContent());
        $this->assertStringNotContainsString('turn:', $yanit->getContent());
    }

    public function test_katilimciya_ice_sunuculari_veriliyor(): void
    {
        // Ters uç: yapılandırma boş dönerse görüşme güvenlik değil işlev
        // olarak kırılır ve fark edilmez.
        $yanit = $this->ucaGit($this->doktor, 'get', 'webrtc')->assertOk();

        $this->assertNotEmpty(
            $yanit->json('ice_servers') ?? $yanit->json('iceServers') ?? [],
            'katılımcıya ICE sunucu listesi dönmedi',
        );
    }

    public function test_yabanci_gorusme_durumunu_degistiremiyor(): void
    {
        // Durum yazma, görüşmeyi uzaktan bitirebilmek demek.
        // Yazılan kolon `meeting_status`; `status` kolonuna bakmak bu ucun
        // hiç dokunmadığı bir alanı doğrulamak olurdu ve test her hâlükârda
        // geçerdi.
        // Referans DİSKTEN okunuyor: sütunun veritabanı varsayılanı 'pending'
        // ve yeni oluşturulan model örneği bunu bilmediği için bellekte null
        // görünüyor. Bellekteki değeri temel almak, hiçbir şey değişmemişken
        // "değişti" dedirtiyordu.
        $oncekiDurum = $this->randevu->fresh()->meeting_status;

        $this->ucaGit($this->yabanci, 'put', 'status')->assertStatus(403);

        $this->assertSame(
            $oncekiDurum,
            $this->randevu->fresh()->meeting_status,
            'yabancı görüşme durumunu değiştirdi',
        );
    }

    public function test_yabanci_konusma_cozumlemesine_erisemiyor(): void
    {
        $yanit = $this->ucaGit($this->yabanci, 'get', 'transcription-token');

        $yanit->assertStatus(403);
        $this->assertStringNotContainsString('token', mb_strtolower($yanit->getContent()));
    }

    public function test_olmayan_randevu_icin_bilgi_sizmiyor(): void
    {
        // Var olmayan kimlikte 404, var olan ama yabancıya ait olanda 403
        // dönmesi randevunun VARLIĞINI sızdırır. Burada ölçülen şey, yanıtın
        // gövdesinde randevuya dair veri olmaması.
        $yanit = $this->olarak($this->yabanci)
            ->getJson('/api/telehealth/00000000-0000-0000-0000-000000000000/session');

        $this->assertContains($yanit->getStatusCode(), [403, 404]);
        $this->assertStringNotContainsString($this->doktor->id, $yanit->getContent());
    }
}
