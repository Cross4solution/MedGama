<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'fullname' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'role_id' => 'sometimes|in:patient,doctor,clinicOwner',
            'city_id' => 'sometimes|integer',
            'country_id' => 'sometimes|integer',
            'date_of_birth' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female,other',
            'clinic_id' => 'sometimes|uuid',
        ]);

        // Check unique email per clinic
        $clinicId = $validated['clinic_id'] ?? null;
        $exists = User::where('email', $validated['email'])
            ->where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }

        $user = User::create([
            'email' => $validated['email'],
            'password' => $validated['password'],
            'fullname' => $validated['fullname'],
            'mobile' => $validated['mobile'] ?? null,
            'role_id' => $validated['role_id'] ?? 'patient',
            'city_id' => $validated['city_id'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'clinic_id' => $clinicId,
            'avatar' => 'https://gravatar.com/avatar/' . md5(strtolower($validated['email'])) . '?s=200&d=identicon',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'clinic_id' => 'sometimes|uuid',
        ]);

        $clinicId = $validated['clinic_id'] ?? null;

        $user = User::where('email', $validated['email'])
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->where('is_active', true)
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login
        $user->update(['last_login' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request)
    {
        $user = $request->user()->load('clinic');

        return response()->json(['user' => $user]);
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'fullname' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|string|url',
            'mobile' => 'sometimes|string|max:20',
            'city_id' => 'sometimes|integer',
            'country_id' => 'sometimes|integer',
            'date_of_birth' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female,other',
        ]);

        $request->user()->update($validated);

        return response()->json(['user' => $request->user()->fresh()]);
    }

    /**
     * POST /api/auth/verify-email
     */
    public function verifyEmail(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        // TODO: Implement actual verification code logic
        $user = $request->user();
        $user->update(['email_verified' => true]);

        return response()->json(['message' => 'Email verified successfully.']);
    }

    /**
     * POST /api/auth/verify-mobile
     */
    public function verifyMobile(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        // TODO: Implement actual verification code logic
        $user = $request->user();
        $user->update(['mobile_verified' => true]);

        return response()->json(['message' => 'Mobile verified successfully.']);
    }

    /**
     * POST /api/auth/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // TODO: Send password reset code via email/SMS
        return response()->json(['message' => 'Password reset code sent.']);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // TODO: Verify reset code
        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
