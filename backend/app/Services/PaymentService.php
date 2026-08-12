<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Payment;
use App\Models\User;
use App\Payments\PaymentProvider;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Kapora tahsilatı — pazaryeri modeli.
 *
 * Medagama tahsil eder, komisyonunu keser, kalanı kliniğin hakedişi olarak
 * kaydeder. Para hareketiyle ilgili her karar burada; kontrolör ve sağlayıcı
 * yalnızca giriş/çıkış noktalarıdır.
 *
 * Değişmez kurallar:
 *  • Ödeme ONAYI yalnızca sağlayıcının doğrulanmış bildirimiyle verilir.
 *    Tarayıcının "başarılı" demesi hiçbir şey ifade etmez.
 *  • Aynı bildirim iki kez gelse bile tek kez işlenir (çift tahsilat olmaz).
 *  • Tutarlar kuruş cinsinden; para birimi çevrilmez.
 */
class PaymentService
{
    public function __construct(
        private readonly PaymentProvider $provider,
    ) {}

    /**
     * Randevu için kapora kaydı açar ve hastayı ödeme sayfasına yönlendirecek
     * adresi döner. Randevu bu aşamada ÖDENMEMİŞ sayılır.
     */
    public function kaporaBaslat(Appointment $appointment, Money $tutar, string $donusUrl): array
    {
        if ($tutar->isZero()) {
            throw new RuntimeException('Kapora tutarı sıfır olamaz.');
        }

        $oran = (float) config('payments.commission_rate');
        ['komisyon' => $komisyon, 'hakedis' => $hakedis] = $tutar->komisyonAyir($oran);

        $payment = DB::transaction(function () use ($appointment, $tutar, $komisyon, $hakedis, $oran) {
            // Aynı randevu için bekleyen bir ödeme varsa yenisini açma —
            // hasta ödeme sayfasını iki kez açarsa çift kayıt oluşmasın.
            $mevcut = Payment::where('appointment_id', $appointment->id)
                ->whereIn('status', [Payment::BEKLIYOR, Payment::ODENDI])
                ->lockForUpdate()
                ->first();

            if ($mevcut && $mevcut->odendiMi()) {
                throw new RuntimeException('Bu randevunun kaporası zaten ödenmiş.');
            }

            if ($mevcut && $mevcut->bekliyorMu() && !$mevcut->suresiDolduMu()) {
                return $mevcut;
            }

            return Payment::create([
                'purpose'          => 'appointment_deposit',
                'appointment_id'   => $appointment->id,
                'patient_id'       => $appointment->patient_id,
                'clinic_id'        => $appointment->clinic_id,
                'doctor_id'        => $appointment->doctor_id,
                'amount_minor'     => $tutar->minor,
                'currency'         => $tutar->currency,
                'commission_minor' => $komisyon->minor,
                'payout_minor'     => $hakedis->minor,
                'commission_rate'  => $oran,
                'status'           => Payment::BEKLIYOR,
                'provider'         => $this->provider->ad(),
                'expires_at'       => now()->addMinutes((int) config('payments.hold_minutes')),
            ]);
        });

        $oturum = $this->provider->baslat($payment, $donusUrl);

        $payment->update(['provider_reference' => $oturum['reference'] ?? null]);

        return [
            'payment'      => $payment->fresh(),
            'redirect_url' => $oturum['redirect_url'],
        ];
    }

    /**
     * Sağlayıcıdan gelen bildirimi işler. Ödeme yalnızca burada kesinleşir.
     *
     * Aynı bildirimin tekrarına karşı korumalı: kayıt zaten 'paid' ise hiçbir
     * şey yapmadan başarılı döner. Sağlayıcılar bildirimi birkaç kez gönderir;
     * bu kontrol olmazsa randevu iki kez onaylanır, komisyon iki kez yazılır.
     */
    public function bildirimIsle(array $govde, array $basliklar): array
    {
        $cozum = $this->provider->bildirimiCoz($govde, $basliklar);

        if ($cozum === null) {
            Log::warning('Ödeme bildirimi doğrulanamadı', ['provider' => $this->provider->ad()]);
            return ['ok' => false, 'sebep' => 'dogrulanamadi'];
        }

        return DB::transaction(function () use ($cozum, $govde) {
            $payment = Payment::where('provider', $this->provider->ad())
                ->where('provider_reference', $cozum['reference'])
                ->lockForUpdate()
                ->first();

            if (!$payment) {
                Log::warning('Bildirimdeki ödeme bulunamadı', ['reference' => $cozum['reference']]);
                return ['ok' => false, 'sebep' => 'kayit_yok'];
            }

            if ($payment->odendiMi()) {
                return ['ok' => true, 'sebep' => 'zaten_islenmis']; // tekrar gelen bildirim
            }

            // Sağlayıcının bildirdiği tutar kayıtla birebir aynı olmalı.
            // Farklıysa işlenmez: eksik tutarla randevu onaylanmasın.
            if ((int) $cozum['tutar_minor'] !== $payment->amount_minor
                || strtoupper($cozum['currency']) !== $payment->currency) {
                Log::error('Ödeme tutarı kayıtla uyuşmuyor', [
                    'payment_id' => $payment->id,
                    'beklenen'   => $payment->amount_minor . ' ' . $payment->currency,
                    'gelen'      => $cozum['tutar_minor'] . ' ' . $cozum['currency'],
                ]);
                $payment->update(['status' => Payment::BASARISIZ, 'provider_payload' => json_encode($govde)]);
                return ['ok' => false, 'sebep' => 'tutar_uyusmuyor'];
            }

            if ($cozum['durum'] !== 'paid') {
                $payment->update([
                    'status'           => Payment::BASARISIZ,
                    'provider_payload' => json_encode($govde),
                ]);
                $this->randevuKaporaDurumu($payment, 'failed');
                return ['ok' => true, 'sebep' => 'basarisiz'];
            }

            $payment->update([
                'status'           => Payment::ODENDI,
                'paid_at'          => now(),
                'provider_payload' => json_encode($govde),
            ]);

            $this->randevuKaporaDurumu($payment, 'paid');

            return ['ok' => true, 'sebep' => 'odendi', 'payment_id' => $payment->id];
        });
    }

