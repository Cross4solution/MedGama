<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    use Concerns\ResolvesMediaUrls;

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
        // Use raw DB values (bypass model accessor which prepends APP_URL)
        // Frontend resolveStorageUrl() handles origin resolution per environment
        $rawAvatar = $this->resource->getRawOriginal('avatar')
                  ?: $this->resource->getRawOriginal('profile_image');
        $avatar = self::resolveMediaUrl($rawAvatar);

        $data = [
            'id'                 => $this->id,
            'fullname'           => $this->fullname,
            'email'              => $this->email,
            'avatar'             => $avatar,
            'profile_image'      => $avatar,
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
            'clinic_name'        => $this->clinic_name,
            'added_by_clinic'    => (bool) $this->added_by_clinic,
            'created_at'         => $this->created_at?->toISOString(),
            'updated_at'         => $this->updated_at?->toISOString(),
        ];

        // Include clinic when loaded or available
        $clinic = $this->relationLoaded('clinic') ? $this->clinic : null;
        if (!$clinic && $this->clinic_id) {
            $clinic = $this->clinic;
        }
        if ($clinic) {
            $data['clinic'] = [
                'id'          => $clinic->id,
                'name'        => $clinic->name,
                'fullname'    => $clinic->fullname,
                'codename'    => $clinic->codename,
                'is_verified' => (bool) $clinic->is_verified,
            ];
        }

        // User level & CRM subscription (platform vs CRM distinction)
        $data['user_level'] = (int) ($this->user_level ?? 1);
        $data['has_crm_subscription'] = $this->resource->hasCrmSubscription();

        // For doctors, include onboarding status + verification details
        if ($this->role_id === 'doctor') {
            $profile = $this->relationLoaded('doctorProfile')
                ? $this->doctorProfile
                : $this->doctorProfile()->first();

            $data['onboarding_completed'] = $profile ? (bool) $profile->onboarding_completed : false;
            $data['verification_status'] = $this->verification_status ?? 'unverified';
            $data['admin_verification_note'] = $this->admin_verification_note;
        }

        // For clinic owners, include onboarding + verification status
        if ($this->role_id === 'clinicOwner') {
            $clinic = $this->relationLoaded('clinic') ? $this->clinic : null;
            if (!$clinic && $this->clinic_id) $clinic = $this->clinic;
            $ownedClinic = $this->relationLoaded('ownedClinic') ? $this->ownedClinic : $this->ownedClinic()->first();
            $c = $ownedClinic ?? $clinic;
            $data['onboarding_completed'] = $c ? (bool) $c->onboarding_completed : false;
        }

        // For hospitals, include hospital info
        if ($this->role_id === 'hospital') {
            $hospital = $this->relationLoaded('ownedHospital')
                ? $this->ownedHospital
                : $this->ownedHospital()->first();
            if ($hospital) {
                $data['hospital'] = [
                    'id'          => $hospital->id,
                    'name'        => $hospital->name,
                    'fullname'    => $hospital->fullname,
                    'is_verified' => (bool) $hospital->is_verified,
                ];
            }
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
