<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Sales CRM — Lead pipeline + salesperson management.
 *
 * Authorization model:
 *  • clinicOwner / hospital / admin → see ALL leads in their clinic, can assign + manage salespeople.
 *  • salesperson → sees ONLY leads where assigned_to === their own id; cannot manage salespeople.
 *  • doctor → sees clinic leads (read/manage) but not salesperson management.
 *
 * Every lead is scoped by clinic_id. Managers' clinic_id comes from $user->clinic_id.
 */
class LeadController extends Controller
{
    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    /** The clinic this user operates within. */
    private function clinicId(User $user): ?string
    {
        return $user->clinic_id;
    }

    /** Can this user see/manage all clinic leads (vs. only assigned)? */
    private function isManager(User $user): bool
    {
        return $user->isClinicOwner() || $user->isHospital() || $user->isAdmin() || $user->isDoctor();
    }

    /** Base query scoped to the user's visibility. */
    private function scopedQuery(User $user)
    {
        $query = Lead::query();

        $clinicId = $this->clinicId($user);
        if ($clinicId) {
            $query->where('clinic_id', $clinicId);
        }

        // Salesperson only sees leads assigned to them.
        if ($user->isSalesperson()) {
            $query->where('assigned_to', $user->id);
        }

        return $query;
    }

    /** Resolve a lead the user is allowed to access, or abort 403/404. */
    private function findAccessibleLead(User $user, string $id): Lead
    {
        $lead = Lead::findOrFail($id);

        if ($this->clinicId($user) && $lead->clinic_id !== $this->clinicId($user)) {
            abort(403, 'Forbidden.');
        }
        if ($user->isSalesperson() && $lead->assigned_to !== $user->id) {
            abort(403, 'Forbidden.');
        }

        return $lead;
    }

    private function logActivity(string $leadId, ?string $userId, string $type, ?string $description = null, array $meta = []): LeadActivity
    {
        return LeadActivity::create([
            'lead_id'     => $leadId,
            'user_id'     => $userId,
            'type'        => $type,
            'description' => $description,
            'meta'        => $meta ?: null,
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    // Leads CRUD
    // ──────────────────────────────────────────────────────────────

    /** GET /crm/leads — list (stage filter, search, assignee filter). */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $this->scopedQuery($user)->with('assignedTo:id,fullname,email');

        $query->when($request->stage, fn($q, $v) => $q->where('stage', $v));

        // Manager can filter by salesperson; salesperson is already pinned to self.
        if ($this->isManager($user)) {
            $query->when($request->assigned_to, fn($q, $v) => $q->where('assigned_to', $v));
        }

        $query->when($request->search, function ($q, $v) {
            $q->where(function ($sub) use ($v) {
                $sub->where('full_name', 'like', "%{$v}%")
                    ->orWhere('email', 'like', "%{$v}%")
                    ->orWhere('phone', 'like', "%{$v}%")
                    ->orWhere('treatment_interest', 'like', "%{$v}%");
            });
        });

        return response()->json(
            $query->orderByDesc('created_at')->paginate($request->per_page ?? 100)
        );
    }

    /** POST /crm/leads — create lead + activity log. */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'full_name'          => 'required|string|max:255',
            'email'              => 'nullable|email|max:255',
            'phone'              => 'nullable|string|max:40',
            'source'             => 'nullable|string|max:100',
            'treatment_interest' => 'nullable|string|max:255',
            'stage'              => 'nullable|in:' . implode(',', Lead::STAGES),
            'notes'              => 'nullable|string',
            'estimated_value'    => 'nullable|numeric|min:0',
            'assigned_to'        => 'nullable|uuid|exists:users,id',
        ]);

        // Salespeople may only create leads assigned to themselves.
        $assignedTo = $validated['assigned_to'] ?? null;
        if ($user->isSalesperson()) {
            $assignedTo = $user->id;
        }

        // Round-robin: a manager leaving the lead unassigned → auto-assign to the
        // next active salesperson in rotation (cycles through the whole team).
        $autoAssigned = false;
        if (!$assignedTo && !$user->isSalesperson()) {
            $next = app(\App\Services\LeadAssignmentService::class)->nextSalesperson($this->clinicId($user));
            if ($next) {
                $assignedTo = $next->id;
                $autoAssigned = true;
            }
        }

        $lead = DB::transaction(function () use ($validated, $user, $assignedTo, $autoAssigned) {
            $lead = Lead::create([
                'clinic_id'          => $this->clinicId($user),
                'assigned_to'        => $assignedTo,
                'full_name'          => $validated['full_name'],
                'email'              => $validated['email'] ?? null,
                'phone'              => $validated['phone'] ?? null,
                'source'             => $validated['source'] ?? 'manual',
                'treatment_interest' => $validated['treatment_interest'] ?? null,
                'stage'              => $validated['stage'] ?? 'new',
                'notes'              => $validated['notes'] ?? null,
                'estimated_value'    => $validated['estimated_value'] ?? null,
            ]);

            $this->logActivity($lead->id, $user->id, 'note', 'Lead created.');

            if ($assignedTo) {
                $this->logActivity($lead->id, $user->id, 'assignment', $autoAssigned ? 'Lead auto-assigned (round-robin).' : 'Lead assigned.', ['assigned_to' => $assignedTo, 'auto' => $autoAssigned]);
            }

            return $lead;
        });

