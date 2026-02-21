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
            'bookmarked_type' => 'sometimes|in:post,doctor,clinic,patient',
            'target_id'       => 'sometimes|uuid',
            'post_id'         => 'sometimes|uuid',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Allow frontend shorthand: { post_id } → { bookmarked_type: 'post', target_id }
        if ($this->has('post_id') && !$this->has('target_id')) {
            $this->merge([
                'bookmarked_type' => 'post',
                'target_id'       => $this->input('post_id'),
            ]);
        }
    }
}
