<?php

namespace App\Support;

use App\Models\PatientDocument;
use App\Models\User;

/**
 * Hasta verisinin HL7 FHIR R4 biçiminde dışa aktarımı (sözleşme madde 4.3).
 *
 * Tek bir Bundle (type: collection) döner; içinde:
 *   - Patient              : hesap sahibinin kimlik bilgileri
 *   - Condition            : tıbbi geçmişteki hastalık / durumlar
 *   - MedicationStatement  : kullanılan ilaçlar
 *   - Immunization         : aşılar
 *   - DocumentReference    : arşivdeki belgeler (dosya içeriği değil,
 *                            üst veri + indirme adresi)
 *
 * Kavramlar serbest metin olarak taşınır (`code.text`); kodlama sistemi
 * (ICD-10, SNOMED, ATC) müşterinin belirleyeceği terminolojiye göre daha
 * sonra eklenebilir; FHIR bunu zorunlu tutmaz. Şifreli sütunlar model
 * cast'iyle çözülür, buraya düz metin gelir.
 */
final class Fhir
{
    public const SURUM = '4.0.1';

    public static function demet(User $hasta): array
    {
        $gecmis = app(\App\Services\AuthService::class)->getMedicalHistory($hasta);
        $hastaKimligi = 'Patient/'.$hasta->id;
        $simdi = now()->toIso8601String();

        $girdiler = [self::hasta($hasta)];

        foreach ($gecmis['conditions'] as $i => $durum) {
            $girdiler[] = self::kaynak('Condition', $hasta->id.'-c'.$i, [
                'clinicalStatus' => self::kodlama('http://terminology.hl7.org/CodeSystem/condition-clinical', 'active'),
                'code'           => ['text' => self::metin($durum)],
                'subject'        => ['reference' => $hastaKimligi],
            ]);
        }

        foreach ($gecmis['medications'] as $i => $ilac) {
            $girdiler[] = self::kaynak('MedicationStatement', $hasta->id.'-m'.$i, [
                'status'                    => 'active',
                'medicationCodeableConcept' => ['text' => self::metin($ilac)],
                'subject'                   => ['reference' => $hastaKimligi],
            ]);
        }

        foreach ($gecmis['vaccinations'] as $i => $asi) {
            $girdiler[] = self::kaynak('Immunization', $hasta->id.'-i'.$i, [
                'status'      => 'completed',
                'vaccineCode' => ['text' => self::metin($asi)],
                'patient'     => ['reference' => $hastaKimligi],
                'occurrenceString' => self::alan($asi, 'date') ?? 'unknown',
            ]);
        }

        $belgeler = PatientDocument::where('patient_id', $hasta->id)
            ->where('is_active', true)
            ->orderBy('created_at')
            ->get();

        foreach ($belgeler as $belge) {
            $girdiler[] = self::kaynak('DocumentReference', $belge->id, [
                'status'      => 'current',
                'type'        => ['text' => self::belgeTuru($belge->category)],
                'category'    => [['text' => $belge->category]],
                'subject'     => ['reference' => $hastaKimligi],
                'date'        => optional($belge->document_date ?? $belge->created_at)->toIso8601String(),
                'description' => $belge->title,
                'content'     => [[
                    'attachment' => [
                        'contentType' => $belge->mime_type,
                        'title'       => $belge->file_name,
                        'size'        => (int) $belge->file_size,
                        // İçerik bu demetin içinde taşınmaz; yetkili istemci
                        // aynı oturumla indirme ucundan alır.
                        'url'         => url('/api/patient-documents/'.$belge->id.'/download'),
                    ],
                ]],
            ]);
        }

        return [
            'resourceType' => 'Bundle',
            'id'           => 'medagama-'.$hasta->id,
            'meta'         => ['lastUpdated' => $simdi, 'profile' => ['http://hl7.org/fhir/StructureDefinition/Bundle']],
            'type'         => 'collection',
            'timestamp'    => $simdi,
            'total'        => count($girdiler),
            'entry'        => $girdiler,
        ];
    }

    private static function hasta(User $u): array
    {
        $ad = trim((string) $u->fullname);
        $parcalar = preg_split('/\s+/', $ad) ?: [];
        $soyad = count($parcalar) > 1 ? array_pop($parcalar) : '';
        $kaynak = [
            'active' => (bool) $u->is_active,
            'name'   => [[
                'use'    => 'official',
                'text'   => $ad,
                'family' => $soyad,
                'given'  => $parcalar,
            ]],
            'telecom' => array_values(array_filter([
                $u->email ? ['system' => 'email', 'value' => $u->email] : null,
                $u->phone ? ['system' => 'phone', 'value' => $u->phone] : null,
            ])),
        ];
        if ($u->gender) {
            $kaynak['gender'] = match (strtolower((string) $u->gender)) {
                'male', 'erkek', 'm'   => 'male',
                'female', 'kadın', 'f' => 'female',
                default                => 'other',
            };
        }
        if ($u->date_of_birth) {
            $kaynak['birthDate'] = $u->date_of_birth->format('Y-m-d');
        }
        if ($u->country || $u->city) {
            $kaynak['address'] = [array_filter(['city' => $u->city, 'country' => $u->country])];
        }
        return self::kaynak('Patient', $u->id, $kaynak);
    }

    private static function kaynak(string $tur, string $id, array $alanlar): array
    {
        return ['fullUrl' => 'urn:medagama:'.$tur.'/'.$id,
                'resource' => ['resourceType' => $tur, 'id' => (string) $id] + $alanlar];
    }

    private static function kodlama(string $sistem, string $kod): array
    {
        return ['coding' => [['system' => $sistem, 'code' => $kod]]];
    }

    /** Geçmiş kalemi düz metin ya da {name, ...} nesnesi olabilir. */
    private static function metin(mixed $kalem): string
    {
        if (is_array($kalem)) {
            return (string) ($kalem['name'] ?? $kalem['label'] ?? $kalem['text'] ?? json_encode($kalem, JSON_UNESCAPED_UNICODE));
        }
        return (string) $kalem;
    }

    private static function alan(mixed $kalem, string $ad): ?string
    {
        return is_array($kalem) && isset($kalem[$ad]) ? (string) $kalem[$ad] : null;
    }

    private static function belgeTuru(?string $kategori): string
    {
        return match ($kategori) {
            'lab_result'   => 'Laboratory report',
            'radiology'    => 'Diagnostic imaging report',
            'epicrisis'    => 'Discharge summary',
            'prescription' => 'Prescription',
            default        => 'Clinical document',
        };
    }
}
