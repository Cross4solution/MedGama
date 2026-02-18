<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Mail\VerificationCodeMail;
use App\Mail\PasswordResetMail;

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

        $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

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
            'email_verified' => false,
            'email_verification_code' => $verificationCode,
        ]);

        // Send verification email
        try {
            Mail::to($user->email)->send(new VerificationCodeMail($verificationCode, $user->fullname));
        } catch (\Throwable $e) {
            // Log but don't block registration if mail fails
            \Log::warning('Verification email failed: ' . $e->getMessage());
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'requires_email_verification' => true,
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

        // Check email verification
        if (!$user->email_verified) {
            return response()->json([
                'user' => $user,
                'token' => $token,
                'requires_email_verification' => true,
                'message' => 'Please verify your email address.',
            ]);
        }

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
     * POST /api/auth/profile/avatar
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|file|image|max:5120', // 5MB max
        ]);

        $file = $request->file('avatar');
        $path = $file->store('avatars', 'public');
        $url = asset('storage/' . $path);

        $request->user()->update(['avatar' => $url]);

        return response()->json([
            'avatar_url' => $url,
            'url' => $url,
            'user' => $request->user()->fresh(),
        ]);
    }

    /**
     * PUT /api/auth/profile/password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6',
            'password_confirmation' => 'required|string|same:password',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * POST /api/auth/verify-email
     */
    public function verifyEmail(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user = $request->user();

        if ($user->email_verified) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->email_verification_code !== $request->code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->update([
            'email_verified' => true,
            'email_verification_code' => null,
        ]);

        return response()->json(['message' => 'Email verified successfully.', 'user' => $user->fresh()]);
    }

    /**
     * POST /api/auth/resend-verification
     */
    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update(['email_verification_code' => $code]);

        try {
            Mail::to($user->email)->send(new VerificationCodeMail($code, $user->fullname));
        } catch (\Throwable $e) {
            \Log::warning('Resend verification email failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Verification code resent.']);
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

        $user = User::where('email', $request->email)->where('is_active', true)->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return response()->json(['message' => 'If this email exists, a reset code has been sent.']);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'password_reset_code' => $code,
            'password_reset_expires_at' => now()->addMinutes(15),
        ]);

        try {
            Mail::to($user->email)->send(new PasswordResetMail($code, $user->fullname));
        } catch (\Throwable $e) {
            \Log::warning('Password reset email failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'If this email exists, a reset code has been sent.']);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if (!$user->password_reset_code || $user->password_reset_code !== $request->code) {
            throw ValidationException::withMessages(['code' => ['Invalid reset code.']]);
        }

        if ($user->password_reset_expires_at && now()->gt($user->password_reset_expires_at)) {
            throw ValidationException::withMessages(['code' => ['Reset code has expired. Please request a new one.']]);
        }

        $user->update([
            'password' => $request->password,
            'password_reset_code' => null,
            'password_reset_expires_at' => null,
        ]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    // ── GDPR & Privacy ──

    /**
     * DELETE /api/auth/profile — Account deletion (GDPR Art. 17)
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        // Soft-delete: deactivate account and anonymize PII
        $user->update([
            'is_active' => false,
            'email' => 'deleted_' . $user->id . '@removed.medgama.com',
            'fullname' => 'Deleted User',
            'avatar' => null,
            'mobile' => null,
            'mobile_verified' => false,
            'email_verified' => false,
        ]);

        // Revoke all tokens
        $user->tokens()->delete();

        // Soft-delete related data
        MedStreamPost::where('author_id', $user->id)->update(['is_active' => false]);
        MedStreamComment::where('author_id', $user->id)->update(['is_active' => false]);
        MedStreamLike::where('user_id', $user->id)->update(['is_active' => false]);
        MedStreamBookmark::where('user_id', $user->id)->update(['is_active' => false]);

        \Log::info('GDPR: Account deleted (soft)', ['user_id' => $user->id]);

        return response()->json(['message' => 'Account and data deleted successfully.']);
    }

    /**
     * GET /api/auth/profile/data-export — GDPR data portability (Art. 20)
     */
    public function dataExport(Request $request)
    {
        $user = $request->user();

        $export = [
            'export_date' => now()->toISOString(),
            'gdpr_export' => true,
            'user' => [
                'id' => $user->id,
                'fullname' => $user->fullname,
                'email' => $user->email,
                'mobile' => $user->mobile,
                'role' => $user->role_id,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at,
                'last_login' => $user->last_login,
            ],
            'posts' => $user->medStreamPosts()->select('id', 'content', 'post_type', 'media_url', 'created_at')->get(),
            'comments' => MedStreamComment::where('author_id', $user->id)->select('id', 'post_id', 'content', 'created_at')->get(),
            'likes' => MedStreamLike::where('user_id', $user->id)->where('is_active', true)->select('post_id', 'created_at')->get(),
            'bookmarks' => $user->bookmarks()->where('is_active', true)->select('bookmarked_type', 'target_id', 'created_at')->get(),
            'medical_history' => json_decode($user->medical_history ?? '[]', true),
        ];

        return response()->json($export);
    }

    /**
     * GET /api/auth/profile/medical-history
     */
    public function getMedicalHistory(Request $request)
    {
        $user = $request->user();
        $conditions = json_decode($user->medical_history ?? '[]', true);

        return response()->json(['conditions' => $conditions]);
    }

    /**
     * PUT /api/auth/profile/medical-history
     */
    public function updateMedicalHistory(Request $request)
    {
        $request->validate([
            'conditions' => 'required|array',
            'conditions.*' => 'string|max:255',
        ]);

        $request->user()->update([
            'medical_history' => json_encode($request->conditions),
        ]);

        return response()->json(['message' => 'Medical history updated.', 'conditions' => $request->conditions]);
    }

    /**
     * GET /api/auth/profile/notification-preferences
     */
    public function getNotificationPrefs(Request $request)
    {
        $user = $request->user();
        $prefs = json_decode($user->notification_preferences ?? '{}', true);

        return response()->json(['preferences' => $prefs]);
    }

    /**
     * PUT /api/auth/profile/notification-preferences
     */
    public function updateNotificationPrefs(Request $request)
    {
        $request->validate([
            'email_notifications' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
            'push_notifications' => 'sometimes|boolean',
            'appointment_reminders' => 'sometimes|boolean',
            'marketing_messages' => 'sometimes|boolean',
        ]);

        $request->user()->update([
            'notification_preferences' => json_encode($request->only([
                'email_notifications', 'sms_notifications', 'push_notifications',
                'appointment_reminders', 'marketing_messages',
            ])),
        ]);

        return response()->json(['message' => 'Notification preferences updated.']);
    }
}
