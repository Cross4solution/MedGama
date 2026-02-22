<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Indicates if the resource should preserve its keys.
     */
    public bool $preserveKeys = true;

    /**
     * Additional data to merge into the resource.
     */
    private array $extra = [];

    /**
     * Fluently set extra data (token, flags, etc.).
     */
    public function withExtra(array $extra): static
    {
        $this->extra = array_merge($this->extra, $extra);
        return $this;
    }

    public function toArray(Request $request): array
    {
        $data = [
            'id'                 => $this->id,
            'fullname'           => $this->fullname,
            'email'              => $this->email,
            'avatar'             => $this->avatar ?: $this->profile_image,
            'profile_image'      => $this->profile_image ?: $this->avatar,
            'role_id'            => $this->role_id,
            'mobile'             => $this->mobile,
            'mobile_verified'    => (bool) $this->mobile_verified,
            'email_verified'     => (bool) $this->email_verified,
            'is_verified'        => (bool) $this->is_verified,
            'is_active'          => (bool) $this->is_active,
            'city_id'            => $this->city_id,
            'country_id'         => $this->country_id,
            'country'            => $this->country,
            'preferred_language' => $this->preferred_language,
            'date_of_birth'      => $this->date_of_birth?->toDateString(),
            'gender'             => $this->gender,
            'last_login'         => $this->last_login?->toISOString(),
            'clinic_id'          => $this->clinic_id,
            'created_at'         => $this->created_at?->toISOString(),
            'updated_at'         => $this->updated_at?->toISOString(),
        ];

        // Include clinic when loaded
        if ($this->relationLoaded('clinic') && $this->clinic) {
            $data['clinic'] = [
                'id'       => $this->clinic->id,
                'fullname' => $this->clinic->fullname,
            ];
        }

        // For doctors, include onboarding status
        if ($this->role_id === 'doctor') {
            $profile = $this->relationLoaded('doctorProfile')
                ? $this->doctorProfile
                : $this->doctorProfile()->first();

            $data['onboarding_completed'] = $profile ? (bool) $profile->onboarding_completed : false;
        }

        return $data;
    }

    /**
     * Customize the outgoing response — merge extra data at root level.
     */
    public function with(Request $request): array
    {
        return $this->extra;
    }
}
