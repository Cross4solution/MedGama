<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'invoice_number', 'patient_id', 'clinic_id', 'doctor_id', 'appointment_id',
        'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'grand_total', 'currency',
        'status', 'paid_amount', 'payment_method',
        'notes', 'issue_date', 'due_date', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'        => 'decimal:2',
            'tax_rate'        => 'decimal:2',
            'tax_amount'      => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'grand_total'     => 'decimal:2',
            'paid_amount'     => 'decimal:2',
            'issue_date'      => 'date',
            'due_date'        => 'date',
            'paid_at'         => 'datetime',
        ];
    }

    // ── Scopes ──

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopeForClinic($query, ?string $clinicId)
    {
        if ($clinicId) {
            return $query->where('clinic_id', $clinicId);
        }
        return $query;
    }

    public function scopeForDoctor($query, string $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    // ── Relationships ──

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    // ── Helpers ──

    public function recalculate(): void
    {
        $subtotal = $this->items()->sum('total_price');
        $taxAmount = round($subtotal * ($this->tax_rate / 100), 2);
        $grandTotal = $subtotal + $taxAmount - $this->discount_amount;

        $this->update([
            'subtotal'   => $subtotal,
            'tax_amount' => $taxAmount,
            'grand_total' => max(0, $grandTotal),
        ]);
    }

    public static function generateInvoiceNumber(): string
    {
        $year = now()->format('Y');
        $latest = static::withTrashed()
            ->where('invoice_number', 'like', "INV-{$year}-%")
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        if ($latest) {
            $seq = (int) substr($latest, -5) + 1;
        } else {
            $seq = 1;
        }

        return sprintf('INV-%s-%05d', $year, $seq);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function remainingAmount(): float
    {
        return max(0, (float) $this->grand_total - (float) $this->paid_amount);
    }
}
