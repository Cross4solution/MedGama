<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Herkese açık iki listenin dizinleri: doktor listesi ve MedStream akışı.
 *
 * İkisi de en çok istek alan uçlar ve ikisi de tabloyu baştan sona tarıyordu —
 * filtrelenen sütunlarda dizin yoktu. Küçük tabloda bu görünmüyor; TiDB
 * dağıtık olduğu için tam tarama satır sayısından bağımsız sabit bir bedel
 * ödetiyor (ölçümde dizinli bir sorgu ~4 ms, dizinsiz ~70 ms).
 *
 * Asıl mesele büyüme: doktor listesi TÜM kullanıcı tablosunu tarıyordu, yani
 * kayıt olan her yeni hasta herkese açık doktor aramasını yavaşlatıyordu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // where role_id = 'doctor' and is_active = 1
            $table->index(['role_id', 'is_active'], 'idx_users_role_active');
        });

        Schema::table('med_stream_posts', function (Blueprint $table) {
            // where is_active = 1 and is_hidden = 0 order by created_at desc
            $table->index(['is_active', 'is_hidden', 'created_at'], 'idx_posts_active_hidden_created');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role_active');
        });

        Schema::table('med_stream_posts', function (Blueprint $table) {
            $table->dropIndex('idx_posts_active_hidden_created');
        });
    }
};
