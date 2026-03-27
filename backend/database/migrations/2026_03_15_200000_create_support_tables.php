<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Ticket Categories ──
        Schema::create('ticket_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('name');            // {"en": "Billing", "tr": "Faturalandırma"}
            $table->json('description')->nullable();
            $table->string('slug')->unique();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ── Tickets ──
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ticket_number')->unique(); // e.g. TKT-2026-00001
            $table->uuid('user_id')->index();          // creator (doctor/patient)
            $table->uuid('category_id')->nullable()->index();
            $table->uuid('assigned_to')->nullable()->index(); // admin/staff

            $table->string('subject');
            $table->string('status', 20)->default('open')->index(); // open, in_progress, resolved, closed
            $table->string('priority', 20)->default('medium');      // low, medium, high, urgent

            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('ticket_categories')->nullOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
        });

        // ── Ticket Messages (conversation thread) ──
        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id')->index();
            $table->uuid('user_id')->index(); // who sent the message
            $table->text('body');
            $table->json('attachments')->nullable(); // [{filename, path, mime, size}]
            $table->boolean('is_internal')->default(false); // admin-only note
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ── FAQ ──
        Schema::create('faqs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('question');  // {"en": "...", "tr": "..."}
            $table->json('answer');    // {"en": "...", "tr": "..."}
            $table->string('category')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('ticket_categories');
    }
};
