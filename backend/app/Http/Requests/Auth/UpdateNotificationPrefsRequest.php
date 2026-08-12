<?php

namespace App\Http\Requests\Auth;

use App\Support\NotificationPreferences;
use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPrefsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Kurallar tercih listesinden türetilir.
     *
     * Sabit bir liste yazmak, tercih eklendiğinde burayı güncellemeyi unutturuyordu:
     * alan doğrulamadan geçmediği için `validated()` onu eliyor ve ayar sessizce
     * kaydedilmemiş oluyordu. Tek kaynak NotificationPreferences::AYARLAR.
     *
     * Eskiden kabul edilen "appointment_reminders" gibi anahtarlar artık YOK:
     * randevu bildirimleri hizmetin parçası ve kapatılamıyor.
     */
    public function rules(): array
    {
        $kurallar = [];

        foreach (array_keys(NotificationPreferences::AYARLAR) as $anahtar) {
            $kurallar[$anahtar] = 'sometimes|boolean';
        }

        return $kurallar;
    }
}
