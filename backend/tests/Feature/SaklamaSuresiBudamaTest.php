<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DigitalAnamnesis;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * Otomatik budama yalnızca saklama süresi dolmuş kaydı siler.
 *
 * `model:prune` zamanlayıcıda haftalık çalışıyor ve dört tabloya dokunuyor:
 * kullanıcılar, randevular, dijital anamnez ve hasta kayıtları. Yaptığı iş
 * KALICI silme — yanlış çalışırsa geri dönüşü yok ve fark edilmesi aylar
 * alabilir.
 *
 * Kurallar kodda doğru: yalnızca yumuşak silinmiş (`onlyTrashed`) kayıtlar,
 * tıbbi veride 10 yıl, kullanıcıda 3 yıl bekleme. Testi yoktu. Bu dosyanın
 * işi, ileride biri `onlyTrashed()` koşulunu ya da süreyi değiştirdiğinde
 * bunun sessizce geçmemesini sağlamak.
 *
 * En kritik güvence ilk test: SİLİNMEMİŞ kayda asla dokunulmaz.
 */
class SaklamaSuresiBudamaTest extends TestCase
{
    use RefreshDatabase;

    private function budama(): void
    {
        Artisan::call('model:prune', [
            '--model' => [
                User::class,
                Appointment::class,
                DigitalAnamnesis::class,
                PatientRecord::class,
            ],
        ]);
    }

    /** @return array{0: User, 1: User, 2: Clinic} hasta, doktor, klinik */
    private function taraflar(): array
    {
        $klinik = Clinic::factory()->create();
        $doktor = User::factory()->doctor()->create(['clinic_id' => $klinik->id, 'is_verified' => true]);
        $hasta  = User::factory()->patient()->create();

        return [$hasta, $doktor, $klinik];
    }

