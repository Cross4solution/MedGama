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
            'date_of_birth' => 'sometimes|date',
            'gender'        => 'sometimes|in:male,female,other',
            'clinic_id'     => 'sometimes|uuid',
        ];
    }
}
