<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Convert single 'translations' JSON column to separate translatable JSON columns.
     *
     * Before: translations = {"en":"Cardiology","tr":"Kardiyoloji"}
     * After:  name = {"en":"Cardiology","tr":"Kardiyoloji"}, description = {"en":"...","tr":"..."}
     *
     * This follows the spatie/laravel-translatable pattern where each translatable
     * attribute has its own JSON column: {"locale": "value", ...}
     */
    public function up(): void
    {
        // ── 1. Specialties ──
        Schema::table('specialties', function (Blueprint $table) {
            $table->json('name')->nullable()->after('code');
            $table->json('description')->nullable()->after('name');
        });

        // Migrate existing data: translations → name
        DB::table('specialties')->whereNotNull('translations')->orderBy('id')->each(function ($row) {
            DB::table('specialties')->where('id', $row->id)->update([
                'name' => $row->translations,
            ]);
        });

        Schema::table('specialties', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        // ── 2. Cities ──
        Schema::table('cities', function (Blueprint $table) {
            $table->json('name')->nullable()->after('code');
        });

        DB::table('cities')->whereNotNull('translations')->orderBy('id')->each(function ($row) {
            DB::table('cities')->where('id', $row->id)->update([
                'name' => $row->translations,
            ]);
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        // ── 3. Disease Conditions ──
        Schema::table('disease_conditions', function (Blueprint $table) {
            $table->json('name')->nullable()->after('code');
            $table->json('description')->nullable()->after('name');
        });

        DB::table('disease_conditions')->whereNotNull('translations')->orderBy('id')->each(function ($row) {
            DB::table('disease_conditions')->where('id', $row->id)->update([
                'name' => $row->translations,
            ]);
        });

        Schema::table('disease_conditions', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        // ── 4. Symptom Specialty Mappings ──
        Schema::table('symptom_specialty_mappings', function (Blueprint $table) {
            $table->json('name')->nullable()->after('symptom');
        });

        DB::table('symptom_specialty_mappings')->whereNotNull('translations')->orderBy('id')->each(function ($row) {
            DB::table('symptom_specialty_mappings')->where('id', $row->id)->update([
                'name' => $row->translations,
            ]);
        });

        Schema::table('symptom_specialty_mappings', function (Blueprint $table) {
            $table->dropColumn('translations');
        });
    }

    public function down(): void
    {
        // ── Reverse: named columns → translations ──

        Schema::table('specialties', function (Blueprint $table) {
            $table->json('translations')->nullable()->after('display_order');
        });
        DB::table('specialties')->whereNotNull('name')->orderBy('id')->each(function ($row) {
            DB::table('specialties')->where('id', $row->id)->update(['translations' => $row->name]);
        });
        Schema::table('specialties', function (Blueprint $table) {
            $table->dropColumn(['name', 'description']);
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->json('translations')->nullable()->after('country_id');
        });
        DB::table('cities')->whereNotNull('name')->orderBy('id')->each(function ($row) {
            DB::table('cities')->where('id', $row->id)->update(['translations' => $row->name]);
        });
        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn('name');
        });

        Schema::table('disease_conditions', function (Blueprint $table) {
            $table->json('translations')->nullable()->after('recommended_specialty_ids');
        });
        DB::table('disease_conditions')->whereNotNull('name')->orderBy('id')->each(function ($row) {
            DB::table('disease_conditions')->where('id', $row->id)->update(['translations' => $row->name]);
        });
        Schema::table('disease_conditions', function (Blueprint $table) {
            $table->dropColumn(['name', 'description']);
        });

        Schema::table('symptom_specialty_mappings', function (Blueprint $table) {
            $table->json('translations')->nullable()->after('specialty_ids');
        });
        DB::table('symptom_specialty_mappings')->whereNotNull('name')->orderBy('id')->each(function ($row) {
            DB::table('symptom_specialty_mappings')->where('id', $row->id)->update(['translations' => $row->name]);
        });
        Schema::table('symptom_specialty_mappings', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
