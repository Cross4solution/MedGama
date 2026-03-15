<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('patient_id')->index();
            $table->uuid('uploaded_by')->index(); // patient or doctor
            $table->string('title');               // user-facing title
            $table->text('description')->nullable(); // encrypted
            $table->enum('category', [
                'lab_result',   // Tahlil sonucu
                'radiology',    // Röntgen, MR, BT
                'epicrisis',    // Epikriz raporu
                'prescription', // Reçete
                'pathology',    // Patoloji raporu
                'surgery',      // Ameliyat raporu
                'vaccination',  // Aşı kartı
                'allergy',      // Alerji testi
                'insurance',    // Sigorta belgesi
                'other',        // Diğer
            ])->default('other');
            $table->string('file_path');           // encrypted storage path
            $table->string('file_name');           // original filename
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size'); // bytes
            $table->date('document_date')->nullable(); // date of the medical document
            $table->json('shared_with')->nullable();   // array of doctor UUIDs who can view
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index('category');
            $table->index('document_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_documents');
    }
};
