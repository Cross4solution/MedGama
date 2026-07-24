<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Feed en sık sorgu: created_at'e göre sıralar + son 30 gün filtresi (top mode)
        Schema::table('med_stream_posts', function (Blueprint $table) {
            if (!$this->hasIndex('med_stream_posts', 'msp_created_at_idx')) {
                $table->index('created_at', 'msp_created_at_idx');
            }
            if (!$this->hasIndex('med_stream_posts', 'msp_author_created_idx')) {
                $table->index(['author_id', 'created_at'], 'msp_author_created_idx');
            }
        });

        // "Yakındaki" yarıçap (bbox) filtresi lat/lng'de aralık taraması yapar
        foreach (['doctor_profiles', 'clinics'] as $tbl) {
            if (Schema::hasColumn($tbl, 'latitude') && Schema::hasColumn($tbl, 'longitude')) {
                Schema::table($tbl, function (Blueprint $table) use ($tbl) {
                    $idx = substr($tbl, 0, 6) . '_latlng_idx';
                    if (!$this->hasIndex($tbl, $idx)) {
                        $table->index(['latitude', 'longitude'], $idx);
                    }
                });
            }
        }
    }

    public function down(): void
    {
        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropIndex('msp_created_at_idx');
            $table->dropIndex('msp_author_created_idx');
        });
        foreach (['doctor_profiles', 'clinics'] as $tbl) {
            Schema::table($tbl, function (Blueprint $table) use ($tbl) {
                $table->dropIndex(substr($tbl, 0, 6) . '_latlng_idx');
            });
        }
    }

    private function hasIndex(string $table, string $index): bool
    {
        try {
            return collect(\Illuminate\Support\Facades\DB::select(
                "SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index]
            ))->isNotEmpty();
        } catch (\Throwable $e) {
            return false; // sqlite (yerel) — güvenle oluştur
        }
    }
};
