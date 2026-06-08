<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Master Accreditations Library ──
        Schema::create('accreditations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique(); // e.g., "JCI Accredited"
            $table->text('description')->nullable();
            $table->string('icon')->nullable(); // e.g., "award", "certificate"
            $table->string('category')->default('certification'); // certification, award, authorization
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('is_active');
        });

        // ── Clinic Accreditations (Many-to-Many) ──
        Schema::create('clinic_accreditations', function (Blueprint $table) {
            $table->uuid('clinic_id');
            $table->uuid('accreditation_id');
            $table->string('certificate_number')->nullable(); // e.g., "JCI-2024-12345"
            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->string('document_url')->nullable(); // Link to certificate PDF
            $table->boolean('is_verified')->default(false); // Admin verification
            $table->timestamps();

            $table->primary(['clinic_id', 'accreditation_id']);
            
            $table->foreign('clinic_id')
                  ->references('id')
                  ->on('clinics')
                  ->onDelete('cascade');
                  
            $table->foreign('accreditation_id')
                  ->references('id')
                  ->on('accreditations')
                  ->onDelete('cascade');

            $table->index('is_verified');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_accreditations');
        Schema::dropIfExists('accreditations');
    }
};
