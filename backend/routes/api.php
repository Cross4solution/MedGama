<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PatientRecordController;
use App\Http\Controllers\Api\DigitalAnamnesisController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\MedStreamController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\DoctorProfileController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\MediaStreamController;
use App\Http\Controllers\Api\ClinicAnalyticsController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\TelehealthController;
use App\Http\Controllers\Api\PatientDocumentController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\ClinicManagerController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SocialController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\ClinicVerificationController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\BranchController;

/*
|--------------------------------------------------------------------------
| Health Check (Railway / Load Balancer) — NO DB dependency
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    return response('ok', 200)->header('Content-Type', 'text/plain');
});

// ╔══════════════════════════════════════════════════════════════════╗
// ║  TEMPORARY: One-time DB seed route — DELETE AFTER USE           ║
// ║  Usage: GET or POST /api/system/init-db?key=MedaGama2026SecretInit ║
// ╚══════════════════════════════════════════════════════════════════╝
Route::match(['get', 'post'], '/system/init-db', function (\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'MedaGama2026SecretInit') {
        return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
    }
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', [
            '--force' => true,
        ]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('db:seed', [
            '--force' => true,
        ]);
        $seedOutput = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'status' => 'success',
            'message' => 'Database migrated and seeded successfully.',
            'migrate_output' => $migrateOutput,
            'seed_output' => $seedOutput,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace'   => $e->getTraceAsString(),
        ], 500);
    }
});

/*
|--------------------------------------------------------------------------
| Auth Routes (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth-password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth-password');
});

/*
|--------------------------------------------------------------------------
| Auth Routes (Protected)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::delete('/profile', [AuthController::class, 'deleteAccount']);
    Route::get('/profile/data-export', [AuthController::class, 'dataExport']);
    Route::get('/profile/medical-history', [AuthController::class, 'getMedicalHistory']);
    Route::put('/profile/medical-history', [AuthController::class, 'updateMedicalHistory']);
    Route::get('/profile/notification-preferences', [AuthController::class, 'getNotificationPrefs']);
    Route::put('/profile/notification-preferences', [AuthController::class, 'updateNotificationPrefs']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('/verify-mobile', [AuthController::class, 'verifyMobile']);
});

/*
|--------------------------------------------------------------------------
| Live Search (Public — autocomplete)
|--------------------------------------------------------------------------
*/
Route::get('/search/live', [SearchController::class, 'live']);

/*
|--------------------------------------------------------------------------
| Catalog Routes (Public — read only)
|--------------------------------------------------------------------------
*/
Route::prefix('catalog')->middleware('cache.headers:public')->group(function () {
    Route::get('/search', [CatalogController::class, 'search']);
    Route::get('/popular', [CatalogController::class, 'popular']);
    Route::get('/specialties', [CatalogController::class, 'specialties']);
    Route::get('/specialties/search', [CatalogController::class, 'specialtiesSearch']);
    Route::get('/cities', [CatalogController::class, 'cities']);
    Route::get('/cities/search', [CatalogController::class, 'citiesSearch']);
    Route::get('/diseases', [CatalogController::class, 'diseases']);
    Route::get('/symptoms', [CatalogController::class, 'symptoms']);
    Route::get('/treatment-tags', [CatalogController::class, 'treatmentTags']);
    Route::get('/treatment-tags/search', [CatalogController::class, 'treatmentTagsSearch']);
});

/*
|--------------------------------------------------------------------------
| Catalog Routes (Admin — write)
|--------------------------------------------------------------------------
*/
Route::prefix('catalog')->middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
    Route::post('/specialties', [CatalogController::class, 'storeSpecialty']);
    Route::put('/specialties/{id}', [CatalogController::class, 'updateSpecialty']);
    Route::delete('/specialties/{id}', [CatalogController::class, 'destroySpecialty']);
    Route::post('/cities', [CatalogController::class, 'storeCity']);
    Route::put('/cities/{id}', [CatalogController::class, 'updateCity']);
    Route::delete('/cities/{id}', [CatalogController::class, 'destroyCity']);
    Route::post('/diseases', [CatalogController::class, 'storeDisease']);
    Route::put('/diseases/{id}', [CatalogController::class, 'updateDisease']);
    Route::post('/symptoms', [CatalogController::class, 'storeSymptom']);
    Route::put('/symptoms/{id}', [CatalogController::class, 'updateSymptom']);
    Route::post('/treatment-tags', [CatalogController::class, 'storeTreatmentTag']);
    Route::put('/treatment-tags/{id}', [CatalogController::class, 'updateTreatmentTag']);
    Route::delete('/treatment-tags/{id}', [CatalogController::class, 'destroyTreatmentTag']);
});

