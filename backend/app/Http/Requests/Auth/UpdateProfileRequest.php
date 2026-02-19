<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fullname'           => 'sometimes|string|max:255',
            'avatar'             => 'sometimes|string|url',
            'mobile'             => 'sometimes|string|max:20',
            'city_id'            => 'sometimes|integer',
            'country_id'         => 'sometimes|integer',
            'country'            => 'sometimes|string|max:5',
            'preferred_language' => 'sometimes|string|max:10',
            'date_of_birth'     => 'sometimes|date',
            'gender'             => 'sometimes|in:male,female,other',
        ];
    }
}
