<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * MedStream handle (username) generator.
 *
 * Rules:
 *   • Doctors:           "Dr. Ayşe Yılmaz"  → dr_ayse_yilmaz
 *   • Clinic / Hospital: clinic/hospital name is used as source
 *   • Turkish chars normalised (ş→s, ı→i, ç→c, ğ→g, ö→o, ü→u)
 *   • Collisions resolved by appending _2, _3, ...
 */
class Username
{
    /** Normalise Turkish-specific characters before slugifying. */
    public static function tr(string $s): string
    {
        return strtr($s, [
            'ş' => 's', 'Ş' => 's', 'ı' => 'i', 'İ' => 'i', 'ç' => 'c', 'Ç' => 'c',
            'ğ' => 'g', 'Ğ' => 'g', 'ö' => 'o', 'Ö' => 'o', 'ü' => 'u', 'Ü' => 'u',
        ]);
    }

    /** Build the base handle (without collision suffix). */
    public static function base(string $name, string $roleId, ?string $clinicName = null): string
    {
        $source = in_array($roleId, ['clinic', 'clinicOwner', 'hospital'], true) && $clinicName
            ? $clinicName
            : $name;

        $slug = (string) Str::of(self::tr($source))
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_');

        if ($slug === '') {
            $slug = 'user';
        }

        if ($roleId === 'doctor') {
            // Strip an existing title (Dr., Doktor, Prof., Doç., Op., Uzm.) so we
            // don't end up with "dr_dr_..." when the name already includes one.
            $slug = preg_replace('/^((dr|doktor|doc|prof|op|uzm)_+)+/', '', $slug);
            if ($slug === '') {
                $slug = 'user';
            }
            $slug = 'dr_' . $slug;
        }

        return substr($slug, 0, 40);
    }

    /** Generate a unique handle, resolving collisions with numeric suffixes. */
    public static function generate(string $name, string $roleId, ?string $clinicName = null, ?string $ignoreId = null): string
    {
        $base = self::base($name, $roleId, $clinicName);
        $candidate = $base;
        $i = 1;

        while (
            User::where('username', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $i++;
            $candidate = $base . '_' . $i;
        }

        return $candidate;
    }
}
