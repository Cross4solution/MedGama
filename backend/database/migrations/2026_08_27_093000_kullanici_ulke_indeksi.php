<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * `users.country` için indeks.
 *
 * MedStream akışı yazarın ülkesine göre süzülüyor ve bu her istekte koşan bir
 * alt sorgu. Sütunda hiç indeks yoktu; EXPLAIN "Table scan on users" diyordu.
 *
 * Süzgeç ayrıca `LIKE '%TR%'` kullanıyordu — sütun ISO kodu tutan bir
 * `varchar(5)` olduğu için alt dize aramanın anlamı yoktu ve hiçbir indeks
 * kullanılamıyordu. Sorgu tam eşleşmeye çevrildi; indeks ancak öyle işe yarar.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'country')) {
            return;
        }

        Schema::table('users', function ($tablo) {
            $tablo->index('country', 'users_country_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function ($tablo) {
            $tablo->dropIndex('users_country_index');
        });
    }
};
