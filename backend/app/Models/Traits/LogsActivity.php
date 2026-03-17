<?php

namespace App\Models\Traits;

use App\Models\AuditLog;

/**
 * Eloquent trait — automatically logs created, updated and deleted events
 * into the audit_logs table with privacy-first masking for sensitive fields.
 *
 * Usage:
 *   use \App\Models\Traits\LogsActivity;
 *
 * Optionally override in your model:
 *   protected static array $auditMaskedFields   = ['password', 'token'];
 *   protected static array $auditExcludedFields  = ['updated_at', 'remember_token'];
 *   protected static string $auditResourceLabel  = 'User';   // friendly name
 */
trait LogsActivity
{
    // ── Global sensitive fields that are ALWAYS masked ──────────────
    private static array $globalMaskedFields = [
        'password',
        'remember_token',
        'api_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'credit_card',
        'card_number',
        'cvv',
        'ssn',
        'social_security',
        'secret',
        'token',
        'access_token',
        'refresh_token',
    ];

    // ── Fields excluded from logging by default ────────────────────
    private static array $globalExcludedFields = [
        'updated_at',
        'created_at',
        'email_verified_at',
    ];

    // ── Boot the trait ─────────────────────────────────────────────
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            $model->logAuditEvent('created');
        });

        static::updated(function ($model) {
            $model->logAuditEvent('updated');
        });

        static::deleted(function ($model) {
            $model->logAuditEvent('deleted');
        });
    }

    // ── Core logging method ────────────────────────────────────────
    protected function logAuditEvent(string $event): void
    {
        // Skip if running in console (seeders / migrations) unless explicitly opted in
        if (app()->runningInConsole() && !($this->auditInConsole ?? false)) {
            return;
        }

        $resourceType = static::$auditResourceLabel ?? class_basename($this);
        $action       = strtolower($resourceType) . '.' . $event;

        $oldValues = null;
        $newValues = null;
        $description = null;

        switch ($event) {
            case 'created':
                $newValues   = $this->maskSensitive($this->getAttributes());
                $description = "{$resourceType} created";
                break;

            case 'updated':
                $dirty    = $this->getDirty();
                $original = array_intersect_key($this->getOriginal(), $dirty);

                // Filter excluded fields
                $excluded  = $this->getMergedExcludedFields();
                $dirty     = array_diff_key($dirty, array_flip($excluded));
                $original  = array_diff_key($original, array_flip($excluded));

                // Nothing meaningful changed
                if (empty($dirty)) {
                    return;
                }

                $oldValues   = $this->maskSensitive($original);
                $newValues   = $this->maskSensitive($dirty);
                $description = "{$resourceType} updated: " . implode(', ', array_keys($dirty));
                break;

            case 'deleted':
                $oldValues   = $this->maskSensitive($this->getAttributes());
                $description = "{$resourceType} deleted";
                break;
        }

        try {
            AuditLog::create([
                'user_id'       => auth()->id(),
                'action'        => $action,
                'resource_type' => $resourceType,
                'resource_id'   => $this->getKey(),
                'old_values'    => $oldValues,
                'new_values'    => $newValues,
                'ip_address'    => request()?->ip(),
                'user_agent'    => request()?->userAgent(),
                'description'   => $description,
                'created_at'    => now(),
            ]);
        } catch (\Throwable $e) {
            \Log::warning("LogsActivity: failed to write audit log — {$e->getMessage()}");
        }
    }

    // ── Privacy masking ────────────────────────────────────────────

    /**
     * Mask sensitive values in the given array.
     * Returns a cleaned copy safe for audit storage.
     */
    protected function maskSensitive(array $data): array
    {
        $masked  = $this->getMergedMaskedFields();
        $excluded = $this->getMergedExcludedFields();

        $clean = [];
        foreach ($data as $key => $value) {
            // Skip excluded
            if (in_array($key, $excluded, true)) {
                continue;
            }

            // Mask sensitive
            if ($this->isSensitiveField($key, $masked)) {
                $clean[$key] = '********';
                continue;
            }

            // Truncate very long strings (> 500 chars) to keep logs lean
            if (is_string($value) && mb_strlen($value) > 500) {
                $clean[$key] = mb_substr($value, 0, 500) . '… [truncated]';
                continue;
            }

            $clean[$key] = $value;
        }

        return $clean;
    }

    /**
     * Check if a field name matches any masked pattern.
     */
    private function isSensitiveField(string $field, array $maskedFields): bool
    {
        $lower = strtolower($field);

        foreach ($maskedFields as $pattern) {
            $pattern = strtolower($pattern);
            // Exact match or contains
            if ($lower === $pattern || str_contains($lower, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Merge global + model-specific masked fields.
     */
    private function getMergedMaskedFields(): array
    {
        $modelMasked = static::$auditMaskedFields ?? [];
        return array_unique(array_merge(self::$globalMaskedFields, $modelMasked));
    }

    /**
     * Merge global + model-specific excluded fields.
     */
    private function getMergedExcludedFields(): array
    {
        $modelExcluded = static::$auditExcludedFields ?? [];
        return array_unique(array_merge(self::$globalExcludedFields, $modelExcluded));
    }
}
