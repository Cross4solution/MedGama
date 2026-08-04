<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Açık rıza kayıtları (KVKK m.5-6 / GDPR Art.7 / HIPAA authorization).
 *
 * Denetimde ispat edilebilmesi için her onay ayrı satır olarak tutulur:
 * kim, neye, HANGİ METİN SÜRÜMÜNE, ne zaman, nereden onay verdi; geri aldıysa
 * ne zaman aldı. Kayıtlar güncellenmez — geri alma yeni bir olay olarak işlenir
 * (revoked_at damgası), böylece geçmiş bozulmaz.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consent_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            // 'health_data_processing' | 'privacy_policy' | 'terms_of_service'
            // | 'medical_share_notice' | 'marketing_communications'
            $table->string('type', 60);
            $table->string('version', 20);              // onaylanan metnin sürümü
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('source', 40)->nullable();   // register | profile | appointment ...
            $table->string('locale', 10)->nullable();   // onay anındaki dil
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_records');
    }
};
