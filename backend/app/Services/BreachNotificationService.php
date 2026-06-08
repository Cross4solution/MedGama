<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * BreachNotificationService — KVKK Md. 12 / GDPR Art. 33-34 / HIPAA § 164.408.
 *
 * Coordinates the operational response to a personal-data breach:
 *   1. Logs a critical-level entry for SIEM ingestion.
 *   2. Emails the platform admin / security inbox.
 *   3. Persists an audit-log record for the regulator-facing trail.
 *   4. Leaves a TODO marker for the 72-hour KVK Kurumu / DPO notification step.
 *
 * The actual outbound notification to the data subjects and the supervisory
 * authority is handled out-of-band per `docs/SECURITY_INCIDENT_RUNBOOK.md`.
 */
class BreachNotificationService
{
    /**
     * Trigger the breach-notification workflow.
     *
     * @param array $details {
     *     @var string $summary       Short human-readable description.
     *     @var string $severity      low|medium|high|critical (default: high).
     *     @var array  $affected_user_ids
     *     @var string $detected_at   ISO 8601 timestamp.
     *     @var string $vector        How the breach was detected/occurred.
     *     @var string $reporter      Who reported it (admin email / system).
     * }
     */
    public function notifyBreach(array $details): array
    {
        $payload = [
            'summary'           => $details['summary'] ?? 'Unspecified data breach',
            'severity'          => $details['severity'] ?? 'high',
            'affected_user_ids' => $details['affected_user_ids'] ?? [],
            'detected_at'       => $details['detected_at'] ?? now()->toIso8601String(),
            'vector'            => $details['vector'] ?? null,
            'reporter'          => $details['reporter'] ?? 'system',
            'notified_at'       => now()->toIso8601String(),
        ];

        // 1. Critical-level log line — picked up by SIEM / log aggregator.
        Log::critical('SECURITY_BREACH_DETECTED', $payload);

        // 2. Email the admin / security inbox.
        $adminEmail = config('mail.admin_email')
            ?: config('mail.from.address')
            ?: env('SECURITY_CONTACT_EMAIL', 'security@medagama.com');

        try {
            Mail::raw(
                "A personal-data breach has been reported.\n\n" . json_encode($payload, JSON_PRETTY_PRINT),
                function ($message) use ($adminEmail, $payload) {
                    $message->to($adminEmail)
                            ->subject('[MedaGama][SECURITY] Breach reported — severity: ' . $payload['severity']);
                }
            );
        } catch (\Throwable $e) {
            Log::warning('Breach notification email failed: ' . $e->getMessage());
        }

        // 3. Audit log entry (regulator-facing evidence trail).
        try {
            $reporterUser = is_numeric($payload['reporter']) ? User::find((int) $payload['reporter']) : null;
            AuditLog::log(
                user: $reporterUser,
                action: 'security.breach_reported',
                resourceType: 'security_incident',
                resourceId: 0,
                oldValues: [],
                newValues: $payload,
                description: 'Personal-data breach reported via BreachNotificationService',
            );
        } catch (\Throwable $e) {
            Log::warning('Breach audit log failed: ' . $e->getMessage());
        }

        // 4. TODO: Within 72 hours of detection, the DPO MUST notify KVK Kurumu (Türkiye)
        //    and/or the lead supervisory authority (GDPR Art. 33). Affected data subjects
        //    must be notified without undue delay (Art. 34) when the breach is likely to
        //    result in a high risk to their rights and freedoms. See SECURITY_INCIDENT_RUNBOOK.md.

        return $payload;
    }
}
