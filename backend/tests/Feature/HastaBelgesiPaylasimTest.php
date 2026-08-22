<?php

namespace Tests\Feature;

use App\Models\HealthDataAuditLog;
use App\Models\PatientDocument;
use App\Models\User;
use App\Services\EncryptedFileStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hasta belgeleri — hastanın kendi tahlil ve raporlarını hekimle paylaşması.
 *
 * Buradaki model diğerlerinden farklı: erişim role değil, HASTANIN AÇIK
 * RIZASINA bağlı. Hasta belgeyi bir hekimle paylaşıyor, dilediğinde geri
 * alıyor.
 *
 * O yüzden asıl sınanan şey İPTALİN GERÇEKTEN ÇALIŞMASI. Paylaşımın işlemesi
 * görünür bir davranış — kullanıcı hemen fark eder. İptalin işlememesi ise
 * tamamen sessiz: hasta erişimi kaldırdığını sanır, hekim okumaya devam eder.
 * Rıza geri alınabilir olmadıkça rıza sayılmaz (KVKK Md. 6 / GDPR Art. 9).
 */
class HastaBelgesiPaylasimTest extends TestCase
{
    use RefreshDatabase;

    private User $hasta;
    private User $hekim;
    private User $yabanciHekim;
    private PatientDocument $belge;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hasta = User::factory()->patient()->create();
        $this->hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $this->yabanciHekim = User::factory()->doctor()->create(['is_verified' => true]);

