<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedStreamPostResource extends JsonResource
{
    use Concerns\ResolvesMediaUrls;

    public function toArray(Request $request): array
    {
        $isAnon = (bool) $this->is_anonymous;

        return [
            'id'          => $this->id,
            'author_id'   => $isAnon ? null : $this->author_id,
            'clinic_id'   => $this->clinic_id,
            'hospital_id' => $this->hospital_id,
            'specialty_id'=> $this->specialty_id,
            'post_type'   => $this->post_type,
            'content'     => $this->content,
            'media_url'   => $this->media_url,
            'media'       => $this->media,
            'is_hidden'         => (bool) $this->is_hidden,
            'is_anonymous'      => $isAnon,
            'gdpr_consent'      => (bool) $this->gdpr_consent,
            'media_processing'  => (bool) $this->media_processing,
            'view_count'        => (int) ($this->view_count ?? 0),
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at'        => $this->updated_at?->toISOString(),
            'time_ago'          => $this->created_at?->diffForHumans(),

            // Relations — masked when anonymous
            'author' => $this->whenLoaded('author', fn() => $isAnon ? [
                'id'       => null,
                'fullname' => 'Anonymous Doctor',
                'avatar'   => null,
                'role_id'  => 'doctor',
            ] : [
                'id'       => $this->author->id,
                'fullname' => $this->author->fullname,
                'avatar'   => self::resolveMediaUrl($this->author->avatar),
                'role_id'  => $this->author->role_id,
            ]),
            'clinic' => $this->whenLoaded('clinic', fn() => [
                'id'       => $this->clinic->id,
                'fullname' => $this->clinic->fullname,
                'avatar'   => self::resolveMediaUrl($this->clinic->avatar ?? null),
            ]),
            'hospital' => $this->whenLoaded('hospital', fn() => [
                'id'     => $this->hospital->id,
                'name'   => $this->hospital->name,
                'avatar' => self::resolveMediaUrl($this->hospital->avatar ?? null),
            ]),
            'specialty' => $this->whenLoaded('specialty', fn() => [
                'id'   => $this->specialty->id,
                'code' => $this->specialty->code,
                'name' => $this->specialty->name,
            ]),
            'engagement_counter' => [
                'like_count'    => (int) ($this->real_like_count ?? ($this->relationLoaded('engagementCounter') && $this->engagementCounter ? $this->engagementCounter->like_count : 0)),
                'comment_count' => (int) ($this->real_comment_count ?? ($this->relationLoaded('engagementCounter') && $this->engagementCounter ? $this->engagementCounter->comment_count : 0)),
            ],
            'comments' => MedStreamCommentResource::collection($this->whenLoaded('comments')),

            // Computed flags (set by service layer)
            'engagement_score' => (int) ($this->engagement_score ?? 0),
            'is_liked'      => $this->is_liked ?? false,
            'is_bookmarked' => $this->is_bookmarked ?? false,
        ];
    }
}
