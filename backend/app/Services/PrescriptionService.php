<?php

namespace App\Services;

use App\Models\HealthDataAuditLog;
use App\Models\PatientRecord;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class PrescriptionService
{
    /**
     * Generate a professional prescription PDF for an examination record.
     *
     * Includes: clinic logo, doctor info, patient info,
     * diagnosis, medications list, and barcode area.
     *
     * @return \Barryvdh\DomPDF\PDF
     */
    public function generatePdf(string $examinationId, User $doctor)
    {
        $record = PatientRecord::active()
            ->examinations()
            ->where('doctor_id', $doctor->id)
            ->with([
                'patient:id,fullname,date_of_birth,gender,mobile',
                'doctor:id,fullname,avatar,mobile,email',
                'clinic:id,name,fullname,address,avatar',
                'appointment:id,appointment_date,appointment_time',
            ])
            ->findOrFail($examinationId);

        // GDPR Audit — log PDF generation as a data export action
        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $record->patient_id,
            resourceType: 'examination',
            resourceId: $record->id,
            action: 'pdf_export',
        );

        $data = $this->preparePdfData($record);

        $pdf = Pdf::loadView('pdf.prescription', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf;
    }

    /**
     * Prepare data for the prescription PDF template.
     */
    private function preparePdfData(PatientRecord $record): array
    {
        $patient = $record->patient;
        $doctor  = $record->doctor;
        $clinic  = $record->clinic;

        // Calculate patient age
        $patientAge = null;
        if ($patient && $patient->date_of_birth) {
            $patientAge = $patient->date_of_birth->age;
        }

        $barcodeString = $this->generateBarcodeString($record);

        return [
            'record'        => $record,
            'patient'       => $patient,
            'patientAge'    => $patientAge,
            'doctor'        => $doctor,
            'clinic'        => $clinic,
            'prescriptions' => $record->prescriptions ?? [],
            'vitals'        => $record->vitals ?? [],
            'icd10_code'    => $record->icd10_code,
            'diagnosis'     => $record->diagnosis_note,
            'date'          => $record->created_at->format('d.m.Y'),
            'time'          => $record->created_at->format('H:i'),
            'barcodeData'   => $barcodeString,
            'barcodeSvg'    => $this->generateBarcodeSvg($barcodeString),
        ];
    }

    /**
     * Generate a barcode-ready string with record metadata.
     * Format: RX-{recordId}-{date}
     */
    private function generateBarcodeString(PatientRecord $record): string
    {
        $shortId = strtoupper(substr($record->id, 0, 8));
        $date = $record->created_at->format('Ymd');

        return "RX-{$shortId}-{$date}";
    }

    /**
     * Generate a Code 128-style SVG barcode from a string.
     * Pure PHP implementation — no external library needed.
     * Uses a simple binary pattern derived from character codes.
     */
    private function generateBarcodeSvg(string $data): string
    {
        $barWidth = 1.5;
        $height = 40;
        $bars = '';
        $x = 0;

        // Start pattern
        $startPattern = [2,1,1,4,1,2];

        // Generate bar patterns from each character
        $patterns = [];
        $patterns[] = $startPattern;

        $checksum = 104; // Start B value
        foreach (str_split($data) as $i => $char) {
            $code = ord($char) - 32;
            if ($code < 0 || $code > 106) $code = 0;
            $checksum += $code * ($i + 1);
            $patterns[] = $this->code128Pattern($code);
        }

        // Checksum character
        $checksumChar = $checksum % 103;
        $patterns[] = $this->code128Pattern($checksumChar);

        // Stop pattern
        $patterns[] = [2,3,3,1,1,1,2];

        // Render SVG bars
        foreach ($patterns as $pattern) {
            $isBar = true;
            foreach ($pattern as $width) {
                $w = $width * $barWidth;
                if ($isBar) {
                    $bars .= "<rect x=\"{$x}\" y=\"0\" width=\"{$w}\" height=\"{$height}\" fill=\"#000\"/>";
                }
                $x += $w;
                $isBar = !$isBar;
            }
        }

        $totalWidth = $x;

        return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{$totalWidth}\" height=\"{$height}\" viewBox=\"0 0 {$totalWidth} {$height}\">{$bars}</svg>";
    }

    /**
     * Code 128B bar/space widths for a given value (0-106).
     * Returns array of 6 alternating bar/space widths.
     */
    private function code128Pattern(int $value): array
    {
        $patterns = [
            [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
            [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
            [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
            [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
            [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
            [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
            [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
            [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
            [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
            [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
            [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
            [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
            [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
            [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
            [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
            [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
            [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
            [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
            [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
            [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
            [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
            [2,1,1,2,3,2],
        ];

        return $patterns[$value] ?? [2,1,2,2,2,2];
    }
}
