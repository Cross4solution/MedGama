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
        return [
            'email'         => 'required|email',
            'password'      => 'required|string|min:6',
            'fullname'      => 'required|string|max:255',
            'mobile'        => 'nullable|string|max:20',
            'role_id'       => 'sometimes|in:patient,doctor,clinicOwner',
            'city_id'       => 'sometimes|integer',
            'country_id'    => 'sometimes|integer',
            'date_of_birth' => 'sometimes|date|after_or_equal:1930-01-01|before_or_equal:today',
            'gender'        => 'sometimes|in:male,female,other',
            'clinic_id'     => 'sometimes|uuid',
            'clinic_name'   => 'sometimes|string|max:255',
            'medical_history' => 'sometimes|nullable|string|max:5000',
        ];
    }

    public function messages(): array
    {
        return [
            'date_of_birth.after_or_equal' => 'Doğum yılı 1930\'dan küçük olamaz.',
            'date_of_birth.before_or_equal' => 'Doğum tarihi bugünden ileri olamaz.',
        ];
    }
}
