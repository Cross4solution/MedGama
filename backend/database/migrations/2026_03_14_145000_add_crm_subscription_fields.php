<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add CRM subscription fields to clinics and users tables.
     *
     * Business rule: CRM module is a paid feature.
     * - Clinics pay for CRM access → is_crm_active + crm_expires_at on clinics
     * - Independent doctors (no clinic) pay individually → same fields on users
     */
    public function up(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->boolean('is_crm_active')->default(false)->after('is_active');
            $table->timestamp('crm_expires_at')->nullable()->after('is_crm_active');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_crm_active')->default(false)->after('is_active');
            $table->timestamp('crm_expires_at')->nullable()->after('is_crm_active');
        });
    }

    public function down(): void
    {
        Schema::table('clinics', function (Blueprint $table) {
            $table->dropColumn(['is_crm_active', 'crm_expires_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_crm_active', 'crm_expires_at']);
        });
    }
};