/*
|--------------------------------------------------------------------------
| Social Routes (Follow / Favorite) — Authenticated
|--------------------------------------------------------------------------
*/
Route::prefix('social')->middleware('auth:sanctum')->group(function () {
    Route::post('/follow', [SocialController::class, 'follow']);
    Route::post('/unfollow', [SocialController::class, 'unfollow']);
    Route::post('/toggle-follow', [SocialController::class, 'toggleFollow']);
    Route::get('/is-following', [SocialController::class, 'isFollowing']);
    Route::get('/followers', [SocialController::class, 'followers']);
    Route::get('/following', [SocialController::class, 'following']);
    Route::post('/favorite', [SocialController::class, 'favorite']);
    Route::post('/unfavorite', [SocialController::class, 'unfavorite']);
    Route::post('/toggle-favorite', [SocialController::class, 'toggleFavorite']);
    Route::get('/is-favorited', [SocialController::class, 'isFavorited']);
    Route::get('/favorites', [SocialController::class, 'favorites']);
    Route::get('/favorites/count', [SocialController::class, 'favoritesCount']);
});

/*
|--------------------------------------------------------------------------
| Clinic Routes
|--------------------------------------------------------------------------
*/
Route::get('/clinics', [ClinicController::class, 'index'])->middleware('cache.headers:public');
Route::get('/clinics/{codename}', [ClinicController::class, 'show'])->middleware('cache.headers:public');

// Clinic reviews — public read (optional auth for can_review flag)
Route::get('/clinics/{id}/reviews', [ClinicController::class, 'reviews']);
Route::middleware('optional.auth')->group(function () {
    Route::get('/clinics/{id}/review-stats', [ClinicController::class, 'reviewStats']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Clinic Onboarding
    Route::get('/clinic-onboarding', [ClinicController::class, 'onboardingProfile']);
    Route::put('/clinic-onboarding', [ClinicController::class, 'updateOnboarding']);
    Route::post('/clinic-onboarding/logo', [ClinicController::class, 'uploadLogo']);

    Route::post('/clinics', [ClinicController::class, 'store'])->middleware('role:superAdmin,saasAdmin');
    Route::put('/clinics/{id}', [ClinicController::class, 'update']);
    Route::get('/clinics/{id}/staff', [ClinicController::class, 'staff']);
    Route::post('/clinics/{id}/staff', [ClinicController::class, 'createStaff']);
    Route::post('/clinics/{id}/reviews', [ClinicController::class, 'submitReview']);

    // Clinic Verification
    Route::get('/clinic-verification/status', [ClinicVerificationController::class, 'status']);
    Route::post('/clinic-verification/submit', [ClinicVerificationController::class, 'submit']);
});

/*
|--------------------------------------------------------------------------
| Doctor Routes (Public)
|--------------------------------------------------------------------------
*/
Route::get('/doctors', [DoctorController::class, 'index'])->middleware('cache.headers:public');
Route::get('/doctors/suggestions', [DoctorController::class, 'suggestions'])->middleware('cache.headers:public');
Route::get('/doctors/{id}', [DoctorController::class, 'show'])->middleware('cache.headers:public');
Route::get('/doctors/{id}/reviews', [DoctorController::class, 'reviews'])->middleware('cache.headers:public');
Route::get('/doctors/{id}/availability', [DoctorController::class, 'availability'])->middleware('cache.headers:public');
Route::post('/doctors/{id}/reviews', [DoctorController::class, 'submitReview'])->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/doctors/my-reviews', [DoctorController::class, 'myReviews']);
    Route::get('/doctors/reviewable-appointments', [DoctorController::class, 'reviewableAppointments']);
    Route::put('/doctors/reviews/{reviewId}/respond', [DoctorController::class, 'respondToReview']);
});

