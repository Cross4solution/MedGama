<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add verification_status to clinics table
        Schema::table('clinics', function (Blueprint $table) {
            $table->string('verification_status', 30)->default('unverified')->after('is_verified');
            // unverified | pending_review | verified | rejected
        });

        // Sync existing is_verified boolean → verification_status
        \DB::table('clinics')->where('is_verified', true)->update(['verification_status' => 'verified']);

        // Create clinic_verifications table for document tracking
        Schema::create('clinic_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('clinic_id')->index();
            $table->uuid('submitted_by')->index(); // user who submitted

            // 4 document paths
            $table->string('business_registration')->nullable();
            $table->string('operating_license')->nullable();
            $table->string('tax_plate')->nullable();
            $table->string('representative_id')->nullable();

            // Status tracking
            $table->string('status', 30)->default('pending_review');
            // pending_review | approved | rejected
            $table->text('admin_notes')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->foreign('clinic_id')->references('id')->on('clinics')->cascadeOnDelete();
            $table->foreign('submitted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_verifications');

        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn('verification_status');
        });
    }
};
