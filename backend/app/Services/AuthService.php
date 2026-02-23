<?php

namespace App\Services;

use App\Models\User;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Mail\VerificationCodeMail;
use Illuminate\Http\UploadedFile;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthService
{
    // ── Registration & Login ──

    /**
     * Register a new user, send verification email, and create token.
     *
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $clinicId = $data['clinic_id'] ?? null;

        $exists = User::where('email', $data['email'])
            ->where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'email' => ['This email is already registered.'],
            ]);
        }

        $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = DB::transaction(function () use ($data, $clinicId, $verificationCode) {
            return User::create([
                'email'                   => $data['email'],
                'password'                => $data['password'],
                'fullname'                => $data['fullname'],
                'mobile'                  => $data['mobile'] ?? null,
                'role_id'                 => $data['role_id'] ?? 'patient',
                'city_id'                 => $data['city_id'] ?? null,
                'country_id'              => $data['country_id'] ?? null,
                'date_of_birth'           => $data['date_of_birth'] ?? null,
                'gender'                  => $data['gender'] ?? null,
                'clinic_id'               => $clinicId,
                'avatar'                  => null,
                'email_verified'          => false,
                'email_verification_code' => $verificationCode,
            ]);
        });

        // In demo/log mode, auto-verify email so users go straight to dashboard
        $isDemoMail = in_array(config('mail.default'), ['log', 'array']);
        if ($isDemoMail) {
            $user->update(['email_verified' => true, 'email_verification_code' => null]);
            $user->refresh();
        } else {
            $this->sendVerificationEmail($user->email, $verificationCode, $user->fullname);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return ['user' => $user, 'token' => $token, 'auto_verified' => $isDemoMail];
    }

    /**
     * Authenticate user and create token.
     *
     * @return array{user: User, token: string, requires_email_verification: bool}
     */
    public function login(array $data): array
    {
        $clinicId = $data['clinic_id'] ?? null;

        $user = User::where('email', $data['email'])
            ->when($clinicId, fn($q) => $q->where('clinic_id', $clinicId))
            ->where('is_active', true)
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email address.'],
            ]);
        }

        if (!Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        $user->update(['last_login' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user'                       => $user,
            'token'                      => $token,
            'requires_email_verification' => !$user->email_verified,
        ];
    }

    /**
     * Revoke current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    // ── Profile ──

    /**
     * Get authenticated user with clinic relation.
     */
    public function getAuthenticatedUser(User $user): User
    {
        return $user->load('clinic');
    }

    /**
     * Update profile fields.
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);

        return $user->refresh();
    }

    /**
     * Store avatar file and update user.
     *
     * @return array{url: string, user: User}
     */
    public function uploadAvatar(User $user, UploadedFile $file): array
    {
        $path = $file->store('avatars', 'public');
        // Use relative URL so it works through Vercel proxy (/storage/...)
        $url  = '/storage/' . $path;

        $user->update(['avatar' => $url]);

        return ['url' => $url, 'user' => $user->refresh()];
    }

    /**
     * Change password after verifying current one.
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $newPassword]);
    }

    // ── Email & Mobile Verification ──

    /**
     * Verify email with 6-digit code.
     */
    public function verifyEmail(User $user, string $code): User
    {
        if ($user->email_verified) {
            return $user;
        }

        if ($user->email_verification_code !== $code) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code.'],
            ]);
        }

        $user->update([
            'email_verified'          => true,
            'email_verification_code' => null,
        ]);

        return $user->refresh();
    }

    /**
     * Resend email verification code.
     */
    public function resendVerification(User $user): void
    {
        if ($user->email_verified) {
            return;
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update(['email_verification_code' => $code]);

        $this->sendVerificationEmail($user->email, $code, $user->fullname);
    }

    /**
     * Verify mobile (placeholder — actual SMS integration pending).
     */
    public function verifyMobile(User $user): void
    {
        $user->update(['mobile_verified' => true]);
    }

    // ── Password Reset ──

    /**
     * Send password reset code to email.
     */
    public function forgotPassword(string $email): void
    {
        $user = User::where('email', $email)->where('is_active', true)->first();

        if (!$user) {
            return; // Silent — prevent email enumeration
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'password_reset_code'       => $code,
            'password_reset_expires_at' => now()->addMinutes(15),
        ]);

        try {
            Mail::to($user->email)->send(new PasswordResetMail($code, $user->fullname));
        } catch (\Throwable $e) {
            \Log::warning('Password reset email failed: ' . $e->getMessage());
        }
    }

    /**
     * Reset password using code.
     */
    public function resetPassword(string $email, string $code, string $newPassword): void
    {
        $user = User::where('email', $email)->where('is_active', true)->first();

        if (!$user) {
            throw ValidationException::withMessages(['email' => ['User not found.']]);
        }

        if (!$user->password_reset_code || $user->password_reset_code !== $code) {
            throw ValidationException::withMessages(['code' => ['Invalid reset code.']]);
        }

        if ($user->password_reset_expires_at && now()->gt($user->password_reset_expires_at)) {
            throw ValidationException::withMessages(['code' => ['Reset code has expired. Please request a new one.']]);
        }

        $user->update([
            'password'                  => $newPassword,
            'password_reset_code'       => null,
            'password_reset_expires_at' => null,
        ]);
    }

    // ── GDPR ──

    /**
     * Soft-delete account and anonymize PII (GDPR Art. 17).
     */
    public function deleteAccount(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->update([
                'is_active'      => false,
                'email'          => 'deleted_' . $user->id . '@removed.medagama.com',
                'fullname'       => 'Deleted User',
                'avatar'         => null,
                'mobile'         => null,
                'mobile_verified' => false,
                'email_verified'  => false,
            ]);

            $user->tokens()->delete();

            MedStreamPost::where('author_id', $user->id)->update(['is_active' => false]);
            MedStreamComment::where('author_id', $user->id)->update(['is_active' => false]);
            MedStreamLike::where('user_id', $user->id)->update(['is_active' => false]);
            MedStreamBookmark::where('user_id', $user->id)->update(['is_active' => false]);
        });

        \Log::info('GDPR: Account deleted (soft)', ['user_id' => $user->id]);
    }

    /**
     * Export all user data (GDPR Art. 20).
     */
    public function exportData(User $user): array
    {
        return [
            'export_date'  => now()->toISOString(),
            'gdpr_export'  => true,
            'user'         => [
                'id'         => $user->id,
                'fullname'   => $user->fullname,
                'email'      => $user->email,
                'mobile'     => $user->mobile,
                'role'       => $user->role_id,
                'avatar'     => $user->avatar,
                'created_at' => $user->created_at,
                'last_login' => $user->last_login,
            ],
            'posts'           => $user->medStreamPosts()->select('id', 'content', 'post_type', 'media_url', 'created_at')->get(),
            'comments'        => MedStreamComment::where('author_id', $user->id)->select('id', 'post_id', 'content', 'created_at')->get(),
            'likes'           => MedStreamLike::where('user_id', $user->id)->where('is_active', true)->select('post_id', 'created_at')->get(),
            'bookmarks'       => $user->bookmarks()->where('is_active', true)->select('bookmarked_type', 'target_id', 'created_at')->get(),
            'medical_history' => json_decode($user->medical_history ?? '[]', true),
        ];
    }

    // ── Medical History ──

    public function getMedicalHistory(User $user): array
    {
        return json_decode($user->medical_history ?? '[]', true);
    }

    public function updateMedicalHistory(User $user, array $conditions): void
    {
        $user->update(['medical_history' => json_encode($conditions)]);
    }

    // ── Notification Preferences ──

    public function getNotificationPrefs(User $user): array
    {
        return json_decode($user->notification_preferences ?? '{}', true);
    }

    public function updateNotificationPrefs(User $user, array $prefs): void
    {
        $user->update([
            'notification_preferences' => json_encode($prefs),
        ]);
    }

    // ── Private Helpers ──

    private function sendVerificationEmail(string $email, string $code, string $name): void
    {
        try {
            Mail::to($email)->send(new VerificationCodeMail($code, $name));
        } catch (\Throwable $e) {
            \Log::warning('Verification email failed: ' . $e->getMessage());
        }
    }
}
