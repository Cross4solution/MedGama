<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Çeviri önbelleği.
 *
 * Çeviri, istendiği anda üretilir ve buraya yazılır: bir gönderi ilk kez
 * Almanca istendiğinde çevrilir, sonraki okuyanlar hazırını alır. Alternatifi
 * (her içeriği yazılır yazılmaz 22 dile çevirmek) üretilenlerin çoğu hiç
 * okunmadığı için boşa yük demekti.
 *
 * `source_hash`: özgün metnin özeti. İçerik düzenlenirse özet değişir ve eski
 * çeviri kendiliğinden geçersiz olur — düzenlenmiş bir gönderinin eski
 * çevirisinin gösterilmesini engeller.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Neyin çevirisi: 'post', 'comment', 'message'
            $table->string('source_type', 32);
            $table->uuid('source_id');
            $table->string('field', 32)->default('body');

            $table->string('source_lang', 8)->nullable();
            $table->string('target_lang', 8);

            // Özgün metnin özeti — içerik değişirse çeviri geçersizleşir.
            $table->string('source_hash', 64);

            // Çeviri metni: TEXT + şifreli. Mesaj çevirileri de burada
            // tutuluyor ve mesajlar sağlık verisi olabiliyor.
            $table->text('translated')->nullable();

            $table->timestamps();

            // Aynı içerik + aynı dil için tek kayıt.
            $table->unique(['source_type', 'source_id', 'field', 'target_lang'], 'translations_kaynak_dil_unique');
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
