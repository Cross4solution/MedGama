<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Examination\StoreExaminationRequest;
use App\Http\Requests\Examination\UpdateExaminationRequest;
use App\Services\ExaminationService;
use App\Services\PrescriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ExaminationController extends Controller
{
    public function __construct(
        private readonly ExaminationService $examinationService,
        private readonly PrescriptionService $prescriptionService,
    ) {}

    // ── Examinations CRUD ──

    #[OA\Get(
        path: '/crm/examinations',
        summary: 'List examinations for the authenticated doctor',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        parameters: [
            new OA\Parameter(name: 'patient_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'icd10_code', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'date_from', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'date_to', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated examination records'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $records = $this->examinationService->listExaminations(
            $request->user(),
            $request->only(['patient_id', 'icd10_code', 'date_from', 'date_to', 'per_page']),
        );

        return response()->json($records);
    }

    #[OA\Get(
        path: '/crm/examinations/{id}',
        summary: 'Get examination detail (triggers GDPR audit log)',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Examination detail with patient, clinic, appointment'),
            new OA\Response(response: 404, description: 'Not found'),
        ]
    )]
    public function show(string $id, Request $request): JsonResponse
    {
        $record = $this->examinationService->getExamination($id, $request->user());

        return response()->json(['examination' => $record]);
    }

    #[OA\Post(
        path: '/crm/examinations',
        summary: 'Create examination record (doctor only)',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['patient_id'],
                properties: [
                    new OA\Property(property: 'patient_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'appointment_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'clinic_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'icd10_code', type: 'string', example: 'J06.9'),
                    new OA\Property(property: 'diagnosis_note', type: 'string'),
                    new OA\Property(
                        property: 'vitals',
                        type: 'object',
                        properties: [
                            new OA\Property(property: 'systolic', type: 'integer', example: 120),
                            new OA\Property(property: 'diastolic', type: 'integer', example: 80),
                            new OA\Property(property: 'pulse', type: 'integer', example: 72),
                            new OA\Property(property: 'temperature', type: 'number', example: 36.6),
                            new OA\Property(property: 'spo2', type: 'integer', example: 98),
                            new OA\Property(property: 'height', type: 'number', example: 175),
                            new OA\Property(property: 'weight', type: 'number', example: 70),
                        ]
                    ),
                    new OA\Property(property: 'examination_note', type: 'string'),
                    new OA\Property(property: 'treatment_plan', type: 'string'),
                    new OA\Property(
                        property: 'prescriptions',
                        type: 'array',
                        items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'drug_name', type: 'string', example: 'Amoxicillin 500mg'),
                                new OA\Property(property: 'dosage', type: 'string', example: '3x1'),
                                new OA\Property(property: 'duration', type: 'string', example: '7 gün'),
                                new OA\Property(property: 'route', type: 'string', enum: ['oral','iv','im','sc','topical','inhalation','rectal','sublingual','transdermal','other']),
                            ]
                        )
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Examination created'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(StoreExaminationRequest $request): JsonResponse
    {
        $record = $this->examinationService->createExamination(
            $request->user(),
            $request->validated(),
        );

        return response()->json(['examination' => $record], 201);
    }

    #[OA\Put(
        path: '/crm/examinations/{id}',
        summary: 'Update examination record (doctor only)',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Examination updated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Not found'),
        ]
    )]
    public function update(UpdateExaminationRequest $request, string $id): JsonResponse
    {
        $record = $this->examinationService->updateExamination(
            $id,
            $request->user(),
            $request->validated(),
        );

        return response()->json(['examination' => $record]);
    }

    #[OA\Delete(
        path: '/crm/examinations/{id}',
        summary: 'Soft-delete examination record (doctor only)',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Examination deleted'),
            new OA\Response(response: 404, description: 'Not found'),
        ]
    )]
    public function destroy(string $id, Request $request): JsonResponse
    {
        $this->examinationService->deleteExamination($id, $request->user());

        return response()->json(['message' => 'Examination record deleted.']);
    }

    // ── ICD-10 Search ──

    #[OA\Get(
        path: '/crm/icd10/search',
        summary: 'Search ICD-10 codes by code or name (TR/EN)',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        parameters: [
            new OA\Parameter(name: 'q', in: 'query', required: true, schema: new OA\Schema(type: 'string', minLength: 2)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of matching ICD-10 codes (max 20)'),
            new OA\Response(response: 422, description: 'Query too short'),
        ]
    )]
    public function searchIcd10(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2']);

        $results = $this->examinationService->searchIcd10($request->q);

        return response()->json(['icd10_codes' => $results]);
    }

    // ── Prescription PDF ──

    #[OA\Get(
        path: '/crm/examinations/{id}/prescription-pdf',
        summary: 'Download prescription PDF for an examination',
        security: [['sanctum' => []]],
        tags: ['Examination'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'PDF file download'),
            new OA\Response(response: 404, description: 'Not found'),
        ]
    )]
    public function prescriptionPdf(string $id, Request $request)
    {
        $pdf = $this->prescriptionService->generatePdf($id, $request->user());

        $filename = "prescription_{$id}.pdf";

        return $pdf->download($filename);
    }
}
