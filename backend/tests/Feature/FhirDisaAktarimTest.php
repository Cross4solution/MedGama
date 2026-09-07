<?php

namespace Tests\Feature;

use App\Models\PatientDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * HL7 FHIR R4 dışa aktarma (sözleşme madde 4.3).
 *
 * Sözleşme, geliştiricinin yazılımı HL7/FHIR protokollerine uygun
 * geliştirmesini istiyor. Bu test o uyumun ölçülebilir hâli: hasta kendi
 * verisini standart FHIR Bundle olarak alabiliyor, kaynak türleri ve
 * zorunlu alanlar yerinde, yalnız hastanın kendisi erişebiliyor.
 */
class FhirDisaAktarimTest extends TestCase
{
    use RefreshDatabase;

    private function hasta(): User
    {
        $this->postJson('/api/auth/register', [
            'fullname'              => 'Ayşe Nur Kaya',
            'email'                 => 'fhir@ornek.test',
            'password'              => 'Qz8#vRt2mKp5wLx9',
            'password_confirmation' => 'Qz8#vRt2mKp5wLx9',
            'role_id'               => 'patient',
            'date_of_birth'         => '1988-05-17',
            'gender'                => 'female',
            'health_data_consent'   => true,
        ])->assertSuccessful();
        app('auth')->forgetGuards();

        $hasta = User::where('email', 'fhir@ornek.test')->firstOrFail();
        $hasta->update(['medical_history' => json_encode([
            'conditions'   => ['Hipertansiyon', ['name' => 'Tip 2 diyabet']],
            'medications'  => ['Metformin 500 mg'],
            'vaccinations' => [['name' => 'Tetanoz', 'date' => '2024-03-01']],
            'notes'        => '',
        ])]);
        PatientDocument::forceCreate([
            'patient_id'  => $hasta->id,
            'uploaded_by' => $hasta->id,
            'title'       => 'Kan tahlili',
            'category'    => 'lab_result',
            'file_path'   => 'gizli/x.pdf',
            'file_name'   => 'tahlil.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 1234,
            'document_date' => '2026-08-01',
        ]);
        return $hasta;
    }

    public function test_hasta_fhir_demeti_aliyor(): void
    {
        $hasta = $this->hasta();

        $yanit = $this->actingAs($hasta)->getJson('/api/auth/profile/fhir');
        $yanit->assertOk();
        $this->assertStringStartsWith('application/fhir+json', $yanit->headers->get('content-type'));

        $demet = $yanit->json();
        $this->assertSame('Bundle', $demet['resourceType']);
        $this->assertSame('collection', $demet['type']);

        $turler = array_count_values(array_column(array_column($demet['entry'], 'resource'), 'resourceType'));
        $this->assertSame([
            'Patient' => 1, 'Condition' => 2, 'MedicationStatement' => 1,
            'Immunization' => 1, 'DocumentReference' => 1,
        ], $turler);
        $this->assertSame(6, $demet['total']);

        $patient = $demet['entry'][0]['resource'];
        $this->assertSame($hasta->id, $patient['id']);
        $this->assertSame('1988-05-17', $patient['birthDate']);
        $this->assertSame('female', $patient['gender']);
        $this->assertSame('Kaya', $patient['name'][0]['family']);
        $this->assertSame(['Ayşe', 'Nur'], $patient['name'][0]['given']);

        $durumlar = array_values(array_filter(array_column($demet['entry'], 'resource'), fn ($r) => $r['resourceType'] === 'Condition'));
        $this->assertSame('Hipertansiyon', $durumlar[0]['code']['text']);
        $this->assertSame('Tip 2 diyabet', $durumlar[1]['code']['text'], 'nesne biçimindeki kalemin adı alınmalı');
        $this->assertSame('Patient/'.$hasta->id, $durumlar[0]['subject']['reference']);

        $belge = array_values(array_filter(array_column($demet['entry'], 'resource'), fn ($r) => $r['resourceType'] === 'DocumentReference'))[0];
        $this->assertSame('application/pdf', $belge['content'][0]['attachment']['contentType']);
        $this->assertStringContainsString('/api/patient-documents/'.$belge['id'].'/download', $belge['content'][0]['attachment']['url']);
        $this->assertArrayNotHasKey('data', $belge['content'][0]['attachment'], 'dosya içeriği demete gömülmemeli');
    }

    public function test_bos_gecmisle_bile_gecerli_demet(): void
    {
        $hasta = $this->hasta();
        $hasta->update(['medical_history' => null]);
        PatientDocument::query()->delete();

        $demet = $this->actingAs($hasta)->getJson('/api/auth/profile/fhir')->assertOk()->json();
        $this->assertSame(1, $demet['total']);
        $this->assertSame('Patient', $demet['entry'][0]['resource']['resourceType']);
    }

    public function test_yalniz_hasta_ve_yalniz_kendi_verisi(): void
    {
        $this->hasta();
        $doktor = User::factory()->create(['role_id' => 'doctor', 'is_active' => true, 'is_verified' => true]);

        $this->getJson('/api/auth/profile/fhir')->assertUnauthorized();
        $this->actingAs($doktor)->getJson('/api/auth/profile/fhir')->assertForbidden();
    }

    public function test_saglik_verisi_rizasi_cekilince_kapali(): void
    {
        $hasta = $this->hasta();
        $this->actingAs($hasta)->deleteJson('/api/consents/health_data_processing')->assertSuccessful();
        app('auth')->forgetGuards();

        $this->actingAs($hasta->fresh())->getJson('/api/auth/profile/fhir')->assertForbidden();
    }
}
