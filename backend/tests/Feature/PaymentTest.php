<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Payment;
use App\Models\User;
use App\Payments\PaymentProvider;
use App\Services\PaymentService;
use App\Support\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kapora tahsilatı. Gerçek sağlayıcı yerine sahte bir sağlayıcı bağlanıyor —
 * test edilen şey para mantığı, sağlayıcının kendisi değil.
 */
class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $doctor;
    private User $patient;
    private Appointment $appointment;

    protected function setUp(): void
    {
        parent::setUp();

        $clinic = Clinic::factory()->create();
        $this->doctor  = User::factory()->doctor()->create(['clinic_id' => $clinic->id]);
        $this->patient = User::factory()->patient()->create();

        $this->appointment = Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'clinic_id'  => $clinic->id,
            'status'     => 'confirmed',
            'starts_at'  => now()->addDays(3),
            'timezone'   => 'Europe/Istanbul',
        ]);

        $this->app->bind(PaymentProvider::class, fn () => new SahteSaglayici());
    }

    private function servis(): PaymentService
    {
        return $this->app->make(PaymentService::class);
    }

    // ── Para birimi ve kuruş ──

    public function test_money_kurus_olarak_saklanir_ve_bolunmez(): void
    {
        $t = Money::fromDecimal('120.50', 'EUR');
        $this->assertSame(12050, $t->minor);
        $this->assertSame('120,50', $t->toDecimalString());

        $this->expectException(\InvalidArgumentException::class);
        $t->plus(Money::of(100, 'TRY')); // farklı para birimi toplanamaz
    }

    public function test_komisyon_kalan_kurusu_klinige_birakir(): void
    {
        // 100,01 TL üzerinden %15 → 15,0015 → platform aşağı yuvarlar
        ['komisyon' => $k, 'hakedis' => $h] = Money::of(10001, 'TRY')->komisyonAyir(0.15);

        $this->assertSame(1500, $k->minor);
        $this->assertSame(8501, $h->minor);
        $this->assertSame(10001, $k->minor + $h->minor, 'Kuruş kayboldu');
    }

    // ── Tahsilat akışı ──

    public function test_kapora_baslatinca_bekleyen_kayit_ve_komisyon_olusur(): void
    {
        $sonuc = $this->servis()->kaporaBaslat(
            $this->appointment,
            Money::fromDecimal('200.00', 'TRY'),
            'https://ornek/donus'
        );

        $payment = $sonuc['payment'];

        $this->assertSame(Payment::BEKLIYOR, $payment->status);
        $this->assertSame(20000, $payment->amount_minor);
        $this->assertSame(3000, $payment->commission_minor);   // %15
        $this->assertSame(17000, $payment->payout_minor);
        $this->assertNotNull($payment->expires_at);
        $this->assertStringContainsString('http', $sonuc['redirect_url']);
    }

    public function test_ayni_randevu_icin_ikinci_kez_baslatinca_yeni_kayit_acilmaz(): void
    {
        $a = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x');
        $b = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x');

        $this->assertSame($a['payment']->id, $b['payment']->id);
        $this->assertSame(1, Payment::where('appointment_id', $this->appointment->id)->count());
    }

    public function test_odeme_yalnizca_dogrulanan_bildirimle_kesinlesir(): void
    {
        $payment = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x')['payment'];

        $sonuc = $this->servis()->bildirimIsle(
            ['reference' => $payment->provider_reference, 'durum' => 'paid', 'tutar_minor' => 20000, 'currency' => 'TRY'],
            []
        );

        $this->assertTrue($sonuc['ok']);
        $this->assertSame(Payment::ODENDI, $payment->fresh()->status);
        $this->assertSame('paid', $this->appointment->fresh()->deposit_status);
    }

    public function test_ayni_bildirim_iki_kez_gelirse_tek_kez_islenir(): void
    {
        $payment = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x')['payment'];
        $bildirim = ['reference' => $payment->provider_reference, 'durum' => 'paid', 'tutar_minor' => 20000, 'currency' => 'TRY'];

        $this->servis()->bildirimIsle($bildirim, []);
        $ikinci = $this->servis()->bildirimIsle($bildirim, []);

        $this->assertSame('zaten_islenmis', $ikinci['sebep']);
        $this->assertSame(1, Payment::where('status', Payment::ODENDI)->count());
    }

    public function test_eksik_tutarli_bildirim_odemeyi_onaylamaz(): void
    {
        $payment = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x')['payment'];

        $sonuc = $this->servis()->bildirimIsle(
            ['reference' => $payment->provider_reference, 'durum' => 'paid', 'tutar_minor' => 100, 'currency' => 'TRY'],
            []
        );

        $this->assertFalse($sonuc['ok']);
        $this->assertSame('tutar_uyusmuyor', $sonuc['sebep']);
        $this->assertSame(Payment::BASARISIZ, $payment->fresh()->status);
    }

    public function test_dogrulanamayan_bildirim_reddedilir(): void
    {
        $sonuc = $this->servis()->bildirimIsle(['gecersiz' => true], []);

        $this->assertFalse($sonuc['ok']);
        $this->assertSame('dogrulanamadi', $sonuc['sebep']);
    }

    // ── İade ──

    public function test_randevuya_cok_varsa_tam_iade_yapilir(): void
    {
        $payment = $this->odenmisKapora();

        $sonuc = $this->servis()->iadeEt($payment, $this->patient, 'hasta iptal etti');

        $this->assertTrue($sonuc['ok']);
        $this->assertSame(Payment::IADE, $payment->fresh()->status);
        $this->assertSame(20000, $payment->fresh()->refunded_minor);
    }

    public function test_iade_penceresi_kapandiysa_hasta_iadesi_reddedilir(): void
    {
        $this->appointment->update(['starts_at' => now()->addHours(3)]); // 24 saatten az
        $payment = $this->odenmisKapora();

        $sonuc = $this->servis()->iadeEt($payment, $this->patient);

        $this->assertFalse($sonuc['ok']);
        $this->assertSame(Payment::ODENDI, $payment->fresh()->status);
    }

    public function test_doktor_iptal_ederse_sure_dolmus_olsa_da_tam_iade(): void
    {
        $this->appointment->update(['starts_at' => now()->addHours(1)]);
        $payment = $this->odenmisKapora();

        $sonuc = $this->servis()->iadeEt($payment, $this->doctor, 'doktor iptal etti');

        $this->assertTrue($sonuc['ok'], 'Doktor iptalinde hastanın parası iade edilmeli');
        $this->assertSame(Payment::IADE, $payment->fresh()->status);
    }

    // ── Süre dolması ──

    public function test_suresi_dolan_odeme_kapanir_ve_randevu_serbest_kalir(): void
    {
        $payment = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x')['payment'];
        $payment->update(['expires_at' => now()->subMinute()]);

        $sayi = $this->servis()->suresiDolanlariKapat();

        $this->assertSame(1, $sayi);
        $this->assertSame(Payment::SURESI_DOLDU, $payment->fresh()->status);
        // Randevu açısından süre dolması "kapora hâlâ ödenmedi" demek.
        $this->assertSame('pending', $this->appointment->fresh()->deposit_status);
    }

    public function test_odenmis_odeme_suresi_dolmus_sayilmaz(): void
    {
        $payment = $this->odenmisKapora();
        $payment->update(['expires_at' => now()->subDay()]);

        $this->assertSame(0, $this->servis()->suresiDolanlariKapat());
        $this->assertSame(Payment::ODENDI, $payment->fresh()->status);
    }

    // ── Sağlayıcı seçilmediğinde ──

    public function test_saglayici_secilmediyse_tahsilat_acik_hata_verir(): void
    {
        $this->app->bind(PaymentProvider::class, fn () => new \App\Payments\UnconfiguredProvider());

        $this->expectException(\RuntimeException::class);
        $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x');
    }

    private function odenmisKapora(): Payment
    {
        $payment = $this->servis()->kaporaBaslat($this->appointment, Money::of(20000, 'TRY'), 'https://x')['payment'];
        $this->servis()->bildirimIsle(
            ['reference' => $payment->provider_reference, 'durum' => 'paid', 'tutar_minor' => 20000, 'currency' => 'TRY'],
            []
        );

        return $payment->fresh();
    }
}

/** Testlerde kullanılan sahte sağlayıcı — gerçek para hareketi yok. */
class SahteSaglayici implements PaymentProvider
{
    public function baslat(Payment $payment, string $donusUrl): array
    {
        return [
            'redirect_url' => 'https://sahte-saglayici.test/ode/' . $payment->id,
            'reference'    => 'REF-' . $payment->id,
        ];
    }

    public function bildirimiCoz(array $govde, array $basliklar): ?array
    {
        if (!isset($govde['reference'], $govde['durum'], $govde['tutar_minor'], $govde['currency'])) {
            return null;
        }

        return [
            'reference'   => $govde['reference'],
            'durum'       => $govde['durum'],
            'tutar_minor' => (int) $govde['tutar_minor'],
            'currency'    => $govde['currency'],
        ];
    }

    public function iade(Payment $payment, int $tutarMinor): array
    {
        return ['ok' => true, 'reference' => 'IADE-' . $payment->id, 'mesaj' => null];
    }

    public function ad(): string
    {
        return 'sahte';
    }
}
