<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ödeme kayıtları (kapora ile başlıyor).
 *
 * Tasarım kararları:
 *
 * • Tutarlar KURUŞ cinsinden tam sayı. Ondalıklı sayı ile para tutmak
 *   toplamlarda kuruş kaymasına yol açıyor; muhasebede kabul edilmez.
 *   1.200,00 € → 120000 + 'EUR'.
 *
 * • Para birimi tutarla birlikte saklanır ve ASLA çevrilmez. Hastaya kendi
 *   parasında gösterilen karşılık yalnızca ekran bilgisidir, kaydedilmez —
 *   kur riskini üstlenmemek için.
 *
 * • Komisyon her kaydın içinde ayrı tutulur (pazaryeri modeli): hastadan
 *   tahsil edilen tutar, Medagama komisyonu ve kliniğin hakedişi. Sonradan
 *   hesaplamak yerine tahsilat anında dondurulur; komisyon oranı değişse bile
 *   geçmiş kayıtlar bozulmaz.
 *
 * • provider_reference benzersiz: sağlayıcıdan gelen aynı bildirim iki kez
 *   işlenip çift tahsilat/çift randevu üretemesin.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Neyin ödemesi — şimdilik yalnızca randevu kaporası.
            $table->string('purpose', 32)->default('appointment_deposit');
            $table->uuid('appointment_id')->nullable();
            $table->uuid('patient_id')->nullable();
            $table->uuid('clinic_id')->nullable();
            $table->uuid('doctor_id')->nullable();

            // Para: kuruş cinsinden tam sayı + ISO para birimi kodu.
            $table->unsignedBigInteger('amount_minor');
            $table->string('currency', 3);

            // Pazaryeri dağılımı — tahsilat anında dondurulur.
            $table->unsignedBigInteger('commission_minor')->default(0);
            $table->unsignedBigInteger('payout_minor')->default(0);
            $table->decimal('commission_rate', 5, 4)->default(0); // 0.1500 = %15

            // pending → paid → refunded / partially_refunded
            //         ↘ failed / expired / cancelled
            $table->string('status', 24)->default('pending');

            // Sağlayıcı bilgileri. Kart verisi BURAYA DA hiçbir yere yazılmaz;
            // yalnızca sağlayıcının verdiği referans tutulur.
            $table->string('provider', 32)->nullable();
            $table->string('provider_reference', 191)->nullable();

            $table->unsignedBigInteger('refunded_minor')->default(0);
            $table->string('refund_reason', 255)->nullable();

            // Ödeme sırasında slot ne zamana kadar kilitli (süre dolarsa serbest).
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('refunded_at')->nullable();

            // Hata ayıklama ve itiraz için sağlayıcı yanıtı (kart verisi hariç).
            $table->text('provider_payload')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('appointment_id');
            $table->index('patient_id');
            $table->index('clinic_id');
            $table->index(['status', 'expires_at']);
            $table->unique(['provider', 'provider_reference'], 'payments_provider_ref_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
