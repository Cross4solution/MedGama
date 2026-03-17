<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class PatientDocument extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    protected static string $auditResourceLabel = 'PatientDocument';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id',
        'uploaded_by',
        'title',
        'description',
        'category',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'document_date',
        'shared_with',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'document_date' => 'date',
            'is_active'     => 'boolean',
            'file_size'     => 'integer',
            'shared_with'   => 'array',
            // GDPR Art. 9 — Encrypt sensitive medical document metadata
            'description'   => 'encrypted',
            'file_path'     => 'encrypted',
        ];
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForPatient($query, string $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeSharedWith($query, string $doctorId)
    {
        return $query->whereJsonContains('shared_with', $doctorId);
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    // ── Relationships ──

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ── Helpers ──

    /**
     * Check if a specific doctor has access to this document.
     */
    public function isSharedWith(string $doctorId): bool
    {
        return in_array($doctorId, $this->shared_with ?? [], true);
    }

    /**
     * Share this document with a doctor.
     */
    public function shareWith(string $doctorId): void
    {
        $shared = $this->shared_with ?? [];
        if (!in_array($doctorId, $shared, true)) {
            $shared[] = $doctorId;
            $this->update(['shared_with' => $shared]);
        }
    }

    /**
     * Revoke sharing with a doctor.
     */
    public function revokeShare(string $doctorId): void
    {
        $shared = array_values(array_filter(
            $this->shared_with ?? [],
            fn($id) => $id !== $doctorId
        ));
        $this->update(['shared_with' => $shared]);
    }

    /**
     * Human-readable file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 2) . ' KB';
        return $bytes . ' B';
    }

    public static array $allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/dicom',
    ];

    public static array $allowedCategories = [
        'lab_result',
        'radiology',
        'epicrisis',
        'prescription',
        'pathology',
        'surgery',
        'vaccination',
        'allergy',
        'insurance',
        'other',
    ];
}
