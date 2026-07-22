<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicalHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'conditions'      => 'required|array',
            'conditions.*'    => 'string|max:255',
            'medications'     => 'sometimes|array',
            'medications.*'   => 'string|max:255',
            'vaccinations'    => 'sometimes|array',
            'vaccinations.*'  => 'string|max:255',
            'notes'           => 'sometimes|nullable|string|max:5000',
        ];
    }
}
