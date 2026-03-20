<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\LogsActivity;

class DoctorProfile extends Model
{
    use HasFactory, HasUuids, LogsActivity;

    protected static string $auditResourceLabel = 'DoctorProfile';

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

    // ── Valid language code → full name mapping ──
    private const LANGUAGE_MAP = [
        'tr' => 'Turkish',    'en' => 'English',   'ar' => 'Arabic',
        'ru' => 'Russian',    'de' => 'German',     'fr' => 'French',
        'es' => 'Spanish',    'it' => 'Italian',    'az' => 'Azerbaijani',
        'uz' => 'Uzbek',      'zh' => 'Chinese',    'hi' => 'Hindi',
        'bn' => 'Bengali',    'pt' => 'Portuguese',  'ja' => 'Japanese',
        'ko' => 'Korean',     'vi' => 'Vietnamese',  'th' => 'Thai',
        'pl' => 'Polish',     'uk' => 'Ukrainian',   'ro' => 'Romanian',
        'nl' => 'Dutch',      'el' => 'Greek',       'cs' => 'Czech',
        'sv' => 'Swedish',    'da' => 'Danish',      'fi' => 'Finnish',
        'no' => 'Norwegian',  'hu' => 'Hungarian',   'he' => 'Hebrew',
        'fa' => 'Persian',    'ku' => 'Kurdish',     'ka' => 'Georgian',
        'bg' => 'Bulgarian',  'sr' => 'Serbian',     'hr' => 'Croatian',
        'sk' => 'Slovak',     'sq' => 'Albanian',    'mk' => 'Macedonian',
        'bs' => 'Bosnian',    'sl' => 'Slovenian',   'lt' => 'Lithuanian',
        'lv' => 'Latvian',    'et' => 'Estonian',    'ms' => 'Malay',
        'id' => 'Indonesian',  'tl' => 'Filipino',   'sw' => 'Swahili',
        'am' => 'Amharic',    'ur' => 'Urdu',        'pa' => 'Punjabi',
        'ta' => 'Tamil',      'te' => 'Telugu',      'ml' => 'Malayalam',
        'kn' => 'Kannada',    'mr' => 'Marathi',     'gu' => 'Gujarati',
        'ne' => 'Nepali',     'si' => 'Sinhala',     'my' => 'Burmese',
        'km' => 'Khmer',      'lo' => 'Lao',         'mn' => 'Mongolian',
        'tk' => 'Turkmen',    'kk' => 'Kazakh',      'ky' => 'Kyrgyz',
        'tg' => 'Tajik',      'ps' => 'Pashto',
    ];

    protected function languages(): Attribute
    {
        $validFullNames = array_map('strtolower', array_values(self::LANGUAGE_MAP));

        return Attribute::make(
            get: function ($value) use ($validFullNames) {
                $raw = is_string($value) ? json_decode($value, true) : $value;
                if (!is_array($raw)) return [];

                $result = [];
                foreach ($raw as $item) {
                    if (!is_string($item)) continue;
                    $clean = trim($item);
                    $lower = strtolower($clean);

                    // 1. Exact code match → full name
                    if (isset(self::LANGUAGE_MAP[$lower])) {
                        $result[] = self::LANGUAGE_MAP[$lower];
                        continue;
                    }
                    // 2. Already a valid full name (e.g. "English", "turkish")
                    if (in_array($lower, $validFullNames)) {
                        $result[] = ucfirst($lower);
                        continue;
                    }
                    // 3. Anything else is garbage → skip
                }

                return array_values(array_unique($result));
            },
        );
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
