<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\ConsentRecord;
use App\Models\ContactMessage;
use App\Models\Conversation;
use App\Models\DoctorReview;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\PatientDocument;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hesap silmenin KAPSAMI — ne gidiyor, ne bilerek kalıyor.
 *
 * `KvkkHaklariTest` silmenin çalıştığını tutuyor: giriş yapılamıyor, oturumlar
 * kapanıyor, kimlik anonimleşiyor. Bu dosya ayrı bir soruyu soruyor: silme
 * talebinden sonra geriye NE kalıyor?
 *
 * Ölçüldüğünde yanıt "neredeyse her şey"di. Kullanıcı satırı anonimleşiyor ve
 * MedStream içeriği pasifleşiyordu; bunun dışında sohbet mesajlarının gövdesi,
 * iletişim kutusuna yazdıkları ve değerlendirme metinleri olduğu gibi
 * duruyordu. Hiçbirinin saklanması için bir yükümlülük yok.
 *
 * ── Silinen ──────────────────────────────────────────────────────────────
 * Kullanıcının kendi yazdığı serbest metinler. Satır kalıyor, içerik gidiyor:
 * karşı tarafın sohbet akışı kopmuyor, ama silinen kişinin sözleri ortada
 * kalmıyor.
 *
 * ── Bilerek KALAN ────────────────────────────────────────────────────────
 * Randevular ve içlerindeki sağlık anlık görüntüsü, hasta belgeleri, faturalar
 * ve rıza kayıtları. Silme hakkı bunlarda sınırlı: GDPR md. 17(3)(b) yasal
 * yükümlülüğü, (e) hukuki taleplerin kullanılmasını ayrı tutuyor; KVKK md. 7
 * de saklama yükümlülüğü olan veriyi kapsam dışında bırakıyor. Tıbbi kayıt
 * saklama süresi, vergi mevzuatı ve rızanın kanıtlanabilirliği burada
 * belirleyici.
 *
 * SÜRELER BU DOSYADA BELİRLENMİYOR — mevzuata ve yargı yetkisine göre değişir
 * ve hukukçu onayı gerektirir. Ölçüt yalnız neyin kaldığını sabitliyor ki
 * sessizce değişmesin.
 */
class SilmeKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $hekim;
    private Appointment $randevu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create(['medical_history' => '["astım"]']);
        $this->hekim = User::factory()->create(['role_id' => 'doctor']);

        $this->randevu = Appointment::factory()->create([
            'patient_id'               => $this->hasta->id,
            'doctor_id'                => $this->hekim->id,
            'patient_medical_snapshot' => 'Astım ve polen alerjisi',
        ]);

        $sohbet = Conversation::create(['title' => 'Görüşme', 'type' => 'direct', 'is_active' => true]);
        Message::create([
            'conversation_id' => $sohbet->id,
            'sender_id'       => $this->hasta->id,
            'body'            => 'Şikayetim üç gündür sürüyor',
            'type'            => 'text',
        ]);

        ContactMessage::create([
            'sender_id'     => $this->hasta->id,
            'receiver_id'   => $this->hekim->id,
            'receiver_type' => 'doctor',
            'subject'       => 'Tahlil sorusu',
            'body'          => 'Sonucumu değerlendirir misiniz?',
        ]);

        DoctorReview::create([
            'doctor_id'  => $this->hekim->id,
            'patient_id' => $this->hasta->id,
            'rating'     => 5,
            'comment'    => 'Çok ilgiliydi, teşekkürler',
            'is_visible' => true,
        ]);

        PatientDocument::create([
            'patient_id'  => $this->hasta->id,
            'uploaded_by' => $this->hasta->id,
            'title'       => 'MR sonucu',
            'category'    => 'report',
            'file_path'   => 'patient-documents/x.bin',
            'file_name'   => 'mr.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 100,
            'is_active'   => true,
        ]);

        Invoice::create([
            'invoice_number' => 'FTR-1',
            'patient_id'     => $this->hasta->id,
            'doctor_id'      => $this->hekim->id,
            'subtotal'       => 1000,
            'grand_total'    => 1000,
            'currency'       => 'TRY',
            'status'         => 'paid',
            'issue_date'     => now()->toDateString(),
        ]);

        ConsentRecord::create([
            'user_id'    => $this->hasta->id,
            'type'       => 'marketing',
            'version'    => '2026-01',
            'granted_at' => now(),
            'source'     => 'web',
            'locale'     => 'tr',
        ]);

        app(AuthService::class)->deleteAccount($this->hasta->fresh());
    }

    // ── Silinenler ──────────────────────────────────────────────────────

    public function test_sohbet_mesaji_govdesi_siliniyor(): void
    {
        // Gövde şifreli saklanıyor; ham sütunda arama yapmak yanıltır, o
        // yüzden çözülmüş değere bakılıyor. (İlk ölçümde tam bu tuzağa
        // düşüldü ve mesaj "silinmiş" göründü.)
        $mesaj = Message::where('sender_id', $this->hasta->id)->first();

        $this->assertNotNull($mesaj, 'satır kaldırılmamalı — karşı tarafın akışı kopar');
        $this->assertSame('', (string) $mesaj->body, 'silinen kullanıcının sözleri sohbette duruyor');
        $this->assertFalse((bool) $mesaj->is_active);
    }

    public function test_iletisim_mesaji_govdesi_siliniyor(): void
    {
        $ileti = ContactMessage::where('sender_id', $this->hasta->id)->first();

        $this->assertNotNull($ileti);
        $this->assertSame('', (string) $ileti->body);
        $this->assertStringNotContainsString('Tahlil sorusu', (string) $ileti->subject);
    }

    public function test_degerlendirme_metni_siliniyor_ve_gizleniyor(): void
    {
        $yorum = DoctorReview::where('patient_id', $this->hasta->id)->first();

        $this->assertNotNull($yorum);
        $this->assertSame('', (string) $yorum->comment);
        $this->assertFalse((bool) $yorum->is_visible, 'silinen kullanıcının yorumu yayında');
    }

    public function test_kendi_beyani_saglik_gecmisi_siliniyor(): void
    {
        $this->assertNull(User::find($this->hasta->id)?->medical_history);
    }

    // ── Bilerek kalanlar ────────────────────────────────────────────────

    public function test_randevu_ve_saglik_anlik_goruntusu_kaliyor(): void
    {
        // Tıbbi kayıt. Silinmesi GDPR md. 17(3)(b) ve saklama yükümlülüğüyle
        // çelişir; bu ölçüt kazara silinmeye karşı.
        $randevu = Appointment::find($this->randevu->id);

        $this->assertNotNull($randevu, 'randevu kaydı silinmiş — tıbbi kayıt saklanmalı');
        $this->assertSame('Astım ve polen alerjisi', $randevu->patient_medical_snapshot);
    }

    public function test_hasta_belgeleri_kaliyor(): void
    {
        $this->assertTrue(
            PatientDocument::where('patient_id', $this->hasta->id)->exists(),
            'hasta belgesi silinmiş — tıbbi kayıt saklanmalı',
        );
    }

    public function test_faturalar_kaliyor(): void
    {
        $this->assertTrue(
            Invoice::where('patient_id', $this->hasta->id)->exists(),
            'fatura silinmiş — vergi ve ticaret mevzuatı saklamayı zorunlu kılıyor',
        );
    }

    public function test_riza_kayitlari_kaliyor(): void
    {
        // Rızanın kanıtı silinirse, rızanın alındığı da kanıtlanamaz.
        $this->assertTrue(
            ConsentRecord::where('user_id', $this->hasta->id)->exists(),
            'rıza kaydı silinmiş — hesap verebilirlik kanıtı kayboldu',
        );
    }

    public function test_baska_kullanicinin_mesaji_etkilenmiyor(): void
    {
        $baskasi = User::factory()->patient()->create();
        $sohbet = Conversation::create(['title' => 'x', 'type' => 'direct', 'is_active' => true]);
        $mesaj = Message::create([
            'conversation_id' => $sohbet->id,
            'sender_id'       => $baskasi->id,
            'body'            => 'Dokunulmamalı',
            'type'            => 'text',
        ]);

        app(AuthService::class)->deleteAccount(User::factory()->patient()->create());

        $this->assertSame('Dokunulmamalı', $mesaj->fresh()->body);
    }
}
