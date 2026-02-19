<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\UploadAvatarRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Http\Requests\Auth\VerifyMobileRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateMedicalHistoryRequest;
use App\Http\Requests\Auth\UpdateNotificationPrefsRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    #[OA\Post(
        path: '/auth/register',
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['fullname', 'email', 'password', 'password_confirmation', 'role_id'],
                properties: [
                    new OA\Property(property: 'fullname', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'password', type: 'string', minLength: 8),
                    new OA\Property(property: 'password_confirmation', type: 'string'),
                    new OA\Property(property: 'role_id', type: 'string', enum: ['patient', 'doctor']),
                    new OA\Property(property: 'mobile', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'User registered, token returned'),
            new OA\Response(response: 422, description: 'Validation error', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return (new UserResource($result['user']))
            ->withExtra([
                'token'                      => $result['token'],
                'requires_email_verification' => true,
            ])
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Post(
        path: '/auth/login',
        summary: 'Login and receive Bearer token',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'password', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Login successful — returns user + token'),
            new OA\Response(response: 401, description: 'Invalid credentials', content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')),
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        $extra = ['token' => $result['token']];

        if ($result['requires_email_verification']) {
            $extra['requires_email_verification'] = true;
            $extra['message'] = 'Please verify your email address.';
        }

        return (new UserResource($result['user']))
            ->withExtra($extra)
            ->response();
    }

    #[OA\Post(
        path: '/auth/logout',
        summary: 'Logout (revoke current token)',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Logged out'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => 'Logged out successfully.']);
    }

    #[OA\Get(
        path: '/auth/me',
        summary: 'Get authenticated user profile',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [
            new OA\Response(response: 200, description: 'Current user data with relations'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->getAuthenticatedUser($request->user());

        return (new UserResource($user))->response();
    }

    #[OA\Put(
        path: '/auth/profile',
        summary: 'Update user profile',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'fullname', type: 'string'),
                    new OA\Property(property: 'mobile', type: 'string'),
                    new OA\Property(property: 'gender', type: 'string'),
                    new OA\Property(property: 'date_of_birth', type: 'string', format: 'date'),
                    new OA\Property(property: 'preferred_language', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Profile updated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return (new UserResource($user))->response();
    }

    #[OA\Post(
        path: '/auth/profile/avatar',
        summary: 'Upload avatar image',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    properties: [new OA\Property(property: 'avatar', type: 'string', format: 'binary')]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Avatar uploaded, URL returned'),
        ]
    )]
    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $result = $this->authService->uploadAvatar($request->user(), $request->file('avatar'));

        return (new UserResource($result['user']))
            ->withExtra([
                'avatar_url' => $result['url'],
                'url'        => $result['url'],
            ])
            ->response();
    }

    #[OA\Put(
        path: '/auth/profile/password',
        summary: 'Change password',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['current_password', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'current_password', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', minLength: 8),
                    new OA\Property(property: 'password_confirmation', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Password changed'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->authService->changePassword(
            $request->user(),
            $request->validated('current_password'),
            $request->validated('password'),
        );

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * POST /api/auth/verify-email
     */
    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        $user = $this->authService->verifyEmail($request->user(), $request->validated('code'));

        return (new UserResource($user))
            ->withExtra(['message' => 'Email verified successfully.'])
            ->response();
    }

    /**
     * POST /api/auth/resend-verification
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $this->authService->resendVerification($request->user());

        return response()->json(['message' => 'Verification code resent.']);
    }

    /**
     * POST /api/auth/verify-mobile
     */
    public function verifyMobile(VerifyMobileRequest $request): JsonResponse
    {
        $this->authService->verifyMobile($request->user());

        return response()->json(['message' => 'Mobile verified successfully.']);
    }

    #[OA\Post(
        path: '/auth/forgot-password',
        summary: 'Request password reset code',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [new OA\Property(property: 'email', type: 'string', format: 'email')]
            )
        ),
        responses: [new OA\Response(response: 200, description: 'Reset code sent if email exists')]
    )]
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->forgotPassword($request->validated('email'));

        return response()->json(['message' => 'If this email exists, a reset code has been sent.']);
    }

    #[OA\Post(
        path: '/auth/reset-password',
        summary: 'Reset password with code',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'code', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'code', type: 'string'),
                    new OA\Property(property: 'password', type: 'string'),
                    new OA\Property(property: 'password_confirmation', type: 'string'),
                ]
            )
        ),
        responses: [new OA\Response(response: 200, description: 'Password reset successful')]
    )]
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword(
            $request->validated('email'),
            $request->validated('code'),
            $request->validated('password'),
        );

        return response()->json(['message' => 'Password reset successfully.']);
    }

    // ── GDPR & Privacy ──

    #[OA\Delete(
        path: '/auth/profile',
        summary: 'Delete account (GDPR Art. 17 — Right to Erasure)',
        description: 'Soft-deletes user account. Data permanently pruned after 3-year retention period.',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [new OA\Response(response: 200, description: 'Account soft-deleted')]
    )]
    public function deleteAccount(Request $request): JsonResponse
    {
        $this->authService->deleteAccount($request->user());

        return response()->json(['message' => 'Account and data deleted successfully.']);
    }

    #[OA\Get(
        path: '/auth/profile/data-export',
        summary: 'Export personal data (GDPR Art. 20 — Data Portability)',
        description: 'Returns full JSON export of all personal data including profile, appointments, medical history.',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [new OA\Response(response: 200, description: 'JSON export of all personal data')]
    )]
    public function dataExport(Request $request): JsonResponse
    {
        $export = $this->authService->exportData($request->user());

        return response()->json($export);
    }

    #[OA\Get(
        path: '/auth/profile/medical-history',
        summary: 'Get medical history (encrypted at rest — AES-256-CBC)',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [new OA\Response(response: 200, description: 'Medical history data (auto-decrypted)')]
    )]
    public function getMedicalHistory(Request $request): JsonResponse
    {
        $conditions = $this->authService->getMedicalHistory($request->user());

        return response()->json(['conditions' => $conditions]);
    }

    #[OA\Put(
        path: '/auth/profile/medical-history',
        summary: 'Update medical history (encrypted at rest)',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [new OA\Property(property: 'conditions', type: 'array', items: new OA\Items(type: 'string'))]
            )
        ),
        responses: [new OA\Response(response: 200, description: 'Medical history updated')]
    )]
    public function updateMedicalHistory(UpdateMedicalHistoryRequest $request): JsonResponse
    {
        $this->authService->updateMedicalHistory($request->user(), $request->validated('conditions'));

        return response()->json([
            'message'    => 'Medical history updated.',
            'conditions' => $request->validated('conditions'),
        ]);
    }

    #[OA\Get(
        path: '/auth/profile/notification-preferences',
        summary: 'Get notification preferences',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [new OA\Response(response: 200, description: 'Notification preferences')]
    )]
    public function getNotificationPrefs(Request $request): JsonResponse
    {
        $prefs = $this->authService->getNotificationPrefs($request->user());

        return response()->json(['preferences' => $prefs]);
    }

    #[OA\Put(
        path: '/auth/profile/notification-preferences',
        summary: 'Update notification preferences',
        security: [['sanctum' => []]],
        tags: ['Auth'],
        responses: [new OA\Response(response: 200, description: 'Preferences updated')]
    )]
    public function updateNotificationPrefs(UpdateNotificationPrefsRequest $request): JsonResponse
    {
        $this->authService->updateNotificationPrefs($request->user(), $request->validated());

        return response()->json(['message' => 'Notification preferences updated.']);
    }
}
