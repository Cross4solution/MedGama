<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // unverified | pending_review | info_requested | approved | rejected
            $table->string('verification_status')->default('unverified')->after('is_verified');
            $table->text('admin_verification_note')->nullable()->after('verification_status');
        });

        // Backfill existing doctors based on current state
        // 1) verified doctors → approved
        \Illuminate\Support\Facades\DB::table('users')
            ->where('role_id', 'doctor')
            ->where('is_verified', true)
            ->update(['verification_status' => 'approved']);

        // 2) unverified doctors who have pending verification requests → pending_review
        $doctorsWithPending = \Illuminate\Support\Facades\DB::table('verification_requests')
            ->where('status', 'pending')
            ->distinct()
            ->pluck('doctor_id');

        if ($doctorsWithPending->isNotEmpty()) {
            \Illuminate\Support\Facades\DB::table('users')
                ->whereIn('id', $doctorsWithPending)
                ->where('is_verified', false)
                ->update(['verification_status' => 'pending_review']);
        }

        // 3) doctors with info_requested → info_requested
        $doctorsInfoReq = \Illuminate\Support\Facades\DB::table('verification_requests')
            ->where('status', 'info_requested')
            ->distinct()
            ->pluck('doctor_id');

        if ($doctorsInfoReq->isNotEmpty()) {
            \Illuminate\Support\Facades\DB::table('users')
                ->whereIn('id', $doctorsInfoReq)
                ->where('is_verified', false)
                ->update(['verification_status' => 'info_requested']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['verification_status', 'admin_verification_note']);
        });
    }
};
