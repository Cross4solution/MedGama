<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_data_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('accessor_id')->index();
            $table->uuid('patient_id')->index();
            $table->string('resource_type', 50);
            $table->uuid('resource_id')->nullable();
            $table->string('action', 30)->default('view');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('accessor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();

            $table->index(['patient_id', 'created_at']);
            $table->index(['accessor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_data_audit_logs');
    }
};
