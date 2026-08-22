<?php

namespace App\Services;

use App\Models\User;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Mail\VerificationCodeMail;
use App\Notifications\WelcomeNotification;
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

        // Cryptographically random 6-digit verification code
        $verificationCode = (string) random_int(100000, 999999);

        $user = DB::transaction(function () use ($data, $clinicId, $verificationCode) {
            // Determine user_level from role_id
            $roleId = $data['role_id'] ?? 'patient';
            $levelMap = [
                'patient'     => 1,
                'doctor'      => 2,
                'clinicOwner' => 3,
                'clinic'      => 3,
                'hospital'    => 4,
                'superAdmin'  => 5,
                'saasAdmin'   => 5,
            ];

            $user = User::create([
                'email'                   => $data['email'],
                'password'                => $data['password'],
                'fullname'                => $data['fullname'],
                // Müşteri kararı: kullanıcı kayıtta kendi handle'ını seçer;
                // gönderilmediyse (eski istemciler) otomatik üretilir.
                'username'                => isset($data['username']) && $data['username'] !== ''
                    ? strtolower(trim($data['username']))
                    : \App\Support\Username::generate(
                        $data['fullname'],
                        $roleId,
                        $data['clinic_name'] ?? null,
                    ),
                'mobile'                  => $data['mobile'] ?? null,
                'role_id'                 => $roleId,
                'user_level'              => $levelMap[$roleId] ?? 1,
                'city_id'                 => $data['city_id'] ?? null,
                'country_id'              => $data['country_id'] ?? null,
                'date_of_birth'           => $data['date_of_birth'] ?? null,
                'gender'                  => $data['gender'] ?? null,
                // Hesabın varsayılan dili: kayıt anında ekranda açık olan dil.
                // Arayüz metinleri, e-postalar ve bildirimler bu dilde gider.
                'preferred_language'      => $data['preferred_language'] ?? 'en',
                'clinic_id'               => $clinicId,
                'clinic_name'             => $data['clinic_name'] ?? null,
                // Kayıtta gelen serbest metin geçmiş, okuma tarafının beklediği
                // {conditions:[...]} objesine sarmalanır (aksi halde json_decode null döner).
                'medical_history'         => self::wrapInitialMedicalHistory($data['medical_history'] ?? null),
                'guardian_email'          => $data['guardian_email'] ?? null,
                'guardian_consent_at'     => !empty($data['guardian_email']) ? now() : null,
                // KVKK Md. 6 / GDPR Art. 9 — sağlık verisi açık rızası (kim/ne zaman + IP)
                'health_data_consent_at'  => !empty($data['health_data_consent']) ? now() : null,
                'health_data_consent_ip'  => !empty($data['health_data_consent']) ? (request()?->ip()) : null,
                'avatar'                  => null,
                'email_verified'          => false,
                'email_verification_code' => $verificationCode,
            ]);

            // Auto-create Clinic record for clinicOwner registrations
            if (($data['role_id'] ?? 'patient') === 'clinicOwner') {
                $clinicName = $data['clinic_name'] ?? ($data['fullname'] . ' Clinic');
                $clinic = \App\Models\Clinic::create([
                    'name'        => $clinicName,
                    'fullname'    => $clinicName,
                    'codename'    => \Illuminate\Support\Str::slug($clinicName) . '-' . \Illuminate\Support\Str::random(4),
                    'owner_id'    => $user->id,
                    'is_verified' => false,
                    'is_active'   => true,
                ]);
                $user->update(['clinic_id' => $clinic->id]);
            }

            return $user;
        });

        // KVKK Md. 6 / GDPR Art. 9 — sağlık verisi açık rızası verildiyse audit kaydı.
        // Self-register sırasında auth()->id() henüz NULL olduğundan accessor = yeni kullanıcı.
        if (!empty($data['health_data_consent']) && $user->health_data_consent_at) {
            try {
                \App\Models\HealthDataAuditLog::log(
                    accessorId: $user->id,
                    patientId: $user->id,
                    resourceType: 'health_data_consent',
                    resourceId: $user->id,
                    action: 'consent_granted',
                );
                \App\Models\AuditLog::create([
                    'user_id'       => $user->id,
                    'action'        => 'consent_granted',
                    'resource_type' => 'User',
                    'resource_id'   => $user->id,
                    'new_values'    => ['health_data_consent_at' => (string) $user->health_data_consent_at],
                    'ip_address'    => request()?->ip(),
                    'user_agent'    => request()?->userAgent(),
                    'description'   => 'Sağlık verisi açık rızası verildi (KVKK Md. 6 / GDPR Art. 9)',
                    'created_at'    => now(),
                ]);
            } catch (\Throwable $e) {
                \Log::warning('Health data consent audit failed: ' . $e->getMessage());
            }
        }

        // Sürümlü rıza kayıtları — hangi metin sürümünün onaylandığı denetimde ispatlanabilsin.
        try {
            app(\App\Services\ConsentService::class)->recordRegistrationConsents($user, $data);
        } catch (\Throwable $e) {
            \Log::warning('Consent records failed: ' . $e->getMessage());
        }

        // Roles that NEVER need email verification during register:
        //   • hospital    → admin-provisioned accounts
        //   • clinic / clinicOwner → business accounts, verified by admin
        //   • superAdmin / saasAdmin → platform operators
        $roleId = $data['role_id'] ?? 'patient';
        $isAutoVerifyRole = in_array($roleId, ['hospital', 'clinic', 'clinicOwner', 'superAdmin', 'saasAdmin']);

        // In LOCAL environment with log/array mail driver, auto-verify patients and doctors
        // for frictionless testing. NEVER apply this shortcut in production — patients/doctors
        // must always receive a real verification code in production.
        $isDemoMail = app()->environment('local')
            && in_array(config('mail.default'), ['log', 'array']);

        $autoVerified = $isAutoVerifyRole || $isDemoMail;

        if ($autoVerified) {
            $user->update(['email_verified' => true, 'email_verification_code' => null]);
            $user->refresh();
        } else {
            // Only patient and doctor get the verification email
            $this->sendVerificationEmail($user->email, $verificationCode, $user->fullname, $user->preferred_language);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Send welcome email
        try {
            $user->notify(new WelcomeNotification($user->role_id ?? 'patient'));
        } catch (\Throwable $e) {
            \Log::warning('Welcome notification failed: ' . $e->getMessage());
        }

        return ['user' => $user, 'token' => $token, 'auto_verified' => $autoVerified];
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

        // Portal/role guard — a portal login only accepts its own role(s).
        // (superAdmin/saasAdmin may enter through any portal.)
        $expected = $data['expected_role'] ?? null;
        if ($expected) {
            $portalRoles = [
                'patient'  => ['patient'],
                'doctor'   => ['doctor'],
                'clinic'   => ['clinicOwner', 'clinic'],
                'hospital' => ['hospital'],
            ];
            $allowed = $portalRoles[$expected] ?? [];
            $isAdmin = in_array($user->role_id, ['superAdmin', 'saasAdmin'], true);
            if ($allowed && !$isAdmin && !in_array($user->role_id, $allowed, true)) {
                throw ValidationException::withMessages([
                    'email' => ['Bu hesap bu giriş ekranı için uygun değil. Lütfen rolünüze uygun giriş ekranını kullanın.'],
                ]);
            }
        }

        $user->update(['last_login' => now()]);

        // Auto-verify non-patient/non-doctor roles on first login (admin-provisioned or no verification required)
        $noVerificationRoles = ['hospital', 'clinic', 'clinicOwner', 'superAdmin', 'saasAdmin'];
        if (in_array($user->role_id, $noVerificationRoles) && !$user->email_verified) {
            $user->update([
                'email_verified'          => true,
                'email_verification_code' => null,
            ]);
            $user->refresh();
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Login NEVER redirects to email verification — verification is a register-only flow
        // for patients and doctors. All other roles are always auto-verified.
        $requiresEmailVerification = false;

        return [
            'user'                        => $user,
            'token'                       => $token,
            'requires_email_verification' => $requiresEmailVerification,
        ];
    }

    /**
     * Revoke current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Tüm cihazlardan çıkış: kullanıcının bütün oturum jetonlarını siler.
     *
     * Ortak bir bilgisayarda açık kalan oturumu kapatmanın başka yolu yoktu;
     * `logout` yalnızca isteği yapan cihazın jetonunu siliyor, diğerleri
     * açık kalıyordu. Hasta verisine erişen bir hesapta bu gerçek bir açık.
     */
    public function logoutAllDevices(User $user): void
    {
        $user->tokens()->delete();
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
        // Optimise → WebP with thumb/medium/original variants
        $result = ImageService::optimiseAvatar($file, 'avatars');
        $url = $result['url']; // e.g. "/storage/avatars/uuid_medium.webp"

        // Store ONLY the storage-relative path in DB (strip /storage/ prefix)
        $dbPath = preg_replace('#^/storage/#', '', $url); // "avatars/uuid_medium.webp"
        $user->update(['avatar' => $dbPath]);

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

        // Şifre değişince açık tüm oturumlar iptal edilir.
        //
        // Çalınmış bir şifreyle giren kişi, sahibi şifreyi değiştirse bile
        // jetonu elinde durduğu için hasta verisini okumaya devam
        // edebiliyordu — şifre değiştirmek saldırganı dışarı atmıyordu.
        // Yeni jetonu çağıran katman üretir; kullanıcı her cihazda
        // yeniden giriş yapar.
        $user->tokens()->delete();

        // Şifre değişimi hesap sahibine bildirilir: değişikliği yapan kişi
        // hesabın sahibi değilse, öğrenebileceği tek yer bu e-posta.
        // Bildirim atılamazsa şifre değişimi geri alınmaz — yalnızca kaydedilir.
        try {
            $istek = request();
            $user->notify(new \App\Notifications\PasswordChangedNotification(
                $istek?->ip(),
                $istek?->userAgent(),
            ));
        } catch (\Throwable $e) {
            \Log::warning('Password changed notification failed: ' . $e->getMessage());
            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }
        }
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
            'email_verified_at'       => now(),
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

        // Cryptographically random 6-digit resend code
        $code = (string) random_int(100000, 999999);
        $user->update(['email_verification_code' => $code]);

        $this->sendVerificationEmail($user->email, $code, $user->fullname, $user->preferred_language);
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
            Mail::to($user->email)->send(
                new PasswordResetMail($code, $user->fullname, $user->preferred_language),
            );
        } catch (\Throwable $e) {
            // Kullanıcıya hâlâ aynı cevabı veriyoruz (e-posta sayımını
            // engellemek için), ama hata artık yalnızca log dosyasına
            // yazılmıyor: yapılandırma bozukken şifre sıfırlama sessizce
            // ölüyordu ve dışarıdan bakınca çalışıyor gibi görünüyordu.
            \Log::error('Şifre sıfırlama e-postası gönderilemedi', [
                'user_id' => $user->id,
                'mailer'  => config('mail.default'),
                'from'    => config('mail.from.address'),
                'hata'    => $e->getMessage(),
            ]);

            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }
        }
    }

    /**
     * Reset password using code.
     */
    public function resetPassword(string $email, string $code, string $newPassword): void
    {
        $user = User::where('email', $email)->where('is_active', true)->first();

        // Bilinmeyen adres ile yanlış kod AYNI yanıtı vermeli.
        //
        // forgotPassword adres sayımını önlemek için bilerek sessiz kalıyor;
        // burada "User not found." demek o özeni boşa çıkarıyordu: saldırgan
        // uydurma bir kodla sırayla adres deneyip hangilerinin kayıtlı
        // olduğunu ayırt edebiliyordu ("User not found." / "Invalid reset
        // code."). İki durum artık tek ve aynı mesajı döndürüyor.
        if (!$user || !$user->password_reset_code || $user->password_reset_code !== $code) {
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

        // Sıfırlama, oturumu ele geçirilmiş hesabı kurtarmak için var. Mevcut
        // jetonlar ayakta kalırsa saldırgan şifre değişse de içeride kalıyor
        // — yani sıfırlama kendi amacını karşılamıyordu. changePassword bunu
        // zaten yapıyordu; sıfırlama yolu atlanmıştı.
        $user->tokens()->delete();
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

    /** Kayıt anındaki serbest-metin geçmişi {conditions:[...]} JSON'una çevir. */
    private static function wrapInitialMedicalHistory(?string $raw): ?string
    {
        if ($raw === null || trim($raw) === '') return null;
        $conditions = array_values(array_filter(array_map('trim', explode(',', $raw))));
        return json_encode(['conditions' => $conditions, 'medications' => [], 'vaccinations' => [], 'notes' => '']);
    }

    public function getMedicalHistory(User $user): array
    {
        $raw = json_decode($user->medical_history ?? '[]', true);
        // Geriye uyumluluk: eski kayıtlar düz liste (sadece conditions) idi.
        if (is_array($raw) && array_is_list($raw)) {
            $raw = ['conditions' => $raw];
        }
        return [
            'conditions'   => $raw['conditions'] ?? [],
            'medications'  => $raw['medications'] ?? [],
            'vaccinations' => $raw['vaccinations'] ?? [],
            'notes'        => $raw['notes'] ?? '',
        ];
    }

    public function updateMedicalHistory(User $user, array $payload): void
    {
        $old = $this->getMedicalHistory($user);
        $new = [
            'conditions'   => array_values($payload['conditions'] ?? []),
            'medications'  => array_values($payload['medications'] ?? $old['medications']),
            'vaccinations' => array_values($payload['vaccinations'] ?? $old['vaccinations']),
            'notes'        => $payload['notes'] ?? $old['notes'],
        ];
        $user->update(['medical_history' => json_encode($new)]);

        // Aynı ölümcül adlandırılmış argüman: anamnez KAYDEDİLİYOR ama
        // hemen ardından bu çağrı patlıyor ve hasta 500 görüyordu.
        \App\Models\AuditLog::log(
            action: 'medical_history_updated',
            resourceType: 'user',
            resourceId: $user->id,
            oldValues: ['medical_history' => $old],
            newValues: ['medical_history' => $new],
            description: 'Patient updated medical history',
        );
    }

    // ── Notification Preferences ──

    /**
     * Tercihler artık tek noktadan (NotificationPreferences) yönetiliyor.
     * Önceki hâli çalışmıyordu: sütun `encrypted:array` cast'li olduğu için
     * okuma bir diziyi json_decode etmeye çalışıyor, yazma ise ikinci kez
     * json_encode ederek çift kodlanmış veri üretiyordu.
     */
    public function getNotificationPrefs(User $user): array
    {
        return \App\Support\NotificationPreferences::oku($user);
    }

    public function updateNotificationPrefs(User $user, array $prefs): array
    {
        return \App\Support\NotificationPreferences::yaz($user, $prefs);
    }

    // ── Private Helpers ──

    private function sendVerificationEmail(string $email, string $code, string $name, ?string $dil = null): void
    {
        try {
            Mail::to($email)->send(new VerificationCodeMail($code, $name, $dil));
        } catch (\Throwable $e) {
            // Şifre sıfırlamada olduğu gibi: yalnızca log'a yazmak arızayı
            // görünmez kılıyordu. Kayıt olan kullanıcı kodu bekler, biz
            // hiçbir şey olmamış sanırız.
            \Log::error('Doğrulama e-postası gönderilemedi', [
                'mailer' => config('mail.default'),
                'hata'   => $e->getMessage(),
            ]);

            if (app()->bound('sentry')) {
                app('sentry')->captureException($e);
            }
        }
    }
}
