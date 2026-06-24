<?php

namespace App\Helpers;

class TurkishStr
{
    /**
     * Map Turkish special characters to their ASCII equivalents.
     */
    private static array $map = [
        'ğ' => 'g', 'Ğ' => 'G',
        'ı' => 'i', 'İ' => 'I',
        'ş' => 's', 'Ş' => 'S',
        'ç' => 'c', 'Ç' => 'C',
        'ö' => 'o', 'Ö' => 'O',
        'ü' => 'u', 'Ü' => 'U',
    ];

    // Characters for PostgreSQL TRANSLATE()
    private static string $trFrom = 'ğıışçöüĞİŞÇÖÜ';
    private static string $trTo   = 'giiscouGISCOU';

    /**
     * Normalize a string by replacing Turkish characters with ASCII equivalents.
     */
    public static function normalize(string $value): string
    {
        return strtr($value, self::$map);
    }

    /**
     * Add a WHERE clause that matches both the original and the
     * Turkish-normalized form of $term against $column.
     *
     * Works with PostgreSQL TRANSLATE() to normalize DB values on the fly.
     *
     * Usage:
     *   TurkishStr::addNormalizedSearch($query, 'users.fullname', $term);
     */
    public static function addNormalizedSearch($query, string $column, string $term, string $boolean = 'or'): void
    {
        $lowerTerm      = mb_strtolower($term);
        $normalizedTerm = mb_strtolower(self::normalize($term));
        $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();

        $query->where(function ($q) use ($column, $lowerTerm, $normalizedTerm, $driver) {
            // 1) Original term against original column (case-insensitive)
            $q->whereRaw("LOWER({$column}) LIKE ?", ["%{$lowerTerm}%"]);

            // 2) Normalized column LIKE normalized term. TRANSLATE() is Postgres-only;
            //    MySQL/TiDB/SQLite have no TRANSLATE → use a chained REPLACE() instead.
            if ($driver === 'pgsql') {
                $q->orWhereRaw(
                    "LOWER(TRANSLATE({$column}, ?, ?)) LIKE ?",
                    [self::$trFrom, self::$trTo, "%{$normalizedTerm}%"]
                );
            } else {
                $expr = "LOWER({$column})";
                foreach (self::$map as $tr => $ascii) {
                    $expr = "REPLACE({$expr}, '" . mb_strtolower($tr) . "', '" . mb_strtolower($ascii) . "')";
                }
                $q->orWhereRaw("{$expr} LIKE ?", ["%{$normalizedTerm}%"]);
            }
        }, boolean: $boolean);
    }
}
