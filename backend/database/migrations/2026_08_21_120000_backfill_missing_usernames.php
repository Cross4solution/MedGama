<?php

use App\Models\User;
use App\Support\Username;
use Illuminate\Database\Migrations\Migration;

/**
 * Kullanıcı adı olmayan hesaplara handle üretir.
 *
 * NEDEN İKİNCİ KEZ:
 * Kolonu ekleyen göç (2026_06_18_120000) zaten bir geri doldurma yapıyor, ama
 * o göç kendi sırası geldiğinde çalıştı ve bir daha çalışmaz. Ondan SONRA
 * tohumlanan hesaplar boş kaldı. Model tarafındaki `creating` kancası da
 * sonradan eklendi (9137f0e), yani arada yaratılan hesapları kapsamıyor.
 * Dağıtım yalnızca `migrate` çalıştırdığı için tam tohumlama da tekrar
 * koşmuyor; kısacası bu hesapları düzeltecek hiçbir yol kalmamıştı.
 *
 * SOMUT ETKİ:
 * Canlıdaki MedStream yazarlarının tamamının (15/15) kullanıcı adı boştu.
 * Profil adresi /@username üzerinden çözüldüğü için hiçbir yazarın profiline
 * gidilemiyordu — akıştaki her yazar bağlantısı çıkmazdı.
 *
 * Yalnızca BOŞ olanlara dokunur; var olan handle'lar korunur, tekrar
 * çalıştırılabilir.
 */
return new class extends Migration
{
    public function up(): void
    {
        // chunkById kendi sıralamasını (id) uyguluyor; ayrıca orderBy vermek
        // sıralamayı çakıştırır.
        User::where(fn ($q) => $q->whereNull('username')->orWhere('username', ''))
            ->chunkById(200, function ($kullanicilar) {
                foreach ($kullanicilar as $k) {
                    $k->username = Username::generate(
                        $k->fullname ?? 'user',
                        $k->role_id ?? 'patient',
                        $k->clinic_name,
                        $k->id,
                    );
                    // Model olayları tetiklenmesin: bu bir veri onarımı,
                    // güncelleme değil.
                    $k->saveQuietly();
                }
            });
    }

    public function down(): void
    {
        // Geri alınamaz: hangi handle'ın bu göçle üretildiği kaydedilmiyor ve
        // silmek çalışan profil adreslerini kırardı.
    }
};
