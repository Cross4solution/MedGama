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
        'operating_hours',
        'whatsapp',
        'social_links',
        'online_consultation',
        'accepts_insurance',
        'insurance_providers',
        'onboarding_completed',
        'onboarding_step',
        'avg_rating',
        'review_count',
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
            'operating_hours'    => 'array',
            'social_links'       => 'array',
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
