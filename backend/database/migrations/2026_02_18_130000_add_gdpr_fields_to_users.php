<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'medical_history')) {
                $table->jsonb('medical_history')->nullable()->after('clinic_id');
            }
            if (!Schema::hasColumn('users', 'notification_preferences')) {
                $table->jsonb('notification_preferences')->nullable()->after('medical_history');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['medical_history', 'notification_preferences']);
        });
    }
};
