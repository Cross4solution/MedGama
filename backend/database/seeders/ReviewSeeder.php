<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\ClinicReview;
use App\Models\DoctorReview;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo reviews (approved + visible) so ratings show real aggregates.
 * Idempotent-ish: skips a doctor/clinic that already has reviews.
 */
class ReviewSeeder extends Seeder
{
    private array $comments = [
        'İlgili ve güler yüzlü, her şeyi sabırla anlattı.',
        'Çok memnun kaldım, kesinlikle tavsiye ederim.',
        'Randevu zamanında başladı, profesyonel bir yaklaşım.',
        'Sorularımı tek tek yanıtladı, kendimi rahat hissettim.',
        'Tedavi süreci çok iyi yönetildi, teşekkürler.',
        'Temiz, modern bir ortam ve deneyimli ekip.',
        'Online görüşme sorunsuzdu, çok pratik oldu.',
        'Güler yüzlü personel, hızlı ve özenli hizmet.',
    ];

    public function run(): void
    {
        $patients = User::where('role_id', 'patient')->where('is_active', true)->pluck('id')->all();
        if (empty($patients)) {
            return;
        }

        $ratings = [5, 5, 5, 4, 5, 4, 5, 3]; // weighted high

        foreach (User::where('role_id', 'doctor')->pluck('id') as $i => $doctorId) {
            if (DoctorReview::where('doctor_id', $doctorId)->exists()) {
                continue;
            }
            $count = 4 + ($i % 5); // 4..8
            foreach (array_slice($patients, 0, min($count, count($patients))) as $j => $patientId) {
                DoctorReview::create([
                    'doctor_id'         => $doctorId,
                    'patient_id'        => $patientId,
                    'appointment_id'    => null,
                    'rating'            => $ratings[($i + $j) % count($ratings)],
                    'comment'           => $this->comments[($i + $j) % count($this->comments)],
                    'is_verified'       => true,
                    'is_visible'        => true,
                    'moderation_status' => 'approved',
                ]);
            }
            DoctorReview::recalculateAggregatedRating($doctorId);
        }

        foreach (Clinic::pluck('id') as $i => $clinicId) {
            if (ClinicReview::where('clinic_id', $clinicId)->exists()) {
                continue;
            }
            $count = 5 + ($i % 6); // 5..10
            foreach (array_slice($patients, 0, min($count, count($patients))) as $j => $patientId) {
                ClinicReview::create([
                    'clinic_id'         => $clinicId,
                    'patient_id'        => $patientId,
                    'appointment_id'    => null,
                    'rating'            => $ratings[($i + $j) % count($ratings)],
                    'comment'           => $this->comments[($i + $j) % count($this->comments)],
                    'is_verified'       => true,
                    'is_visible'        => true,
                    'moderation_status' => 'approved',
                ]);
            }
            ClinicReview::recalculateAggregatedRating($clinicId);
        }
    }
}
