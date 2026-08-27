<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hesap silme denetim kaydına yazılmalı.
 *
 * Saklama politikası (`docs/Mevzuat_Uyum_Saklama_Suresi.pdf`, madde 4) açıkça
 * istiyor: "Süre boyunca ve silme anında işlem denetim kaydına yazılır."
 *
 * Silme yalnızca uygulama günlüğüne (`Log::info`) yazılıyordu. O bunu
 * karşılamıyor: günlük dosyaları döner, sorgulanamaz ve bir denetimde kanıt
 * olarak sunulamaz.
 *
 * Kaydın ikinci işi, NEYİN SİLİNMEDİĞİNİ belgelemek. Tıbbi kayıt ve fatura
 * yasal saklama yüzünden duruyor; denetimde "hasta sildirmiş, bunlar neden
 * hâlâ burada" sorusunun yazılı cevabı bu satır.
 */
class SilmeDenetimKaydiTest extends TestCase
{
    use RefreshDatabase;

    public function test_silme_denetim_kaydina_yaziliyor(): void
    {
        $hasta = User::factory()->patient()->create();

        app(AuthService::class)->deleteAccount($hasta->fresh());

        $kayit = AuditLog::where('action', 'gdpr.account_deleted')
            ->where('resource_id', $hasta->id)
            ->first();

        $this->assertNotNull($kayit, 'hesap silme denetim kaydında yok');
        $this->assertSame('User', $kayit->resource_type);
    }

    public function test_kayit_neyin_saklandigini_da_yaziyor(): void
    {
        $hasta = User::factory()->patient()->create();

        app(AuthService::class)->deleteAccount($hasta->fresh());

        $kayit = AuditLog::where('action', 'gdpr.account_deleted')
            ->where('resource_id', $hasta->id)
            ->first();

        $yeni = is_array($kayit->new_values) ? $kayit->new_values : json_decode((string) $kayit->new_values, true);

        $this->assertSame('legal_obligation', $yeni['retention_basis'] ?? null);
        $this->assertContains('invoices', $yeni['retained_records'] ?? []);
        $this->assertContains('patient_documents', $yeni['retained_records'] ?? []);
    }

    public function test_silinmeyen_hesap_kayit_uretmiyor(): void
    {
        // Ölçüt fazla geniş olmamalı: kayıt yalnız silme anında düşüyor.
        User::factory()->patient()->create();

        $this->assertSame(0, AuditLog::where('action', 'gdpr.account_deleted')->count());
    }
}
