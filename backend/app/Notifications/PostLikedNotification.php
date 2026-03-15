<?php

namespace App\Notifications;

use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class PostLikedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public MedStreamPost $post,
        public User $liker,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'         => 'post_liked',
            'post_id'      => $this->post->id,
            'title'        => ($this->liker->fullname ?? 'Someone') . ' liked your post',
            'message'      => ($this->liker->fullname ?? 'Someone') . ' liked your post: "' . Str::limit($this->post->content, 80) . '"',
            'liker_id'     => $this->liker->id,
            'liker_name'   => $this->liker->fullname ?? 'Someone',
            'liker_avatar' => $this->liker->avatar,
            'post_content' => Str::limit($this->post->content, 60),
        ];
    }
}
