<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Reçete / Prescription — {{ $barcodeData }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #222; line-height: 1.5; }

        .page { padding: 30px 40px; }

        /* ── Header ── */
        .header { border-bottom: 2px solid #1a56db; padding-bottom: 12px; margin-bottom: 16px; }
        .header-top { display: table; width: 100%; }
        .header-left { display: table-cell; vertical-align: top; width: 60%; }
        .header-right { display: table-cell; vertical-align: top; width: 40%; text-align: right; }
        .clinic-name { font-size: 16px; font-weight: bold; color: #1a56db; }
        .clinic-address { font-size: 9px; color: #666; margin-top: 4px; }
        .rx-title { font-size: 22px; font-weight: bold; color: #1a56db; letter-spacing: 2px; }
        .rx-date { font-size: 10px; color: #666; margin-top: 4px; }

        /* ── Patient & Doctor Info ── */
        .info-section { display: table; width: 100%; margin-bottom: 14px; }
        .info-box { display: table-cell; vertical-align: top; width: 50%; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .info-box:first-child { border-right: none; }
        .info-title { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #1a56db; font-weight: bold; margin-bottom: 4px; }
        .info-row { font-size: 10px; margin-bottom: 2px; }
        .info-label { color: #666; }
        .info-value { font-weight: bold; }

        /* ── Diagnosis ── */
        .section { margin-bottom: 14px; }
        .section-title { font-size: 11px; font-weight: bold; color: #1a56db; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 6px; }

        /* ── Vitals ── */
        .vitals-grid { display: table; width: 100%; }
        .vital-item { display: table-cell; text-align: center; padding: 6px 4px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .vital-value { font-size: 14px; font-weight: bold; color: #1a56db; }
        .vital-label { font-size: 8px; color: #666; text-transform: uppercase; }

        /* ── Medications Table ── */
        .med-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        .med-table th { background: #1a56db; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; text-align: left; }
        .med-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        .med-table tr:nth-child(even) td { background: #f8fafc; }
        .med-num { width: 30px; text-align: center; font-weight: bold; color: #1a56db; }

        /* ── Footer ── */
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: table; width: 100%; }
        .footer-left { display: table-cell; width: 50%; vertical-align: bottom; }
        .footer-right { display: table-cell; width: 50%; text-align: right; vertical-align: bottom; }
        .barcode-area { display: inline-block; }
        .barcode-text { font-family: monospace; font-size: 10px; letter-spacing: 1.5px; text-align: center; margin-top: 4px; color: #333; }
        .signature-area { margin-top: 40px; }
        .signature-line { border-top: 1px solid #333; width: 200px; display: inline-block; margin-bottom: 4px; }
        .signature-name { font-size: 10px; font-weight: bold; }
        .signature-title { font-size: 9px; color: #666; }

        .note-text { font-size: 10px; color: #444; padding: 6px 0; white-space: pre-wrap; }
        .disclaimer { font-size: 8px; color: #999; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
<div class="page">

    {{-- ── HEADER ── --}}
    <div class="header">
        <div class="header-top">
            <div class="header-left">
                <div class="clinic-name">{{ $clinic->fullname ?? $clinic->name ?? 'MedGama Clinic' }}</div>
                @if($clinic && $clinic->address)
                    <div class="clinic-address">{{ $clinic->address }}</div>
                @endif
            </div>
            <div class="header-right">
                <div class="rx-title">℞ REÇETE</div>
                <div class="rx-date">{{ $date }} — {{ $time }}</div>
            </div>
        </div>
    </div>

    {{-- ── PATIENT & DOCTOR INFO ── --}}
    <div class="info-section">
        <div class="info-box">
            <div class="info-title">Hasta Bilgileri / Patient Info</div>
            <div class="info-row"><span class="info-label">Ad Soyad:</span> <span class="info-value">{{ $patient->fullname ?? '—' }}</span></div>
            @if($patientAge)
                <div class="info-row"><span class="info-label">Yaş / Age:</span> <span class="info-value">{{ $patientAge }}</span></div>
            @endif
            @if($patient && $patient->gender)
                <div class="info-row"><span class="info-label">Cinsiyet:</span> <span class="info-value">{{ $patient->gender === 'male' ? 'Erkek' : ($patient->gender === 'female' ? 'Kadın' : $patient->gender) }}</span></div>
            @endif
            @if($patient && $patient->mobile)
                <div class="info-row"><span class="info-label">Tel:</span> <span class="info-value">{{ $patient->mobile }}</span></div>
            @endif
        </div>
        <div class="info-box">
            <div class="info-title">Hekim Bilgileri / Doctor Info</div>
            <div class="info-row"><span class="info-label">Dr.</span> <span class="info-value">{{ $doctor->fullname ?? '—' }}</span></div>
            @if($doctor && $doctor->email)
                <div class="info-row"><span class="info-label">E-posta:</span> <span class="info-value">{{ $doctor->email }}</span></div>
            @endif
            @if($doctor && $doctor->mobile)
                <div class="info-row"><span class="info-label">Tel:</span> <span class="info-value">{{ $doctor->mobile }}</span></div>
            @endif
        </div>
    </div>

    {{-- ── VITALS ── --}}
    @if(!empty($vitals))
    <div class="section">
        <div class="section-title">Vital Bulgular / Vital Signs</div>
        <div class="vitals-grid">
            @if(isset($vitals['systolic']) && isset($vitals['diastolic']))
                <div class="vital-item">
                    <div class="vital-value">{{ $vitals['systolic'] }}/{{ $vitals['diastolic'] }}</div>
                    <div class="vital-label">Tansiyon (mmHg)</div>
                </div>
            @endif
            @if(isset($vitals['pulse']))
                <div class="vital-item">
                    <div class="vital-value">{{ $vitals['pulse'] }}</div>
                    <div class="vital-label">Nabız (bpm)</div>
                </div>
            @endif
            @if(isset($vitals['temperature']))
                <div class="vital-item">
                    <div class="vital-value">{{ $vitals['temperature'] }}°C</div>
                    <div class="vital-label">Ateş</div>
                </div>
            @endif
            @if(isset($vitals['spo2']))
                <div class="vital-item">
                    <div class="vital-value">{{ $vitals['spo2'] }}%</div>
                    <div class="vital-label">SpO2</div>
                </div>
            @endif
            @if(isset($vitals['height']))
                <div class="vital-item">
                    <div class="vital-value">{{ $vitals['height'] }} cm</div>
                    <div class="vital-label">Boy</div>
                </div>
            @endif
            @if(isset($vitals['weight']))
                <div class="vital-item">
                    <div class="vital-value">{{ $vitals['weight'] }} kg</div>
                    <div class="vital-label">Kilo</div>
                </div>
            @endif
        </div>
    </div>
    @endif

    {{-- ── DIAGNOSIS ── --}}
    <div class="section">
        <div class="section-title">Tanı / Diagnosis</div>
        @if($icd10_code)
            <div class="info-row"><span class="info-label">ICD-10:</span> <span class="info-value">{{ $icd10_code }}</span></div>
        @endif
        @if($diagnosis)
            <div class="note-text">{{ $diagnosis }}</div>
        @else
            <div class="note-text" style="color:#999;">—</div>
        @endif
    </div>

    {{-- ── MEDICATIONS ── --}}
    @if(!empty($prescriptions))
    <div class="section">
        <div class="section-title">İlaçlar / Medications</div>
        <table class="med-table">
            <thead>
                <tr>
                    <th class="med-num">#</th>
                    <th>İlaç Adı / Drug Name</th>
                    <th>Dozaj / Dosage</th>
                    <th>Süre / Duration</th>
                    <th>Uygulama / Route</th>
                </tr>
            </thead>
            <tbody>
                @foreach($prescriptions as $index => $rx)
                    <tr>
                        <td class="med-num">{{ $index + 1 }}</td>
                        <td style="font-weight:bold;">{{ $rx['drug_name'] ?? '—' }}</td>
                        <td>{{ $rx['dosage'] ?? '—' }}</td>
                        <td>{{ $rx['duration'] ?? '—' }}</td>
                        <td>{{ $rx['route'] ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- ── TREATMENT PLAN ── --}}
    @if($record->treatment_plan)
    <div class="section">
        <div class="section-title">Tedavi Planı / Treatment Plan</div>
        <div class="note-text">{{ $record->treatment_plan }}</div>
    </div>
    @endif

    {{-- ── EXAMINATION NOTE ── --}}
    @if($record->examination_note)
    <div class="section">
        <div class="section-title">Muayene Notu / Examination Note</div>
        <div class="note-text">{{ $record->examination_note }}</div>
    </div>
    @endif

    {{-- ── FOOTER: Barcode + Signature ── --}}
    <div class="footer">
        <div class="footer-left">
            <div style="font-size:9px;color:#666;margin-bottom:4px;">Reçete No / Rx ID</div>
            <div class="barcode-area">
                {!! $barcodeSvg ?? '' !!}
                <div class="barcode-text">{{ $barcodeData }}</div>
            </div>
        </div>
        <div class="footer-right">
            <div class="signature-area">
                <div class="signature-line">&nbsp;</div><br>
                <div class="signature-name">Dr. {{ $doctor->fullname ?? '' }}</div>
                <div class="signature-title">İmza / Signature</div>
            </div>
        </div>
    </div>

    <div class="disclaimer">
        Bu belge MedGama CRM sistemi tarafından otomatik oluşturulmuştur. Geçerliliği hekim imzası ile kesinleşir.<br>
        This document was automatically generated by MedGama CRM. Validity is confirmed by the physician's signature.
    </div>

</div>
</body>
</html>
