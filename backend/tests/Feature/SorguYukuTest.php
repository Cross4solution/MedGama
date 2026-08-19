<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Sorgu yükü — N+1 avı.
 *
 * Yerel veritabanı SQLite olduğu için ham hız ölçmenin anlamı yok; TiDB'de
 * bambaşka çıkar. Ama SORGU SAYISI veritabanından bağımsızdır ve asıl darboğaz
 * odur: liste 10 satırken kimse fark etmez, 10.000 satırda uç çöker.
 *
 * Ölçüt tek: veri büyüyünce sorgu sayısı BÜYÜMEMELİ. Küçük bir pay bırakıldı
 * (sayfalama toplamı, izin kontrolü gibi satır sayısına bağlı olmayan ekler
 * için), çünkü sabit farklar N+1 değildir.
 */
class SorguYukuTest extends TestCase
{
    use RefreshDatabase;

    /** Satır sayısı 5 kat artınca kabul edilen en fazla ek sorgu. */
    private const PAY = 3;

    /**
     * Bir isteği çalıştırıp kaç sorgu sürdüğünü döner.
     */
    private function sorguSayisi(callable $istek): int
    {
        // Ölçülen şey isteğin VERİTABANI yükü. Bazı uçlar yanıtı önbelleğe
        // alıyor; önbellek temizlenmezse ikinci ölçüm sıfır sorgu görür ve
        // test N+1'i değil önbelleği ölçmüş olur.
        Cache::flush();

        DB::flushQueryLog();
        DB::enableQueryLog();
        $yanit = $istek();
        $sayi = count(DB::getQueryLog());
        DB::disableQueryLog();

        // İstek zaten başarısızsa sayının bir anlamı yok.
        $this->assertLessThan(400, $yanit->getStatusCode(), 'Uç hata döndü: ' . $yanit->getStatusCode());

        return $sayi;
    }

    /**
     * Yanıtın içindeki liste uzunluğunu bulur.
     *
     * Uçlar aynı biçimi kullanmıyor: kimi düz dizi, kimi {data:[...]}, kimi
     * sayfalayıcı ({data:{data:[...]}}). En uzun diziyi bulmak, biçimi tek tek
     * bilmeye gerek bırakmıyor.
     */
    private function satirSay(mixed $govde): int
    {
        if (!is_array($govde)) {
            return 0;
        }

        $enUzun = array_is_list($govde) ? count($govde) : 0;

        foreach ($govde as $deger) {
            if (is_array($deger)) {
                $enUzun = max($enUzun, $this->satirSay($deger));
            }
        }

        return $enUzun;
    }

    /**
     * Az veriyle ve çok veriyle aynı ucu ölçüp karşılaştırır.
     *
     * @param callable(int):void $veriUret  verilen adette kayıt üretir
     * @param callable():\Illuminate\Testing\TestResponse $istek
     */
    private function olcekle(string $ad, callable $veriUret, callable $istek): void
    {
        $veriUret(3);
        $az = $this->sorguSayisi($istek);

        $veriUret(12); // toplam 15 — 5 kat
        $cok = $this->sorguSayisi($istek);

        // Boş liste dönen bir uç bu testi kendiliğinden geçerdi: sorgu sayısı
        // sabit kalır çünkü ortada satır yoktur. Bu yüzden ucun gerçekten
        // üretilen kayıtları döndürdüğü ayrıca doğrulanıyor.
        Cache::flush();
        $this->assertGreaterThanOrEqual(
            15,
            $this->satirSay($istek()->json()),
            "{$ad}: uç 15 kaydın hepsini döndürmedi — sorgu sayısı ölçümü anlamsız."
        );

        $this->assertLessThanOrEqual(
            $az + self::PAY,
            $cok,
            "{$ad}: veri 5 kat artınca sorgu {$az} → {$cok} oldu. Satır başına sorgu var (N+1)."
        );
    }

    public function test_medstream_akisi_satir_basina_sorgu_atmiyor(): void
    {
        $yazar = User::factory()->doctor()->create();

        $this->olcekle(
            'MedStream akışı',
            fn (int $adet) => MedStreamPost::factory()->count($adet)->create(['author_id' => $yazar->id]),
            fn () => $this->getJson('/api/medstream/posts?per_page=50'),
        );
    }

    public function test_doktor_listesi_satir_basina_sorgu_atmiyor(): void
    {
        $klinik = Clinic::factory()->create();

        $this->olcekle(
            'Doktor listesi',
            fn (int $adet) => User::factory()->doctor()->count($adet)->create(['clinic_id' => $klinik->id]),
            fn () => $this->getJson('/api/doctors?per_page=50'),
        );
    }

    public function test_randevu_listesi_satir_basina_sorgu_atmiyor(): void
    {
        $klinik  = Clinic::factory()->create();
        $doktor  = User::factory()->doctor()->create(['clinic_id' => $klinik->id]);
        $hasta   = User::factory()->patient()->create();

        $this->actingAs($hasta, 'sanctum');

        $this->olcekle(
            'Randevu listesi',
            fn (int $adet) => Appointment::factory()->count($adet)->create([
                'patient_id' => $hasta->id,
                'doctor_id'  => $doktor->id,
                'clinic_id'  => $klinik->id,
                'status'     => 'confirmed',
                'starts_at'  => now()->addDays(2),
                'timezone'   => 'Europe/Istanbul',
            ]),
            fn () => $this->getJson('/api/appointments?per_page=50'),
        );
    }

    public function test_bildirim_listesi_satir_basina_sorgu_atmiyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $this->actingAs($hasta, 'sanctum');