        $this->belge = PatientDocument::create([
            'patient_id'  => $this->hasta->id,
            'uploaded_by' => $this->hasta->id,
            'title'       => 'Kan tahlili',
            'category'    => 'lab_result',
            'file_path'   => app(EncryptedFileStorage::class)
                ->putContents('hasta-belgeleri/tahlil-paylasim.pdf', 'HEMOGRAM SONUCU'),
            'file_name'   => 'tahlil.pdf',
            'mime_type'   => 'application/pdf',
            'file_size'   => 15,
            'is_active'   => true,
        ]);
    }

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    private function paylas(User $aktor, User $hedef)
    {
        return $this->olarak($aktor)
            ->postJson("/api/patient-documents/{$this->belge->id}/share", ['doctor_id' => $hedef->id]);
    }

    private function indir(User $user)
    {
        return $this->olarak($user)->get("/api/patient-documents/{$this->belge->id}/download");
    }

    // ── Sahip ──

    public function test_hasta_kendi_belgesini_indirebiliyor(): void
    {
        // Pozitif kontrol: uç hiç dosya vermiyorsa aşağıdaki ret testleri
        // hiçbir şey kanıtlamaz.
        $yanit = $this->indir($this->hasta)->assertOk();

        $this->assertSame('HEMOGRAM SONUCU', $yanit->getContent());
    }

    public function test_hasta_kendi_belgesini_listede_goruyor(): void
    {
        $this->assertStringContainsString(
            'Kan tahlili',
            $this->olarak($this->hasta)->getJson('/api/patient-documents')->assertOk()->getContent(),
        );
    }

    // ── Paylaşılmamışken kimse göremiyor ──

    public function test_paylasilmamis_belgeyi_hekim_indiremiyor(): void
    {
        $yanit = $this->indir($this->hekim);

        $this->assertSame(403, $yanit->getStatusCode(), 'paylaşılmamış belge hekime açıldı');
        $this->assertStringNotContainsString('HEMOGRAM', $yanit->getContent());
    }

    public function test_baska_hasta_indiremiyor(): void
    {
        $yanit = $this->indir(User::factory()->patient()->create());

        $this->assertSame(403, $yanit->getStatusCode());
        $this->assertStringNotContainsString('HEMOGRAM', $yanit->getContent());
    }

    // ── Paylaşım ──

    public function test_paylasilan_hekim_belgeyi_indirebiliyor(): void
    {
        $this->paylas($this->hasta, $this->hekim)->assertOk();

        $this->assertSame('HEMOGRAM SONUCU', $this->indir($this->hekim)->assertOk()->getContent());
    }

    public function test_paylasim_yalnizca_hedef_hekime_aciliyor(): void
    {
        // Paylaşım hekime ÖZEL olmalı; olmasaydı tek paylaşım belgeyi bütün
        // hekimlere açardı.
        $this->paylas($this->hasta, $this->hekim)->assertOk();

        $this->assertSame(403, $this->indir($this->yabanciHekim)->getStatusCode(), 'paylaşım yabancı hekime de açıldı');
    }

    public function test_hekim_belgeyi_kendine_paylastiramiyor(): void
    {
        // Paylaşma hakkı yalnız hastada. Hekim kendine yetki veremezse rıza
        // modeli ayakta kalır.
        $this->paylas($this->hekim, $this->hekim)->assertStatus(404);

        $this->assertSame(403, $this->indir($this->hekim)->getStatusCode());
    }

    public function test_yabanci_hasta_baskasinin_belgesini_paylastiramiyor(): void
    {
        $this->paylas(User::factory()->patient()->create(), $this->hekim)->assertStatus(404);

        $this->assertSame(403, $this->indir($this->hekim)->getStatusCode());
    }

    // ── İptal: asıl mesele ──

    public function test_iptal_hekimin_erisimini_gercekten_kesiyor(): void
    {
        // Sessiz başarısızlığın en kötü hâli: hasta rızasını geri çektiğini
        // sanır, hekim okumaya devam eder.
        $this->paylas($this->hasta, $this->hekim)->assertOk();
        $this->indir($this->hekim)->assertOk();

        $this->olarak($this->hasta)
            ->postJson("/api/patient-documents/{$this->belge->id}/revoke", ['doctor_id' => $this->hekim->id])
            ->assertOk();

        $yanit = $this->indir($this->hekim);

        $this->assertSame(403, $yanit->getStatusCode(), 'iptalden sonra hekim hâlâ indirebiliyor');
        $this->assertStringNotContainsString('HEMOGRAM', $yanit->getContent());
    }

    public function test_iptal_edilen_belge_hekimin_listesinden_dusuyor(): void
    {
        // Sonucu kullanıcının gördüğü yerden de doğrula: kolonun değişmesi
        // yetmez.
        $this->paylas($this->hasta, $this->hekim)->assertOk();

        $paylasilanYol = "/api/patient-documents/shared/{$this->hasta->id}";

        $this->assertStringContainsString(
            'Kan tahlili',
            $this->olarak($this->hekim)->getJson($paylasilanYol)->assertOk()->getContent(),
            'paylaşılan belge hekimin listesinde görünmedi',
        );

        $this->olarak($this->hasta)
            ->postJson("/api/patient-documents/{$this->belge->id}/revoke", ['doctor_id' => $this->hekim->id])
            ->assertOk();

        $this->assertStringNotContainsString(
            'Kan tahlili',
            $this->olarak($this->hekim)->getJson($paylasilanYol)->assertOk()->getContent(),
            'iptal edilen belge hekimin listesinde kaldı',
        );
    }

    public function test_yabanci_hekim_paylasilan_listeyi_goremiyor(): void
    {
        $this->paylas($this->hasta, $this->hekim)->assertOk();

        $this->assertStringNotContainsString(
            'Kan tahlili',
            $this->olarak($this->yabanciHekim)
                ->getJson("/api/patient-documents/shared/{$this->hasta->id}")
                ->assertOk()->getContent(),
            'yabancı hekim başkasına paylaşılan belgeyi gördü',
        );
    }

    public function test_hekim_baskasinin_paylasimini_iptal_edemiyor(): void
    {
        // İptal hakkı da yalnız hastada: hekim kendi erişimini "kalıcı"
        // yapamamalı, hasta da başkasının belgesini yönetememeli.
        $this->paylas($this->hasta, $this->hekim)->assertOk();

        $this->olarak($this->yabanciHekim)
            ->postJson("/api/patient-documents/{$this->belge->id}/revoke", ['doctor_id' => $this->hekim->id])
            ->assertStatus(404);

        $this->indir($this->hekim)->assertOk();
    }

    // ── Denetim kaydı ──

    public function test_hekimin_indirmesi_iz_birakiyor(): void
    {
        $this->paylas($this->hasta, $this->hekim)->assertOk();

        $oncekiSayi = HealthDataAuditLog::count();
        $this->indir($this->hekim)->assertOk();

        $this->assertGreaterThan(
            $oncekiSayi,
            HealthDataAuditLog::count(),
            'hekimin belge indirmesi iz bırakmadı',
        );
    }

    public function test_belge_onbelleklenmiyor(): void
    {
        $baslik = (string) $this->indir($this->hasta)->assertOk()->headers->get('Cache-Control');

        $this->assertStringContainsString('no-store', $baslik, 'sağlık belgesi saklanabilir işaretlendi');
        $this->assertStringContainsString('private', $baslik);
    }
}
