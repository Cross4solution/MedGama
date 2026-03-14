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
     * Only the author, the hospital owner, or an admin can update a post.
     */
    public function update(User $user, MedStreamPost $post): bool
    {
        return $user->id === $post->author_id
            || $user->isAdmin()
            || $this->isHospitalOwner($user, $post);
    }

    /**
     * Only the author, the hospital owner, or an admin can delete a post.
     */
    public function delete(User $user, MedStreamPost $post): bool
    {
        return $user->id === $post->author_id
            || $user->isAdmin()
            || $this->isHospitalOwner($user, $post);
    }

    /**
     * Hospital role user can manage posts belonging to their hospital.
     */
    private function isHospitalOwner(User $user, MedStreamPost $post): bool
    {
        if (!$user->isHospital() || !$post->hospital_id) {
            return false;
        }

        // Hospital user manages posts linked to their hospital
        return $user->hospital_id === $post->hospital_id;
    }
}
