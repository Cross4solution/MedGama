<?php

namespace App\Services;

use App\Models\ConsentRecord;
use App\Models\HealthDataAuditLog;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Açık rıza yönetimi (KVKK / GDPR Art.7 / HIPAA).
 *
 * Kurallar:
 *  • Her onay ve geri alma AYRI olay olarak saklanır; geçmiş silinmez/üzerine yazılmaz.
 *  • Onay, metin sürümüyle birlikte kaydedilir (ispat yükümlülüğü).
 *  • Sağlık verisiyle ilgili rıza hareketleri ayrıca denetim kaydına yazılır.
 */
class ConsentService
{
    /** Onay kaydeder. Aynı tip için önceki aktif kayıt varsa geri alınır (sürüm değişimi). */
    public function grant(User $user, string $type, string $source = 'profile'): ?ConsentRecord
    {
        $config = $this->typeConfig($type);
        if (!$config) {
            return null;
        }

        $version = (string) $config['version'];

        // Aynı sürüm için zaten aktif onay varsa tekrar kayıt açma
        $existing = ConsentRecord::where('user_id', $user->id)
            ->where('type', $type)->where('version', $version)
            ->active()->first();
        if ($existing) {
            return $existing;
        }

        // Eski sürüm onayları kapat (yeni sürüm onaylandı)
        ConsentRecord::where('user_id', $user->id)->where('type', $type)
            ->active()->update(['revoked_at' => now()]);

        $record = ConsentRecord::create([
            'user_id'    => $user->id,
            'type'       => $type,
            'version'    => $version,
            'granted_at' => now(),
            'source'     => $source,
            'locale'     => app()->getLocale(),
            'ip_address' => request()?->ip(),
            'user_agent' => substr((string) request()?->userAgent(), 0, 512),
        ]);

        $this->audit($user, $type, 'consent_granted');

        return $record;
    }

    /**
     * Onayı geri alır.
     *
     * Dönüş bir DURUM, çünkü üç farklı sonuç vardı ve üçü de tek bir `false`
     * olarak dışarı çıkıyordu. Kullanıcı, aktif kaydı olmadığı için geri
     * alınamayan bir onayda "bu onay hizmetin verilebilmesi için zorunludur"
     * mesajını görüyordu — geri alınabilir bir onay, geri alınamaz gibi
     * gösteriliyordu. Yanlış bilgi, üstelik hukuki bir konuda.
     *
     * @return 'unknown'|'not_revocable'|'ok'
     */
    public function revoke(User $user, string $type): string
    {
        $config = $this->typeConfig($type);

        if (!$config) {
            return 'unknown';
        }

        if (!($config['revocable'] ?? false)) {
            return 'not_revocable';
        }

        $updated = ConsentRecord::where('user_id', $user->id)
            ->where('type', $type)->active()
            ->update(['revoked_at' => now()]);

        if ($updated > 0) {
            $this->audit($user, $type, 'consent_revoked');
        }

        // Kayıt yoksa da sonuç kullanıcının istediği durum: onay aktif değil.
        // Hata döndürmek, geri alınabilir bir onayı geri alınamaz göstermek olurdu.
        return 'ok';
    }

    /** Kullanıcının tüm rıza tiplerindeki güncel durumu (ekranda gösterim için). */
    public function statusFor(User $user, string $locale = 'tr'): Collection
    {
        $active = ConsentRecord::where('user_id', $user->id)->active()->get()->keyBy('type');
        $history = ConsentRecord::where('user_id', $user->id)
            ->orderByDesc('created_at')->get()->groupBy('type');

        return collect(config('consents.types', []))->map(function ($config, $type) use ($active, $history, $locale) {
            $current = $active->get($type);
            $last = $history->get($type)?->first();

            return [
                'type'         => $type,
                'label'        => $config['label'][$locale] ?? $config['label']['en'] ?? $type,
                'required'     => (bool) ($config['required'] ?? false),
                'revocable'    => (bool) ($config['revocable'] ?? false),
                'version'      => (string) $config['version'],
                'granted'      => $current !== null,
                'granted_at'   => $current?->granted_at?->toISOString(),
                'granted_version' => $current?->version,
                // Sürüm güncellendiyse kullanıcıdan yeniden onay istenmeli
                'needs_renewal' => $current !== null && $current->version !== (string) $config['version'],
                'revoked_at'   => $current === null ? $last?->revoked_at?->toISOString() : null,
            ];
        })->values();
    }

    /** Kayıt sırasında verilen zorunlu onayları topluca işler. */
    public function recordRegistrationConsents(User $user, array $data): void
    {
        // Sağlık verisi işleme onayı yalnız açıkça verildiyse
        if (!empty($data['health_data_consent'])) {
            $this->grant($user, 'health_data_processing', 'register');
        }

        // Kayıt akışında kabul edilmesi zorunlu olanlar
        foreach (['privacy_policy', 'terms_of_service', 'medical_share_notice'] as $type) {
            $this->grant($user, $type, 'register');
        }

        if (!empty($data['marketing_consent'])) {
            $this->grant($user, 'marketing_communications', 'register');
        }
    }

    private function typeConfig(string $type): ?array
    {
        return config("consents.types.{$type}");
    }

    private function audit(User $user, string $type, string $action): void
    {
        try {
            HealthDataAuditLog::log(
                accessorId: $user->id,
                patientId: $user->id,
                resourceType: 'consent',
                resourceId: $type,
                action: $action,
            );
        } catch (\Throwable $e) {
            \Log::warning('Consent audit failed: ' . $e->getMessage());
        }
    }
}
