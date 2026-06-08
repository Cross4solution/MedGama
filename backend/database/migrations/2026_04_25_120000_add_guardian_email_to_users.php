<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * GDPR Art. 8 / KVKK / COPPA — Parental consent for users under 16/18.
 * Stores the guardian email collected at registration when the user is a minor.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'guardian_email')) {
                $table->string('guardian_email', 255)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'guardian_consent_at')) {
                $table->timestamp('guardian_consent_at')->nullable()->after('guardian_email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'guardian_consent_at')) {
                $table->dropColumn('guardian_consent_at');
            }
            if (Schema::hasColumn('users', 'guardian_email')) {
                $table->dropColumn('guardian_email');
            }
        });
    }
};
