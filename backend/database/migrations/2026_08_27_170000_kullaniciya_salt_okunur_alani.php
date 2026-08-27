<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Salt okunur hesap: girer, gezer, hiçbir şeyi değiştiremez.
 *
 * Müşteriye yönetim panelini gösterebilmek için gerekiyordu. Alternatifler
 * daha kötüydü: paneli şifresiz açmak adresi bilen herkese hasta kayıtlarını
 * verirdi; tam yetkili bir hesap vermek ise tanıtım sırasında yanlışlıkla
 * silinen bir kaydı geri getirilemez kılardı.
 *
 * Kısıt VERİTABANINDA değil uygulamada uygulanıyor (bkz.
 * `SaltOkunurKullanici` middleware), ama işareti burada duruyor: rol
 * sisteminden bağımsız, yani ileride hekim ya da klinik hesabı için de
 * kullanılabilir.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('salt_okunur')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('salt_okunur');
        });
    }
};
