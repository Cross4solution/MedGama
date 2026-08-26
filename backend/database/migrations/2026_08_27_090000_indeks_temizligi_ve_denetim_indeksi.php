<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * İndeks temizliği ve eksik denetim indeksi.
 *
 * ── 1. EKSİK İNDEKS ────────────────────────────────────────────────────
 *
 * Klinik analitiği, hekim profil görüntülemelerini `health_data_audit_logs`
 * üzerinden sayıyor:
 *
 *     WHERE resource_id IN (...) AND resource_type = 'doctor_profile'
 *       AND created_at BETWEEN ...
 *
 * Tabloda `resource_type` ya da `resource_id` için hiç indeks yoktu. EXPLAIN
 * "Table scan" diyordu. Bu bir denetim kaydı — sağlık verisine her erişimde
 * satır ekleniyor, yani sonsuza dek büyüyor. Bugün 334 satırda fark edilmez,
 * milyonlarca satırda ekranı durdurur.
 *
 * ── 2. GEREKSİZ İNDEKSLER ──────────────────────────────────────────────
 *
 * Otuz iki indeks ya birebir kopya ya da daha geniş bir indeksin öneki.
 * Önek olan bir indeks hiçbir sorguya katkı sağlamaz: MySQL geniş olanı
 * zaten kullanabiliyor. Maliyeti ise her INSERT ve UPDATE'te ödeniyor —
 * her yazma bütün indeksleri güncelliyor.
 *
 * `appointments` gibi sıcak tablolarda `appointment_date` ve `status` İKİ
 * KEZ indekslenmişti; muhtemelen iki ayrı göç aynı indeksi farklı adla
 * eklemiş.
 *
 * Benzersizlik kısıtı olan indeksler DOKUNULMUYOR: onlar bir kural taşıyor,
 * performans için değil.
 *
 * Düşürme savunmacı: indeks yoksa atlanıyor, ve yabancı anahtarın dayandığı
 * bir indeksi düşürmek sürücü tarafından reddedilirse göç durur — sessizce
 * yutulmaz.
 */
return new class extends Migration
{
    /** Birebir kopyalar: her çiftin benzersiz OLMAYAN üyesi düşüyor. */
    private const KOPYALAR = [
        ['appointments', 'idx_appointments_date'],
        ['appointments', 'idx_appointments_status'],
        ['digital_anamneses', 'digital_anamneses_patient_id_index'],
        ['doctor_profiles', 'doctor_profiles_slug_index'],
        ['med_stream_posts', 'msp_author_created_idx'],
        ['personal_access_tokens', 'idx_pat_tokenable'],
        ['symptom_specialty_mappings', 'symptom_specialty_mappings_symptom_index'],
        ['users', 'idx_users_email'],
    ];

    /** Daha geniş bir indeksin öneki olanlar. */
    private const ONEKLER = [
        ['appointments', 'appointments_clinic_id_index'],
        ['appointments', 'appointments_doctor_id_index'],
        ['appointments', 'appointments_patient_id_index'],
        ['branches', 'branches_hospital_id_index'],
        ['calendar_slots', 'calendar_slots_doctor_id_index'],
        ['chat_conversations', 'chat_conversations_user_one_id_index'],
        ['cities', 'cities_country_id_index'],
        ['clinic_favorites', 'clinic_favorites_user_id_index'],
        ['consent_records', 'consent_records_user_id_index'],
        ['conversation_participants', 'conversation_participants_conversation_id_index'],
        ['doctor_follows', 'doctor_follows_follower_id_index'],
        ['favorites', 'favorites_user_id_index'],
        ['health_data_audit_logs', 'health_data_audit_logs_accessor_id_index'],
        ['health_data_audit_logs', 'health_data_audit_logs_patient_id_index'],
        ['med_stream_bookmarks', 'med_stream_bookmarks_user_id_index'],
        ['med_stream_likes', 'med_stream_likes_user_id_index'],
        ['med_stream_posts', 'med_stream_posts_author_id_index'],
        ['med_stream_posts', 'med_stream_posts_clinic_id_index'],
        ['med_stream_reports', 'med_stream_reports_post_id_index'],
        ['message_read_receipts', 'message_read_receipts_message_id_index'],
        ['users', 'idx_users_clinic_id'],
        ['users', 'idx_users_role_id'],
        ['users', 'users_clinic_id_index'],
    ];

    public function up(): void
    {
        $surucu = DB::connection()->getDriverName();

        // Eksik indeks — her sürücüde anlamlı.
        if (Schema::hasTable('health_data_audit_logs') && !$this->indeksVar('health_data_audit_logs', 'hdal_resource_created_idx')) {
            Schema::table('health_data_audit_logs', function ($tablo) {
                $tablo->index(['resource_type', 'resource_id', 'created_at'], 'hdal_resource_created_idx');
            });
        }

        // Temizlik yalnız MySQL/TiDB'de: SQLite indeks adlarını farklı üretiyor
        // ve testlerde tablo zaten her seferinde sıfırdan kuruluyor.
        if ($surucu !== 'mysql') {
            return;
        }

        foreach ([...self::KOPYALAR, ...self::ONEKLER] as [$tablo, $indeks]) {
            if (!Schema::hasTable($tablo) || !$this->indeksVar($tablo, $indeks)) {
                continue;
            }

            DB::statement("ALTER TABLE `{$tablo}` DROP INDEX `{$indeks}`");
        }
    }

    public function down(): void
    {
        // Geri alma bilinçli olarak YOK.
        //
        // Düşürülen indekslerin hepsi ya kopya ya önek: geri koymak hiçbir
        // sorguyu hızlandırmaz, yalnız yazma maliyetini geri getirir. Eklenen
        // indeks ise bir tam tablo taramasını kapatıyor.
        if (Schema::hasTable('health_data_audit_logs') && $this->indeksVar('health_data_audit_logs', 'hdal_resource_created_idx')) {
            Schema::table('health_data_audit_logs', function ($tablo) {
                $tablo->dropIndex('hdal_resource_created_idx');
            });
        }
    }

    private function indeksVar(string $tablo, string $indeks): bool
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return false;
        }

        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $tablo)
            ->where('index_name', $indeks)
            ->exists();
    }
};
