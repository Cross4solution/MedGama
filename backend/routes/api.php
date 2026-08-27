<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PatientRecordController;
use App\Http\Controllers\Api\DigitalAnamnesisController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\GeoController;
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
use App\Http\Controllers\Api\DoctorFaqController;
use App\Http\Controllers\Api\AccreditationController;

/*
|--------------------------------------------------------------------------
| Health Check (Railway / Load Balancer) — NO DB dependency
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    return response('ok', 200)->header('Content-Type', 'text/plain');
});

// İçerik güvenlik politikası ihlal raporları.
//
// Tarayıcı gönderir, kimlik taşımaz — o yüzden herkese açık olmak zorunda.
// Kötüye kullanımı sınırlamak için kendi hız sınırı var; genel API sınırından
// ayrı tutuldu ki rapor seli gerçek kullanıcıların kotasını yemesin.
Route::post('/csp-report', [\App\Http\Controllers\Api\CspRaporController::class, 'store'])
    ->middleware('throttle:csp-report');

/*
| Şema onarım uçları (`/system/init-db`, `/system/init-db-status`) KALDIRILDI.
|
| Göç ve tohum çalıştırıyorlardı. Anahtar arkasındaydılar ama bir HTTP isteğiyle
| veritabanına dokunabilen bir uç, hiçbir arıza senaryosunda gerekmeyecek kadar
| ağır. Göç gerekiyorsa Render konsolundan `php artisan migrate` çalıştırılır.
*/

/*
|--------------------------------------------------------------------------
| Demo Login (şifresiz — yalnızca demo hesapları)
|--------------------------------------------------------------------------
| Kasıtlı kimlik doğrulama atlaması. Sunucuda DEMO_LOGIN_KEY tanımlı değilse
| 404 döner, yani varsayılan olarak kapalıdır. Ayrıntı ve kapatma yolu:
| DemoLoginController.
*/
Route::get('/demo-login/{rol}', \App\Http\Controllers\Api\DemoLoginController::class)
    ->middleware('throttle:20,1');

/*
| Yönetim panelinin şifresiz açılması — tanıtım için, bilerek.
|
| `DEMO_ADMIN_AUTO_LOGIN` tanımlı değilse 404. Açıkken verdiği oturum SALT
| OKUNUR bir hesaba ait; gelen kişi hiçbir kaydı değiştiremez. Ayrıntı ve
| kapatma yordamı: DemoYoneticiGirisiController.
*/
Route::get('/demo-yonetici-girisi', \App\Http\Controllers\Api\DemoYoneticiGirisiController::class)
    ->middleware('throttle:20,1');

/*
| Teşhis uçları KALDIRILDI.
|
| `/system/mail-status`, `/system/broadcast-status` ve `/system/mail-preview`
| burada dururdu. Barındırma ortamında kabuk erişimi olmadığı için eklenmişler
| ve kendi yorumları "teslimden önce kaldırılmalı" diyordu.
|
| Sonuncusu yalnız okuma yapmıyordu: her şablondan ÖRNEK E-POSTA GÖNDERİYORDU.
| Anahtarı eline geçiren biri istediği adrese posta attırabilirdi.
|
| Ayara bakmak gerekirse Render panelindeki ortam değişkenleri okunur.
*/

