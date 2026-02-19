<?php

namespace App\Http\Requests\MedStream;

use App\Models\MedStreamPost;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route Model Binding resolves the post automatically
        $post = $this->route('post');
        return $post && ($post->author_id === $this->user()->id || $this->user()->isAdmin());
    }

    public function rules(): array
    {
        return [
            'content'   => 'sometimes|string',
            'media_url' => 'sometimes|string|url',
            'is_hidden' => 'sometimes|boolean',
        ];
    }
}
