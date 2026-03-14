<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PatientService;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function __construct(
        private PatientService $patientService,
    ) {}

    /**
     * GET /crm/patients — List patients with tags, stages, stats
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $filters = $request->only([
            'search', 'tag', 'stage', 'gender',
            'sort_by', 'sort_dir', 'per_page',
        ]);

        $patients = $this->patientService->listPatients($user, $filters);

        return response()->json($patients);
    }

    /**
     * GET /crm/patients/stats — Dashboard stats
     */
    public function stats(Request $request)
    {
        $stats = $this->patientService->getPatientStats($request->user());

        return response()->json($stats);
    }

    /**
     * GET /crm/patients/filters — Distinct tags & stages for filter dropdowns
     */
    public function filters(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'tags' => $this->patientService->getDistinctTags($user),
            'stages' => $this->patientService->getDistinctStages($user),
        ]);
    }

    /**
     * GET /crm/patients/{id} — Patient 360° full profile
     */
    public function show(string $id, Request $request)
    {
        $data = $this->patientService->getPatient360($id, $request->user());

        return response()->json($data);
    }

    /**
     * GET /crm/patients/{id}/timeline — Chronological timeline
     */
    public function timeline(string $id, Request $request)
    {
        $filters = $request->only(['type']);

        $timeline = $this->patientService->getPatientTimeline($id, $request->user(), $filters);

        return response()->json(['timeline' => $timeline]);
    }

    /**
     * GET /crm/patients/{id}/summary — Medical summary (vitals, prescriptions, diagnoses)
     */
    public function summary(string $id, Request $request)
    {
        $summary = $this->patientService->getMedicalSummary($id, $request->user());

        return response()->json($summary);
    }

    /**
     * GET /crm/patients/{id}/documents — Patient documents
     */
    public function documents(string $id, Request $request)
    {
        $filters = $request->only(['record_type', 'per_page']);

        $documents = $this->patientService->getPatientDocuments($id, $request->user(), $filters);

        return response()->json($documents);
    }

    /**
     * POST /crm/patients/{id}/tags — Add tag to patient
     */
    public function addTag(string $id, Request $request)
    {
        $validated = $request->validate([
            'tag' => 'required|string|max:100',
        ]);

        $tag = $this->patientService->addTag($id, $request->user(), $validated['tag']);

        return response()->json(['tag' => $tag], 201);
    }

    /**
     * DELETE /crm/patients/tags/{tagId} — Remove a tag
     */
    public function removeTag(string $tagId, Request $request)
    {
        $this->patientService->removeTag($tagId, $request->user());

        return response()->json(['message' => 'Tag removed.']);
    }

    /**
     * POST /crm/patients/{id}/stage — Set/update process stage
     */
    public function setStage(string $id, Request $request)
    {
        $validated = $request->validate([
            'stage' => 'required|string|max:100',
        ]);

        $stage = $this->patientService->setStage($id, $request->user(), $validated['stage']);

        return response()->json(['stage' => $stage], 201);
    }
}
