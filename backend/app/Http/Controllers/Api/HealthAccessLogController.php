<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthDataAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "Sağlık verime kim, ne zaman, neye baktı?" — şeffaflık raporu.
 *
 * KVKK/GDPR veri sahibinin erişim hakkı + HIPAA denetim izi. Hasta kendi
 * kaydını görür; yönetici (superAdmin/saasAdmin) denetim için tümünü görür.
 */
class HealthAccessLogController extends Controller
{
    /** Denetim kaydındaki teknik tipleri kullanıcıya anlaşılır etikete çevirir. */
    private const LABELS = [
        'medical_archive'             => 'Tıbbi arşivinizi görüntüledi',
        'patient_document'            => 'Belgenize erişti',
        'patient_documents'           => 'Belgelerinizi listeledi',
        'medical_document_downloaded' => 'Belgenizi indirdi',
        'appointment'                 => 'Randevu kaydınızı görüntüledi',
        'anamnesis'                   => 'Anamnez kaydınızı görüntüledi',
        'examination'                 => 'Muayene kaydınızı görüntüledi',
        'prescription'                => 'Reçetenizi görüntüledi',
        'patient_record'              => 'Hasta kaydınızı görüntüledi',
    ];

    private const ACTION_LABELS = [
        'view'     => 'Görüntüleme',
        'download' => 'İndirme',
        'create'   => 'Oluşturma',
        'update'   => 'Güncelleme',
        'delete'   => 'Silme',
    ];

    /**
     * GET /health-access-logs  (auth)
     * Hasta: yalnız kendi kayıtları. Admin: tümü (patient_id ile filtrelenebilir).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = in_array($user->role_id, ['superAdmin', 'saasAdmin'], true);

        $query = HealthDataAuditLog::query()
            ->with(['accessor:id,fullname,avatar,role_id'])
            ->orderByDesc('created_at');

        if ($isAdmin) {
            $query->when($request->query('patient_id'), fn ($q, $v) => $q->where('patient_id', $v));
            $query->with(['patient:id,fullname']);
        } else {
            // Hasta yalnız KENDİ verisine yapılan erişimleri görür
            $query->where('patient_id', $user->id);
        }

        // Kendi kendine erişimi listeleme — hasta kendi arşivine baktığında gürültü olur
        if (!$isAdmin) {
            $query->whereColumn('accessor_id', '!=', 'patient_id');
        }

        $perPage = min(100, max(5, (int) $request->query('per_page', 25)));
        $logs = $query->paginate($perPage);

        $logs->getCollection()->transform(function (HealthDataAuditLog $log) use ($isAdmin) {
            return [
                'id'            => $log->id,
                'accessed_at'   => $log->created_at?->toISOString(),
                'accessor'      => [
                    'id'      => $log->accessor?->id,
                    'name'    => $log->accessor?->fullname ?? 'Bilinmeyen kullanıcı',
                    'avatar'  => $log->accessor?->avatar,
                    'role_id' => $log->accessor?->role_id,
                ],
                'what'          => self::LABELS[$log->resource_type] ?? $log->resource_type,
                'action'        => self::ACTION_LABELS[$log->action] ?? $log->action,
                'resource_type' => $log->resource_type,
                // IP/tarayıcı bilgisi yalnız denetim rolüne
                'ip_address'    => $isAdmin ? $log->ip_address : null,
                'patient'       => $isAdmin ? ['id' => $log->patient?->id, 'name' => $log->patient?->fullname] : null,
            ];
        });

        return response()->json($logs);
    }
}
