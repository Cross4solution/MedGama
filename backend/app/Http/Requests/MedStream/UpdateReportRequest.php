<?php

namespace App\Http\Requests\MedStream;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'admin_status' => 'required|in:pending,reviewed,hidden,deleted',
        ];
    }
}
