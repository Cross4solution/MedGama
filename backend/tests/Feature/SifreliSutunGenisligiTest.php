<?php

namespace Tests\Feature;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Şifrelenen bir alan `varchar` sütuna sığmaz.
 *
 * Laravel'in `encrypted` cast'i dizgeyi yaklaşık dört katına çıkarıyor:
 * doksan karakterlik bir dosya yolu şifrelenince 340 karakter oluyor.
 * `chat_messages.attachment_url` ise `varchar(255)`ti.
 *
 * Sonuç canlıda 500'dü — sohbete dosya eklemek `SQLSTATE[22001] Data too
 * long` ile düşüyordu. Yerelde HİÇ görünmüyordu: SQLite varchar uzunluğunu
 * uygulamıyor, değeri sessizce kabul ediyor. Yani paket yeşilken üretim
 * bozuktu ve bunu ancak GERÇEK SÜRÜCÜYE karşı koşmak gösterdi.
 *
 * Bu ölçüt SQLite'ta atlanıyor — orada ölçülecek bir şey yok. MySQL'e karşı
 * koşulduğunda bütün şifreli alanları tarıyor:
 *
 *   DB_CONNECTION=mysql DB_DATABASE=<test_db> DB_SSL_DISABLED=1 php artisan test
 *
 * (Ayrıntı: docs/YEREL-TEST.md)
 */
class SifreliSutunGenisligiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sifreli_alanlarin_sutunu_varchar_degil(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped(
                'Sütun genişliği yalnız gerçek sürücüde ölçülebilir; SQLite varchar sınırını uygulamıyor.'
            );
        }

        $dar = [];

        foreach (glob(app_path('Models/*.php')) as $dosya) {
            $sinif = 'App\\Models\\' . basename($dosya, '.php');

            if (!class_exists($sinif)) {
                continue;
            }

            $model = new $sinif();

            if (!$model instanceof Model) {
                continue;
            }

            foreach ($model->getCasts() as $alan => $tip) {
                if (!str_starts_with((string) $tip, 'encrypted')) {
                    continue;
                }

                try {
                    $sutun = DB::select("SHOW COLUMNS FROM `{$model->getTable()}` LIKE ?", [$alan]);
                } catch (\Throwable) {
                    continue;
                }

                if (!$sutun) {
                    continue;
                }

                if (preg_match('/^varchar/i', $sutun[0]->Type)) {
                    $dar[] = "{$model->getTable()}.{$alan} ({$sutun[0]->Type})";
                }
            }
        }

        $this->assertSame(
            [],
            $dar,
            'şifrelenen alan varchar sütunda: şifreli değer taşar ve yazma canlıda 500 verir',
        );
    }
}
