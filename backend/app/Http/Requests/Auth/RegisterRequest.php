<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $role = $this->input('role_id', 'patient');
        $isPatient = $role === 'patient';

        // Patient registrations require birth_date so we can enforce age/parental-consent rules (GDPR Art. 8 / KVKK).
        $dobRule = $isPatient
            ? 'required|date|after_or_equal:1930-01-01|before:today'
            : 'sometimes|date|after_or_equal:1930-01-01|before_or_equal:today';

        // If user is under 18, guardian_email is mandatory.
        $dob = $this->input('date_of_birth');
        $isMinor = false;
        if ($isPatient && $dob) {
            try {
                $isMinor = \Carbon\Carbon::parse($dob)->age < 18;
            } catch (\Throwable $e) {
                $isMinor = false;
            }
        }

        return [
            'email'         => 'required|email',
            'password'      => 'required|string|min:6',
            'fullname'      => 'required|string|max:255',
            'mobile'        => 'nullable|string|max:20',
            'role_id'       => 'sometimes|in:patient,doctor,clinicOwner',
            'city_id'       => 'sometimes|integer',
            'country_id'    => 'sometimes|integer',
            'date_of_birth' => $dobRule,
            'gender'        => 'sometimes|in:male,female,other',
            'clinic_id'     => 'sometimes|uuid',
            'clinic_name'   => 'sometimes|string|max:255',
            'medical_history' => 'sometimes|nullable|string|max:5000',
            'guardian_email' => ($isMinor ? 'required' : 'nullable') . '|email|max:255|different:email',
            // KVKK Md. 6 / GDPR Art. 9 — hasta için sağlık verisi açık rızası zorunlu (accepted).
            'health_data_consent' => $isPatient ? 'required|accepted' : 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'date_of_birth.required' => 'Doğum tarihi zorunludur.',
            'date_of_birth.before' => 'Doğum tarihi bugünden ileri olamaz.',
            'date_of_birth.after_or_equal' => 'Doğum yılı 1930\'dan küçük olamaz.',
            'date_of_birth.before_or_equal' => 'Doğum tarihi bugünden ileri olamaz.',
            'guardian_email.required' => '18 yaş altı kayıt için veli e-posta adresi zorunludur.',
            'guardian_email.email' => 'Geçerli bir veli e-posta adresi giriniz.',
            'guardian_email.different' => 'Veli e-postası kullanıcının e-postasından farklı olmalıdır.',
            'health_data_consent.required' => 'Sağlık verilerinizin işlenmesine açık rıza vermeniz zorunludur.',
            'health_data_consent.accepted' => 'Sağlık verilerinizin işlenmesine açık rıza vermeniz zorunludur.',
        ];
    }
}
