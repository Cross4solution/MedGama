<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Sürücüye göre değişen SQL parçaları.
 *
 * Proje üç veritabanıyla çalışıyor: canlıda TiDB (MySQL uyumlu), yerelde
 * PostgreSQL, testlerde SQLite. Bazı işlevlerin karşılığı üçünde farklı ve
 * kod tabanına PostgreSQL'e özgü yazımlar sürücü kontrolü olmadan
 * serpilmişti — TO_CHAR ve ILIKE gibi. Sonuç: dokuz uç canlıda 500
 * veriyordu ve testlerde de çalışmadıkları için hiç fark edilmemişti.
 *
 * Bu sınıf o parçaları tek yerde toplar. Yeni bir sorguda tarih gruplaması
 * veya metin araması gerekiyorsa buradan geçirin; doğrudan TO_CHAR/ILIKE
 * yazmayın.
 */
final class Sorgu
{
    private function __construct() {}

    private static function surucu(): string
    {
        return DB::connection()->getDriverName();
    }

    /**
     * "YYYY-MM" biçiminde ay anahtarı üreten SQL ifadesi.
     *
     * Gruplama veritabanında kalsın diye ifade döndürülüyor: yönetici
     * raporları tüm platformu kapsıyor, satırları PHP'ye çekmek pahalı olurdu.
     */
    public static function ayIfadesi(string $sutun): string
    {
        return match (self::surucu()) {
            'pgsql'  => "TO_CHAR({$sutun}, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', {$sutun})",
            default  => "DATE_FORMAT({$sutun}, '%Y-%m')", // mysql / tidb
        };
    }

    /**
     * ISO haftası anahtarı ("YYYY-WW").
     *
     * MySQL'de %x-%v ISO yıl+hafta demek; %Y-%u değil (o farklı bir hafta
     * tanımı kullanır ve yıl sonlarında kayar).
     */
    public static function haftaIfadesi(string $sutun): string
    {
        return match (self::surucu()) {
            'pgsql'  => "TO_CHAR({$sutun}, 'IYYY-IW')",
            'sqlite' => "strftime('%Y-%W', {$sutun})",
            default  => "DATE_FORMAT({$sutun}, '%x-%v')",
        };
    }

    /**
     * Büyük/küçük harf duyarsız arama işleci.
     *
     * PostgreSQL'de ILIKE gerekir; MySQL ve SQLite'ta LIKE zaten duyarsızdır.
     */
    public static function benzer(): string
    {
        return self::surucu() === 'pgsql' ? 'ilike' : 'like';
    }
}
