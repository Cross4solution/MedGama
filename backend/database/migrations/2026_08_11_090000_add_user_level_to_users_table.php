<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * users.user_level — kodun her yerinde kullanılan ama hiçbir migration'ın
 * oluşturmadığı sütun. Model fillable/casts'te var, yetki middleware'leri
 * (EnsureDoctorVerified, EnsureCanPublishMedStream), UserResource ve
 * AuthService::register hepsi buna yazıp okuyor. Sütun olmadığı için
 * KAYIT TAMAMEN KIRIKTI (insert "no column named user_level" ile patlıyordu).
 *
 * Seviyeler AuthService'teki eşlemeyle birebir:
 *   1 hasta · 2 doktor · 3 klinik · 4 hastane · 5 yönetici
 */
return new class extends Migration
{
    /** role_id → user_level (AuthService::register ile aynı) */
    private const LEVELS = [
        'patient'     => 1,
        'doctor'      => 2,
        'clinicOwner' => 3,
        'clinic'      => 3,
        'hospital'    => 4,
        'superAdmin'  => 5,
        'saasAdmin'   => 5,
    ];

    public function up(): void
    {
        if (Schema::hasColumn('users', 'user_level')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $column = $table->unsignedTinyInteger('user_level')->default(1);
            // AFTER yalnız MySQL/TiDB'de geçerli; sqlite'ta atlanır.
            if (DB::connection()->getDriverName() === 'mysql') {
                $column->after('role_id');
            }
        });

        // Mevcut kullanıcıları rolüne göre doldur (varsayılan 1 = hasta).
        foreach (self::LEVELS as $role => $level) {
            if ($level === 1) {
                continue; // zaten varsayılan
            }
            DB::table('users')->where('role_id', $role)->update(['user_level' => $level]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'user_level')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('user_level');
            });
        }
    }
};
