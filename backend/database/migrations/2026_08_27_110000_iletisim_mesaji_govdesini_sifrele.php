<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Var olan iletişim mesajlarının gövdesini şifreler.
 *
 * `ContactMessage::$casts` artık `body`yi şifreli tutuyor. Cast yalnız YENİ
 * yazmaları etkiliyor; daha önce düz metin kaydedilmiş satırlar olduğu gibi
 * duruyor ve model onları okumaya çalıştığında `DecryptException` fırlıyor —
 * yani gelen kutusu eski mesajlarda kırılır.
 *
 * Göç o satırları yerinde şifreliyor.
 *
 * TEKRAR ÇALIŞTIRILABİLİR. Zaten şifreli bir değeri yeniden şifrelemek onu
 * çift sarmalar ve okunduğunda şifreli metin döner — sessiz ve geri dönüşü zor
 * bir bozulma. Bu yüzden her satır önce sınanıyor: Laravel'in şifreli yükü
 * base64 içinde `iv`, `value` ve `mac` taşıyan bir JSON; bu yapıya uyan değer
 * atlanıyor.
 *
 * GERİ ALMA yok. Şifreyi çözüp düz metne dönmek, veriyi bilerek korumasız
 * bırakmak olurdu.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('contact_messages')) {
            return;
        }

        DB::table('contact_messages')
            ->select('id', 'body')
            ->orderBy('id')
            ->chunk(200, function ($satirlar) {
                foreach ($satirlar as $satir) {
                    // BOŞ DİZGE DE ŞİFRELENİYOR.
                    //
                    // İlk hâli onu "korunacak bir şey yok" diye atlıyordu. Ama
                    // şifreli bir sütunda duran ham `''` okunurken
                    // `DecryptException` fırlatıyor — yani o tek satır bütün
                    // gelen kutusunu kırar. `''` şifrelendiğinde geçerli bir
                    // yük oluyor ve yine `''` olarak çözülüyor.
                    //
                    // `null` farklı: sütun boş kalıyor, cast onu hiç çözmeye
                    // çalışmıyor.
                    if ($satir->body === null || $this->zatenSifreli($satir->body)) {
                        continue;
                    }

                    DB::table('contact_messages')
                        ->where('id', $satir->id)
                        ->update(['body' => Crypt::encryptString($satir->body)]);
                }
            });
    }

    public function down(): void
    {
        // Bilerek boş: bkz. sınıf açıklaması.
    }

    /** Laravel'in şifreli yükü mü? */
    private function zatenSifreli(string $deger): bool
    {
        $cozulmus = base64_decode($deger, true);

        if ($cozulmus === false) {
            return false;
        }

        $yuk = json_decode($cozulmus, true);

        return is_array($yuk)
            && array_key_exists('iv', $yuk)
            && array_key_exists('value', $yuk)
            && array_key_exists('mac', $yuk);
    }
};
