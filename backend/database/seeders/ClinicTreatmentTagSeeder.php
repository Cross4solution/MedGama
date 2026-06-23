<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Specialty;
use App\Models\TreatmentTag;
use Illuminate\Database\Seeder;

/**
 * Attach a realistic subset of treatment tags to each demo clinic so
 * "treatment → clinics offering it" is precise (not just specialty-approximate).
 * Idempotent: syncWithoutDetaching by codename.
 */
class ClinicTreatmentTagSeeder extends Seeder
{
    public function run(): void
    {
        // codename => specialty codes whose tags this clinic offers
        $map = [
            'medagama-clinic'        => ['CARD', 'DERM', 'GENS'],
            'elite-dental-clinic'    => ['DENT'],
            'vision-eye-clinic'      => ['OPHT'],
            'life-ortopedi-klinigi'  => ['ORTH'],
            'prime-cardio-merkezi'   => ['CARD'],
        ];

        foreach ($map as $codename => $codes) {
            $clinic = Clinic::where('codename', $codename)->first();
            if (!$clinic) {
                continue;
            }
            $specIds = Specialty::whereIn('code', $codes)->pluck('id');
            $tagIds = TreatmentTag::whereIn('specialty_id', $specIds)
                ->where('is_active', true)
                ->pluck('id')
                ->all();
            if ($tagIds) {
                $clinic->treatmentTags()->syncWithoutDetaching($tagIds);
            }
        }
    }
}