/*
|--------------------------------------------------------------------------
| Auth Routes (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
    Route::get('/username-available', [AuthController::class, 'usernameAvailable'])->middleware('throttle:60,1');
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
    Route::post('/logout-all', [AuthController::class, 'logoutAllDevices']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::delete('/profile', [AuthController::class, 'deleteAccount']);
    Route::get('/profile/data-export', [AuthController::class, 'dataExport']);
    // Sağlık verisi rızası geri çekildiyse bu uçlar kapanır (KVKK/GDPR md.7(3)).
    Route::middleware('health.consent')->group(function () {
        Route::get('/profile/medical-history', [AuthController::class, 'getMedicalHistory']);
        Route::put('/profile/medical-history', [AuthController::class, 'updateMedicalHistory']);
    });
    Route::get('/profile/notification-preferences', [AuthController::class, 'getNotificationPrefs']);
    Route::put('/profile/notification-preferences', [AuthController::class, 'updateNotificationPrefs']);
    // Kod 6 haneli ve süresiz: sınırsız deneme, doğrulamayı tahmin edilebilir
    // hale getiriyordu. Yeniden gönderim de sınırlı — aksi hâlde tek hesap
    // istediği kadar e-posta tetikleyebiliyor.
    Route::post('/verify-email', [AuthController::class, 'verifyEmail'])->middleware('throttle:auth-verify');
    Route::post('/resend-verification', [AuthController::class, 'resendVerification'])->middleware('throttle:auth-verify');
    // /verify-mobile kaldırıldı: gönderilen kodu hiç doğrulamadan telefonu
    // "onaylı" işaretliyordu. SMS gönderimi hiç kurulmadığı için doğrulanacak
    // bir kod da yoktu. SMS'e karar verilirse gerçek doğrulama ile yeniden eklenir.
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
Route::prefix('catalog')->middleware('cache.headers:public;max_age=60')->group(function () {
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
Route::get('/clinics', [ClinicController::class, 'index'])->middleware('cache.headers:public;max_age=60');
// Sabit yol joker rotadan önce: aksi halde "reviewable-appointments" bir
// klinik kod adı sanılıp 404 dönüyor.
Route::get('/clinics/reviewable-appointments', [ClinicController::class, 'reviewableAppointments'])
    ->middleware('auth:sanctum');

Route::get('/clinics/{codename}', [ClinicController::class, 'show'])->middleware('cache.headers:public;max_age=60');

// Hospital (L4): CRM stats (auth) + public profile. stats BEFORE {codename} so it isn't captured as a codename.
Route::get('/hospitals/stats', [\App\Http\Controllers\Api\HospitalController::class, 'stats'])->middleware('auth:sanctum');
Route::get('/hospitals/{codename}', [\App\Http\Controllers\Api\HospitalController::class, 'show'])->middleware('cache.headers:public;max_age=60');

// Clinic reviews & staff — public read
Route::get('/clinics/{id}/reviews', [ClinicController::class, 'reviews']);
Route::get('/clinics/{id}/staff', [ClinicController::class, 'staff']);
Route::middleware('optional.auth')->group(function () {
    Route::get('/clinics/{id}/review-stats', [ClinicController::class, 'reviewStats']);
});

// Açık rıza kayıtları (KVKK/GDPR Art.7): durum, tam geçmiş, ver/geri al
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/consents', [\App\Http\Controllers\Api\ConsentController::class, 'index']);
    Route::get('/consents/history', [\App\Http\Controllers\Api\ConsentController::class, 'history']);
    Route::post('/consents/{type}', [\App\Http\Controllers\Api\ConsentController::class, 'grant']);
    Route::delete('/consents/{type}', [\App\Http\Controllers\Api\ConsentController::class, 'revoke']);
});

// "Sağlık verime kim baktı?" şeffaflık raporu — hasta kendi kaydını, admin tümünü görür
Route::get('/health-access-logs', [\App\Http\Controllers\Api\HealthAccessLogController::class, 'index'])
    ->middleware('auth:sanctum');

// MedStream konum akışı — misafir IP→ülke (public), giriş sonrası kontrol + kaydet (auth)
Route::get('/geo/ip-country', [GeoController::class, 'ipCountry']);

// Gönderi videolarının alt yazıları. Okuma herkese açık — gönderi zaten
// herkese açık; düzeltme yalnızca gönderi sahibine ve yöneticiye.
Route::get('/medstream/posts/{post}/subtitles', [\App\Http\Controllers\Api\VideoSubtitleController::class, 'index']);
Route::get('/medstream/posts/{post}/subtitles/{lang}', [\App\Http\Controllers\Api\VideoSubtitleController::class, 'show']);
Route::put('/medstream/posts/{post}/subtitles/{lang}', [\App\Http\Controllers\Api\VideoSubtitleController::class, 'update'])
    ->middleware('auth:sanctum');

// İçerik çevirisi. Durum sorgusu herkese açık (giriş yapmamış kullanıcı da
// düğmenin durumunu görebilmeli); çeviri isteği oturum gerektirir.
//
// `optional.auth` ŞART: rota düz açık bırakıldığında jeton gönderilse bile
// $request->user() null geliyordu, denetim `: false`'a düşüyor ve uç GİRİŞ
// YAPMIŞ HERKESE `enabled: false` diyordu. Tercih doğru kaydediliyor, ön yüz
// durumu buradan okuduğu için içerik hiç çevrilmiyordu.
Route::get('/translation/status', [\App\Http\Controllers\Api\TranslationController::class, 'status'])
    ->middleware('optional.auth');
Route::post('/translation/batch', [\App\Http\Controllers\Api\TranslationController::class, 'batch'])
    ->middleware('auth:sanctum');
// Ters-geocode sunucu tarafında: hasta tarayıcısı 3. taraf servise bağlanmaz
Route::get('/geo/reverse', [GeoController::class, 'reverse'])->middleware('throttle:30,1');
Route::get('/geo/forward', [GeoController::class, 'forward'])->middleware('throttle:30,1');
// Yoğunluğa göre arama yarıçapı: yoğun bölgede dar, seyrekte geniş
Route::get('/geo/suggest-radius', [GeoController::class, 'suggestRadius'])->middleware('throttle:60,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/geo/check', [GeoController::class, 'check']);
    Route::post('/geo/location', [GeoController::class, 'saveLocation']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Clinic Onboarding
    Route::get('/clinic-onboarding', [ClinicController::class, 'onboardingProfile']);
    Route::put('/clinic-onboarding', [ClinicController::class, 'updateOnboarding']);
    Route::post('/clinic-onboarding/logo', [ClinicController::class, 'uploadLogo']);

    Route::post('/clinics', [ClinicController::class, 'store'])->middleware('role:superAdmin,saasAdmin');
    Route::put('/clinics/{id}', [ClinicController::class, 'update']);
    Route::post('/clinics/{id}/staff', [ClinicController::class, 'createStaff']);
    Route::post('/clinics/{id}/reviews', [ClinicController::class, 'submitReview']);

    // Clinic Verification
    Route::get('/clinic-verification/status', [ClinicVerificationController::class, 'status']);
    Route::post('/clinic-verification/submit', [ClinicVerificationController::class, 'submit']);
    // Yetkili belge indirme (admin veya klinik sahibi) — private diskten stream
    Route::get('/clinic-verifications/{id}/document/{field}', [ClinicVerificationController::class, 'downloadDocument']);

    // Clinic Accreditations
    Route::get('/clinics/{clinicId}/accreditations', [AccreditationController::class, 'clinicAccreditations']);
    Route::post('/clinics/{clinicId}/accreditations', [AccreditationController::class, 'attachAccreditations']);
    Route::delete('/clinics/{clinicId}/accreditations/{accreditationId}', [AccreditationController::class, 'detachAccreditation']);
});

// Public: List all available accreditations (for dropdown)
Route::get('/accreditations', [AccreditationController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Doctor Routes (Public)
|--------------------------------------------------------------------------
*/
Route::get('/doctors', [DoctorController::class, 'index'])->middleware('cache.headers:public;max_age=60');
Route::get('/doctors/suggestions', [DoctorController::class, 'suggestions'])->middleware('cache.headers:public;max_age=60');
/*
| Sabit yollar joker rotadan ÖNCE gelmeli.
|
| `/doctors/{id}` daha üstte tanımlıyken `/doctors/my-reviews` isteği
| "my-reviews" kimlikli bir doktor araması olarak eşleşiyor ve 404 dönüyordu:
| doktorun kendi yorumları ekranı ve "yorum yazılabilir randevular" listesi
| hiç çalışmıyordu.
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/doctors/my-reviews', [DoctorController::class, 'myReviews']);
    Route::get('/doctors/reviewable-appointments', [DoctorController::class, 'reviewableAppointments']);
    Route::put('/doctors/reviews/{reviewId}/respond', [DoctorController::class, 'respondToReview']);
});

Route::get('/doctors/{id}', [DoctorController::class, 'show'])->middleware('cache.headers:public;max_age=60');
Route::get('/doctors/{id}/reviews', [DoctorController::class, 'reviews'])->middleware('cache.headers:public;max_age=60');
Route::get('/doctors/{id}/availability', [DoctorController::class, 'availability'])->middleware('cache.headers:public;max_age=60');
Route::get('/doctors/{id}/faqs', [DoctorFaqController::class, 'index'])->middleware('cache.headers:public;max_age=60');
Route::post('/doctors/{id}/reviews', [DoctorController::class, 'submitReview'])->middleware('auth:sanctum');
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
    Route::post('/certification-image', [DoctorProfileController::class, 'uploadCertificationImage']);
    Route::delete('/gallery', [DoctorProfileController::class, 'deleteGalleryImage']);
    Route::put('/gallery/reorder', [DoctorProfileController::class, 'reorderGallery']);
    Route::put('/operating-hours', [DoctorProfileController::class, 'updateOperatingHours']);
    Route::put('/services', [DoctorProfileController::class, 'updateServices']);
    Route::put('/social', [DoctorProfileController::class, 'updateSocial']);
    // Verification documents (Doc §8.3)
    Route::get('/verification', [DoctorProfileController::class, 'verificationRequests']);
    Route::post('/verification', [DoctorProfileController::class, 'submitVerification']);

    // Doctor FAQs (CRM CRUD)
    Route::get('/faqs', [DoctorFaqController::class, 'myFaqs']);
    Route::post('/faqs', [DoctorFaqController::class, 'store']);
    Route::put('/faqs/reorder', [DoctorFaqController::class, 'reorder']);
    Route::put('/faqs/{id}', [DoctorFaqController::class, 'update']);
    Route::delete('/faqs/{id}', [DoctorFaqController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Appointment Routes (Protected)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/appointments/calendar-events', [AppointmentController::class, 'calendarEvents']);
    Route::patch('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule'])->middleware('verified.doctor');
    // Onaylı Review Sistemi — doktor/klinik manuel "Gelmedi" işaretleme
    Route::put('/appointments/{appointment}/no-show', [AppointmentController::class, 'markNoShow']);
    // Randevu iptali — hasta KENDİ randevusunu, doktor/klinik de iptal edebilir (policy: cancel)
    Route::put('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    // Medical Archive (B): randevu aldığı doktor/klinik hastanın komple anamnezini otomatik görür
    Route::get('/appointments/{appointment}/medical-context', [AppointmentController::class, 'medicalContext']);
    Route::get('/appointments/{appointment}/documents/{documentId}/download', [AppointmentController::class, 'downloadSharedDocument']);
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
Route::prefix('patient-documents')->middleware(['auth:sanctum', 'health.consent'])->group(function () {
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
| CRM — Reports / Analytics (provider-scoped, read-only)
|--------------------------------------------------------------------------
| Doctor → kendi verisi, clinicOwner/hospital → klinik verisi.
*/
Route::prefix('crm/reports')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,hospital,superAdmin,saasAdmin', 'crm.access'])->group(function () {
    Route::get('/appointments', [ReportController::class, 'appointments']);
    Route::get('/patients', [ReportController::class, 'patients']);
    Route::get('/services', [ReportController::class, 'services']);
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
| CRM — Sales Leads Pipeline (doctor/clinicOwner/hospital/salesperson)
|--------------------------------------------------------------------------
| Salesperson sees only assigned leads (enforced in controller). Manager
| roles see all clinic leads. Salesperson management is manager-only.
*/
Route::prefix('crm/leads')->middleware(['auth:sanctum', 'role:doctor,clinicOwner,hospital,superAdmin,saasAdmin,salesperson', 'crm.access'])->group(function () {
    Route::get('/', [LeadController::class, 'index']);
    Route::post('/', [LeadController::class, 'store']);
    Route::get('/stats', [LeadController::class, 'stats']);
    Route::get('/{id}', [LeadController::class, 'show']);
    Route::put('/{id}', [LeadController::class, 'update']);
    Route::put('/{id}/stage', [LeadController::class, 'updateStage']);
    Route::put('/{id}/assign', [LeadController::class, 'assign']);
    Route::post('/{id}/activities', [LeadController::class, 'addActivity']);
    Route::delete('/{id}', [LeadController::class, 'destroy']);
});

