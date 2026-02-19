<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedStreamPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'author_id'  => $this->author_id,
            'clinic_id'  => $this->clinic_id,
            'post_type'  => $this->post_type,
            'content'    => $this->content,
            'media_url'  => $this->media_url,
            'media'      => $this->media,
            'is_hidden'         => (bool) $this->is_hidden,
            'media_processing'  => (bool) $this->media_processing,
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relations
            'author' => $this->whenLoaded('author', fn() => [
                'id'       => $this->author->id,
                'fullname' => $this->author->fullname,
                'avatar'   => $this->author->avatar,
                'role_id'  => $this->author->role_id,
            ]),
            'clinic' => $this->whenLoaded('clinic', fn() => [
                'id'       => $this->clinic->id,
                'fullname' => $this->clinic->fullname,
                'avatar'   => $this->clinic->avatar ?? null,
            ]),
            'engagement_counter' => $this->whenLoaded('engagementCounter', fn() => [
                'like_count'    => $this->engagementCounter->like_count ?? 0,
                'comment_count' => $this->engagementCounter->comment_count ?? 0,
            ]),
            'comments' => MedStreamCommentResource::collection($this->whenLoaded('comments')),

            // Computed flags (set by service layer)
            'is_liked'      => $this->is_liked ?? false,
            'is_bookmarked' => $this->is_bookmarked ?? false,
        ];
    }
}
