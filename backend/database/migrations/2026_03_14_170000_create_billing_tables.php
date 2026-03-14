<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Invoices ──
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number')->unique();          // e.g. INV-2026-00001
            $table->uuid('patient_id')->index();
            $table->uuid('clinic_id')->nullable()->index();
            $table->uuid('doctor_id')->index();
            $table->uuid('appointment_id')->nullable()->index(); // optional link

            // Financial
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);       // e.g. 18.00 for 18%
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('currency', 3)->default('EUR');

            // Status: paid, pending, partial, cancelled
            $table->string('status', 20)->default('pending')->index();
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('payment_method', 30)->nullable();    // cash, credit_card, bank_transfer

            // Meta
            $table->text('notes')->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('patient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('clinic_id')->references('id')->on('clinics')->nullOnDelete();
            $table->foreign('doctor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('appointment_id')->references('id')->on('appointments')->nullOnDelete();
        });

        // ── Invoice Items (line items) ──
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id')->index();

            $table->string('description');                       // e.g. "General Consultation"
            $table->string('category')->nullable();              // Consultation, Lab, Imaging, etc.
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);               // quantity * unit_price

            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
