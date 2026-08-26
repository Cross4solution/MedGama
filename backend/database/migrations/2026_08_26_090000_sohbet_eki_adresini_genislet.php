<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `chat_messages.attachment_url` sütunu şifreli değeri taşıyamıyordu.
 *
 * Sütun `varchar(255)`, alan ise `encrypted` cast'li. Laravel'in şifrelemesi
 * dizgeyi yaklaşık dört katına çıkarıyor: doksan karakterlik bir dosya yolu
 * şifrelendiğinde 340, eski `/storage/...` biçimindeyse 372 karakter oluyor.
 * İkisi de sütuna sığmıyor.
 *
 * Sonucu: sohbete dosya eklemek MySQL/TiDB üzerinde
 * `SQLSTATE[22001] Data too long` ile 500 veriyordu — yani CANLIDA. Yerelde
 * görünmüyordu çünkü SQLite varchar uzunluğunu uygulamıyor; testler geçiyordu.
 *
 * Bu, sütunun oluşturulduğu göçten değil, alanın şifrelenmeye başladığı
 * değişiklikten (9d06314) beri bozuk. Aradaki sürede sütunu genişleten bir
 * göç yazılmamış.
 *
 * TEXT seçildi: şifreli uzunluk girdiye göre değişiyor ve sabit bir üst sınır
 * uydurmak aynı hatayı ileri bir tarihe ertelemek olurdu. Sütun dizinli değil
 * ve varsayılanı yok — TiDB kuralları karşılanıyor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->text('attachment_url')->nullable()->change();
            // Dosya adı da şifreleniyorsa aynı tuzağa düşer; şu an düz metin
            // ama sınırı yükseltmenin maliyeti yok.
            $table->string('attachment_name', 512)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('attachment_url')->nullable()->change();
            $table->string('attachment_name')->nullable()->change();
        });
    }
};
