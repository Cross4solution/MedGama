<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\User;

/**
 * Round-robin salesperson assignment for incoming leads.
 *
 * Each new (unassigned) lead goes to the NEXT active salesperson of the clinic,
 * cycling back to the first once everyone has had a turn. Rotation is derived
 * statelessly from the clinic's most recently assigned lead — no extra column.
 */
class LeadAssignmentService
{
    /** Pick the next salesperson in the clinic's round-robin rotation, or null if none. */
    public function nextSalesperson(?string $clinicId): ?User
    {
        if (!$clinicId) {
            return null;
        }

        // Ordered, stable pool of the clinic's active salespeople
        $pool = User::where('role_id', 'salesperson')
            ->where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        if ($pool->isEmpty()) {
            return null;
        }

        // Who got the most recent assignment in this clinic?
        $lastLead = Lead::where('clinic_id', $clinicId)
            ->whereNotNull('assigned_to')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        if (!$lastLead) {
            return $pool->first();
        }

        $idx = $pool->search(fn (User $u) => $u->id === $lastLead->assigned_to);

        // Last assignee no longer in the pool (left/deactivated) → start from first
        if ($idx === false) {
            return $pool->first();
        }

        // Next in line, wrapping around
        return $pool[($idx + 1) % $pool->count()];
    }
}
