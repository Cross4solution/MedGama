<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ClinicManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicManagerController extends Controller
{
    public function __construct(private ClinicManagerService $service) {}

    /**
     * GET /api/clinic-manager/overview
     */
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->service->authorizeManager($user);
        return response()->json($this->service->overview($user));
    }

    /**
     * GET /api/clinic-manager/doctors
     */
    public function doctors(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->service->authorizeManager($user);
        return response()->json($this->service->doctors($user, $request->all()));
    }

    /**
     * GET /api/clinic-manager/doctors/{doctorId}
     */
    public function doctorDetail(Request $request, string $doctorId): JsonResponse
    {
        $user = $request->user();
        $this->service->authorizeManager($user);
        return response()->json($this->service->doctorDetail($user, $doctorId));
    }

    /**
     * POST /api/clinic-manager/doctors/{doctorId}/add
     */
    public function addDoctor(Request $request, string $doctorId): JsonResponse
    {
        $user = $request->user();
        $this->service->authorizeManager($user);
        $doctor = $this->service->addDoctor($user, $doctorId);
        return response()->json($doctor);
    }

    /**
     * DELETE /api/clinic-manager/doctors/{doctorId}/remove
     */
    public function removeDoctor(Request $request, string $doctorId): JsonResponse
    {
        $user = $request->user();
        $this->service->authorizeManager($user);
        $this->service->removeDoctor($user, $doctorId);
        return response()->json(['message' => 'Doctor removed from clinic']);
    }

    /**
     * PUT /api/clinic-manager/doctors/{doctorId}/hours
     */
    public function updateDoctorHours(Request $request, string $doctorId): JsonResponse
    {
        $data = $request->validate([
            'operating_hours'   => 'required|array|size:7',
            'operating_hours.*' => 'array',
        ]);

        $user = $request->user();
        $this->service->authorizeManager($user);
        $profile = $this->service->updateDoctorHours($user, $doctorId, $data['operating_hours']);
        return response()->json($profile);
    }

    /**
     * GET /api/clinic-manager/financials
     */
    public function financials(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->service->authorizeManager($user);
        return response()->json($this->service->financials($user, $request->all()));
    }
}
