<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hibrit Medical Archive paylaşımı (C):
 *   • Randevuda "özet" (alerji + kritik ilaç) hastanın genel rızasıyla otomatik görünür.
 *   • "Tam" arşiv (aşılar, notlar, belgeler) yalnız hasta bu randevu için RIZA verirse açılır.
 * Bu tablo o randevu-bazlı tam-paylaşım rızasını tutar (süreli + geri alınabilir).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_share_consents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id');
            $table->uuid('appointment_id');
            $table->uuid('provider_id')->nullable();      // görüntüleyecek doktor/klinik user id
            $table->string('scope', 20)->default('full'); // 'full' — özet zaten rıza gerektirmez
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('expires_at')->nullable();  // randevu bitimi/otomatik sona
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('appointment_id');
            $table->unique(['appointment_id', 'scope']);  // randevu başına tek aktif tam-rıza
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_share_consents');
    }
};
