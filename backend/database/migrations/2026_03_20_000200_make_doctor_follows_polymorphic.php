<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The doctor_follows table had a FK on following_id → users.id,
     * but clinics can also be followed. Add following_type column
     * and drop the restrictive FK so clinic UUIDs are accepted.
     */
    public function up(): void
    {
        Schema::table('doctor_follows', function (Blueprint $table) {
            // Drop old FK on following_id (references users only)
            $table->dropForeign(['following_id']);

            // Add polymorphic type column: 'doctor' or 'clinic'
            $table->string('following_type', 20)->default('doctor')->after('following_id');

            // Drop old unique and re-create with type included
            $table->dropUnique(['follower_id', 'following_id']);
            $table->unique(['follower_id', 'following_id', 'following_type']);
        });
    }

    public function down(): void
    {
        Schema::table('doctor_follows', function (Blueprint $table) {
            $table->dropUnique(['follower_id', 'following_id', 'following_type']);
            $table->dropColumn('following_type');
            $table->unique(['follower_id', 'following_id']);
            $table->foreign('following_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
