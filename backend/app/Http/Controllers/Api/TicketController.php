<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(private TicketService $service) {}

    /**
     * GET /api/support/tickets
     */
    public function index(Request $request): JsonResponse
    {
        $data = $this->service->list($request->user(), $request->all());
        return response()->json($data);
    }

    /**
     * POST /api/support/tickets
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject'     => 'required|string|max:255',
            'body'        => 'required|string|max:5000',
            'category_id' => 'nullable|uuid|exists:ticket_categories,id',
            'priority'    => 'nullable|in:low,medium,high,urgent',
        ]);

        $files = $request->file('attachments', []);
        if (!is_array($files)) $files = [$files];

        $ticket = $this->service->create($request->user(), $data, array_filter($files));
        return response()->json($ticket, 201);
    }

    /**
     * GET /api/support/tickets/{ticket}
     */
    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $this->service->show($request->user(), $ticket);
        return response()->json($data);
    }

    /**
     * POST /api/support/tickets/{ticket}/reply
     */
    public function reply(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'body'        => 'required|string|max:5000',
            'is_internal' => 'nullable|boolean',
        ]);

        $files = $request->file('attachments', []);
        if (!is_array($files)) $files = [$files];

        $message = $this->service->reply($request->user(), $ticket, $data, array_filter($files));
        return response()->json($message, 201);
    }

    /**
     * PATCH /api/support/tickets/{ticket}/status
     */
    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $updated = $this->service->updateStatus($request->user(), $ticket, $data['status']);
        return response()->json($updated);
    }

    /**
     * PATCH /api/support/tickets/{ticket}/assign
     */
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'assigned_to' => 'nullable|uuid|exists:users,id',
        ]);

        $updated = $this->service->assign($request->user(), $ticket, $data['assigned_to'] ?? null);
        return response()->json($updated);
    }

    /**
     * GET /api/support/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role_id, ['superAdmin', 'saasAdmin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($this->service->stats());
    }

    /**
     * GET /api/support/categories
     */
    public function categories(): JsonResponse
    {
        $cats = TicketCategory::active()->orderBy('sort_order')->get();
        return response()->json($cats);
    }

    /**
     * POST /api/support/categories — Admin only
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|array',
            'name.en'     => 'required|string|max:100',
            'description' => 'nullable|array',
            'slug'        => 'required|string|max:50|unique:ticket_categories,slug',
            'sort_order'  => 'nullable|integer',
        ]);

        $cat = TicketCategory::create($data);
        return response()->json($cat, 201);
    }

    /**
     * PUT /api/support/categories/{id} — Admin only
     */
    public function updateCategory(Request $request, string $id): JsonResponse
    {
        $cat = TicketCategory::findOrFail($id);
        $data = $request->validate([
            'name'        => 'nullable|array',
            'description' => 'nullable|array',
            'slug'        => 'nullable|string|max:50|unique:ticket_categories,slug,' . $id,
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);

        $cat->update(array_filter($data, fn($v) => $v !== null));
        return response()->json($cat);
    }

    /**
     * DELETE /api/support/categories/{id} — Admin only
     */
    public function destroyCategory(string $id): JsonResponse
    {
        TicketCategory::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
