<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('content_translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->char('source_hash', 64);        // sha256 of source text
            $table->string('target_lang', 8);
            $table->string('source_lang', 8)->nullable();
            $table->text('translated_text')->nullable();
            $table->string('provider', 32)->nullable();
            $table->timestamps();

            $table->unique(['source_hash', 'target_lang']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_translations');
    }
};
