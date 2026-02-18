<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorProfile extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'title',
        'specialty',
        'sub_specialties',
        'bio',
        'experience_years',
        'license_number',
        'education',
        'certifications',
        'services',
        'prices',
        'languages',
        'address',
        'map_coordinates',
        'phone',
        'website',
        'gallery',
        'online_consultation',
        'accepts_insurance',
        'insurance_providers',
        'onboarding_completed',
        'onboarding_step',
    ];

    protected function casts(): array
    {
        return [
            'sub_specialties'    => 'array',
            'education'          => 'array',
            'certifications'     => 'array',
            'services'           => 'array',
            'prices'             => 'array',
            'languages'          => 'array',
            'map_coordinates'    => 'array',
            'gallery'            => 'array',
            'insurance_providers'=> 'array',
            'online_consultation'=> 'boolean',
            'accepts_insurance'  => 'boolean',
            'onboarding_completed' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
