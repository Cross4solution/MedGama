<?php

namespace App\Services;

use App\Models\User;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\ContactMessage;
use App\Models\DoctorReview;
use App\Models\PatientDocument;
use App\Models\ConsentRecord;
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
            // Rol → seviye eşlemesi User::SEVIYELER içinde; iki kopya
            // birbirinden ayrı düşüp yetkileri kaydırmıştı.

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
                'user_level'              => User::seviyeIcin($roleId),
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
                    // `is_active` Clinic'te toplu atamaya kapalı; sütunun
                    // varsayılanı zaten aktif. Diziye yazmak onu sessizce
                    // düşürüyordu — yani satır hiçbir zaman bir şey yapmadı.
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

        // Hesap yok ve parola yanlış AYNI yanıtı vermeli.
        //
        // Eskiden ikisi ayrılıyordu: olmayan e-posta "No account found with this
        // email address.", var olan e-posta + yanlış parola ise "The password you
        // entered is incorrect." Aradaki fark, bir e-postanın burada KAYITLI OLUP
        // OLMADIĞINI dışarıdan sınanabilir kılıyordu. Tıbbi bir platformda bu
        // bilginin kendisi hassas: birinin burada hesabı olması, tedavi arıyor
        // olduğunu ima eder.
        //
        // Aynı ilke parola sıfırlamada zaten uygulanıyor ("şifre sıfırlama
        // bağlantısı, e-posta kayıtlıysa gönderildi"); giriş hizalanmamıştı.
        //
        // Mesaj İKİ alana birden yazılıyor: hem yanıt hesabın varlığından
        // bağımsız olarak birebir aynı kalıyor, hem de formda iki alan da
        // işaretlenip kullanıcıya hangisini düzelteceği konusunda yanlış yön
        // verilmiyor.
        $kimlikHatasi = fn () => ValidationException::withMessages([
            'email'    => ['Email or password is incorrect.'],
            'password' => ['Email or password is incorrect.'],
        ]);

        if (!$user) {
            throw $kimlikHatasi();
        }

        if (!Hash::check($data['password'], $user->password)) {
            throw $kimlikHatasi();
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
            // Anonimleştirme KİŞİSEL VERİYİ de kapsamalı. Önceki hâli yalnız
            // e-posta, ad, avatar ve telefonu temizliyordu; silme talebinden
            // sonra şunlar duruyordu (ölçüldü):
            //
            //   medical_history  → tanılar, ilaçlar, notlar (ÖZEL NİTELİKLİ)
            //   date_of_birth    → kimlik belirleyici
            //   username         → herkese açık handle, kişiyi işaret ediyor
            //   bio              → kullanıcının kendi yazdığı serbest metin
            //   latitude/longitude → ev konumu
            //
            // Buradaki `medical_history` HASTANIN KENDİ BEYANI; sağlayıcının
            // tuttuğu klinik kayıtlar (PatientRecord, muayeneler) yasal
            // saklama süresine tabi ve BİLEREK dokunulmuyor.
            //
            // Handle boşaltılmıyor, anonim bir değerle DEĞİŞTİRİLİYOR: null
            // bırakmak onu yeniden alınabilir yapardı ve eski bağlantılar
            // başka bir kişiyi gösterirdi.
            $user->update([
                'is_active'      => false,
                'email'          => 'deleted_' . $user->id . '@removed.medagama.com',
                'fullname'       => 'Deleted User',
                'username'       => 'silinmis_' . substr(str_replace('-', '', (string) $user->id), 0, 16),
                'avatar'         => null,
                'profile_image'  => null,
                'cover_image'    => null,
                'bio'            => null,
                'mobile'         => null,
                'mobile_verified' => false,
                'email_verified'  => false,
                'medical_history' => null,
                'date_of_birth'   => null,
                'gender'          => null,
                'latitude'        => null,
                'longitude'       => null,
                'location_updated_at' => null,
            ]);

            $user->tokens()->delete();

            MedStreamPost::where('author_id', $user->id)->update(['is_active' => false]);
            MedStreamComment::where('author_id', $user->id)->update(['is_active' => false]);
            MedStreamLike::where('user_id', $user->id)->update(['is_active' => false]);
            MedStreamBookmark::where('user_id', $user->id)->update(['is_active' => false]);

            // ── Yasal dayanağı OLMAYAN serbest metinler siliniyor ──────────
            //
            // Silme talebinden sonra şunlar duruyordu (ölçüldü): sohbet
            // mesajlarının gövdesi, iletişim kutusuna yazdıkları ve
            // değerlendirme metinleri. Üçü de kullanıcının kendi yazdığı
            // serbest metin ve hiçbirinin saklanması için bir yükümlülük yok.
            //
            // Satırlar kalıyor, İÇERİK gidiyor: karşı tarafın sohbet akışı
            // kopmasın, ama silinen kişinin sözleri ortada kalmasın.
            //
            // Ne SİLİNMEDİĞİ en az bunun kadar önemli — aşağısı bilinçli:
            //
            //   randevular + patient_medical_snapshot → tıbbi kayıt
            //   hasta belgeleri                        → tıbbi kayıt
            //   faturalar                              → vergi/ticaret hukuku
            //   rıza kayıtları                         → rızanın kanıtı
            //
            // GDPR md. 17(3)(b) ve (e) silme hakkını tam olarak bu durumlarda
            // sınırlıyor; KVKK md. 7 de saklama yükümlülüğü olan veriyi ayrı
            // tutuyor. SÜRELER mevzuata göre değişir ve burada belirlenmiyor.
            // Sütunlar NOT NULL; içerik boşaltılıyor, satır duruyor.
            //
            // Mesaj gövdesi `encrypted` cast'li: sorgu kurucusuyla yazmak
            // şifrelemeyi ATLAR ve satır bir daha okunamaz hâle gelir
            // (`DecryptException`). Model üzerinden yazılıyor ki cast çalışsın.
            Message::where('sender_id', $user->id)
                ->chunkById(200, function ($mesajlar) {
                    foreach ($mesajlar as $mesaj) {
                        $mesaj->body = '';
                        $mesaj->is_active = false;
                        $mesaj->save();
                    }
                });

            ContactMessage::where('sender_id', $user->id)->update([
                'subject' => 'Silinmiş mesaj',
                'body'    => '',
            ]);

            // Değerlendirmeler MedStream gönderileriyle aynı muameleyi görüyor:
            // ikisi de kullanıcının yayımladığı içerik.
            $degerlendirmeler = DoctorReview::where('patient_id', $user->id)->get();
            DoctorReview::where('patient_id', $user->id)->update([
                'comment'    => '',
                'is_visible' => false,
            ]);
            foreach ($degerlendirmeler->pluck('doctor_id')->unique() as $hekimId) {
                DoctorReview::recalculateAggregatedRating($hekimId);
            }
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

            // ── Aşağıdakiler eskiden dışa aktarmada YOKTU ───────────────────
            //
            // Dosya "gdpr_export" diyordu ama yalnız profil, gönderi, beğeni ve
            // yer imi taşıyordu. Kullanıcının platformdaki asıl izi — kiminle
            // ne zaman randevusu olduğu, ne ödediği, ne yazdığı, neye rıza
            // verdiği — hiç çıkmıyordu. GDPR md. 15 ve 20 bunların hepsini
            // istiyor; KVKK md. 11 de aynı kapsamda.
            //
            // Bu uç bozulduğunda kimse fark etmez: kullanıcı bir kez kullanır,
            // eksik olduğunu anlamaz. Denetimde ortaya çıkar.

            // Hem hasta hem hekim tarafı: aynı kişi ikisinde de olabilir.
            'appointments' => Appointment::query()
                ->where('patient_id', $user->id)
                ->orWhere('doctor_id', $user->id)
                ->select('id', 'patient_id', 'doctor_id', 'clinic_id', 'appointment_type',
                    'starts_at', 'timezone', 'status', 'doctor_note', 'created_at')
                ->orderByDesc('created_at')
                ->get(),

            'invoices' => Invoice::query()
                ->where('patient_id', $user->id)
                ->orWhere('doctor_id', $user->id)
                ->select('id', 'invoice_number', 'grand_total', 'currency', 'status',
                    'payment_method', 'issue_date', 'due_date', 'paid_at', 'created_at')
                ->orderByDesc('created_at')
                ->get(),

            // YALNIZ kendi yazdıkları.
            //
            // Sohbetin tamamını vermek karşı tarafın mesajlarını da açardı —
            // yani bir kişinin veri talebi, başka birinin verisini teslim
            // etmek olurdu. Erişim hakkı kişinin KENDİ verisini kapsıyor.
            'messages_sent' => Message::query()
                ->where('sender_id', $user->id)
                ->where('is_active', true)
                ->select('id', 'conversation_id', 'body', 'type', 'created_at')
                ->orderByDesc('created_at')
                ->get(),

            'contact_messages_sent' => ContactMessage::query()
                ->where('sender_id', $user->id)
                ->select('id', 'receiver_type', 'subject', 'body', 'created_at')
                ->orderByDesc('created_at')
                ->get(),

            'reviews_written' => DoctorReview::query()
                ->where('patient_id', $user->id)
                ->select('id', 'doctor_id', 'rating', 'comment', 'treatment_type', 'created_at')
                ->orderByDesc('created_at')
                ->get(),

            // Belgelerin KENDİSİ değil, kaydı: dosyalar şifreli diskte ve
            // imzalı bağlantıyla iniyor. Liste hangi belgenin durduğunu
            // söylüyor, indirme mevcut uçtan yapılıyor.
            'documents' => PatientDocument::query()
                ->where('patient_id', $user->id)
                ->where('is_active', true)
                ->select('id', 'title', 'description', 'category', 'file_name',
                    'mime_type', 'file_size', 'document_date', 'created_at')
                ->orderByDesc('created_at')
                ->get(),

            // Neye, ne zaman, hangi metin sürümüne rıza verildiği.
            'consents' => ConsentRecord::query()
                ->where('user_id', $user->id)
                ->select('type', 'version', 'granted_at', 'revoked_at', 'source', 'locale')
                ->orderByDesc('granted_at')
                ->get(),
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
