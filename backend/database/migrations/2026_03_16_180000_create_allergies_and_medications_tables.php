<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allergies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 30)->unique();
            $table->json('name');           // {"en": "Penicillin", "tr": "Penisilin"}
            $table->string('category', 50)->nullable(); // drug, food, environmental, other
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('medications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 30)->unique();
            $table->json('name');           // {"en": "Ibuprofen", "tr": "İbuprofen"}
            $table->string('category', 50)->nullable(); // analgesic, antibiotic, cardiovascular, etc.
            $table->string('form', 30)->nullable();      // tablet, capsule, syrup, injection
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medications');
        Schema::dropIfExists('allergies');
    }
};
