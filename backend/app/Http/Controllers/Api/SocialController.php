<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Clinic;
use App\Models\Favorite;
use App\Models\DoctorFollow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SocialController extends Controller
{
    // ══════════════════════════════════════════════
    //  FAVORITES  (polymorphic: doctor | clinic)
    // ══════════════════════════════════════════════

    /**
     * Resolve and validate the favoritable target.
     */
    private function resolveTarget(string $type, string $id): array
    {
        if ($type === 'clinic') {
            $entity = Clinic::active()->findOrFail($id);
            return ['entity' => $entity, 'name' => $entity->fullname ?? $entity->name];
        }
        // doctor
        $entity = User::where('role_id', 'doctor')->where('is_active', true)->findOrFail($id);
        return ['entity' => $entity, 'name' => $entity->fullname];
    }

    /**
     * POST /api/social/favorite — Add to favorites.
     */
    public function favorite(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:clinic,doctor',
            'target_id'   => 'required|uuid',
        ]);

        $user       = $request->user();
        $targetType = $request->input('target_type');
        $targetId   = $request->input('target_id');
        $target     = $this->resolveTarget($targetType, $targetId);

        $created = false;
        DB::transaction(function () use ($user, $targetId, $targetType, &$created) {
            $existing = Favorite::forUser($user->id)
                ->where('favoritable_id', $targetId)
                ->where('favoritable_type', $targetType)
                ->first();

            if (!$existing) {
                Favorite::create([
                    'user_id'          => $user->id,
                    'favoritable_id'   => $targetId,
                    'favoritable_type' => $targetType,
                ]);
                $created = true;
            }
        });

        if ($created) {
            AuditLog::log(
                action: "{$targetType}.favorited",
                resourceType: 'Favorite',
                resourceId: $targetId,
                newValues: ['target_type' => $targetType, 'target_name' => $target['name']],
                description: "{$user->fullname} favorited {$targetType}: {$target['name']}",
            );
        }

        return response()->json([
            'favorited' => true,
            'message'   => ucfirst($targetType) . ' added to favorites.',
        ]);
    }

    /**
     * POST /api/social/unfavorite — Remove from favorites.
     */
    public function unfavorite(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:clinic,doctor',
            'target_id'   => 'required|uuid',
        ]);

        $user       = $request->user();
        $targetType = $request->input('target_type');
        $targetId   = $request->input('target_id');

        $deleted = Favorite::forUser($user->id)
            ->where('favoritable_id', $targetId)
            ->where('favoritable_type', $targetType)
            ->delete();

        if ($deleted) {
            $target = $targetType === 'clinic'
                ? Clinic::find($targetId)
                : User::find($targetId);
            AuditLog::log(
                action: "{$targetType}.unfavorited",
                resourceType: 'Favorite',
                resourceId: $targetId,
                oldValues: ['target_type' => $targetType],
                description: "{$user->fullname} removed {$targetType} from favorites: " . ($target->fullname ?? $target->name ?? $targetId),
            );
        }

        return response()->json([
            'favorited' => false,
            'message'   => ucfirst($targetType) . ' removed from favorites.',
        ]);
    }

    /**
     * POST /api/social/toggle-favorite — Single-call toggle: add if missing, remove if exists.
     * Returns { favorited: bool, favorites_count: int }
     */
    public function toggleFavorite(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:clinic,doctor',
            'target_id'   => 'required|uuid',
        ]);

        $user       = $request->user();
        $targetType = $request->input('target_type');
        $targetId   = $request->input('target_id');

        // Validate target exists
        $target = $this->resolveTarget($targetType, $targetId);

        $favorited = DB::transaction(function () use ($user, $targetId, $targetType) {
            $existing = Favorite::forUser($user->id)
                ->where('favoritable_id', $targetId)
                ->where('favoritable_type', $targetType)
                ->first();

            if ($existing) {
                $existing->delete();
                return false;
            }

            Favorite::create([
                'user_id'          => $user->id,
                'favoritable_id'   => $targetId,
                'favoritable_type' => $targetType,
            ]);
            return true;
        });

        AuditLog::log(
            action: $favorited ? "{$targetType}.favorited" : "{$targetType}.unfavorited",
            resourceType: 'Favorite',
            resourceId: $targetId,
            newValues: ['target_type' => $targetType, 'target_name' => $target['name'], 'favorited' => $favorited],
            description: "{$user->fullname} " . ($favorited ? 'favorited' : 'unfavorited') . " {$targetType}: {$target['name']}",
        );

        $totalCount = Favorite::forUser($user->id)->count();

        return response()->json([
            'favorited'       => $favorited,
            'favorites_count' => $totalCount,
            'message'         => $favorited
                ? ucfirst($targetType) . ' added to favorites.'
                : ucfirst($targetType) . ' removed from favorites.',
        ]);
    }

    /**
     * GET /api/social/is-favorited?target_type=clinic|doctor&target_id=xxx
     */
    public function isFavorited(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:clinic,doctor',
            'target_id'   => 'required|uuid',
        ]);

        $exists = Favorite::forUser($request->user()->id)
            ->where('favoritable_id', $request->input('target_id'))
            ->where('favoritable_type', $request->input('target_type'))
            ->exists();

        return response()->json(['favorited' => $exists]);
    }

    /**
     * GET /api/social/favorites?target_type=clinic|doctor&per_page=20
     * Returns paginated list of user's favorites with details.
     */
    public function favorites(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'nullable|string|in:clinic,doctor',
        ]);

        $user       = $request->user();
        $perPage    = min((int) $request->query('per_page', 20), 50);
        $targetType = $request->query('target_type');

        $query = Favorite::forUser($user->id)->orderByDesc('created_at');

        if ($targetType) {
            $query->ofType($targetType);
        }

        $favorites = $query->paginate($perPage);

        // Eager-load relationships based on type
        $clinicIds = $favorites->getCollection()->where('favoritable_type', 'clinic')->pluck('favoritable_id')->all();
        $doctorIds = $favorites->getCollection()->where('favoritable_type', 'doctor')->pluck('favoritable_id')->all();

        $clinics = !empty($clinicIds)
            ? Clinic::whereIn('id', $clinicIds)->select('id', 'name', 'codename', 'fullname', 'avatar', 'address', 'is_verified')->get()->keyBy('id')
            : collect();
        $doctors = !empty($doctorIds)
            ? User::whereIn('id', $doctorIds)->select('id', 'fullname', 'avatar', 'is_verified', 'gender')
                ->with('doctorProfile:id,user_id,title,specialty')
                ->get()->keyBy('id')
            : collect();

        $data = $favorites->through(function ($fav) use ($clinics, $doctors) {
            if ($fav->favoritable_type === 'clinic') {
                $c = $clinics->get($fav->favoritable_id);
                if (!$c) return null;
                return [
                    'type'        => 'clinic',
                    'id'          => $c->id,
                    'name'        => $c->fullname ?? $c->name,
                    'codename'    => $c->codename,
                    'avatar'      => $c->avatar,
                    'address'     => $c->address,
                    'is_verified' => $c->is_verified,
                    'saved_at'    => $fav->created_at?->toISOString(),
                ];
            }
            // doctor
            $d = $doctors->get($fav->favoritable_id);
            if (!$d) return null;
            return [
                'type'        => 'doctor',
                'id'          => $d->id,
                'name'        => $d->fullname,
                'title'       => $d->doctorProfile?->title,
                'specialty'   => $d->doctorProfile?->specialty,
                'avatar'      => $d->avatar,
                'is_verified' => $d->is_verified,
                'saved_at'    => $fav->created_at?->toISOString(),
            ];
        });

        return response()->json($data);
    }

    /**
     * GET /api/social/favorites/count — Badge count for sidebar.
     * Optionally filter by target_type.
     */
    public function favoritesCount(Request $request): JsonResponse
    {
        $query = Favorite::forUser($request->user()->id);

        if ($type = $request->query('target_type')) {
            $query->ofType($type);
        }

        return response()->json(['count' => $query->count()]);
    }

    // ══════════════════════════════════════════════
    //  FOLLOWS (proxy to MedStreamService logic)
    // ══════════════════════════════════════════════

    /**
     * POST /api/social/follow — Toggle follow on a doctor/clinic owner.
     */
    public function follow(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:doctor,clinic',
            'target_id'   => 'required|uuid',
        ]);

        $user        = $request->user();
        $followingId = $request->input('target_id');

        if ($user->id === $followingId) {
            return response()->json(['following' => false, 'error' => 'Cannot follow yourself'], 422);
        }

        $targetType = $request->input('target_type');

        $result = DB::transaction(function () use ($user, $followingId, $targetType) {
            $existing = DoctorFollow::where('follower_id', $user->id)
                ->where('following_id', $followingId)
                ->where('following_type', $targetType)
                ->first();

            if ($existing) {
                $existing->update(['is_active' => true]);
                return ['following' => true];
            }

            DoctorFollow::create([
                'follower_id'    => $user->id,
                'following_id'   => $followingId,
                'following_type' => $targetType,
            ]);

            return ['following' => true];
        });

        return response()->json($result);
    }

    /**
     * POST /api/social/unfollow
     */
    public function unfollow(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:doctor,clinic',
            'target_id'   => 'required|uuid',
        ]);

        $user        = $request->user();
        $followingId = $request->input('target_id');

        $targetType = $request->input('target_type');

        DoctorFollow::where('follower_id', $user->id)
            ->where('following_id', $followingId)
            ->where('following_type', $targetType)
            ->update(['is_active' => false]);

        return response()->json(['following' => false]);
    }

    /**
     * POST /api/social/toggle-follow — Single-call toggle: follow if not, unfollow if yes.
     * Returns { following: bool, followers_count: int }
     */
    public function toggleFollow(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:doctor,clinic',
            'target_id'   => 'required|uuid',
        ]);

        $user        = $request->user();
        $followingId = $request->input('target_id');

        if ($user->id === $followingId) {
            return response()->json(['following' => false, 'error' => 'Cannot follow yourself'], 422);
        }

        // Validate target exists
        $targetType = $request->input('target_type');
        $target = $this->resolveTarget($targetType, $followingId);

        $following = DB::transaction(function () use ($user, $followingId, $targetType) {
            $existing = DoctorFollow::where('follower_id', $user->id)
                ->where('following_id', $followingId)
                ->where('following_type', $targetType)
                ->first();

            if ($existing) {
                $newState = !$existing->is_active;
                $existing->update(['is_active' => $newState]);
                return $newState;
            }

            DoctorFollow::create([
                'follower_id'    => $user->id,
                'following_id'   => $followingId,
                'following_type' => $targetType,
            ]);
            return true;
        });

        AuditLog::log(
            action: $following ? "{$targetType}.followed" : "{$targetType}.unfollowed",
            resourceType: 'Follow',
            resourceId: $followingId,
            newValues: ['target_type' => $targetType, 'target_name' => $target['name'], 'following' => $following],
            description: "{$user->fullname} " . ($following ? 'followed' : 'unfollowed') . " {$targetType}: {$target['name']}",
        );

        $followersCount = DoctorFollow::where('following_id', $followingId)
            ->where('following_type', $targetType)
            ->where('is_active', true)
            ->count();

        return response()->json([
            'following'       => $following,
            'followers_count' => $followersCount,
        ]);
    }

    /**
     * GET /api/social/is-following?target_type=doctor&target_id=xxx
     */
    public function isFollowing(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:doctor,clinic',
            'target_id'   => 'required|uuid',
        ]);

        $exists = DoctorFollow::where('follower_id', $request->user()->id)
            ->where('following_id', $request->input('target_id'))
            ->where('following_type', $request->input('target_type'))
            ->where('is_active', true)
            ->exists();

        return response()->json(['following' => $exists]);
    }

    /**
     * GET /api/social/followers?target_type=doctor&target_id=xxx
     */
    public function followers(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|string|in:doctor,clinic',
            'target_id'   => 'required|uuid',
        ]);

        $count = DoctorFollow::where('following_id', $request->input('target_id'))
            ->where('following_type', $request->input('target_type'))
            ->where('is_active', true)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * GET /api/social/following — List of users the current user follows.
     */
    public function following(Request $request): JsonResponse
    {
        $ids = DoctorFollow::where('follower_id', $request->user()->id)
            ->where('is_active', true)
            ->pluck('following_id');

        return response()->json(['following_ids' => $ids]);
    }
}