/*
|--------------------------------------------------------------------------
| Doctor Profile (Protected — own profile management + onboarding)
|--------------------------------------------------------------------------
*/
Route::prefix('doctor-profile')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [DoctorProfileController::class, 'show']);
    Route::put('/', [DoctorProfileController::class, 'update']);
    Route::put('/onboarding', [DoctorProfileController::class, 'updateOnboarding']);
    Route::post('/gallery', [DoctorProfileController::class, 'uploadGallery']);
    Route::delete('/gallery', [DoctorProfileController::class, 'deleteGalleryImage']);
    Route::put('/gallery/reorder', [DoctorProfileController::class, 'reorderGallery']);
    Route::put('/operating-hours', [DoctorProfileController::class, 'updateOperatingHours']);
    Route::put('/services', [DoctorProfileController::class, 'updateServices']);
    Route::put('/social', [DoctorProfileController::class, 'updateSocial']);
    // Verification documents (Doc §8.3)
    Route::get('/verification', [DoctorProfileController::class, 'verificationRequests']);
    Route::post('/verification', [DoctorProfileController::class, 'submitVerification']);
});

/*
|--------------------------------------------------------------------------
| Appointment Routes (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/appointments/calendar-events', [AppointmentController::class, 'calendarEvents']);
    Route::patch('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule'])->middleware('verified.doctor');
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::post('/appointments', [AppointmentController::class, 'store'])->middleware('verified.doctor');
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->middleware('verified.doctor');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->middleware('verified.doctor');
});

/*
|--------------------------------------------------------------------------
| Calendar Slot Routes (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/calendar-slots', [CalendarSlotController::class, 'index']);
    Route::post('/calendar-slots', [CalendarSlotController::class, 'store'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::post('/calendar-slots/bulk', [CalendarSlotController::class, 'bulkStore'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::put('/calendar-slots/{id}', [CalendarSlotController::class, 'update'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::delete('/calendar-slots/{id}', [CalendarSlotController::class, 'destroy'])->middleware('role:doctor,clinicOwner,superAdmin');
});

/*
|--------------------------------------------------------------------------
| Patient Records (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/patient-records', [PatientRecordController::class, 'index']);
    Route::get('/patient-records/{id}', [PatientRecordController::class, 'show']);
    Route::post('/patient-records', [PatientRecordController::class, 'store'])->middleware('role:doctor,clinicOwner,superAdmin');
    Route::delete('/patient-records/{id}', [PatientRecordController::class, 'destroy'])->middleware('role:doctor,clinicOwner,superAdmin');
});

/*
|--------------------------------------------------------------------------
| Patient Documents — Medical Wallet (Bölüm 7.4)
|--------------------------------------------------------------------------
*/
Route::prefix('patient-documents')->middleware('auth:sanctum')->group(function () {
    Route::get('/stats', [PatientDocumentController::class, 'stats']);
    Route::get('/', [PatientDocumentController::class, 'index']);
    Route::post('/', [PatientDocumentController::class, 'store']);
    Route::get('/{id}', [PatientDocumentController::class, 'show']);
    Route::put('/{id}', [PatientDocumentController::class, 'update']);
    Route::delete('/{id}', [PatientDocumentController::class, 'destroy']);
    Route::get('/{id}/download', [PatientDocumentController::class, 'download']);
    Route::post('/{id}/share', [PatientDocumentController::class, 'share']);
    Route::post('/{id}/revoke', [PatientDocumentController::class, 'revoke']);
    // Doctor access to shared documents
    Route::get('/shared/{patientId}', [PatientDocumentController::class, 'sharedWithDoctor'])
        ->middleware('role:doctor,clinicOwner,superAdmin');
});

/*
|--------------------------------------------------------------------------
| Digital Anamnesis (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/anamnesis/{patientId}', [DigitalAnamnesisController::class, 'show']);
    Route::post('/anamnesis', [DigitalAnamnesisController::class, 'upsert']);
});

/*
|--------------------------------------------------------------------------
| CRM — Patient Management (Bölüm 7.3)
|--------------------------------------------------------------------------
*/
Route::prefix('crm')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,hospital,superAdmin', 'crm.access'])->group(function () {
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/stats', [PatientController::class, 'stats']);
    Route::get('/patients/filters', [PatientController::class, 'filters']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::get('/patients/{id}/timeline', [PatientController::class, 'timeline']);
    Route::get('/patients/{id}/summary', [PatientController::class, 'summary']);
    Route::get('/patients/{id}/documents', [PatientController::class, 'documents']);
    Route::post('/patients/{id}/tags', [PatientController::class, 'addTag']);
    Route::delete('/patients/tags/{tagId}', [PatientController::class, 'removeTag']);
    Route::post('/patients/{id}/stage', [PatientController::class, 'setStage']);
});