    /**
     * İade. Kural: randevuya "iade penceresi"nden fazla varsa tam iade.
     * Doktor/klinik iptal ettiyse süreye bakılmaksızın tam iade — hastanın
     * kusuru olmayan iptalde parayı tutmak haksız ve itiraz sebebi.
     */
    public function iadeEt(Payment $payment, ?User $iptalEden = null, ?string $sebep = null): array
    {
        if (!$payment->odendiMi()) {
            return ['ok' => false, 'mesaj' => 'Ödenmemiş bir kayıt iade edilemez.'];
        }

        $kalan = $payment->iadeEdilebilir();
        if ($kalan->isZero()) {
            return ['ok' => false, 'mesaj' => 'Bu ödeme zaten tamamen iade edilmiş.'];
        }

        if (!$this->iadeHakkiVar($payment, $iptalEden)) {
            return [
                'ok' => false,
                'mesaj' => 'Randevu saatine ' . config('payments.refund_window_hours')
                    . ' saatten az kaldığı için iade yapılamıyor.',
            ];
        }

        $sonuc = $this->provider->iade($payment, $kalan->minor);

        if (!($sonuc['ok'] ?? false)) {
            return ['ok' => false, 'mesaj' => $sonuc['mesaj'] ?? 'İade sağlayıcı tarafından reddedildi.'];
        }

        $toplamIade = $payment->refunded_minor + $kalan->minor;

        $payment->update([
            'refunded_minor' => $toplamIade,
            'refunded_at'    => now(),
            'refund_reason'  => $sebep,
            'status'         => $toplamIade >= $payment->amount_minor
                ? Payment::IADE
                : Payment::KISMI_IADE,
        ]);

        $this->randevuKaporaDurumu($payment, 'refunded');

        return ['ok' => true, 'iade_edilen' => $kalan->toArray()];
    }

    /** Randevuya yeterli süre var mı, ya da iptal sağlayıcı tarafından mı geldi? */
    public function iadeHakkiVar(Payment $payment, ?User $iptalEden = null): bool
    {
        $appointment = $payment->appointment;

        if (!$appointment) {
            return true; // randevu yoksa parayı tutmanın dayanağı da yok
        }

        $saglayiciIptali = $iptalEden
            && in_array($iptalEden->id, [$appointment->doctor_id], true);

        if ($saglayiciIptali && config('payments.always_refund_on_provider_cancel')) {
            return true;
        }

        $baslangic = $appointment->startsAt();
        if ($baslangic === null) {
            return true;
        }

        $pencere = (int) config('payments.refund_window_hours');

        return now()->lte($baslangic->copy()->subHours($pencere));
    }

    /**
     * Süresi dolmuş ödemeleri kapatır ve tuttukları saatleri serbest bırakır.
     * Zamanlayıcıdan çağrılır; yoksa yarım kalan ödemeler saatleri sonsuza
     * kadar bloke eder.
     */
    public function suresiDolanlariKapat(): int
    {
        $sayac = 0;

        Payment::bekleyen()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->chunkById(100, function ($kayitlar) use (&$sayac) {
                foreach ($kayitlar as $payment) {
                    $payment->update(['status' => Payment::SURESI_DOLDU]);
                    $this->randevuKaporaDurumu($payment, 'expired');
                    $sayac++;
                }
            });

        return $sayac;
    }

    /**
     * Randevunun kapora durumunu ödemeyle aynı hizada tutar.
     *
     * Randevu yalnızca dört durumu tanır: bekliyor / ödendi / iade / atlandı.
     * "Başarısız" ve "süresi doldu" ödeme kaydının ayrıntısıdır; randevu
     * açısından ikisi de "kapora hâlâ ödenmedi" demektir. Ödeme durum makinesini
     * randevuya kopyalamak iki yerde ayrı ayrı bakım gerektirirdi.
     */
    private function randevuKaporaDurumu(Payment $payment, string $durum): void
    {
        $appointment = $payment->appointment;
        if (!$appointment) {
            return;
        }

        $randevuDurumu = match ($durum) {
            'paid'     => 'paid',
            'refunded' => 'refunded',
            default    => 'pending', // failed, expired → kapora ödenmedi
        };

        $appointment->update(['deposit_status' => $randevuDurumu]);
    }
}
