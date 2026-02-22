<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Fix: encrypted cast columns must be TEXT, not JSON/JSONB/VARCHAR
|--------------------------------------------------------------------------
| Laravel's encrypted / encrypted:array casts produce a base64 string,
| NOT valid JSON.  PostgreSQL strictly validates json/jsonb columns,
| so it rejects the encrypted payload.  Changing these columns to TEXT
| stores the ciphertext verbatim and lets the Eloquent cast handle
| serialization on read.
|
| Affected columns:
|   users.medical_history           jsonb  → text
|   users.notification_preferences  jsonb  → text
|   digital_anamneses.answers       json   → text
|   patient_records.description     string → text  (encrypted value > 255 chars)
*/

return new class extends Migration
{
    public function up(): void
    {
        // users.medical_history  jsonb → text
        if (Schema::hasColumn('users', 'medical_history')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('medical_history')->nullable()->change();
            });
        }

        // users.notification_preferences  jsonb → text
        if (Schema::hasColumn('users', 'notification_preferences')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('notification_preferences')->nullable()->change();
            });
        }

        // digital_anamneses.answers  json → text
        Schema::table('digital_anamneses', function (Blueprint $table) {
            $table->text('answers')->change();
        });

        // patient_records.description  varchar(255) → text
        Schema::table('patient_records', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'medical_history')) {
            Schema::table('users', function (Blueprint $table) {
                $table->jsonb('medical_history')->nullable()->change();
            });
        }

        if (Schema::hasColumn('users', 'notification_preferences')) {
            Schema::table('users', function (Blueprint $table) {
                $table->jsonb('notification_preferences')->nullable()->change();
            });
        }

        Schema::table('digital_anamneses', function (Blueprint $table) {
            $table->json('answers')->change();
        });

        Schema::table('patient_records', function (Blueprint $table) {
            $table->string('description')->nullable()->change();
        });
    }
};
