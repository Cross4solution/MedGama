<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PatientRecordController;
use App\Http\Controllers\Api\DigitalAnamnesisController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\MedStreamController;
use App\Http\Controllers\Api\CatalogController;

/*
|--------------------------------------------------------------------------
| Auth Routes (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
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
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
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
    Route::get('/posts/{id}', [MedStreamController::class, 'showPost']);
    Route::get('/posts/{postId}/comments', [MedStreamController::class, 'comments']);

    // Protected write
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/posts', [MedStreamController::class, 'storePost']);
        Route::put('/posts/{id}', [MedStreamController::class, 'updatePost']);
        Route::delete('/posts/{id}', [MedStreamController::class, 'destroyPost']);

        Route::post('/posts/{postId}/comments', [MedStreamController::class, 'storeComment']);
        Route::post('/posts/{postId}/like', [MedStreamController::class, 'toggleLike']);
        Route::post('/posts/{postId}/report', [MedStreamController::class, 'storeReport']);

        Route::get('/bookmarks', [MedStreamController::class, 'bookmarks']);
        Route::post('/bookmarks', [MedStreamController::class, 'toggleBookmark']);
    });

    // Admin moderation
    Route::middleware(['auth:sanctum', 'role:superAdmin,saasAdmin'])->group(function () {
        Route::get('/reports', [MedStreamController::class, 'reports']);
        Route::put('/reports/{id}', [MedStreamController::class, 'updateReport']);
    });
});
