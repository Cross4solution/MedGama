<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Mükerrer çeviri tablosunu kaldırır.
 *
 * Çeviri önbelleği zaten `content_translations` tablosunda vardı (metin özetine
 * göre anahtarlanmış, sağlayıcı değiştirilebilir). İkinci bir tablo eklemek iki
 * ayrı önbellek ve iki ayrı bakım noktası demekti; kullanılmadan kaldırıldı.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('translations');
    }

    public function down(): void
    {
        // Geri alınmaz: tablo hiç kullanılmadı, veri kaybı yok.
    }
};
