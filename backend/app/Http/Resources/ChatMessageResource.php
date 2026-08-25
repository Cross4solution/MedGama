<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class ChatMessageResource extends JsonResource
{
    use Concerns\ResolvesMediaUrls;

    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id'       => $this->sender_id,
            'message_type'    => $this->message_type,
            'content'         => $this->content,
            'attachment_url'  => $this->ekBaglantisi(),
            'attachment_name' => $this->attachment_name,
            'read_at'         => $this->read_at?->toISOString(),
            'created_at'      => $this->created_at?->toISOString(),
            'updated_at'      => $this->updated_at?->toISOString(),

            'sender' => $this->whenLoaded('sender', fn () => [
                'id'       => $this->sender->id,
                'fullname' => $this->sender->fullname,
                'avatar'   => self::resolveMediaUrl($this->sender->avatar),
            ]),
        ];
    }

    /**
     * Ek bağlantısı — özel diskteki dosya için kısa süreli imzalı adres.
     *
     * Yeni ekler `chat/attachments/<konusma>/<uuid>.<uzanti>` gibi ÖZEL disk
     * yolları olarak saklanıyor; herkese açık bir adresleri yok. Bu kaynak
     * yalnız konuşmanın katılımcısına döndüğü için, imzalı bağlantıyı burada
     * üretmek yetkiyi de taşımış oluyor.
     *
     * Eski kayıtlar `/storage/...` değeri taşıyor. Onlar zaten herkese açık
     * diskte duruyor; değerlerini olduğu gibi geçiriyoruz ki geçmiş sohbetler
     * kırılmasın. Yeni yazılan hiçbir ek oraya düşmüyor.
     */
    private function ekBaglantisi(): ?string
    {
        $yol = $this->attachment_url;

        if (!$yol) {
            return null;
        }

        if (str_starts_with($yol, '/storage/') || str_starts_with($yol, 'http')) {
            return self::resolveMediaUrl($yol);
        }

        return URL::temporarySignedRoute(
            'chat.attachment.file',
            now()->addMinutes(30),
            ['message' => $this->id],
        );
    }
}