/*
|--------------------------------------------------------------------------
| CRM — Tags, Stages, Archives (Protected — doctor/clinicOwner)
|--------------------------------------------------------------------------
*/
Route::prefix('crm')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,hospital,superAdmin', 'crm.access'])->group(function () {
    Route::get('/tags', [CrmController::class, 'tags']);
    Route::post('/tags', [CrmController::class, 'storeTag']);
    Route::delete('/tags/{id}', [CrmController::class, 'destroyTag']);

    Route::get('/stages', [CrmController::class, 'stages']);
    Route::post('/stages', [CrmController::class, 'storeStage']);
    Route::put('/stages/{id}', [CrmController::class, 'updateStage']);

    Route::get('/archived-records', [CrmController::class, 'archivedRecords']);
    Route::post('/archived-records', [CrmController::class, 'storeArchivedRecord']);
});

/*
|--------------------------------------------------------------------------
| CRM — Billing / Invoicing (Bölüm 7.5)
|--------------------------------------------------------------------------
*/
Route::prefix('crm/billing')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,hospital,superAdmin', 'crm.access'])->group(function () {
    Route::get('/invoices', [BillingController::class, 'index']);
    Route::post('/invoices', [BillingController::class, 'store']);
    Route::get('/invoices/{id}', [BillingController::class, 'show']);
    Route::put('/invoices/{id}', [BillingController::class, 'update']);
    Route::delete('/invoices/{id}', [BillingController::class, 'destroy']);
    Route::get('/invoices/{id}/pdf', [BillingController::class, 'pdf']);
    Route::get('/stats', [BillingController::class, 'stats']);
    Route::get('/revenue-chart', [BillingController::class, 'revenueChart']);
    Route::get('/outstanding', [BillingController::class, 'outstanding']);
});

/*
|--------------------------------------------------------------------------
| Finance / Analytics (Bölüm 7.5)
|--------------------------------------------------------------------------
*/
Route::prefix('finance')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,hospital,superAdmin,saasAdmin', 'crm.access'])->group(function () {
    Route::get('/top-services', [FinanceController::class, 'topServices']);
    Route::get('/payout', [FinanceController::class, 'payout']);
    Route::get('/platform-overview', [FinanceController::class, 'platformOverview']);
    Route::get('/exchange-rates', [FinanceController::class, 'exchangeRates']);
    Route::post('/convert', [FinanceController::class, 'convert']);
    Route::get('/export', [FinanceController::class, 'export']);
});

/*
|--------------------------------------------------------------------------
| Examination & Prescription — Doctor only (Bölüm 7.4)
|--------------------------------------------------------------------------
*/
Route::prefix('crm')->middleware(['auth:sanctum', 'role:doctor', 'crm.access'])->group(function () {
    // Examinations CRUD
    Route::get('/examinations', [ExaminationController::class, 'index']);
    Route::get('/examinations/{id}', [ExaminationController::class, 'show']);
    Route::post('/examinations', [ExaminationController::class, 'store']);
    Route::put('/examinations/{id}', [ExaminationController::class, 'update']);
    Route::delete('/examinations/{id}', [ExaminationController::class, 'destroy']);

    // Prescription PDF download
    Route::get('/examinations/{id}/prescription-pdf', [ExaminationController::class, 'prescriptionPdf']);

    // ICD-10 code search
    Route::get('/icd10/search', [ExaminationController::class, 'searchIcd10']);
});

