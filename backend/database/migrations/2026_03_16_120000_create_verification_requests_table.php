<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('doctor_id');
            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();

            // Document type: diploma, specialty_certificate, clinic_license, id_card, other
            $table->string('document_type', 50);
            $table->string('document_label')->nullable();       // User-facing label, e.g. "Cardiology Board Certificate"
            $table->string('file_path');                         // Storage path
            $table->string('file_name');                         // Original filename
            $table->string('mime_type', 100)->nullable();

            // Review workflow
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->uuid('reviewed_by')->nullable();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->text('notes')->nullable();                   // Doctor's notes to admin

            $table->timestamps();

            $table->index(['doctor_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_requests');
    }
};
