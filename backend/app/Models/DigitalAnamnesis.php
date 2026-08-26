<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class DigitalAnamnesis extends Model
{
    use HasFactory, HasUuids, LogsActivity, MassPrunable, SoftDeletes;

    protected static string $auditResourceLabel = 'DigitalAnamnesis';

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'digital_anamneses';

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'answers', 'last_updated_by',
    ];

    protected function casts(): array
    {
        return [
            'answers'   => 'encrypted:array',
            'is_active' => 'boolean',
        ];
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 10 year retention for health data) ──

    /**
     * Budama kuyruğu.
     *
     * İki yol var ve ikisi de gerekli:
     *
     *   1. Yumuşak silinmiş kayıt — on yıl sonra kalıcı siliniyor.
     *   2. HESABINI SİLMİŞ hastanın kaydı — hasta silindikten on yıl sonra.
     *
     * İkincisi eksikti. Hesap silme tıbbi kayda dokunmuyor (klinik onu
     * görmeye devam etmeli: kliniğin kendi saklama yükümlülüğü var, GDPR
     * md. 17(3)(b) ve (h) silme hakkını burada sınırlıyor). Ama dokunmamak
     * SÜRESİZ tutmak demek değil — saklama süresi dolduğunda kayıt gitmeli.
     * Ölçüldüğünde silinen hesabın kayıtları hiçbir sayaca girmiyordu.
     *
     * Kliniğin görüşü bozulmuyor: kayıt on yıl boyunca listede kalıyor,
     * yalnız sonunda kalıcı olarak siliniyor.
     */
    public function prunable()
    {
        $hastaSutunu = 'patient_id';

        return static::withTrashed()
            ->where(function ($q) use ($hastaSutunu) {
                $q->where(function ($x) {
                    $x->whereNotNull('deleted_at')
                        ->where('deleted_at', '<=', now()->subYears(10));
                })->orWhereIn($hastaSutunu, function ($alt) {
                    $alt->select('id')->from('users')
                        ->whereNotNull('deleted_at')
                        ->where('deleted_at', '<=', now()->subYears(10));
                });
            });
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
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
}
