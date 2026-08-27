<?php

namespace App\Http\Controllers\Api;

use App\Support\Sorgu;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clinic;
use App\Models\ContactMessage;
use App\Models\ContactMessageAttachment;
use App\Models\User;
use App\Services\EncryptedFileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class ContactMessageController extends Controller
{
    private static array $allowedMimes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    /**
     * POST /api/contact-messages
     * Patient sends a message to a clinic or doctor (with optional attachments).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'receiver_id'   => 'required|uuid',
            'receiver_type'  => 'required|string|in:clinic,doctor',
            'subject'        => 'nullable|string|max:255',
            'body'           => 'required|string|max:5000',
            'attachments'    => 'nullable|array|max:5',
            'attachments.*'  => 'file|max:5120', // 5 MB per file
        ]);

        $user         = $request->user();
        $receiverType = $request->input('receiver_type');
        $receiverId   = $request->input('receiver_id');

        // Validate receiver exists
        if ($receiverType === 'clinic') {
            Clinic::findOrFail($receiverId);
        } else {
            User::where('role_id', 'doctor')->where('is_active', true)->findOrFail($receiverId);
        }

        // Create message
        $message = ContactMessage::create([
            'sender_id'     => $user->id,
            'receiver_id'   => $receiverId,
            'receiver_type' => $receiverType,
            'subject'       => $request->input('subject'),
            'body'          => $request->input('body'),
        ]);

        // Handle attachments
        $attachments = [];
        // Elenen dosyalar ARTIK sessizce yutulmuyor.
        //
        // Tür listesinde olmayan bir dosya `continue` ile atılıyordu ve istek
        // 201 dönüyordu: gönderen, raporunu ilettiğini sanıyor, alıcı ekte
        // hiçbir şey görmüyor, ortada hata da yok. Hangi dosyanın neden
        // alınmadığı yanıtta söyleniyor.
        $elenen = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $mime = $file->getMimeType();
                if (!in_array($mime, self::$allowedMimes, true)) {
                    $elenen[] = [
                        'file_name' => $file->getClientOriginalName(),
                        'mime_type' => $mime,
                        'reason'    => 'unsupported_type',
                    ];
                    continue;
                }

                // Herkese açık disk DEĞİL. Bu ekler hastadan geliyor ve bir
                // sağlık sorusuna iliştirilmiş rapor ya da fotoğraf olabiliyor;
                // `public` diskte kalıcı ve denetimsiz bir adres oluşuyordu.
                // Sohbet ekleri için verilen kararın aynısı (bkz. ChatService).
                $path = app(EncryptedFileStorage::class)
                    ->storeUploaded($file, 'contact-messages/' . $message->id);

                $attachments[] = ContactMessageAttachment::create([
                    'contact_message_id' => $message->id,
                    'file_name'          => $file->getClientOriginalName(),
                    'file_path'          => $path,
                    'mime_type'          => $mime,
                    'file_size'          => $file->getSize(),
                ]);
            }
        }

        AuditLog::log(
            action: 'contact_message.sent',
            resourceType: 'ContactMessage',
            resourceId: $message->id,
            newValues: [
                'receiver_type' => $receiverType,
                'receiver_id'   => $receiverId,
                'has_attachments' => count($attachments) > 0,
            ],
            description: "{$user->fullname} sent a contact message to {$receiverType}:{$receiverId}",
        );

        $message->load('attachments');

        return response()->json([
            'message'  => 'Message sent successfully.',
            'data'     => $this->formatMessage($message),
            // Boş dizi de dönüyor: istemcinin alanın varlığına göre dal
            // seçmesi gerekmesin.
            'rejected_attachments' => $elenen,
        ], 201);
    }

    /**
     * GET /api/contact-messages/inbox
     * Inbox for clinic owner / doctor — list received contact messages.
     */
    public function inbox(Request $request): JsonResponse
    {
        $user    = $request->user();
        $role    = $user->role_id;
        $perPage = min((int) ($request->query('per_page') ?? 20), 50);

        // Determine receiver scope
        $query = ContactMessage::query()->with(['sender:id,fullname,avatar,email', 'attachments']);

        if ($role === 'clinicOwner' || $role === 'clinic') {
            // Show messages sent to any clinic owned by this user
            $clinicIds = Clinic::where('owner_id', $user->id)->pluck('id')->toArray();
            if (empty($clinicIds)) {
                return response()->json(['data' => [], 'meta' => ['total' => 0]]);
            }
            $query->where('receiver_type', 'clinic')->whereIn('receiver_id', $clinicIds);
        } elseif ($role === 'doctor') {
            $query->where('receiver_type', 'doctor')->where('receiver_id', $user->id);
        } elseif (!$user->isAdmin()) {
            // Bu dal "superAdmin — hepsini görsün" diye yazılmıştı ama rota
            // grubunda ROL SÜZGECİ YOK: hasta, hastane hesabı ve satışçı da
            // buraya düşüyor ve süzgeçsiz sorgu sistemdeki BÜTÜN mesajları
            // veriyordu — gönderenin adı, e-postası ve ekleriyle birlikte.
            // Yönetici olmayan için kapsam boş.
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        // Filters
        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $query->unread();
        }
        if ($search = $request->query('search')) {
            // Gövde ŞİFRELİ: alt dize eşleşmesi orada çalışmaz. Sorguda
            // bırakmak sessizce "hiç eşleşme yok" demek olurdu — aramanın
            // bozulduğu değil, sonucun boş olduğu sanılırdı.
            $query->where('subject', Sorgu::benzer(), "%{$search}%");
        }

        $messages = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $messages->through(fn($msg) => $this->formatMessage($msg));

        return response()->json($data);
    }

    /**
     * GET /api/contact-messages/{id}
     * Show single message + mark as read.
     */
    /**
     * Mesaja erişebilecek kişi: gönderen ya da alıcı.
     *
     * inbox() rolüne göre süzülüyordu ama show/destroy/downloadAttachment
     * hiçbir kontrol yapmıyordu: kimliği bilen HERHANGİ bir oturumlu kullanıcı
     * başka kliniğe gelen mesajı okuyabiliyor, ekini indirebiliyor ve kalıcı
     * olarak silebiliyordu. Listeyi süzmek tek başına erişim kontrolü değil.
     */
    private function erisebilirMesaj(Request $request, string $id): ContactMessage
    {
        $message = ContactMessage::with(['sender:id,fullname,avatar,email', 'attachments'])->findOrFail($id);
        $user = $request->user();

        if ($user->id === $message->sender_id) {
            return $message;
        }

        $alici = match ($message->receiver_type) {
            'doctor' => $user->id === $message->receiver_id,
            'clinic' => Clinic::where('id', $message->receiver_id)
                ->where('owner_id', $user->id)
                ->exists(),
            default  => false,
        };

        abort_unless($alici || $user->isAdmin(), 403, 'Bu mesaja erişim yetkiniz yok.');

        return $message;
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $message = $this->erisebilirMesaj($request, $id);

        // Mark as read
        if (!$message->is_read) {
            $message->update(['is_read' => true, 'read_at' => now()]);
        }

        return response()->json(['data' => $this->formatMessage($message)]);
    }

    /**
     * DELETE /api/contact-messages/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $message = $this->erisebilirMesaj($request, $id);

        // Delete attachment files
        foreach ($message->attachments as $att) {
            Storage::disk('public')->delete($att->file_path);
        }

        $message->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * GET /api/contact-messages/{id}/download/{attachmentId}
     * Download a specific attachment.
     */
    public function downloadAttachment(Request $request, string $id, string $attachmentId)
    {
        $message    = $this->erisebilirMesaj($request, $id);
        $attachment = ContactMessageAttachment::where('contact_message_id', $message->id)->findOrFail($attachmentId);

        $files = app(EncryptedFileStorage::class);
        $icerik = $files->read($attachment->file_path);

        if ($icerik === null) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return response($icerik, 200, [
            'Content-Type'        => $attachment->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => \App\Support\DosyaBasligi::uret('inline', $attachment->file_name),
            'Content-Length'      => (string) strlen($icerik),
            'Cache-Control'       => 'no-store, private',
        ]);
    }

    /**
     * GET /api/contact-messages/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user->role_id;

        $query = ContactMessage::unread();

        if ($role === 'clinicOwner' || $role === 'clinic') {
            $clinicIds = Clinic::where('owner_id', $user->id)->pluck('id')->toArray();
            $query->where('receiver_type', 'clinic')->whereIn('receiver_id', $clinicIds);
        } elseif ($role === 'doctor') {
            $query->where('receiver_type', 'doctor')->where('receiver_id', $user->id);
        } elseif (!$user->isAdmin()) {
            // Aynı dallanma, aynı boşluk: süzgeçsiz sayım sistem genelindeki
            // okunmamış mesaj sayısını sızdırıyordu.
            return response()->json(['count' => 0]);
        }

        return response()->json(['count' => $query->count()]);
    }

    // ── Helper ──

    private function formatMessage(ContactMessage $msg): array
    {
        return [
            'id'            => $msg->id,
            'sender'        => $msg->sender ? [
                'id'       => $msg->sender->id,
                'fullname' => $msg->sender->fullname,
                'avatar'   => $msg->sender->avatar,
                'email'    => $msg->sender->email,
            ] : null,
            'receiver_id'   => $msg->receiver_id,
            'receiver_type' => $msg->receiver_type,
            'subject'       => $msg->subject,
            'body'          => $msg->body,
            'is_read'       => $msg->is_read,
            'read_at'       => $msg->read_at?->toISOString(),
            'attachments'   => $msg->attachments->map(fn ($a) => [
                'id'        => $a->id,
                'file_name' => $a->file_name,
                // Eskiden `/storage/<yol>` dönüyordu ve arayüz onu doğrudan
                // <img src> olarak kullanıyordu — yetkili indirme ucu vardı ama
                // kimse ondan geçmiyordu. Artık kısa süreli imzalı bağlantı:
                // imzalı olması şart, çünkü <img src> Authorization gönderemez.
                'file_path' => self::ekBaglantisi($msg, $a),
                'mime_type' => $a->mime_type,
                'file_size' => $a->file_size,
            ]),
            'created_at'    => $msg->created_at?->toISOString(),
        ];
    }

    /**
     * GET /contact-messages/{id}/attachment/{attachmentId} — imzalı, süreli.
     *
     * Kimlik kontrolü yok; imza taşıyor. Bağlantı, mesajı görmeye YETKİLİ
     * kullanıcıya dönen yanıtta üretiliyor (`formatMessage`), dolayısıyla
     * imzanın varlığı yetkinin bir kez doğrulanmış olması demek.
     */
    public function attachmentSigned(string $id, string $attachmentId)
    {
        $ek = ContactMessageAttachment::where('contact_message_id', $id)->findOrFail($attachmentId);

        $icerik = app(EncryptedFileStorage::class)->read($ek->file_path);
        abort_if($icerik === null, 404, 'File not found.');

        return response($icerik, 200, [
            'Content-Type'        => $ek->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => \App\Support\DosyaBasligi::uret('inline', $ek->file_name),
            'Content-Length'      => (string) strlen($icerik),
            'Cache-Control'       => 'no-store, private',
        ]);
    }

    /** Ek için 30 dakikalık imzalı bağlantı. */
    private static function ekBaglantisi(ContactMessage $msg, ContactMessageAttachment $ek): string
    {
        // Her ek imzalı yoldan geçiyor — eskiler de. Eskiler herkese açık
        // diskte duruyordu ve bağlantıları `/storage/...` olarak veriliyordu:
        // oturum yok, imza yok, süre yok. İletişim kutusuna hasta yazıyor ve
        // rapor ekliyor; o adres bir kez sızdığında kalıcı olarak açıktı.
        //
        // İmzalı uç dosyayı EncryptedFileStorage üzerinden okuyor, o da özel
        // diskte bulamazsa herkese açık diske ve şifresiz eski biçime düşüyor.
        // Yani geçmiş kutular kırılmadan kapanıyor.
        return URL::temporarySignedRoute(
            'contact-messages.attachment',
            now()->addMinutes(30),
            ['id' => $msg->id, 'attachmentId' => $ek->id],
        );
    }
}
