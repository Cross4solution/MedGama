<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sales CRM — Lead activity timeline (notes, calls, stage changes, assignments).
     *
     * TiDB/MySQL-compatible: ENUM for type, JSON for meta (nullable), TEXT nullable.
     */
    public function up(): void
    {
        Schema::create('lead_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('lead_id')->index();
            $table->uuid('user_id')->nullable()->index(); // who performed it

            $table->enum('type', ['note', 'call', 'email', 'stage_change', 'assignment'])
                ->default('note')
                ->index();

            $table->text('description')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
    }
};