Route::prefix('crm/salespeople')->middleware(['auth:sanctum', 'role:clinicOwner,hospital,superAdmin,saasAdmin', 'crm.access'])->group(function () {
    Route::get('/', [LeadController::class, 'listSalespeople']);
    Route::post('/', [LeadController::class, 'createSalesperson']);
    Route::put('/{id}/toggle', [LeadController::class, 'toggleSalesperson']);
});

/*
|--------------------------------------------------------------------------
| CRM — Billing / Invoicing (Bölüm 7.5)
|--------------------------------------------------------------------------
*/
// ── Doctor Billing (MVP — no CRM gate, all authenticated doctors) ──────────────
Route::prefix('doctor/billing')->middleware(['auth:sanctum', 'role:doctor'])->group(function () {
    Route::get('/invoices', [BillingController::class, 'index']);
    Route::post('/invoices', [BillingController::class, 'store']);
    Route::get('/invoices/{id}', [BillingController::class, 'show']);
    Route::put('/invoices/{id}', [BillingController::class, 'update']);
    Route::delete('/invoices/{id}', [BillingController::class, 'destroy']);
    Route::get('/stats', [BillingController::class, 'stats']);
    Route::get('/patient-search', [BillingController::class, 'patientSearch']);
});

/*
| Hastanın kendi faturaları — salt okunur.
|
| Fatura hastanın adını, aldığı hizmeti ve tutarı taşıyor; kendi kaydına
| erişmesi gerekiyor (fatura e-postası da buraya yönleniyor). Yazma uçları
| bilerek yok: fatura yalnızca klinik tarafında kesilir ve değiştirilir.
| Kapsam BillingService::scopeQuery içinde patient_id ile kısıtlı.
*/
Route::prefix('patient/billing')->middleware(['auth:sanctum', 'role:patient'])->group(function () {
    Route::get('/invoices', [BillingController::class, 'index']);
    Route::get('/invoices/{id}', [BillingController::class, 'show']);
    Route::get('/invoices/{id}/pdf', [BillingController::class, 'pdf']);
});

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
    // Döviz çevirme uçları KALDIRILDI. Sabit, uydurma kurlarla çalışıyordu
    // (TRY 34.50) ve hiçbir ekran çağırmıyordu. Sağlık turizmi fiyatlandırması
    // gündeme gelince gerçek bir kur kaynağıyla birlikte yazılır.
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
    // ICD-10 arama ucu kaldırıldı: kodlama Mart'ta projeden çıkarıldı
    // (tablo düşürüldü) ama rota kalmıştı ve karşılığı olmayan bir metoda
    // işaret ettiği için her çağrıda 500 dönüyordu.
});

