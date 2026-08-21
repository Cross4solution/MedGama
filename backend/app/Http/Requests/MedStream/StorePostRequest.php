<?php

namespace App\Http\Requests\MedStream;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role_id, [
            'doctor', 'clinicOwner', 'hospital', 'superAdmin', 'saasAdmin',
        ]);
    }

    public function rules(): array
    {
        return [
            'post_type'    => 'required|in:text,image,video,document,mixed',
            'content'      => 'sometimes|string',
            'media_url'    => 'sometimes|string|url',
            'clinic_id'    => 'sometimes|uuid|exists:clinics,id',
            'hospital_id'  => 'sometimes|uuid|exists:hospitals,id',
            'specialty_id' => 'sometimes|nullable|uuid|exists:specialties,id',
            'is_anonymous' => 'sometimes|boolean',
            'gdpr_consent' => 'sometimes|boolean',
            'photos'     => 'sometimes|array',
            // SVG BİLEREK YOK — betik taşıyabilen tek görsel biçimi.
            //
            // Gönderi görselleri "public" diskte tutuluyor ve /storage/... ile
            // doğrudan sunuluyor; ön yüz de /storage yolunu arka uca
            // yönlendirdiği için dosya UYGULAMAYLA AYNI KÖKENDEN açılıyor.
            // Oturum jetonu localStorage'da durduğundan, içine <script> gömülü
            // bir SVG'yi açan kullanıcının jetonu okunabilirdi.
            //
            // Sohbet eklerinde SVG zaten dışlanmıştı (MessageController);
            // gönderi yüklemesinde atlanmış.
            'photos.*'   => 'file|mimes:jpg,jpeg,png,gif,bmp,webp,heic,heif|max:10240',
            'videos'     => 'sometimes|array',
            'videos.*'   => 'file|mimetypes:video/mp4,video/quicktime,video/webm,video/avi|max:102400',
            'papers'     => 'sometimes|array',
            'papers.*'   => 'file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,csv|max:20480',
        ];
    }
}
