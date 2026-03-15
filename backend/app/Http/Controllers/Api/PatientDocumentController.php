<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthDataAuditLog;
use App\Models\PatientDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PatientDocumentController extends Controller
{
    // ══════════════════════════════════════════════
    //  LIST — Patient's own documents
    // ══════════════════════════════════════════════

    /**
     * GET /patient-documents
     * Returns the authenticated patient's documents.
     * Query params: category, per_page
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = PatientDocument::active()
            ->forPatient($user->id)
            ->with('uploader:id,fullname,avatar');

        if ($category = $request->input('category')) {
            $query->category($category);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('file_name', 'ilike', "%{$search}%");
            });
        }

        $perPage = min((int) ($request->input('per_page') ?? 20), 100);

        $documents = $query->orderByDesc('document_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        // GDPR Audit
        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $user->id,
            resourceType: 'patient_documents',
            resourceId: $user->id,
            action: 'list',
        );

        return response()->json($documents);
    }

    // ══════════════════════════════════════════════
    //  SHOW — Single document detail
    // ══════════════════════════════════════════════

    /**
     * GET /patient-documents/{id}
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $user = $request->user();

        $doc = PatientDocument::active()
            ->with('uploader:id,fullname,avatar')
            ->findOrFail($id);

        // Access: owner or shared doctor
        $this->authorizeAccess($doc, $user);

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $doc->patient_id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'view',
        );

        return response()->json($doc);
    }

    // ══════════════════════════════════════════════
    //  UPLOAD — Patient uploads a new document
    // ══════════════════════════════════════════════

    /**
     * POST /patient-documents
     * Accepts multipart file upload.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file'          => 'required|file|max:20480', // 20 MB max
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string|max:2000',
            'category'      => 'required|in:' . implode(',', PatientDocument::$allowedCategories),
            'document_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $file = $request->file('file');

        // Validate MIME type
        $mime = $file->getMimeType();
        if (!in_array($mime, PatientDocument::$allowedMimeTypes, true)) {
            return response()->json([
                'message' => 'File type not allowed.',
                'errors' => ['file' => ['Allowed types: PDF, JPEG, PNG, WebP, Word, Excel, DICOM']],
            ], 422);
        }

        // Store file in private disk (not publicly accessible)
        $ext = $file->getClientOriginalExtension() ?: 'pdf';
        $filename = Str::uuid() . '.' . $ext;
        $path = $file->storeAs('patient-documents/' . $user->id, $filename, 'local');

        $doc = PatientDocument::create([
            'patient_id'    => $user->id,
            'uploaded_by'   => $user->id,
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'category'      => $validated['category'],
            'file_path'     => $path,
            'file_name'     => $file->getClientOriginalName(),
            'mime_type'     => $mime,
            'file_size'     => $file->getSize(),
            'document_date' => $validated['document_date'] ?? now()->toDateString(),
            'shared_with'   => [],
        ]);

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $user->id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'upload',
        );

        $doc->load('uploader:id,fullname,avatar');

        return response()->json($doc, 201);
    }

    // ══════════════════════════════════════════════
    //  UPDATE — Edit title/description/category
    // ══════════════════════════════════════════════

    /**
     * PUT /patient-documents/{id}
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $doc = PatientDocument::active()->where('patient_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'description'   => 'nullable|string|max:2000',
            'category'      => 'sometimes|in:' . implode(',', PatientDocument::$allowedCategories),
            'document_date' => 'nullable|date',
        ]);

        $doc->update(array_filter($validated, fn($v) => $v !== null));

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $user->id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'update',
        );

        return response()->json($doc->fresh());
    }

    // ══════════════════════════════════════════════
    //  DELETE — Soft-delete a document
    // ══════════════════════════════════════════════

    /**
     * DELETE /patient-documents/{id}
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $doc = PatientDocument::active()->where('patient_id', $user->id)->findOrFail($id);

        $doc->delete(); // soft delete

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $user->id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'delete',
        );

        return response()->json(['message' => 'Document deleted.']);
    }

    // ══════════════════════════════════════════════
    //  DOWNLOAD — Secure file download
    // ══════════════════════════════════════════════

    /**
     * GET /patient-documents/{id}/download
     */
    public function download(string $id, Request $request)
    {
        $user = $request->user();
        $doc = PatientDocument::active()->findOrFail($id);

        $this->authorizeAccess($doc, $user);

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $doc->patient_id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'download',
        );

        $disk = Storage::disk('local');
        if (!$disk->exists($doc->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return $disk->download($doc->file_path, $doc->file_name, [
            'Content-Type' => $doc->mime_type,
        ]);
    }

    // ══════════════════════════════════════════════
    //  SHARE / REVOKE — Doctor access management
    // ══════════════════════════════════════════════

    /**
     * POST /patient-documents/{id}/share
     * Body: { doctor_id: "uuid" }
     */
    public function share(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $doc = PatientDocument::active()->where('patient_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:users,id',
        ]);

        $doc->shareWith($validated['doctor_id']);

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $user->id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'share',
        );

        return response()->json(['message' => 'Document shared.', 'shared_with' => $doc->fresh()->shared_with]);
    }

    /**
     * POST /patient-documents/{id}/revoke
     * Body: { doctor_id: "uuid" }
     */
    public function revoke(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $doc = PatientDocument::active()->where('patient_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:users,id',
        ]);

        $doc->revokeShare($validated['doctor_id']);

        HealthDataAuditLog::log(
            accessorId: $user->id,
            patientId: $user->id,
            resourceType: 'patient_document',
            resourceId: $doc->id,
            action: 'revoke_share',
        );

        return response()->json(['message' => 'Share revoked.', 'shared_with' => $doc->fresh()->shared_with]);
    }

    // ══════════════════════════════════════════════
    //  DOCTOR VIEW — Doctor access to shared docs
    // ══════════════════════════════════════════════

    /**
     * GET /patient-documents/shared/{patientId}
     * Doctor views documents shared by a specific patient.
     */
    public function sharedWithDoctor(string $patientId, Request $request): JsonResponse
    {
        $doctor = $request->user();

        $documents = PatientDocument::active()
            ->forPatient($patientId)
            ->sharedWith($doctor->id)
            ->with('uploader:id,fullname,avatar')
            ->orderByDesc('document_date')
            ->get();

        HealthDataAuditLog::log(
            accessorId: $doctor->id,
            patientId: $patientId,
            resourceType: 'patient_documents',
            resourceId: $patientId,
            action: 'doctor_view_shared',
        );

        return response()->json(['data' => $documents]);
    }

    // ══════════════════════════════════════════════
    //  STATS — Document counts per category
    // ══════════════════════════════════════════════

    /**
     * GET /patient-documents/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $stats = PatientDocument::active()
            ->forPatient($user->id)
            ->selectRaw("category, count(*) as count, sum(file_size) as total_size")
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        $total = PatientDocument::active()->forPatient($user->id)->count();
        $totalSize = PatientDocument::active()->forPatient($user->id)->sum('file_size');

        return response()->json([
            'total_documents' => $total,
            'total_size' => $totalSize,
            'by_category' => $stats,
        ]);
    }

    // ══════════════════════════════════════════════
    //  AUTHORIZATION HELPER
    // ══════════════════════════════════════════════

    private function authorizeAccess(PatientDocument $doc, $user): void
    {
        $isOwner = $doc->patient_id === $user->id;
        $isShared = $doc->isSharedWith($user->id);
        $isAdmin = in_array($user->role ?? $user->role_id ?? '', ['superAdmin', 'saasAdmin'], true);

        if (!$isOwner && !$isShared && !$isAdmin) {
            abort(403, 'You do not have access to this document.');
        }
    }
}
