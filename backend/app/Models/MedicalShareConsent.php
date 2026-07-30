<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MedicalShareConsent extends Model
{
    use HasUuids;

    protected $fillable = [
        'patient_id', 'appointment_id', 'provider_id', 'scope',
        'granted_at', 'expires_at', 'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /** Şu an geçerli (verilmiş, geri alınmamış, süresi dolmamış) mı? */
    public function isActive(): bool
    {
        return $this->granted_at !== null
            && $this->revoked_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public static function activeFor(string $appointmentId): ?self
    {
        return static::where('appointment_id', $appointmentId)
            ->where('scope', 'full')
            ->whereNotNull('granted_at')
            ->whereNull('revoked_at')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->first();
    }
}
