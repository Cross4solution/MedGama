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
            'conditions'   => 'required|array',
            'conditions.*' => 'string|max:255',
        ];
    }
}