    public function test_silinmemis_kayitlara_dokunulmuyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->taraflar();

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
            'starts_at'  => now()->subYears(20), 'timezone' => 'Europe/Istanbul',
        ]);
        $kayit = PatientRecord::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
            'created_at' => now()->subYears(20),
        ]);

        $this->budama();

        // Yirmi yıllık ama SİLİNMEMİŞ kayıtlar duruyor olmalı: budama ölçütü
        // yaş değil, silinmiş olmak + silinmenin üzerinden geçen süre.
        $this->assertNotNull($randevu->fresh(), 'Silinmemiş randevu budandı');
        $this->assertNotNull($kayit->fresh(), 'Silinmemiş hasta kaydı budandı');
        $this->assertNotNull($hasta->fresh(), 'Aktif kullanıcı budandı');
    }

    public function test_yeni_silinmis_tibbi_kayit_korunuyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->taraflar();

        $kayit = PatientRecord::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
        ]);
        $kayit->delete();
        $kayit->forceFill(['deleted_at' => now()->subYears(9)])->save();

        $this->budama();

        // Dokuz yıl, on yıllık saklama süresinin içinde.
        $this->assertNotNull(
            PatientRecord::withTrashed()->find($kayit->id),
            'Saklama süresi dolmadan tıbbi kayıt silindi',
        );
    }

    public function test_saklama_suresi_dolan_tibbi_kayit_siliniyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->taraflar();

        $kayit = PatientRecord::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
        ]);
        $kayit->delete();
        $kayit->forceFill(['deleted_at' => now()->subYears(11)])->save();

        $this->budama();

        $this->assertNull(
            PatientRecord::withTrashed()->find($kayit->id),
            'Saklama süresi dolan kayıt silinmedi — budama çalışmıyor',
        );
    }

    public function test_randevuda_on_yillik_sure_uygulaniyor(): void
    {
        [$hasta, $doktor, $klinik] = $this->taraflar();

        $yeni = Appointment::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
            'starts_at'  => now()->subYears(12), 'timezone' => 'Europe/Istanbul',
        ]);
        $eski = Appointment::factory()->create([
            'patient_id' => $hasta->id, 'doctor_id' => $doktor->id, 'clinic_id' => $klinik->id,
            'starts_at'  => now()->subYears(12), 'timezone' => 'Europe/Istanbul',
        ]);

        $yeni->delete();
        $yeni->forceFill(['deleted_at' => now()->subYears(9)])->save();
        $eski->delete();
        $eski->forceFill(['deleted_at' => now()->subYears(11)])->save();

        $this->budama();

        $this->assertNotNull(Appointment::withTrashed()->find($yeni->id), '9 yıllık randevu erken silindi');
        $this->assertNull(Appointment::withTrashed()->find($eski->id), '11 yıllık randevu silinmedi');
    }

    public function test_kullanicida_uc_yillik_sure_uygulaniyor(): void
    {
        $yeni = User::factory()->patient()->create();
        $eski = User::factory()->patient()->create();

        $yeni->delete();
        $yeni->forceFill(['deleted_at' => now()->subYears(2)])->save();
        $eski->delete();
        $eski->forceFill(['deleted_at' => now()->subYears(4)])->save();

        $this->budama();

        $this->assertNotNull(User::withTrashed()->find($yeni->id), '2 yıllık kullanıcı erken silindi');
        $this->assertNull(User::withTrashed()->find($eski->id), '4 yıllık kullanıcı silinmedi');
    }

    // ── Hesabını silmiş hastanın kayıtları ──────────────────────────────

    public function test_hesabini_silen_hastanin_randevusu_hemen_gitmiyor(): void
    {
        /*
         * Hesap silme tıbbi kayda DOKUNMUYOR ve dokunmamalı: klinik o kaydın
         * kendi veri sorumlusu ve saklama yükümlülüğü var. GDPR md. 17(3)(b)
         * ve (h) silme hakkını tam burada sınırlıyor.
         *
         * Yani hasta hesabını sildiği gün, kliniğin dosyası kaybolmaz.
         */
        [$hasta, $doktor] = $this->taraflar();

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
        ]);

        $hasta->delete();
        $this->budama();

        $this->assertNotNull(
            Appointment::withTrashed()->find($randevu->id),
            'hasta hesabını siler silmez kliniğin tıbbi kaydı gitmiş',
        );
    }

    public function test_hesabini_silen_hastanin_randevusu_on_yil_sonra_gidiyor(): void
    {
        /*
         * Dokunmamak SÜRESİZ tutmak demek değil. Saklama süresi dolduğunda
         * kayıt gitmeli — yoksa "saklama politikası" diye bir şey yok,
         * yalnızca sonsuza dek biriken veri var.
         *
         * Ölçüldüğünde tam bu oluyordu: budama yalnız yumuşak silinmiş
         * KAYDA bakıyordu, hesap silme ise kayda dokunmuyordu. İkisi
         * birleşince silinen hesabın tıbbi kayıtları hiçbir sayaca
         * girmiyordu.
         */
        [$hasta, $doktor] = $this->taraflar();

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
        ]);

        $hasta->delete();
        // Hasta on yıl önce silinmiş.
        User::withTrashed()->where('id', $hasta->id)
            ->update(['deleted_at' => now()->subYears(10)->subDay()]);

        $this->budama();

        $this->assertNull(
            Appointment::withTrashed()->find($randevu->id),
            'silinen hastanın randevusu on yıl sonra hâlâ duruyor',
        );
    }

    public function test_yasayan_hastanin_kaydina_dokunulmuyor(): void
    {
        // En kritik güvence: sayaç YALNIZ silinmiş hesap için işliyor.
        [$hasta, $doktor] = $this->taraflar();

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
        ]);

        $this->budama();

        $this->assertNotNull(
            Appointment::find($randevu->id),
            'hesabı duran hastanın randevusu silinmiş',
        );
    }

    // ── Budamalar arası çakışma ─────────────────────────────────────────

    public function test_tibbi_kaydi_duran_kullanici_budanmiyor(): void
    {
        /*
         * EN CİDDİ ÇAKIŞMA. `users`tan tıbbi ve mali tablolara giden yabancı
         * anahtarların hepsi `ON DELETE CASCADE`. Kullanıcı satırı kalıcı
         * silindiği anda veritabanı randevuyu, hasta kaydını, belgeleri ve
         * faturaları da siliyor.
         *
         * Süreler çakışıyordu: kullanıcı üç yıl, tıbbi kayıt on yıl. Üç
         * yıllık budama önce çalıştığı için on yıllık saklama sırasını hiç
         * göremiyordu — ölçüldü, üçü de gitmişti.
         *
         * Kullanıcı artık kaydı durduğu sürece bekliyor.
         */
        [$hasta, $doktor] = $this->taraflar();

        $randevu = Appointment::factory()->create([
            'patient_id' => $hasta->id,
            'doctor_id'  => $doktor->id,
        ]);

        $hasta->delete();
        User::withTrashed()->where('id', $hasta->id)
            ->update(['deleted_at' => now()->subYears(4)]);

        $this->budama();

        $this->assertNotNull(
            User::withTrashed()->find($hasta->id),
            'kullanıcı budandı — randevusu CASCADE ile silinir',
        );
        $this->assertNotNull(
            Appointment::withTrashed()->find($randevu->id),
            'tıbbi kayıt kullanıcıyla birlikte gitmiş',
        );
    }

    public function test_kaydi_kalmayan_kullanici_budaniyor(): void
    {
        // Koruma fazla geniş olmamalı: kayıt kalmadığında kullanıcıyı tutmanın
        // bir anlamı yok, "süresiz saklama" oraya kayar.
        [$hasta] = $this->taraflar();

        $hasta->delete();
        User::withTrashed()->where('id', $hasta->id)
            ->update(['deleted_at' => now()->subYears(4)]);

        $this->budama();

        $this->assertNull(
            User::withTrashed()->find($hasta->id),
            'kaydı olmayan kullanıcı üç yıl sonra hâlâ duruyor',
        );
    }

    public function test_faturasi_duran_kullanici_budanmiyor(): void
    {
        // Fatura vergi ve ticaret mevzuatına tabi; kullanıcıyla birlikte
        // silinmesi tıbbi kayıttan farklı bir yükümlülüğü çiğner.
        [$hasta, $doktor] = $this->taraflar();

        \App\Models\Invoice::create([
            'invoice_number' => 'FTR-BUDAMA-1',
            'patient_id'     => $hasta->id,
            'doctor_id'      => $doktor->id,
            'subtotal'       => 100,
            'grand_total'    => 100,
            'currency'       => 'TRY',
            'status'         => 'paid',
            'issue_date'     => now()->toDateString(),
        ]);

        $hasta->delete();
        User::withTrashed()->where('id', $hasta->id)
            ->update(['deleted_at' => now()->subYears(4)]);

        $this->budama();

        $this->assertNotNull(User::withTrashed()->find($hasta->id));
        $this->assertTrue(\App\Models\Invoice::where('patient_id', $hasta->id)->exists());
    }
}
