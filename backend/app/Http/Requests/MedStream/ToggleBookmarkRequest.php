<?php

namespace App\Http\Requests\MedStream;

use Illuminate\Foundation\Http\FormRequest;

class ToggleBookmarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bookmarked_type' => 'required|in:post,doctor,clinic,patient',
            'target_id'       => 'required|uuid',
        ];
    }
}
