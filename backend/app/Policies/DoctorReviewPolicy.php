<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\DoctorReview;
use App\Models\User;

class DoctorReviewPolicy
{
    /**
     * Only patients with at least one completed appointment with the doctor can create a review.
     */
    public function create(User $user, string $doctorId): bool
    {
        if ($user->role_id !== 'patient') {
            return false;
        }

        return Appointment::where('patient_id', $user->id)
            ->where('doctor_id', $doctorId)
            ->where('status', 'completed')
            ->exists();
    }

    /**
     * Only the review's author can update their own review.
     */
    public function update(User $user, DoctorReview $review): bool
    {
        return $user->id === $review->patient_id;
    }

    /**
     * Only the doctor who owns the review can respond.
     */
    public function respond(User $user, DoctorReview $review): bool
    {
        return $user->id === $review->doctor_id;
    }

    /**
     * Anyone can view approved/visible reviews.
     */
    public function view(?User $user, DoctorReview $review): bool
    {
        if ($review->is_visible && $review->moderation_status === 'approved') {
            return true;
        }

        // The review's author or the doctor can always see it
        if ($user && ($user->id === $review->patient_id || $user->id === $review->doctor_id)) {
            return true;
        }

        // SuperAdmin/SaasAdmin can see all
        if ($user && in_array($user->role_id, ['superAdmin', 'saasAdmin'])) {
            return true;
        }

        return false;
    }
}
