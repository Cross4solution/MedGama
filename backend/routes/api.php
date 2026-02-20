<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PatientRecordController;
use App\Http\Controllers\Api\DigitalAnamnesisController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\MedStreamController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\DoctorProfileController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\MediaStreamController;
use App\Http\Controllers\Api\ClinicAnalyticsController;
use App\Http\Controllers\Api\SuperAdminController;

/*
|--------------------------------------------------------------------------
| Health Check (Railway / Load Balancer)
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $dbOk = true;
    } catch (\Throwable $e) {
        $dbOk = false;
    }
    return response()->json([
        'status'  => $dbOk ? 'healthy' : 'degraded',
        'app'     => config('app.name'),
        'db'      => $dbOk ? 'connected' : 'disconnected',
        'time'    => now()->toIso8601String(),
    ], $dbOk ? 200 : 503);
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
| Catalog Routes (Public — read only)
|--------------------------------------------------------------------------
*/
Route::prefix('catalog')->group(function () {
    Route::get('/specialties', [CatalogController::class, 'specialties']);
    Route::get('/cities', [CatalogController::class, 'cities']);
    Route::get('/diseases', [CatalogController::class, 'diseases']);
    Route::get('/symptoms', [CatalogController::class, 'symptoms']);
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
});

/*
|--------------------------------------------------------------------------
| Clinic Routes
|--------------------------------------------------------------------------
*/
Route::get('/clinics', [ClinicController::class, 'index']);
Route::get('/clinics/{codename}', [ClinicController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/clinics', [ClinicController::class, 'store'])->middleware('role:superAdmin,saasAdmin');
    Route::put('/clinics/{id}', [ClinicController::class, 'update']);
    Route::get('/clinics/{id}/staff', [ClinicController::class, 'staff']);
    Route::post('/clinics/{id}/staff', [ClinicController::class, 'createStaff']);
});

/*
|--------------------------------------------------------------------------
| Doctor Routes (Public)
|--------------------------------------------------------------------------
*/
Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);

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
});

/*
|--------------------------------------------------------------------------
| Appointment Routes (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('appointments', AppointmentController::class);
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
| Digital Anamnesis (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/anamnesis/{patientId}', [DigitalAnamnesisController::class, 'show']);
    Route::post('/anamnesis', [DigitalAnamnesisController::class, 'upsert']);
});

/*
|--------------------------------------------------------------------------
| CRM — Tags, Stages, Archives (Protected — doctor/clinicOwner)
|--------------------------------------------------------------------------
*/
Route::prefix('crm')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,superAdmin'])->group(function () {
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
| MedStream — Posts, Comments, Likes, Bookmarks, Reports
|--------------------------------------------------------------------------
*/
Route::prefix('medstream')->group(function () {
    // Public read
    Route::get('/posts', [MedStreamController::class, 'posts']);
    Route::get('/posts/{post}', [MedStreamController::class, 'showPost']);
    Route::get('/posts/{post}/comments', [MedStreamController::class, 'comments']);

    // Protected write
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/posts', [MedStreamController::class, 'storePost']);
        Route::put('/posts/{post}', [MedStreamController::class, 'updatePost']);
        Route::delete('/posts/{post}', [MedStreamController::class, 'destroyPost']);

        Route::post('/posts/{post}/comments', [MedStreamController::class, 'storeComment']);
        Route::put('/comments/{comment}', [MedStreamController::class, 'updateComment']);
        Route::delete('/comments/{comment}', [MedStreamController::class, 'destroyComment']);

        Route::post('/posts/{post}/like', [MedStreamController::class, 'toggleLike']);
        Route::post('/posts/{post}/report', [MedStreamController::class, 'storeReport']);

        Route::get('/bookmarks', [MedStreamController::class, 'bookmarks']);
        Route::post('/bookmarks', [MedStreamController::class, 'toggleBookmark']);
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
| SuperAdmin — Platform Management (Dashboard, Verification, Moderation)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
    // Global dashboard
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard']);

    // Doctor verification
    Route::get('/doctors', [SuperAdminController::class, 'doctors']);
    Route::put('/doctors/{id}/verify', [SuperAdminController::class, 'verifyDoctor']);

    // Content moderation
    Route::get('/reports', [SuperAdminController::class, 'reports']);
    Route::put('/reports/{id}/approve', [SuperAdminController::class, 'approveReport']);
    Route::delete('/reports/{id}/remove', [SuperAdminController::class, 'removeReport']);
});

// ╔══════════════════════════════════════════════════════════════════╗
// ║  TEMPORARY: One-time DB seed route — DELETE AFTER USE           ║
// ║  Usage: GET /api/system/init-db?key=MedaGama2026SecretInit      ║
// ╚══════════════════════════════════════════════════════════════════╝
Route::get('/system/init-db', function (\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'MedaGama2026SecretInit') {
        return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
    }
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);
        $output = \Illuminate\Support\Facades\Artisan::output();
        return response()->json([
            'status' => 'success',
            'message' => 'Database migrated and seeded successfully.',
            'output' => $output,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace'   => $e->getTraceAsString(),
        ], 500);
    }
});