/*
|--------------------------------------------------------------------------
| MedStream — Posts, Comments, Likes, Bookmarks, Reports
|--------------------------------------------------------------------------
*/
Route::prefix('medstream')->group(function () {
    // Public read (optional auth to resolve is_liked/is_bookmarked flags)
    Route::middleware('optional.auth')->group(function () {
        Route::get('/posts', [MedStreamController::class, 'posts']);
        Route::get('/posts/{post}', [MedStreamController::class, 'showPost']);
        Route::get('/posts/{post}/comments', [MedStreamController::class, 'comments']);
    });

    // Secure file download (path-validated, no auth needed for public posts)
    Route::get('/download', [MedStreamController::class, 'download']);

    // Protected write
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/feed', [MedStreamController::class, 'feed']);

        Route::post('/posts', [MedStreamController::class, 'storePost'])->middleware('verified.doctor');
        Route::put('/posts/{post}', [MedStreamController::class, 'updatePost'])->middleware('verified.doctor');
        Route::delete('/posts/{post}', [MedStreamController::class, 'destroyPost'])->middleware('verified.doctor');

        Route::post('/posts/{post}/comments', [MedStreamController::class, 'storeComment'])->middleware('verified.doctor');
        Route::put('/comments/{comment}', [MedStreamController::class, 'updateComment'])->middleware('verified.doctor');
        Route::delete('/comments/{comment}', [MedStreamController::class, 'destroyComment'])->middleware('verified.doctor');

        Route::post('/posts/{post}/like', [MedStreamController::class, 'toggleLike'])->middleware('verified.doctor');
        Route::post('/posts/{post}/report', [MedStreamController::class, 'storeReport']);

        Route::get('/bookmarks', [MedStreamController::class, 'bookmarks']);
        Route::post('/bookmarks', [MedStreamController::class, 'toggleBookmark'])->middleware('verified.doctor');

        Route::post('/follow/{userId}', [MedStreamController::class, 'toggleFollow']);
        Route::get('/follow-counts/{userId}', [MedStreamController::class, 'followCounts']);
    });

    // Admin moderation
    Route::middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
        Route::get('/reports', [MedStreamController::class, 'reports']);
        Route::put('/reports/{id}', [MedStreamController::class, 'updateReport']);
    });
});

/*
|--------------------------------------------------------------------------
| Messaging — Conversations, Messages, Attachments, Read Receipts
|--------------------------------------------------------------------------
*/
Route::prefix('messages')->middleware('auth:sanctum')->group(function () {
    // Conversations
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::post('/conversations', [MessageController::class, 'createConversation']);
    Route::get('/conversations/{id}', [MessageController::class, 'showConversation']);
    Route::put('/conversations/{id}', [MessageController::class, 'updateConversation']);
    Route::delete('/conversations/{id}', [MessageController::class, 'deleteConversation']);

    // Messages within a conversation
    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'messages']);
    Route::post('/conversations/{conversationId}/messages', [MessageController::class, 'sendMessage']);

    // Mark conversation as read
    Route::post('/conversations/{conversationId}/read', [MessageController::class, 'markRead']);

    // Single message operations
    Route::put('/{messageId}', [MessageController::class, 'updateMessage']);
    Route::delete('/{messageId}', [MessageController::class, 'deleteMessage']);

    // Search & unread count
    Route::get('/search', [MessageController::class, 'search']);
    Route::get('/unread-count', [MessageController::class, 'unreadCount']);
});

/*
|--------------------------------------------------------------------------
| Notifications (Protected)
|--------------------------------------------------------------------------
*/
Route::prefix('notifications')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/', [NotificationController::class, 'destroyAll']);
});

/*
|--------------------------------------------------------------------------
| Real-time Chat — 1:1 Doctor-Patient Conversations
|--------------------------------------------------------------------------
*/
Route::prefix('chat')->middleware('auth:sanctum')->group(function () {
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::post('/conversations', [ChatController::class, 'startConversation']);
    Route::get('/conversations/{conversation}/messages', [ChatController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/conversations/{conversation}/read', [ChatController::class, 'markAsRead']);
    Route::post('/conversations/{conversation}/typing', [ChatController::class, 'typing']);
    Route::get('/unread-count', [ChatController::class, 'unreadCount']);
});

/*
|--------------------------------------------------------------------------
| Media Stream (Public — supports Range/seek for video)
|--------------------------------------------------------------------------
*/
Route::get('/media/stream/{path}', [MediaStreamController::class, 'stream'])
    ->where('path', '.*');

/*
|--------------------------------------------------------------------------
| Clinic Analytics — Business Intelligence & Reporting
|--------------------------------------------------------------------------
*/
Route::prefix('analytics')->middleware('auth:sanctum')->group(function () {
    Route::get('/clinic/{clinicId}/summary', [ClinicAnalyticsController::class, 'summary']);
    Route::get('/clinic/{clinicId}/doctors', [ClinicAnalyticsController::class, 'doctorPerformance']);
    Route::get('/clinic/{clinicId}/engagement', [ClinicAnalyticsController::class, 'engagement']);
    Route::get('/clinic/{clinicId}/appointment-trend', [ClinicAnalyticsController::class, 'appointmentTrend']);
});

/*
|--------------------------------------------------------------------------
| Clinic / Hospital Manager Panel (§8.2)
|--------------------------------------------------------------------------
*/
Route::prefix('clinic-manager')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/overview', [ClinicManagerController::class, 'overview']);
    Route::get('/doctors', [ClinicManagerController::class, 'doctors']);
    Route::get('/doctors/{doctorId}', [ClinicManagerController::class, 'doctorDetail']);
    Route::post('/doctors/{doctorId}/add', [ClinicManagerController::class, 'addDoctor']);
    Route::delete('/doctors/{doctorId}/remove', [ClinicManagerController::class, 'removeDoctor']);
    Route::put('/doctors/{doctorId}/hours', [ClinicManagerController::class, 'updateDoctorHours']);
    Route::get('/financials', [ClinicManagerController::class, 'financials']);
});

