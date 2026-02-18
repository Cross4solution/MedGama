<?php

namespace App\Notifications;

use App\Models\MedStreamComment;
use App\Models\MedStreamPost;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class PostCommentedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public MedStreamPost $post,
        public MedStreamComment $comment,
        public string $commenterName = 'Someone',
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'post_commented',
            'post_id' => $this->post->id,
            'comment_id' => $this->comment->id,
            'title' => 'New Comment on Your Post',
            'message' => $this->commenterName . ' commented on your post: "' . Str::limit($this->comment->content, 80) . '"',
            'commenter_id' => $this->comment->author_id,
            'commenter_name' => $this->commenterName,
            'post_content' => Str::limit($this->post->content, 60),
        ];
    }
}