/*
|--------------------------------------------------------------------------
| MedStream — Posts, Comments, Likes, Bookmarks, Reports
|--------------------------------------------------------------------------
*/
Route::prefix('medstream')->group(function () {
    // Public read (optional auth to resolve is_liked/is_bookmarked flags)
    // 60sn public cache — kataloglar gibi statik/yarı statik içerik
    Route::middleware(['optional.auth', 'cache.headers:public;max_age=60'])->group(function () {
        Route::get('/posts', [MedStreamController::class, 'posts']);
        Route::get('/posts/{post}', [MedStreamController::class, 'showPost']);
        Route::get('/posts/{post}/comments', [MedStreamController::class, 'comments']);
        // Public Twitter-style profile by handle (@username)
        //
        // Hız sınırı, kullanıcı adı HASADINA karşı. Uç kimlik istemiyor ve
        // kullanıcı adını ad soyada çeviriyor; `auth/username-available`
        // (60/dk) hangi adların var olduğunu söylediğine göre, ikisi sınırsız
        // bir kimlik listesi çıkarma yolu oluyordu. Gerçek bir ziyaretçi
        // dakikada otuz profil açmıyor.
        Route::get('/u/{username}', [MedStreamController::class, 'profile'])
            ->middleware('throttle:30,1');
    });

    // Secure file download (path-validated, no auth needed for public posts)
    Route::get('/download', [MedStreamController::class, 'download']);

    // Protected write
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/feed', [MedStreamController::class, 'feed']);

        // Publish (posts) — clinics, clinic groups, doctors only (NOT patients)
        Route::post('/posts', [MedStreamController::class, 'storePost'])->middleware('medstream.publish');
        Route::put('/posts/{post}', [MedStreamController::class, 'updatePost'])->middleware('medstream.publish');
        Route::delete('/posts/{post}', [MedStreamController::class, 'destroyPost'])->middleware('medstream.publish');

        // Engage (comment / like / bookmark) — any authenticated user, including patients.
        // Yorum yazmak doğrulanmamış doktora kapalı: yayınla aynı kural, çünkü
        // yorum da hastaya "doktor" etiketiyle görünüyor.
        Route::post('/posts/{post}/comments', [MedStreamController::class, 'storeComment'])->middleware('medstream.comment');
        Route::put('/comments/{comment}', [MedStreamController::class, 'updateComment'])->middleware('medstream.comment');
        Route::delete('/comments/{comment}', [MedStreamController::class, 'destroyComment']);

        Route::post('/posts/{post}/like', [MedStreamController::class, 'toggleLike']);
        Route::post('/posts/{post}/report', [MedStreamController::class, 'storeReport']);

        Route::get('/bookmarks', [MedStreamController::class, 'bookmarks']);
        Route::post('/bookmarks', [MedStreamController::class, 'toggleBookmark']);

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
// Sohbet ekleri: private+şifreli diskten, KISA SÜRELİ İMZALI bağlantıyla servis edilir.
// İmzalı olmaları şart — <img src> Authorization başlığı gönderemez; bağlantı yalnız
// yetkili katılımcıya dönen authenticated API yanıtında üretilir ve 30 dk'da ölür.
Route::get('/messages/attachments/{attachment}/file', [MessageController::class, 'attachmentFile'])
    ->name('messages.attachment.file')->middleware('signed');
Route::get('/messages/attachments/{attachment}/thumb', [MessageController::class, 'attachmentThumb'])
    ->name('messages.attachment.thumb')->middleware('signed');

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
// Sohbet eki: private+şifreli diskten, KISA SÜRELİ İMZALI bağlantıyla.
// `MessageAttachment` için verilmiş kararın aynısı — imzalı olması şart, çünkü
// <img src> Authorization başlığı gönderemez. Bağlantı yalnız konuşmanın
// katılımcısına dönen authenticated yanıtta üretilir ve 30 dk'da ölür.
Route::get('/chat/attachments/{message}/file', [ChatController::class, 'attachmentFile'])
    ->name('chat.attachment.file')->middleware('signed');

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
    Route::get('/{appointmentId}/webrtc', [TelehealthController::class, 'webrtcConfig']);
    Route::get('/{appointmentId}/transcription-token', [TelehealthController::class, 'transcriptionToken']);
    // Sahte transkript üretir; üretimde kapalı. Gerçek görüşmede uydurma
    // klinik cümleleri "kayıt" diye göstermek hekimi yanıltır.
    Route::get('/{appointmentId}/simulate-transcript', [TelehealthController::class, 'simulateTranscript'])
        ->middleware(\App\Http\Middleware\UretimdeKapat::class);
    Route::put('/{appointmentId}/status', [TelehealthController::class, 'updateStatus']);
});

