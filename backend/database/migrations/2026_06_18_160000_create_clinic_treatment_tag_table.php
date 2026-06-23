<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clinic_treatment_tag', function (Blueprint $table) {
            $table->uuid('clinic_id');
            $table->uuid('treatment_tag_id');
            $table->timestamps();

            $table->primary(['clinic_id', 'treatment_tag_id']);
            $table->index('treatment_tag_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_treatment_tag');
    }
};
