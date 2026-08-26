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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Dışa aktarma KAPSAMI — "benim verim" gerçekten hepsi mi?
 *
 * `KvkkHaklariTest` ucun ÇALIŞTIĞINI tutuyor: kendi verisini veriyor,
 * başkasınınkini vermiyor, oturumsuz çalışmıyor. Bu dosya ayrı bir soruyu
 * soruyor — İÇİNDE NE VAR?
 *
 * Ölçüldüğünde yanıt şuydu: profil, gönderiler, yorumlar, beğeniler, yer
 * imleri ve tıbbi geçmiş. Dosya kendine "gdpr_export" diyordu ama kullanıcının
 * platformdaki asıl izini taşımıyordu:
 *
 *   • kiminle ne zaman randevusu olduğu
 *   • ne ödediği
 *   • ne yazdığı (mesajlar, iletişim kutusu, değerlendirmeler)
 *   • hangi belgelerinin durduğu
 *   • neye, hangi metin sürümüne rıza verdiği
 *
 * GDPR md. 15 ve 20 ile KVKK md. 11 bunların hepsini kapsıyor. Eksik bir
 * dışa aktarma sessizdir: kullanıcı bu ucu bir kez kullanır ve neyin
 * eksik olduğunu bilemez.
 *
 * MESAJLARDA SINIR: yalnız kullanıcının KENDİ yazdıkları. Sohbetin tamamını
 * vermek, bir kişinin veri talebini başka birinin verisini teslim etmeye
 * çevirirdi.
 */
class DisaAktarimKapsamiTest extends TestCase
{
    use RefreshDatabase;

    private function disaAktar(User $kullanici): array
    {
        $govde = $this->actingAs($kullanici, 'sanctum')
            ->getJson('/api/auth/profile/data-export')
            ->assertOk()
            ->json();

        return $govde['data'] ?? $govde;
    }