/*
|--------------------------------------------------------------------------
| Telehealth — Daily.co Video + Deepgram Transcription (§4.4)
|--------------------------------------------------------------------------
*/
Route::prefix('telehealth')->middleware('auth:sanctum')->group(function () {
    Route::get('/{appointmentId}/session', [TelehealthController::class, 'session']);
    Route::get('/{appointmentId}/transcription-token', [TelehealthController::class, 'transcriptionToken']);
    Route::get('/{appointmentId}/simulate-transcript', [TelehealthController::class, 'simulateTranscript']);
    Route::put('/{appointmentId}/status', [TelehealthController::class, 'updateStatus']);
});

/*
|--------------------------------------------------------------------------
| SuperAdmin — Platform Management (Dashboard, Verification, Moderation)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
    // Global dashboard
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);
    Route::get('/growth-trend', [SuperAdminController::class, 'growthTrend']);

    // Doctor verification (legacy simple toggle)
    Route::get('/doctors', [SuperAdminController::class, 'doctors']);
    Route::put('/doctors/{id}/verify', [SuperAdminController::class, 'verifyDoctor']);

    // Verification requests (Doc §8.3 — document-based approval)
    Route::get('/verification-requests', [SuperAdminController::class, 'verificationRequests']);
    Route::get('/verification-requests/stats', [SuperAdminController::class, 'verificationStats']);
    Route::get('/verification-requests/doctor/{doctorId}', [SuperAdminController::class, 'doctorVerificationDetail']);
    Route::put('/verification-requests/{id}/approve', [SuperAdminController::class, 'approveVerification']);
    Route::put('/verification-requests/{id}/reject', [SuperAdminController::class, 'rejectVerification']);
    Route::put('/verification-requests/{id}/undo', [SuperAdminController::class, 'undoVerification']);
    Route::put('/verification-requests/{id}/request-info', [SuperAdminController::class, 'requestMoreInfo']);
    Route::get('/verification-requests/{id}/document', [SuperAdminController::class, 'verificationDocument']);

    // Clinic verification (document-based)
    Route::get('/clinic-verifications', [ClinicVerificationController::class, 'adminList']);
    Route::put('/clinic-verifications/{id}/approve', [ClinicVerificationController::class, 'approve']);
    Route::put('/clinic-verifications/{id}/reject', [ClinicVerificationController::class, 'reject']);

    // Review moderation (Doc §10)
    Route::get('/reviews', [SuperAdminController::class, 'listReviews']);
    Route::get('/reviews/stats', [SuperAdminController::class, 'reviewStats']);
    Route::put('/reviews/{id}/approve', [SuperAdminController::class, 'approveReview']);
    Route::put('/reviews/{id}/reject', [SuperAdminController::class, 'rejectReview']);
    Route::put('/reviews/{id}/hide', [SuperAdminController::class, 'hideReview']);

    // User management (Doc §14)
    Route::get('/users', [SuperAdminController::class, 'listUsers']);
    Route::get('/users/stats', [SuperAdminController::class, 'userStats']);
    Route::get('/users/search', [SuperAdminController::class, 'searchUsers']);
    Route::get('/users/{id}', [SuperAdminController::class, 'getUserDetail']);
    Route::put('/users/{id}/role', [SuperAdminController::class, 'updateUserRole']);
    Route::put('/users/{id}/suspend', [SuperAdminController::class, 'suspendUser']);
    Route::put('/users/{id}/reset-password', [SuperAdminController::class, 'resetPassword']);

    // Content moderation
    Route::get('/reports', [SuperAdminController::class, 'reports']);
    Route::put('/reports/{id}/approve', [SuperAdminController::class, 'approveReport']);
    Route::delete('/reports/{id}/remove', [SuperAdminController::class, 'removeReport']);

    // Feature toggles (system settings)
    Route::get('/feature-toggles', [SuperAdminController::class, 'featureToggles']);
    Route::put('/feature-toggles', [SuperAdminController::class, 'updateFeatureToggle']);

    // Audit logs
    Route::get('/audit-logs', [SuperAdminController::class, 'auditLogs']);
    Route::get('/audit-logs/stats', [SuperAdminController::class, 'auditLogStats']);

    // Catalog management (admin CRUD)
    Route::prefix('catalog')->group(function () {
        Route::get('/specialties', [CatalogController::class, 'specialties']);
        Route::post('/specialties', [CatalogController::class, 'storeSpecialty']);
        Route::put('/specialties/{id}', [CatalogController::class, 'updateSpecialty']);
        Route::delete('/specialties/{id}', [CatalogController::class, 'destroySpecialty']);

        Route::get('/cities', [CatalogController::class, 'cities']);
        Route::post('/cities', [CatalogController::class, 'storeCity']);
        Route::put('/cities/{id}', [CatalogController::class, 'updateCity']);
        Route::delete('/cities/{id}', [CatalogController::class, 'destroyCity']);

        Route::get('/diseases', [CatalogController::class, 'diseases']);
        Route::post('/diseases', [CatalogController::class, 'storeDisease']);
        Route::put('/diseases/{id}', [CatalogController::class, 'updateDisease']);

        Route::get('/treatment-tags', [CatalogController::class, 'treatmentTags']);
        Route::post('/treatment-tags', [CatalogController::class, 'storeTreatmentTag']);
        Route::put('/treatment-tags/{id}', [CatalogController::class, 'updateTreatmentTag']);
        Route::delete('/treatment-tags/{id}', [CatalogController::class, 'destroyTreatmentTag']);
    });

    // Announcements (admin CRUD)
    Route::get('/announcements', [AnnouncementController::class, 'adminList']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // FAQ management (admin)
    Route::get('/faqs', [FaqController::class, 'adminIndex']);
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::put('/faqs/{id}', [FaqController::class, 'update']);
    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Support / Help Center (Bölüm 12)
|--------------------------------------------------------------------------
*/
// Public FAQ (no auth required)
Route::get('/faqs', [FaqController::class, 'index']);

