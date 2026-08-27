<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fatura raporlarının indeksleri.
 *
 * Gelir ekranı faturaları `status='paid'` + (kliniğe göre) + `paid_at` aralığı
 * ile sorguluyor. `paid_at` ve `issue_date` indekssizdi; EXPLAIN "Table scan on
 * invoices" diyordu. Gelir ve tahsilat, kliniğin her gün açtığı ekranlar.
 *
 * Sorgular ayrıca `whereDate()` ve `whereYear()` kullanıyordu — ikisi de sütunu
 * bir işleve sarmalıyor, yani indeks EKLENSE BİLE kullanılamazdı. Onlar da
 * aralık karşılaştırmasına çevrildi.
 *
 * `invoices_clinic_id_index` düşüyor: yeni bileşik indeksin öneki, dolayısıyla
 * artık hiçbir sorguya katkısı yok (bkz. IndeksSagligiTest).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function ($tablo) {
            // Klinik kapsamlı gelir: en sık yol.
            $tablo->index(['clinic_id', 'status', 'paid_at'], 'invoices_clinic_status_paid_idx');

            // Platform geneli gelir ve tahsilat.
            $tablo->index(['status', 'paid_at'], 'invoices_status_paid_idx');

            // Fatura listesinin tarih aralığı süzgeci.
            $tablo->index(['clinic_id', 'issue_date'], 'invoices_clinic_issue_idx');
        });

        // Yeni bileşiklerin öneki kalan tekil indeksler düşüyor: artık hiçbir
        // sorguya katkıları yok, yalnız her yazmada güncelleniyorlar.
        // (IndeksSagligiTest bunu zaten yakaladı — ölçüt kendi göçümü tuttu.)
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach (['invoices_clinic_id_index', 'invoices_status_index'] as $eski) {
            if ($this->indeksVar('invoices', $eski)) {
                DB::statement("ALTER TABLE `invoices` DROP INDEX `{$eski}`");
            }
        }
    }

    public function down(): void
    {
        Schema::table('invoices', function ($tablo) {
            $tablo->dropIndex('invoices_clinic_status_paid_idx');
            $tablo->dropIndex('invoices_status_paid_idx');
            $tablo->dropIndex('invoices_clinic_issue_idx');
            $tablo->index('clinic_id', 'invoices_clinic_id_index');
            $tablo->index('status', 'invoices_status_index');
        });
    }

    private function indeksVar(string $tablo, string $indeks): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $tablo)
            ->where('index_name', $indeks)
            ->exists();
    }
};
