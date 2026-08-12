<?php

namespace App\Models;

use App\Support\Money;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

/**
 * Bir ödeme kaydı. Şimdilik tek amaç: randevu kaporası.
 *
 * Durum akışı:
 *   pending ─▶ paid ─▶ refunded / partially_refunded
 *      │
 *      ├─▶ failed     (sağlayıcı reddetti)
 *      ├─▶ expired    (süre doldu, slot serbest bırakıldı)
 *      └─▶ cancelled  (hasta vazgeçti)
 *
 * Geriye dönüş yok: ödenmiş bir kayıt tekrar "pending" olamaz. Her geçiş
 * PaymentService üzerinden yapılır, doğrudan status atanmaz.
 */
class Payment extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected static string $auditResourceLabel = 'Payment';

    protected $keyType = 'string';
    public $incrementing = false;

    public const BEKLIYOR   = 'pending';
    public const ODENDI     = 'paid';
    public const BASARISIZ  = 'failed';
    public const SURESI_DOLDU = 'expired';
    public const IPTAL      = 'cancelled';
    public const IADE       = 'refunded';
    public const KISMI_IADE = 'partially_refunded';

    protected $fillable = [
        'purpose', 'appointment_id', 'patient_id', 'clinic_id', 'doctor_id',
        'amount_minor', 'currency',
        'commission_minor', 'payout_minor', 'commission_rate',
        'status', 'provider', 'provider_reference',
        'refunded_minor', 'refund_reason',
        'expires_at', 'paid_at', 'refunded_at', 'provider_payload',
    ];

    protected function casts(): array
    {
        return [
            'amount_minor'     => 'integer',
            'commission_minor' => 'integer',
            'payout_minor'     => 'integer',
            'refunded_minor'   => 'integer',
            'commission_rate'  => 'float',
            'expires_at'       => 'datetime',
            'paid_at'          => 'datetime',
            'refunded_at'      => 'datetime',
            // Sağlayıcı yanıtı şifreli: içinde referans/kişi bilgisi geçebiliyor.
            'provider_payload' => 'encrypted',
        ];
    }

    // ── İlişkiler ──

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    // ── Para ──

    public function tutar(): Money
    {
        return Money::of($this->amount_minor, $this->currency);
    }

    public function komisyon(): Money
    {
        return Money::of($this->commission_minor, $this->currency);
    }

    public function hakedis(): Money
    {
        return Money::of($this->payout_minor, $this->currency);
    }

    public function iadeEdilen(): Money
    {
        return Money::of($this->refunded_minor, $this->currency);
    }

    /** Henüz iade edilebilecek tutar. */
    public function iadeEdilebilir(): Money
    {
        return $this->tutar()->minus($this->iadeEdilen());
    }

    // ── Durum ──

    public function odendiMi(): bool
    {
        return in_array($this->status, [self::ODENDI, self::KISMI_IADE], true);
    }

    public function bekliyorMu(): bool
    {
        return $this->status === self::BEKLIYOR;
    }

    /** Ödeme penceresi doldu mu? (slot serbest bırakılmalı) */
    public function suresiDolduMu(): bool
    {
        return $this->bekliyorMu()
            && $this->expires_at !== null
            && now()->greaterThan($this->expires_at);
    }

    public function scopeBekleyen($query)
    {
        return $query->where('status', self::BEKLIYOR);
    }
}
