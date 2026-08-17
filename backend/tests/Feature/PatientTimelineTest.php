<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Invoice;
use App\Models\PatientDocument;
use App\Models\User;
use App\Services\PatientService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hasta zaman çizelgesi.
 *
 * Çizelge yalnızca randevu, muayene ve klinik kayıtlarını gösteriyordu.
 * Hastanın kendi yüklediği tahlil sonucu ayrı bir ekranda kalıyordu —
 * doktor oraya bakmayı unutursa hiç görmemiş oluyordu. Faturalar ve
 * yazışma teması da yoktu, dolayısıyla "bu hastayla en son ne oldu"
 * sorusunun cevabı tek yerde değildi.
 */
class PatientTimelineTest extends TestCase
{
    use RefreshDatabase;

    private User $doctor;
    private User $patient;
    private Clinic $clinic;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic = Clinic::factory()->create();
        $this->doctor = User::factory()->doctor()->create(['clinic_id' => $this->clinic->id]);
        $this->patient = User::factory()->patient()->create();

        // Çizelge yalnızca tedavi ilişkisi olan hastada açılıyor; ilişkiyi
        // kuran şey randevu. Bu randevu olmadan hiçbir uç yanıt vermez.
        Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'clinic_id'  => $this->clinic->id,
            'status'     => 'completed',
        ]);
    }

    private function cizelge(): array
    {
        return $this->app->make(PatientService::class)
            ->getPatientTimeline($this->patient->id, $this->doctor, []);
    }

    public function test_hastanin_yukledigi_belge_cizelgede_gorunur(): void
    {
        PatientDocument::create([
            'patient_id'  => $this->patient->id,
            'uploaded_by' => $this->patient->id,   // hastanın kendisi yükledi
            'title'       => 'Kan tahlili',
            'category'    => 'lab_result',
            'file_path'   => 'documents/deneme.pdf',
            'file_name'   => 'deneme.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 1024,
            'is_active'   => true,
        ]);

        $satirlar = collect($this->cizelge())->where('type', 'patient_document');

        $this->assertCount(1, $satirlar);
        $this->assertSame('Kan tahlili', $satirlar->first()['title']);
        // Kimin yüklediği önemli: hastanın gönderdiği belge ayırt edilebilmeli.
        $this->assertSame('Hasta', $satirlar->first()['doctor']);
    }

    public function test_fatura_cizelgede_tutariyla_gorunur(): void
    {
        Invoice::create([
            'invoice_number' => 'FT-1',
            'patient_id'     => $this->patient->id,
            'doctor_id'      => $this->doctor->id,
            'clinic_id'      => $this->clinic->id,
            'subtotal'       => 100,
            'grand_total'    => 100,
            'paid_amount'    => 40,
            'currency'       => 'EUR',
            'status'         => 'partial',
            'issue_date'     => now()->toDateString(),
        ]);

        $satir = collect($this->cizelge())->firstWhere('type', 'invoice');

        $this->assertNotNull($satir);
        $this->assertSame(100.0, $satir['amount']);
        $this->assertSame(40.0, $satir['paid_amount']);
        $this->assertSame('EUR', $satir['currency']);
    }

    public function test_baska_doktorun_faturasi_cizelgeye_girmez(): void
    {
        $baskaDoktor = User::factory()->doctor()->create();

        Invoice::create([
            'invoice_number' => 'FT-2',
            'patient_id'     => $this->patient->id,
            'doctor_id'      => $baskaDoktor->id,
            'subtotal'       => 50,
            'grand_total'    => 50,
            'paid_amount'    => 0,
            'currency'       => 'EUR',
            'status'         => 'pending',
            'issue_date'     => now()->toDateString(),
        ]);

        $this->assertCount(0, collect($this->cizelge())->where('type', 'invoice'));
    }

    public function test_gorusme_durumu_randevu_satirinda_tasinir(): void
    {
        $randevu = Appointment::factory()->create([
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'online',
            'meeting_status'   => 'completed',
        ]);

        // setUp'taki ilişki randevusu da çizelgede; kendi kaydımızı kimliğiyle buluyoruz.
        $satir = collect($this->cizelge())->firstWhere('id', $randevu->id);

        $this->assertSame('completed', $satir['meeting_status']);
    }

    public function test_yuz_yuze_randevuda_gorusme_durumu_gosterilmez(): void
    {
        $randevu = Appointment::factory()->create([
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'clinic_id'        => $this->clinic->id,
            'appointment_type' => 'inPerson',
            'meeting_status'   => 'pending',
        ]);

        $satir = collect($this->cizelge())->firstWhere('id', $randevu->id);

        $this->assertNull($satir['meeting_status']);
    }

    /**
     * Gelmedi geçmişi hasta kartında toplanmalı: klinik kapora isteyip
     * istemeyeceğine buna bakarak karar veriyor.
     */
    public function test_gelmedi_gecmisi_hasta_ozetinde_toplanir(): void
    {
        foreach (['no_show', 'no_show', 'completed', 'cancelled'] as $durum) {
            Appointment::factory()->create([
                'patient_id' => $this->patient->id,
                'doctor_id'  => $this->doctor->id,
                'clinic_id'  => $this->clinic->id,
                'status'     => $durum,
            ]);
        }

        $ozet = $this->app->make(PatientService::class)
            ->getPatient360($this->patient->id, $this->doctor)['stats'];

        $this->assertSame(2, $ozet['no_show_count']);
        $this->assertSame(1, $ozet['cancelled_count']);
        // setUp'taki ilişki randevusu da 'completed'; 2 gelmedi / (2 tamam + 2 gelmedi)
        $this->assertSame(50, $ozet['no_show_rate']);
    }

    /**
     * Dondurulmuş anamnez randevu anının kaydıdır; hastanın sonradan
     * eklediği ilaç ayrı bir alanda gelmeli, yoksa doktor yeni ilaçtan
     * habersiz kalır.
     */
    public function test_guncel_tibbi_gecmis_dondurulmus_olandan_ayri_gelir(): void
    {
        $randevu = Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'clinic_id'  => $this->clinic->id,
            'patient_medical_snapshot' => 'Kullanılan İlaçlar: Aspirin',
        ]);

        // Alan şifreli JSON metni olarak saklanıyor.
        $this->patient->update([
            'medical_history' => json_encode(['medications' => ['Aspirin', 'Varfarin']]),
        ]);

        $guncel = $randevu->fresh()->guncelTibbiGecmis();

        $this->assertStringContainsString('Varfarin', $guncel);
        // Dondurulmuş kayıt değişmemeli.
        $this->assertSame('Kullanılan İlaçlar: Aspirin', $randevu->fresh()->patient_medical_snapshot);
    }
}
