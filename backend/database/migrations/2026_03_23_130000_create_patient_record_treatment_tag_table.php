<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_record_treatment_tag', function (Blueprint $table) {
            $table->id();
            $table->uuid('patient_record_id');
            $table->uuid('treatment_tag_id');

            $table->foreign('patient_record_id')->references('id')->on('patient_records')->cascadeOnDelete();
            $table->foreign('treatment_tag_id')->references('id')->on('treatment_tags')->cascadeOnDelete();

            $table->unique(['patient_record_id', 'treatment_tag_id'], 'pr_tt_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_record_treatment_tag');
    }
};
