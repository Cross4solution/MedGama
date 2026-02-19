<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedStreamCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'post_id'    => $this->post_id,
            'author_id'  => $this->author_id,
            'parent_id'  => $this->parent_id,
            'content'    => $this->content,
            'is_hidden'  => (bool) $this->is_hidden,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'author' => $this->whenLoaded('author', fn() => [
                'id'       => $this->author->id,
                'fullname' => $this->author->fullname,
                'avatar'   => $this->author->avatar,
            ]),

            'replies' => MedStreamCommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