    public function test_randevular_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();
        $hekim = User::factory()->create(['role_id' => 'doctor']);

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $hekim->id,
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertNotEmpty($veri['appointments'] ?? [], 'randevular dışa aktarımda yok');
        $this->assertSame(
            $randevu->id,
            data_get($veri, 'appointments.0.id'),
            'randevu kaydı eksik',
        );
    }

    public function test_hekim_kendi_randevularini_da_aliyor(): void
    {
        // Aynı uç iki rolü de karşılıyor; hekim için randevu da kişisel veri.
        $hekim = User::factory()->create(['role_id' => 'doctor']);
        Appointment::factory()->create([
            'doctor_id'  => $hekim->id,
            'patient_id' => User::factory()->patient()->create()->id,
        ]);

        $veri = $this->disaAktar($hekim);

        $this->assertNotEmpty($veri['appointments'] ?? [], 'hekimin randevuları yok');
    }

    public function test_faturalar_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();
        $fatura = Invoice::create([
            'invoice_number' => 'FTR-2026-0001',
            'patient_id'     => $hasta->id,
            'doctor_id'      => User::factory()->create(['role_id' => 'doctor'])->id,
            'subtotal'       => 1000,
            'grand_total'    => 1000,
            'currency'       => 'TRY',
            'status'         => 'paid',
            'issue_date'     => now()->toDateString(),
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertSame(
            $fatura->invoice_number,
            data_get($veri, 'invoices.0.invoice_number'),
            'faturalar dışa aktarımda yok',
        );
    }

    public function test_kendi_mesajlari_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();
        $sohbet = Conversation::create(['title' => 'Deneme', 'type' => 'direct', 'is_active' => true]);

        Message::create([
            'conversation_id' => $sohbet->id,
            'sender_id'       => $hasta->id,
            'body'            => 'Kendi yazdığım mesaj',
            'type'            => 'text',
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertSame(
            'Kendi yazdığım mesaj',
            data_get($veri, 'messages_sent.0.body'),
            'kullanıcının kendi mesajları dışa aktarımda yok',
        );
    }

    public function test_baskasinin_mesaji_disa_aktarimda_yok(): void
    {
        // Aynı sohbetteki KARŞI tarafın mesajı sızmamalı: bir kişinin veri
        // talebi, başka birinin verisini teslim etmek olamaz.
        $hasta = User::factory()->patient()->create();
        $baskasi = User::factory()->create(['role_id' => 'doctor']);
        $sohbet = Conversation::create(['title' => 'Deneme', 'type' => 'direct', 'is_active' => true]);

        Message::create([
            'conversation_id' => $sohbet->id,
            'sender_id'       => $hasta->id,
            'body'            => 'Benim mesajım',
            'type'            => 'text',
        ]);
        Message::create([
            'conversation_id' => $sohbet->id,
            'sender_id'       => $baskasi->id,
            'body'            => 'BASKASININ GIZLI MESAJI',
            'type'            => 'text',
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertStringNotContainsString(
            'BASKASININ GIZLI MESAJI',
            json_encode($veri),
            'karşı tarafın mesajı dışa aktarıma sızmış',
        );
        $this->assertCount(1, $veri['messages_sent'] ?? []);
    }

    public function test_iletisim_mesajlari_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();
        $hekim = User::factory()->create(['role_id' => 'doctor']);

        ContactMessage::create([
            'sender_id'     => $hasta->id,
            'receiver_id'   => $hekim->id,
            'receiver_type' => 'doctor',
            'subject'       => 'Tahlil sorusu',
            'body'          => 'Sonucu değerlendirebilir misiniz?',
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertSame(
            'Tahlil sorusu',
            data_get($veri, 'contact_messages_sent.0.subject'),
            'iletişim kutusundan yazdıkları dışa aktarımda yok',
        );
    }

    public function test_yazdigi_degerlendirmeler_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();
        $hekim = User::factory()->create(['role_id' => 'doctor']);

        DoctorReview::create([
            'doctor_id'  => $hekim->id,
            'patient_id' => $hasta->id,
            'rating'     => 5,
            'comment'    => 'Çok ilgiliydi',
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertSame(
            'Çok ilgiliydi',
            data_get($veri, 'reviews_written.0.comment'),
            'yazdığı değerlendirmeler dışa aktarımda yok',
        );
    }

    public function test_belge_kayitlari_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();

        PatientDocument::create([
            'patient_id'  => $hasta->id,
            'uploaded_by' => $hasta->id,
            'title'       => 'MR sonucu',
            'category'    => 'lab_result',
            'file_path'   => 'patient-documents/x.bin',
            'file_name'   => 'mr.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 100,
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertSame(
            'MR sonucu',
            data_get($veri, 'documents.0.title'),
            'belge kayıtları dışa aktarımda yok',
        );
    }

    public function test_belgelerin_disk_yolu_disa_aktarimda_yok(): void
    {
        // Liste hangi belgenin durduğunu söylüyor; dosyanın kendisi şifreli
        // diskte ve imzalı bağlantıyla iniyor. Ham yolu vermek, o adresi
        // dışa aktarma dosyasını eline geçiren herkese vermek olurdu.
        $hasta = User::factory()->patient()->create();

        PatientDocument::create([
            'patient_id'  => $hasta->id,
            'uploaded_by' => $hasta->id,
            'title'       => 'Rapor',
            'category'    => 'lab_result',
            'file_path'   => 'patient-documents/GIZLI-YOL.bin',
            'file_name'   => 'rapor.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 100,
        ]);

        $this->assertStringNotContainsString(
            'GIZLI-YOL',
            json_encode($this->disaAktar($hasta)),
            'belgenin disk yolu dışa aktarıma sızmış',
        );
    }

    public function test_riza_kayitlari_disa_aktarimda(): void
    {
        $hasta = User::factory()->patient()->create();

        ConsentRecord::create([
            'user_id'    => $hasta->id,
            'type'       => 'marketing',
            'version'    => '2026-01',
            'granted_at' => now(),
            'source'     => 'web',
            'locale'     => 'tr',
        ]);

        $veri = $this->disaAktar($hasta);

        $this->assertSame(
            'marketing',
            data_get($veri, 'consents.0.type'),
            'rıza kayıtları dışa aktarımda yok — neye rıza verdiği görünmüyor',
        );
        $this->assertSame('2026-01', data_get($veri, 'consents.0.version'));
    }

    public function test_bos_hesapta_bolumler_yine_de_var(): void
    {
        // Boş dizi ile "bu bölüm hiç yok" farklı şeyler. Kullanıcı hangi veri
        // türlerinin tutulduğunu görebilmeli.
        $veri = $this->disaAktar(User::factory()->patient()->create());

        foreach (['appointments', 'invoices', 'messages_sent', 'contact_messages_sent',
                  'reviews_written', 'documents', 'consents'] as $bolum) {
            $this->assertArrayHasKey($bolum, $veri, "'{$bolum}' bölümü dışa aktarımda yok");
        }
    }
}
