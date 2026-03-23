<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Master Brief Compliance: Removing all ICD-10 traces.
     */
    public function up(): void
    {
        if (Schema::hasColumn('patient_records', 'icd10_code')) {
            Schema::table('patient_records', function (Blueprint $table) {
                $table->dropColumn('icd10_code');
            });
        }

        Schema::dropIfExists('icd10_codes');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('icd10_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('category');
            $table->json('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('patient_records', function (Blueprint $table) {
            $table->string('icd10_code')->nullable()->after('appointment_id');
        });
    }
};