        $uret = function (int $adet) use ($hasta) {
            for ($i = 0; $i < $adet; $i++) {
                DB::table('notifications')->insert([
                    'id'              => (string) \Illuminate\Support\Str::uuid(),
                    'type'            => 'App\\Notifications\\TestBildirimi',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $hasta->id,
                    'data'            => json_encode(['title' => 'Test', 'body' => 'Test']),
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            }
        };

        $this->olcekle('Bildirim listesi', $uret, fn () => $this->getJson('/api/notifications?per_page=50'));
    }

    public function test_sohbet_listesi_satir_basina_sorgu_atmiyor(): void
    {
        $hasta = User::factory()->patient()->create();
        $this->actingAs($hasta, 'sanctum');

        // Her sohbetin bir karşı tarafı ve bir son mesajı var: sohbet listesi
        // N+1'in en sık saklandığı yer.
        $uret = function (int $adet) use ($hasta) {
            for ($i = 0; $i < $adet; $i++) {
                $karsiTaraf = User::factory()->doctor()->create();
                $sohbet = \App\Models\ChatConversation::factory()->create([
                    'user_one_id' => $hasta->id,
                    'user_two_id' => $karsiTaraf->id,
                ]);
                \App\Models\ChatMessage::factory()->create([
                    'conversation_id' => $sohbet->id,
                    'sender_id'       => $karsiTaraf->id,
                ]);
            }
        };

        $this->olcekle('Sohbet listesi', $uret, fn () => $this->getJson('/api/chat/conversations'));
    }

    public function test_gonderi_yorumlari_satir_basina_sorgu_atmiyor(): void
    {
        $yazar = User::factory()->doctor()->create();
        $gonderi = MedStreamPost::factory()->create(['author_id' => $yazar->id]);

        // Her yorumun bir yazarı var; yazar tek tek çekilirse N+1 olur.
        $uret = function (int $adet) use ($gonderi) {
            for ($i = 0; $i < $adet; $i++) {
                $yorumcu = User::factory()->patient()->create();
                DB::table('med_stream_comments')->insert([
                    'id'         => (string) \Illuminate\Support\Str::uuid(),
                    'post_id'    => $gonderi->id,
                    'author_id'  => $yorumcu->id,
                    'content'    => 'Test yorumu',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        };

        $this->olcekle(
            'Gönderi yorumları',
            $uret,
            fn () => $this->getJson("/api/medstream/posts/{$gonderi->id}/comments?per_page=50"),
        );
    }

    /**
     * CRM erişimi olan bir doktor üretir.
     *
     * CRM uçları abonelik istiyor; abonesiz kullanıcıda hepsi 403 döner ve
     * ölçüm yapılamaz.
     */
    private function crmDoktoru(): array
    {
        $klinik = Clinic::factory()->create([
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $doktor = User::factory()->doctor()->create([
            'clinic_id'      => $klinik->id,
            'is_crm_active'  => true,
            'crm_expires_at' => now()->addYear(),
        ]);

        $this->actingAs($doktor, 'sanctum');

        return [$doktor, $klinik];
    }

    public function test_crm_hasta_listesi_satir_basina_sorgu_atmiyor(): void
    {
        [$doktor, $klinik] = $this->crmDoktoru();

        // CRM hasta listesi randevu ilişkisi üzerinden kuruluyor: her hasta
        // için ayrı randevu sorgusu atılırsa klinik büyüdükçe ekran durur.
        $uret = function (int $adet) use ($doktor, $klinik) {
            for ($i = 0; $i < $adet; $i++) {
                $hasta = User::factory()->patient()->create();
                Appointment::factory()->create([
                    'patient_id' => $hasta->id,
                    'doctor_id'  => $doktor->id,
                    'clinic_id'  => $klinik->id,
                    'status'     => 'completed',
                    'starts_at'  => now()->subDays($i + 1),
                    'timezone'   => 'Europe/Istanbul',
                ]);
            }
        };

        $this->olcekle('CRM hasta listesi', $uret, fn () => $this->getJson('/api/crm/patients?per_page=50'));
    }

    public function test_crm_fatura_listesi_satir_basina_sorgu_atmiyor(): void
    {
        [$doktor, $klinik] = $this->crmDoktoru();

        $sayac = 0;
        $uret = function (int $adet) use ($doktor, $klinik, &$sayac) {
            for ($i = 0; $i < $adet; $i++) {
                $sayac++;
                $hasta = User::factory()->patient()->create();
                \App\Models\Invoice::create([
                    'invoice_number' => 'TEST-' . $sayac,
                    'patient_id'     => $hasta->id,
                    'doctor_id'      => $doktor->id,
                    'clinic_id'      => $klinik->id,
                    'subtotal'       => 100,
                    'grand_total'    => 100,
                    'paid_amount'    => 0,
                    'currency'       => 'EUR',
                    'status'         => 'pending',
                    'issue_date'     => now()->toDateString(),
                ]);
            }
        };

        $this->olcekle('CRM fatura listesi', $uret, fn () => $this->getJson('/api/crm/billing/invoices?per_page=50'));
    }

    public function test_takvim_olaylari_satir_basina_sorgu_atmiyor(): void
    {
        [$doktor, $klinik] = $this->crmDoktoru();

        $uret = function (int $adet) use ($doktor, $klinik) {
            for ($i = 0; $i < $adet; $i++) {
                Appointment::factory()->create([
                    'patient_id' => User::factory()->patient()->create()->id,
                    'doctor_id'  => $doktor->id,
                    'clinic_id'  => $klinik->id,
                    'status'     => 'confirmed',
                    'starts_at'  => now()->addDays($i + 1),
                    'timezone'   => 'Europe/Istanbul',
                ]);
            }
        };

        $this->olcekle('Takvim olayları', $uret, fn () => $this->getJson('/api/appointments/calendar-events'));
    }
}