        return response()->json(['lead' => $lead->load('assignedTo:id,fullname,email')], 201);
    }

    /** GET /crm/leads/{id} — detail + activities. */
    public function show(string $id, Request $request)
    {
        $user = $request->user();
        $lead = $this->findAccessibleLead($user, $id);

        $lead->load([
            'assignedTo:id,fullname,email',
            'convertedPatient:id,fullname,email',
            'activities.user:id,fullname',
        ]);

        return response()->json(['lead' => $lead]);
    }

    /** PUT /crm/leads/{id} — edit fields. */
    public function update(string $id, Request $request)
    {
        $user = $request->user();
        $lead = $this->findAccessibleLead($user, $id);

        $validated = $request->validate([
            'full_name'          => 'sometimes|string|max:255',
            'email'              => 'nullable|email|max:255',
            'phone'              => 'nullable|string|max:40',
            'source'             => 'nullable|string|max:100',
            'treatment_interest' => 'nullable|string|max:255',
            'notes'              => 'nullable|string',
            'estimated_value'    => 'nullable|numeric|min:0',
            'last_contacted_at'  => 'nullable|date',
        ]);

        $lead->update($validated);
        $this->logActivity($lead->id, $user->id, 'note', 'Lead details updated.');

        return response()->json(['lead' => $lead->fresh('assignedTo')]);
    }

    /**
     * PUT /crm/leads/{id}/stage — move pipeline stage.
     * When stage becomes 'won', auto-create a patient user + link converted_patient_id.
     */
    public function updateStage(string $id, Request $request)
    {
        $user = $request->user();
        $lead = $this->findAccessibleLead($user, $id);

        $validated = $request->validate([
            'stage'       => 'required|in:' . implode(',', Lead::STAGES),
            'lost_reason' => 'nullable|string|max:500',
        ]);

        $from = $lead->stage;
        $to   = $validated['stage'];

        DB::transaction(function () use ($lead, $user, $validated, $from, $to) {
            $payload = ['stage' => $to];

            if ($to === 'lost') {
                $payload['lost_reason'] = $validated['lost_reason'] ?? null;
            }

            // ── Won → auto-convert to patient (reuse clinic-created user pattern) ──
            if ($to === 'won' && !$lead->converted_patient_id) {
                $patient = $this->convertToPatient($lead);
                $payload['converted_patient_id'] = $patient->id;
                $this->logActivity($lead->id, $user->id, 'note', 'Lead converted to patient.', ['patient_id' => $patient->id]);
            }

            $lead->update($payload);

            $this->logActivity($lead->id, $user->id, 'stage_change', "Stage: {$from} → {$to}", [
                'from' => $from,
                'to'   => $to,
            ]);
        });

        return response()->json(['lead' => $lead->fresh(['assignedTo', 'convertedPatient'])]);
    }

    /**
     * Create a patient User from a won lead. Mirrors ClinicController::createStaff:
     *  - role_id 'patient', clinic_id set, added_by_clinic, pre-verified.
     *  - Auto-generated password (clinic can reset / patient uses reset flow).
     */
    private function convertToPatient(Lead $lead): User
    {
        // Reuse an existing patient with same email in this clinic if present.
        if ($lead->email) {
            $existing = User::where('email', $lead->email)
                ->where('clinic_id', $lead->clinic_id)
                ->where('role_id', 'patient')
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $email = $lead->email ?: 'lead-' . Str::lower(Str::random(10)) . '@leads.medagama.local';

        return User::create([
            'fullname'        => $lead->full_name,
            'email'           => $email,
            'password'        => bcrypt(Str::random(24)),
            'mobile'          => $lead->phone,
            'role_id'         => 'patient',
            'user_level'      => 1,
            'clinic_id'       => $lead->clinic_id,
            'added_by_clinic' => true,
            'is_active'       => true,
            'email_verified'  => true,
        ]);
    }

    /** PUT /crm/leads/{id}/assign — assign to a salesperson (managers only). */
    public function assign(string $id, Request $request)
    {
        $user = $request->user();

        if (!$this->isManager($user)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $lead = $this->findAccessibleLead($user, $id);

        $validated = $request->validate([
            'assigned_to' => 'nullable|uuid|exists:users,id',
        ]);

        $assignedTo = $validated['assigned_to'] ?? null;

        // Ensure target belongs to the same clinic (and is a salesperson) if provided.
        if ($assignedTo) {
            $target = User::find($assignedTo);
            if (!$target || $target->clinic_id !== $lead->clinic_id) {
                return response()->json(['message' => 'Salesperson not found in this clinic.'], 422);
            }
        }

        $lead->update(['assigned_to' => $assignedTo]);
        $this->logActivity($lead->id, $user->id, 'assignment',
            $assignedTo ? 'Lead assigned.' : 'Lead unassigned.',
            ['assigned_to' => $assignedTo]
        );

        return response()->json(['lead' => $lead->fresh('assignedTo')]);
    }

    /** POST /crm/leads/{id}/activities — add note/call/email log. */
    public function addActivity(string $id, Request $request)
    {
        $user = $request->user();
        $lead = $this->findAccessibleLead($user, $id);

        $validated = $request->validate([
            'type'        => 'required|in:note,call,email',
            'description' => 'nullable|string|max:2000',
        ]);

        $activity = $this->logActivity($lead->id, $user->id, $validated['type'], $validated['description'] ?? null);

        // Calls/emails count as contact.
        if (in_array($validated['type'], ['call', 'email'])) {
            $lead->update(['last_contacted_at' => now()]);
        }

        return response()->json(['activity' => $activity->load('user:id,fullname')], 201);
    }

    /** GET /crm/leads/stats — pipeline summary (count + value per stage). */
    public function stats(Request $request)
    {
        $user = $request->user();

        $rows = $this->scopedQuery($user)
            ->selectRaw('stage, COUNT(*) as count, COALESCE(SUM(estimated_value), 0) as total_value')
            ->groupBy('stage')
            ->get()
            ->keyBy('stage');

        $byStage = [];
        foreach (Lead::STAGES as $stage) {
            $row = $rows->get($stage);
            $byStage[$stage] = [
                'count'       => (int) ($row->count ?? 0),
                'total_value' => (float) ($row->total_value ?? 0),
            ];
        }

        return response()->json([
            'by_stage'    => $byStage,
            'total_leads' => array_sum(array_column($byStage, 'count')),
            'won_value'   => $byStage['won']['total_value'] ?? 0,
        ]);
    }

    /** DELETE /crm/leads/{id} — soft delete. */
    public function destroy(string $id, Request $request)
    {
        $user = $request->user();
        $lead = $this->findAccessibleLead($user, $id);
        $lead->delete();

        return response()->json(['message' => 'Lead deleted.']);
    }

    // ──────────────────────────────────────────────────────────────
    // Salesperson management (managers only)
    // ──────────────────────────────────────────────────────────────

    private function ensureManager(User $user): void
    {
        if (!($user->isClinicOwner() || $user->isHospital() || $user->isAdmin())) {
            abort(403, 'Forbidden.');
        }
    }

    /** GET /crm/salespeople — clinic's salespeople. */
    public function listSalespeople(Request $request)
    {
        $user = $request->user();
        $this->ensureManager($user);

        $people = User::where('role_id', 'salesperson')
            ->where('clinic_id', $this->clinicId($user))
            ->withCount(['assignedLeads as active_leads_count' => function ($q) {
                $q->whereNotIn('stage', ['won', 'lost']);
            }])
            ->orderBy('fullname')
            ->get(['id', 'fullname', 'email', 'mobile', 'is_active', 'created_at']);

        return response()->json(['salespeople' => $people]);
    }

    /** POST /crm/salespeople — create a salesperson account (returns credentials once). */
    public function createSalesperson(Request $request)
    {
        $user = $request->user();
        $this->ensureManager($user);

        $clinicId = $this->clinicId($user);
        if (!$clinicId) {
            return response()->json(['message' => 'No clinic associated with this account.'], 422);
        }

        $validated = $request->validate([
            'fullname' => 'required|string|max:255',
            'email'    => 'required|email|max:255',
            'mobile'   => 'nullable|string|max:40',
            'password' => 'nullable|string|min:6|max:100',
        ]);

        $exists = User::where('email', $validated['email'])->where('clinic_id', $clinicId)->exists();
        if ($exists) {
            return response()->json(['message' => 'A user with this email already exists in this clinic.'], 422);
        }

        $password = $validated['password'] ?? Str::random(10);

        $salesperson = User::create([
            'fullname'        => $validated['fullname'],
            'email'           => $validated['email'],
            'password'        => bcrypt($password),
            'mobile'          => $validated['mobile'] ?? null,
            'role_id'         => 'salesperson',
            'user_level'      => 2,
            'clinic_id'       => $clinicId,
            'added_by_clinic' => true,
            'is_active'       => true,
            'email_verified'  => true, // clinic-created accounts are pre-verified
        ]);

        return response()->json([
            'salesperson' => $salesperson->only(['id', 'fullname', 'email', 'mobile', 'is_active']),
            'credentials' => [
                'email'    => $validated['email'],
                'password' => $password, // shown once to the manager
            ],
        ], 201);
    }

    /** PUT /crm/salespeople/{id}/toggle — activate / deactivate. */
    public function toggleSalesperson(string $id, Request $request)
    {
        $user = $request->user();
        $this->ensureManager($user);

        $salesperson = User::where('role_id', 'salesperson')
            ->where('clinic_id', $this->clinicId($user))
            ->findOrFail($id);

        $salesperson->update(['is_active' => !$salesperson->is_active]);

        return response()->json([
            'salesperson' => $salesperson->only(['id', 'fullname', 'email', 'is_active']),
        ]);
    }
}