// On-demand content translation (cached). Auth + throttled to curb abuse/quota.
Route::post('/translate', [\App\Http\Controllers\Api\TranslationController::class, 'translate'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);

// Vasco AI — symptom → specialist routing (never diagnoses). Public, throttled.
Route::post('/vasco/suggest', [\App\Http\Controllers\Api\VascoController::class, 'suggest'])
    ->middleware('throttle:30,1');

// Calendar ICS subscription feed (doctor/patient auto-sync, no OAuth).
Route::get('/calendar/feed/{token}', [\App\Http\Controllers\Api\CalendarFeedController::class, 'feed']); // PUBLIC (secret token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/calendar/feed', [\App\Http\Controllers\Api\CalendarFeedController::class, 'info']);
    Route::post('/calendar/feed/regenerate', [\App\Http\Controllers\Api\CalendarFeedController::class, 'regenerate']);
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
    // Klinik yorumu denetimi — doktor yorumlarının birebir karşılığı.
    Route::get('/clinic-reviews', [SuperAdminController::class, 'listClinicReviews']);
    Route::put('/clinic-reviews/{id}/approve', [SuperAdminController::class, 'approveClinicReview']);
    Route::put('/clinic-reviews/{id}/reject', [SuperAdminController::class, 'rejectClinicReview']);
    Route::put('/clinic-reviews/{id}/hide', [SuperAdminController::class, 'hideClinicReview']);

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

    // Security — breach reporting (KVKK Md. 12 / GDPR Art. 33)
    Route::post('/security/breach-report', function (\Illuminate\Http\Request $request, \App\Services\BreachNotificationService $svc) {
        $data = $request->validate([
            'summary'           => 'required|string|max:1000',
            'severity'          => 'sometimes|in:low,medium,high,critical',
            'affected_user_ids' => 'sometimes|array',
            // Kullanıcı kimlikleri UUID; `integer` doğrulaması GERÇEK kimlikleri
            // reddediyordu. Yani veri ihlali bildirimi, tam da bildirmesi
            // gereken şeyi — kimlerin etkilendiğini — kabul edemiyordu
            // (KVKK Md. 12, GDPR Md. 33/34).
            'affected_user_ids.*' => 'uuid|exists:users,id',
            'detected_at'       => 'sometimes|date',
            'vector'            => 'sometimes|string|max:500',
        ]);
        $data['reporter'] = $request->user()?->email ?? 'admin';
        $payload = $svc->notifyBreach($data);
        return response()->json(['ok' => true, 'incident' => $payload], 201);
    });

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
    //
    // Rol ara katmanı EKSİKTİ: yorum "admin" diyordu ama grup yalnız
    // auth:sanctum taşıyordu ve denetleyicide de rol denetimi yoktu.
    // Ölçüldü — bir HASTA hesabı destek kategorisini yeniden adlandırdı (200)
    // ve sildi (200). Silinen kategori ona bağlı bütün talepleri etkiliyor.
    Route::middleware('role:superAdmin,saasAdmin')->group(function () {
        Route::post('/categories', [TicketController::class, 'storeCategory']);
        Route::put('/categories/{id}', [TicketController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [TicketController::class, 'destroyCategory']);
    });
});

/*
|--------------------------------------------------------------------------
| Contact Messages — Patient → Clinic/Doctor inquiries (with attachments)
|--------------------------------------------------------------------------
*/
// İletişim mesajı eki: private+şifreli diskten, KISA SÜRELİ İMZALI bağlantıyla.
// Sohbet ekleriyle aynı gerekçe — arayüz eki <img src> ile gösteriyor ve
// <img> Authorization başlığı gönderemez. Yetki, bağlantı ÜRETİLİRKEN yapılıyor:
// bağlantı yalnız mesajı görmeye yetkili kullanıcıya dönen yanıtta oluşuyor.
Route::get('/contact-messages/{id}/attachment/{attachmentId}', [ContactMessageController::class, 'attachmentSigned'])
    ->name('contact-messages.attachment')->middleware('signed');

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
