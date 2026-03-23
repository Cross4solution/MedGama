<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    // ══════════════════════════════════════════════
    //  PUBLIC — visible announcements for current user
    // ══════════════════════════════════════════════

    /**
     * GET /api/announcements — Active announcements for current user's role.
     */
    public function index(Request $request): JsonResponse
    {
        $role = $request->user()?->role_id;

        $announcements = Announcement::currentlyVisible()
            ->forRole($role)
            ->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($a) => [
                'id'             => $a->id,
                'title'          => $a->title,
                'body'           => $a->body,
                'type'           => $a->type,
                'is_dismissible' => $a->is_dismissible,
                'link_url'       => $a->link_url,
                'link_label'     => $a->link_label,
                'created_at'     => $a->created_at?->toISOString(),
            ]);

        return response()->json($announcements);
    }

    // ══════════════════════════════════════════════
    //  ADMIN CRUD
    // ══════════════════════════════════════════════

    /**
     * GET /api/admin/announcements — List all (paginated).
     */
    public function adminList(Request $request): JsonResponse
    {
        $query = Announcement::with('creator:id,fullname')
            ->orderByDesc('created_at');

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $announcements = $query->paginate($request->input('per_page', 20));

        return response()->json($announcements);
    }

    /**
     * POST /api/admin/announcements — Create announcement.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'body'           => 'required|string|max:5000',
            'type'           => 'required|string|in:info,warning,success,error',
            'target_roles'   => 'nullable|array',
            'target_roles.*' => 'string|in:patient,doctor,clinicOwner,superAdmin,saasAdmin',
            'is_active'      => 'boolean',
            'is_dismissible' => 'boolean',
            'starts_at'      => 'nullable|date',
            'ends_at'        => 'nullable|date|after_or_equal:starts_at',
            'link_url'       => 'nullable|string|max:500',
            'link_label'     => 'nullable|string|max:100',
            'priority'       => 'integer|min:0|max:100',
        ]);

        $data['created_by'] = $request->user()->id;
        $data['target_roles'] = $data['target_roles'] ?? [];

        $announcement = Announcement::create($data);

        AuditLog::log(
            action: 'announcement.created',
            resourceType: 'Announcement',
            resourceId: $announcement->id,
            newValues: ['title' => $announcement->title, 'type' => $announcement->type],
            description: "Created announcement: {$announcement->title}",
        );

        return response()->json([
            'message'      => 'Announcement created.',
            'announcement' => $announcement->load('creator:id,fullname'),
        ], 201);
    }

    /**
     * PUT /api/admin/announcements/{id} — Update announcement.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);

        $data = $request->validate([
            'title'          => 'sometimes|string|max:255',
            'body'           => 'sometimes|string|max:5000',
            'type'           => 'sometimes|string|in:info,warning,success,error',
            'target_roles'   => 'nullable|array',
            'target_roles.*' => 'string|in:patient,doctor,clinicOwner,superAdmin,saasAdmin',
            'is_active'      => 'boolean',
            'is_dismissible' => 'boolean',
            'starts_at'      => 'nullable|date',
            'ends_at'        => 'nullable|date',
            'link_url'       => 'nullable|string|max:500',
            'link_label'     => 'nullable|string|max:100',
            'priority'       => 'integer|min:0|max:100',
        ]);

        $oldValues = $announcement->only(['title', 'type', 'is_active']);
        $announcement->update($data);

        AuditLog::log(
            action: 'announcement.updated',
            resourceType: 'Announcement',
            resourceId: $announcement->id,
            oldValues: $oldValues,
            newValues: $data,
            description: "Updated announcement: {$announcement->title}",
        );

        return response()->json([
            'message'      => 'Announcement updated.',
            'announcement' => $announcement->refresh()->load('creator:id,fullname'),
        ]);
    }

    /**
     * DELETE /api/admin/announcements/{id} — Delete announcement.
     */
    public function destroy(string $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);
        $title = $announcement->title;

        $announcement->delete();

        AuditLog::log(
            action: 'announcement.deleted',
            resourceType: 'Announcement',
            resourceId: $id,
            oldValues: ['title' => $title],
            description: "Deleted announcement: {$title}",
        );

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
