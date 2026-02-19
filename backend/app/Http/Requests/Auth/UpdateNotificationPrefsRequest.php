<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPrefsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email_notifications'   => 'sometimes|boolean',
            'sms_notifications'     => 'sometimes|boolean',
            'push_notifications'    => 'sometimes|boolean',
            'appointment_reminders' => 'sometimes|boolean',
            'marketing_messages'    => 'sometimes|boolean',
        ];
    }
}
