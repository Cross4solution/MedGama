<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message_type' => 'sometimes|in:text,image,document',
            'content'      => 'required_without:attachment|nullable|string|max:5000',
            'attachment'   => 'required_without:content|nullable|file|max:20480',
        ];
    }
}
