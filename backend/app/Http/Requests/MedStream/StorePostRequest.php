<?php

namespace App\Http\Requests\MedStream;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role_id, [
            'doctor', 'clinicOwner', 'superAdmin', 'saasAdmin',
        ]);
    }

    public function rules(): array
    {
        return [
            'post_type'  => 'required|in:text,image,video,document,mixed',
            'content'    => 'sometimes|string',
            'media_url'  => 'sometimes|string|url',
            'clinic_id'  => 'sometimes|uuid|exists:clinics,id',
            'photos'     => 'sometimes|array',
            'photos.*'   => 'file|mimes:jpg,jpeg,png,gif,bmp,webp,svg,heic,heif|max:10240',
            'videos'     => 'sometimes|array',
            'videos.*'   => 'file|mimetypes:video/mp4,video/quicktime,video/webm,video/avi|max:102400',
            'papers'     => 'sometimes|array',
            'papers.*'   => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,csv|max:20480',
        ];
    }
}
