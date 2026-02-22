<?php

namespace App\Policies;

use App\Models\MedStreamPost;
use App\Models\User;

class MedStreamPostPolicy
{
    /**
     * Anyone can view visible posts (handled by scope), but hidden posts
     * can only be viewed by the author or an admin.
     */
    public function view(?User $user, MedStreamPost $post): bool
    {
        if (!$post->is_hidden) {
            return true;
        }

        return $user && ($user->id === $post->author_id || $user->isAdmin());
    }

    /**
     * Only the author or an admin can update a post.
     */
    public function update(User $user, MedStreamPost $post): bool
    {
        return $user->id === $post->author_id || $user->isAdmin();
    }

    /**
     * Only the author or an admin can delete a post.
     */
    public function delete(User $user, MedStreamPost $post): bool
    {
        return $user->id === $post->author_id || $user->isAdmin();
    }
}