// Public announcements (auth optional — role-based filtering)
Route::get('/announcements', [AnnouncementController::class, 'index'])->middleware('auth:sanctum');

// Authenticated support ticket routes
Route::prefix('support')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/categories', [TicketController::class, 'categories']);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply']);
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::patch('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::get('/stats', [TicketController::class, 'stats']);

    // Category management (admin)
    Route::post('/categories', [TicketController::class, 'storeCategory']);
    Route::put('/categories/{id}', [TicketController::class, 'updateCategory']);
    Route::delete('/categories/{id}', [TicketController::class, 'destroyCategory']);
});

/*
|--------------------------------------------------------------------------
| Contact Messages — Patient → Clinic/Doctor inquiries (with attachments)
|--------------------------------------------------------------------------
*/
Route::prefix('contact-messages')->middleware('auth:sanctum')->group(function () {
    Route::post('/', [ContactMessageController::class, 'store']);
    Route::get('/inbox', [ContactMessageController::class, 'inbox']);
    Route::get('/unread-count', [ContactMessageController::class, 'unreadCount']);
    Route::get('/{id}', [ContactMessageController::class, 'show']);
    Route::delete('/{id}', [ContactMessageController::class, 'destroy']);
    Route::get('/{id}/download/{attachmentId}', [ContactMessageController::class, 'downloadAttachment']);
});

/*
|--------------------------------------------------------------------------
| Branches — Hospital (Level 4) Promotion Network
|--------------------------------------------------------------------------
*/
Route::prefix('branches')->middleware(['auth:sanctum', 'role:hospital,superAdmin,saasAdmin'])->group(function () {
    Route::get('/', [BranchController::class, 'index']);
    Route::post('/', [BranchController::class, 'store']);
    Route::get('/{id}', [BranchController::class, 'show']);
    Route::put('/{id}', [BranchController::class, 'update']);
    Route::delete('/{id}', [BranchController::class, 'destroy']);
});
