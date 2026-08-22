<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\DoctorReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Doktor değerlendirmeleri — platformun güven mekanizması.
 *
 * Puan, hastanın hangi hekimi seçeceğini belirliyor. İki yönlü kötüye
 * kullanıma açık: rakibi kötülemek ve kendini yükseltmek. Bu yüzden yorum
 * yazmak TAMAMLANMIŞ bir randevuya bağlı ve yorum, moderasyondan geçmeden
 * herkese açık listede görünmemeli.
 *
 * Kural üç katmanda yazılı — DoctorReviewPolicy, denetleyicideki randevu
 * denetimleri ve DoctorService::submitReview — ve üçü aynı şeyi yeniden
 * söylüyor. Testler uca saldırıyor, hangi katmanın tuttuğuna değil sonuca
 * bakıyor.
 */
class DoktorDegerlendirmeTest extends TestCase
{
    use RefreshDatabase;

    private User $doktor;
    private User $hasta;
    private Appointment $tamamlanan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->doktor = $this->hekim();
        $this->hasta = User::factory()->patient()->create();

        $this->tamamlanan = Appointment::factory()->create([
            'patient_id'       => $this->hasta->id,
            'doctor_id'        => $this->doktor->id,
            'status'           => 'completed',
            'appointment_type' => 'inPerson',
        ]);
    }

    private function hekim(): User
    {
        $u = User::factory()->doctor()->create(['is_verified' => true]);
        DoctorProfile::create([
            'user_id'   => $u->id,
            'specialty' => 'Kardiyoloji',
            'slug'      => 'dr-' . substr($u->id, 0, 8),
        ]);

        return $u;
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function yorumYaz(User $user, ?string $doktorId = null, array $ek = [])
    {
        return $this->olarak($user)->postJson(
            '/api/doctors/' . ($doktorId ?? $this->doktor->id) . '/reviews',
            array_merge([
                'rating'         => 5,
                'comment'        => 'Cok ilgili bir hekim, tesekkur ederim.',
                'appointment_id' => $this->tamamlanan->id,
            ], $ek),
        );
    }

    // ── Kim yorum yazabilir ──

    public function test_tamamlanmis_randevusu_olan_hasta_yorum_yazabiliyor(): void
    {
        // Pozitif kontrol: uç tümden kapalı olsaydı ret testleri hiçbir şey
        // kanıtlamazdı.
        $this->yorumYaz($this->hasta)->assertStatus(201);

        $this->assertDatabaseHas('doctor_reviews', [
            'doctor_id'  => $this->doktor->id,
            'patient_id' => $this->hasta->id,
        ]);
    }

    public function test_randevusu_olmayan_hasta_yorum_yazamiyor(): void
    {
        // En temel kötüye kullanım: hiç muayene olmadan puan yazmak.
        $yabanciHasta = User::factory()->patient()->create();

        $this->yorumYaz($yabanciHasta)->assertStatus(403);
        $this->assertDatabaseMissing('doctor_reviews', ['patient_id' => $yabanciHasta->id]);
    }

    public function test_tamamlanmamis_randevu_yorum_hakki_vermiyor(): void
    {
        // 'confirmed' yetseydi randevu alıp gitmeden puan yazmak mümkün olurdu.
        $hasta = User::factory()->patient()->create();
        $randevu = Appointment::factory()->confirmed()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $this->doktor->id,
        ]);

        $this->yorumYaz($hasta, null, ['appointment_id' => $randevu->id])->assertStatus(403);
        $this->assertDatabaseMissing('doctor_reviews', ['patient_id' => $hasta->id]);
    }

    public function test_doktor_baska_doktora_yorum_yazamiyor(): void
    {
        // Rakip karalama yolu.
        $rakip = $this->hekim();

        $this->yorumYaz($rakip)->assertStatus(403);
    }

    public function test_baskasinin_randevusuyla_yorum_yazilamiyor(): void
    {
        // Randevu kimliği tahmin edilebilir olmasa da, sahiplik denetimi
        // kimliğin gizliliğine bırakılmamalı.
        $yabanciHasta = User::factory()->patient()->create();

        $this->yorumYaz($yabanciHasta, null, ['appointment_id' => $this->tamamlanan->id])
            ->assertStatus(403);
    }

    public function test_baska_doktorun_randevusuyla_yorum_yazilamiyor(): void
    {
        $baskaDoktor = $this->hekim();

        // Kendi randevusu var ama BAŞKA hekime yorum yazmaya çalışıyor.
        $this->yorumYaz($this->hasta, $baskaDoktor->id)->assertStatus(403);
    }

    // ── Tekrar ve sıklık ──

    public function test_ayni_doktora_ikinci_yorum_yazilamiyor(): void
    {
        // Olmasaydı tek hasta puanı istediği yöne çekebilirdi.
        $this->yorumYaz($this->hasta)->assertStatus(201);

        $this->yorumYaz($this->hasta)->assertStatus(409);
        $this->assertSame(1, DoctorReview::where('patient_id', $this->hasta->id)->count());
    }

    public function test_yirmi_dort_saat_icinde_ikinci_yorum_engelleniyor(): void
    {
        // Farklı hekimlere art arda yorum — toplu karalama kampanyasının şekli.
        $this->yorumYaz($this->hasta)->assertStatus(201);

        $baskaDoktor = $this->hekim();
        $ikinciRandevu = Appointment::factory()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $baskaDoktor->id,
            'status'     => 'completed',
        ]);

        // İKİNCİ randevunun kimliği gönderilmeli: ilkininki gönderilirse uç
        // 429'a hiç gelmeden 403 veriyor ve test akış korumasını değil
        // randevu-doktor eşleşmesini ölçmüş oluyor.
        $this->yorumYaz($this->hasta, $baskaDoktor->id, ['appointment_id' => $ikinciRandevu->id])
            ->assertStatus(429);
    }

    public function test_bir_gun_sonra_baska_doktora_yorum_yazilabiliyor(): void
    {
        // Ters uç: sınır kalıcı olsaydı hasta ikinci hekimini hiç
        // değerlendiremezdi.
        $this->yorumYaz($this->hasta)->assertStatus(201);

        $this->travel(25)->hours();

        $baskaDoktor = $this->hekim();
        $ikinciRandevu = Appointment::factory()->create([
            'patient_id' => $this->hasta->id,
            'doctor_id'  => $baskaDoktor->id,
            'status'     => 'completed',
        ]);

        $this->yorumYaz($this->hasta, $baskaDoktor->id, ['appointment_id' => $ikinciRandevu->id])
            ->assertStatus(201);
    }

    // ── Girdi doğrulama ──

    public function test_puan_araligi_disinda_kabul_edilmiyor(): void
    {
        foreach ([0, 6, -1, 100] as $puan) {
            $this->yorumYaz($this->hasta, null, ['rating' => $puan])
                ->assertStatus(422, "puan {$puan} kabul edildi");
        }

        $this->assertSame(0, DoctorReview::count());
    }

    public function test_randevu_kimligi_zorunlu(): void
    {
        // Zorunlu olmasaydı "onaylı yorum" iddiası anlamını yitirirdi.
        $yanit = $this->olarak($this->hasta)->postJson(
            "/api/doctors/{$this->doktor->id}/reviews",
            ['rating' => 5, 'comment' => 'Randevusuz yorum denemesi.'],
        );

        $this->assertSame(422, $yanit->getStatusCode(), 'randevu kimliği olmadan yorum kabul edildi');
    }

    // ── Moderasyon: asıl güvence ──

    public function test_yeni_yorum_beklemede_baslıyor(): void
    {
        $this->yorumYaz($this->hasta)->assertStatus(201);

        $this->assertSame(
            'pending',
            DoctorReview::where('patient_id', $this->hasta->id)->value('moderation_status'),
            'yeni yorum doğrudan onaylı kaydedildi',
        );
    }

    public function test_onaylanmamis_yorum_herkese_acik_listede_gorunmuyor(): void
    {
        // Moderasyon buysa iş görmeli: onaysız yorum hasta seçimini
        // etkilememeli.
        $this->yorumYaz($this->hasta, null, ['comment' => 'ONAYSIZ YORUM METNI'])->assertStatus(201);

        $yanit = $this->getJson("/api/doctors/{$this->doktor->id}/reviews")->assertOk();

        $this->assertStringNotContainsString(
            'ONAYSIZ YORUM METNI',
            $yanit->getContent(),
            'onaylanmamış yorum herkese açık listede göründü',
        );
    }

    public function test_onaylanan_yorum_listede_gorunuyor(): void
    {
        // Ters uç: hiçbir yorum görünmüyorsa yukarıdaki test de boşuna geçer.
        $this->yorumYaz($this->hasta, null, ['comment' => 'ONAYLI YORUM METNI'])->assertStatus(201);

        DoctorReview::where('patient_id', $this->hasta->id)
            ->update(['moderation_status' => 'approved', 'is_visible' => true]);

        $this->assertStringContainsString(
            'ONAYLI YORUM METNI',
            $this->getJson("/api/doctors/{$this->doktor->id}/reviews")->assertOk()->getContent(),
            'onaylanmış yorum listede görünmedi',
        );
    }

    // ── Hekim yanıtı ──

    public function test_hekim_kendi_yorumuna_yanit_verebiliyor(): void
    {
        $this->yorumYaz($this->hasta)->assertStatus(201);
        $yorum = DoctorReview::where('doctor_id', $this->doktor->id)->firstOrFail();

        $this->olarak($this->doktor)
            ->putJson("/api/doctors/reviews/{$yorum->id}/respond", ['response' => 'Tesekkur ederim.'])
            ->assertOk();
    }

    public function test_yabanci_hekim_baskasinin_yorumuna_yanit_veremiyor(): void
    {
        // Yanıt, hasta bildirimi olarak da gidiyor: yabancı bir hekim
        // başkasının adına hastaya mesaj göndermiş olurdu.
        $this->yorumYaz($this->hasta)->assertStatus(201);
        $yorum = DoctorReview::where('doctor_id', $this->doktor->id)->firstOrFail();

        $yabanciHekim = $this->hekim();

        $yanit = $this->olarak($yabanciHekim)
            ->putJson("/api/doctors/reviews/{$yorum->id}/respond", ['response' => 'YABANCI YANIT']);

        $this->assertContains($yanit->getStatusCode(), [403, 404], 'yabancı hekim yanıt verdi');
        $this->assertNull($yorum->fresh()->doctor_response, 'yorumu yabancı hekim yanıtladı');
    }

    public function test_hasta_baskasinin_yorumuna_yanit_veremiyor(): void
    {
        $this->yorumYaz($this->hasta)->assertStatus(201);
        $yorum = DoctorReview::where('doctor_id', $this->doktor->id)->firstOrFail();

        $yanit = $this->olarak(User::factory()->patient()->create())
            ->putJson("/api/doctors/reviews/{$yorum->id}/respond", ['response' => 'HASTA YANITI']);

        $this->assertContains($yanit->getStatusCode(), [403, 404]);
        $this->assertNull($yorum->fresh()->doctor_response);
    }
}
