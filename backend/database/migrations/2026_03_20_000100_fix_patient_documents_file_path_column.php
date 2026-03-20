<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * file_path uses 'encrypted' cast which produces values >255 chars.
     * Change from varchar(255) to text so the encrypted payload fits.
     */
    public function up(): void
    {
        Schema::table('patient_documents', function (Blueprint $table) {
            $table->text('file_path')->change();
        });
    }

    public function down(): void
    {
        Schema::table('patient_documents', function (Blueprint $table) {
            $table->string('file_path')->change();
        });
    }
};
