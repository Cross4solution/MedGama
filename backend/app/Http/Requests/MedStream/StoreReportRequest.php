<?php

namespace App\Http\Requests\MedStream;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Açıklama için istenen en az karakter — moderasyonun işine yarayacak kadar. */
    public const MIN_DESCRIPTION = 15;

    public function rules(): array
    {
        return [
            // Kategori (spam / yanıltıcı / uygunsuz / diğer)
            'reason' => 'required|string|max:50',
            // Açıklama ZORUNLU: tek tıkla boş rapor gönderilip moderasyon kuyruğunun
            // anlamsız kayıtlarla dolması engellenir. Sunucuda da doğrulanır ki
            // arayüz doğrulaması atlatılamasın.
            // Üst sınır, kategoriyle birleşince reason kolonuna (varchar 255) sığacak şekilde.
            'description' => 'required|string|min:' . self::MIN_DESCRIPTION . '|max:200',
        ];
    }

    public function messages(): array
    {
        return [
            'description.required' => __('Please describe the issue.'),
            'description.min'      => __('Please describe the issue in at least :min characters.', ['min' => self::MIN_DESCRIPTION]),
        ];
    }
}
