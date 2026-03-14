<?php

namespace App\Http\Requests\Examination;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isDoctor();
    }

    public function rules(): array
    {
        return [
            'appointment_id'   => 'sometimes|nullable|uuid|exists:appointments,id',

            // ICD-10
            'icd10_code'       => 'sometimes|nullable|string|max:10|exists:icd10_codes,code',
            'diagnosis_note'   => 'sometimes|nullable|string|max:5000',

            // Vitals (JSON)
            'vitals'                => 'sometimes|nullable|array',
            'vitals.systolic'       => 'sometimes|nullable|integer|min:50|max:300',
            'vitals.diastolic'      => 'sometimes|nullable|integer|min:30|max:200',
            'vitals.pulse'          => 'sometimes|nullable|integer|min:20|max:250',
            'vitals.temperature'    => 'sometimes|nullable|numeric|min:30|max:45',
            'vitals.spo2'           => 'sometimes|nullable|integer|min:50|max:100',
            'vitals.height'         => 'sometimes|nullable|numeric|min:20|max:300',
            'vitals.weight'         => 'sometimes|nullable|numeric|min:0.5|max:500',

            // Examination note & treatment plan
            'examination_note' => 'sometimes|nullable|string|max:10000',
            'treatment_plan'   => 'sometimes|nullable|string|max:10000',

            // Prescriptions (JSON array)
            'prescriptions'              => 'sometimes|nullable|array',
            'prescriptions.*.drug_name'  => 'required_with:prescriptions|string|max:255',
            'prescriptions.*.dosage'     => 'required_with:prescriptions|string|max:255',
            'prescriptions.*.duration'   => 'sometimes|nullable|string|max:100',
            'prescriptions.*.route'      => 'sometimes|nullable|string|in:oral,iv,im,sc,topical,inhalation,rectal,sublingual,transdermal,other',
        ];
    }

    public function messages(): array
    {
        return [
            'prescriptions.*.drug_name.required_with' => 'İlaç adı (drug_name) zorunludur.',
            'prescriptions.*.dosage.required_with'    => 'Dozaj (dosage) zorunludur.',
        ];
    }
}
