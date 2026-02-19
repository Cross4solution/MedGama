<?php

namespace App\Http\Requests\MedStream;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content'   => 'required|string|max:2000',
            'parent_id' => 'sometimes|nullable|uuid|exists:med_stream_comments,id',
        ];
    }
}
