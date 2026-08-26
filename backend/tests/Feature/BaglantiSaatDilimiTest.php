<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Veritabanı bağlantısının saat dilimi sabit olmalı.
 *
 * `timestamp` sütunları yazarken ve okurken OTURUM saat dilimine göre
 * çevriliyor. Sabitlenmediğinde oturum `SYSTEM` oluyor, yani veritabanı
 * sunucusunun yerel saati. Şemada 193 `timestamp` sütunu var.
 *
 * Ölçüldü:
 *
 *     SET time_zone='+03:00';  INSERT ... '2026-06-15 12:00:00'
 *     SET time_zone='+00:00';  SELECT  →  2026-06-15 09:00:00
 *
 * Aynı ortamda gidiş-dönüş tutarlı olduğu için hiçbir şey bozuk GÖRÜNMEZ.
 * Kayma sunucu taşındığında, sunucunun saat dilimi değiştiğinde ya da başka
 * dilimdeki bir kopyadan okunduğunda ortaya çıkar — ve o noktada geçmişteki
 * bütün randevu saatleri kaymış olur.
 *
 * Uygulama zaten UTC; bağlantının da UTC olması ikisini hizalıyor.
 */
class BaglantiSaatDilimiTest extends TestCase
{
    use RefreshDatabase;

    public function test_uygulama_utc(): void
    {
        // Bağlantı UTC'ye sabitlenirken uygulama başka bir dilimdeyse, ikisi
        // arasındaki fark sessizce geri gelir.
        $this->assertSame('UTC', config('app.timezone'));
    }

    public function test_mysql_baglantisi_utc_ye_sabit(): void
    {
        $this->assertSame(
            '+00:00',
            config('database.connections.mysql.timezone'),
            'bağlantı saat dilimi sabitlenmemiş: sunucunun yerel saati devreye girer',
        );
    }

    public function test_oturum_gercekten_utc(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Oturum saat dilimi yalnız gerçek sürücüde ölçülebilir.');
        }

        $this->assertSame('+00:00', DB::select('SELECT @@session.time_zone AS tz')[0]->tz);
    }

    public function test_zaman_damgasi_gidip_donerken_kaymiyor(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Çevrim davranışı yalnız gerçek sürücüde ölçülebilir.');
        }

        // Asıl ölçüt: yazılan an, okunan an.
        $an = \Carbon\Carbon::parse('2026-06-15 12:00:00', 'UTC');

        DB::statement('CREATE TEMPORARY TABLE zaman_olcum (t TIMESTAMP NULL)');
        DB::table('zaman_olcum')->insert(['t' => $an]);

        $okunan = DB::table('zaman_olcum')->value('t');

        $this->assertSame(
            $an->format('Y-m-d H:i:s'),
            \Carbon\Carbon::parse($okunan)->format('Y-m-d H:i:s'),
            'zaman damgası gidip dönerken kaydı',
        );
    }
}
