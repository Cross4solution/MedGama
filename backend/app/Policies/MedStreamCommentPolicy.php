<?php

namespace App\Policies;

use App\Models\MedStreamComment;
use App\Models\User;

class MedStreamCommentPolicy
{
    /**
     * Only the comment author can update their own comment.
     */
    public function update(User $user, MedStreamComment $comment): bool
    {
        return $user->id === $comment->author_id;
    }

    /**
     * Delete allowed for:
     *  - The comment author (can always delete their own comment)
     *  - A doctor who owns the post the comment belongs to (moderation of their own content)
     *  - An admin
     */
    public function delete(User $user, MedStreamComment $comment): bool
    {
        // Comment author can always delete
        if ($user->id === $comment->author_id) {
            return true;
        }

        // Admin can delete any comment
        if ($user->isAdmin()) {
            return true;
        }

        // Doctor who owns the post can delete comments on their post
        if ($user->isDoctor()) {
            $comment->loadMissing('post:id,author_id');
            return $comment->post && $comment->post->author_id === $user->id;
        }

        return false;
    }
}
