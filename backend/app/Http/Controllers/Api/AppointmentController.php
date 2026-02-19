<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\HealthDataAuditLog;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;

class AppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService,
    ) {}

    #[OA\Get(
        path: '/appointments',
        summary: 'List appointments (scoped by authenticated user role)',
        security: [['sanctum' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'])),
            new OA\Parameter(name: 'date', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'doctor_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'patient_id', in: 'query', schema: new OA\Schema(type: 'string', format: 'uuid')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer', default: 20)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated appointments (AppointmentResource)'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $appointments = $this->appointmentService->list(
            $request->user(),
            $request->only(['status', 'date', 'doctor_id', 'patient_id', 'per_page']),
        );

        return AppointmentResource::collection($appointments);
    }

    #[OA\Get(
        path: '/appointments/{appointment}',
        summary: 'Show appointment detail (HIPAA-audited)',
        description: 'Access is logged to health_data_audit_logs table. doctor_note and confirmation_note are encrypted at rest (AES-256-CBC).',
        security: [['sanctum' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'appointment', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Appointment detail (AppointmentResource)'),
            new OA\Response(response: 403, description: 'Not a participant', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
            new OA\Response(response: 404, description: 'Not found'),
        ]
    )]
    public function show(Appointment $appointment, Request $request): JsonResponse
    {
        $this->authorize('view', $appointment);

        $appointment->load(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname', 'slot']);

        // HIPAA/GDPR Audit: log health data access
        HealthDataAuditLog::log(
            accessorId: $request->user()->id,
            patientId: $appointment->patient_id,
            resourceType: 'appointment',
            resourceId: $appointment->id,
        );

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Post(
        path: '/appointments',
        summary: 'Create appointment (locks calendar slot atomically)',
        security: [['sanctum' => []]],
        tags: ['Appointments'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['doctor_id', 'appointment_type', 'slot_id', 'appointment_date', 'appointment_time'],
                properties: [
                    new OA\Property(property: 'doctor_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'patient_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'clinic_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'appointment_type', type: 'string', enum: ['inPerson', 'online']),
                    new OA\Property(property: 'slot_id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'appointment_date', type: 'string', format: 'date'),
                    new OA\Property(property: 'appointment_time', type: 'string', example: '14:30'),
                    new OA\Property(property: 'confirmation_note', type: 'string', description: 'Encrypted at rest'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Appointment created (AppointmentResource)'),
            new OA\Response(response: 422, description: 'Validation error / slot unavailable', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->appointmentService->store(
            $request->user(),
            $request->validated(),
            $request->isCreatedByDoctor(),
        );

        return (new AppointmentResource($appointment->load(['patient:id,fullname,avatar', 'doctor:id,fullname,avatar'])))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Put(
        path: '/appointments/{appointment}',
        summary: 'Update appointment (status, notes, video link)',
        security: [['sanctum' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'appointment', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed']),
                    new OA\Property(property: 'doctor_note', type: 'string', description: 'Encrypted at rest (AES-256-CBC)'),
                    new OA\Property(property: 'confirmation_note', type: 'string', description: 'Encrypted at rest'),
                    new OA\Property(property: 'video_conference_link', type: 'string', format: 'uri'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Appointment updated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('update', $appointment);

        $appointment = $this->appointmentService->update(
            $request->user(),
            $appointment,
            $request->validated(),
        );

        return (new AppointmentResource($appointment))->response();
    }

    #[OA\Delete(
        path: '/appointments/{appointment}',
        summary: 'Soft-delete appointment (slot released, GDPR: pruned after 10 years)',
        security: [['sanctum' => []]],
        tags: ['Appointments'],
        parameters: [
            new OA\Parameter(name: 'appointment', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Appointment soft-deleted'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function destroy(Appointment $appointment): JsonResponse
    {
        $this->authorize('delete', $appointment);

        $this->appointmentService->destroy($appointment);

        return response()->json(['message' => 'Appointment deleted.']);
    }
}
