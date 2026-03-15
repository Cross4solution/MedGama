<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Notifications\TicketReceivedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TicketService
{
    // ══════════════════════════════════════════════
    //  LIST
    // ══════════════════════════════════════════════

    public function list(User $user, array $filters = []): array
    {
        $query = Ticket::query()
            ->with(['user:id,fullname,avatar,email,role_id', 'category', 'assignee:id,fullname,avatar', 'latestMessage']);

        // Role-based scoping
        if (!in_array($user->role_id, ['superAdmin', 'saasAdmin'])) {
            $query->where('user_id', $user->id);
        }

        // Filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }
        if (!empty($filters['search'])) {
            $s = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($s) {
                $q->where('subject', 'ilike', $s)
                  ->orWhere('ticket_number', 'ilike', $s);
            });
        }

        return $query->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 15)
            ->toArray();
    }

    // ══════════════════════════════════════════════
    //  CREATE
    // ══════════════════════════════════════════════

    public function create(User $user, array $data, array $files = []): Ticket
    {
        return DB::transaction(function () use ($user, $data, $files) {
            $ticket = Ticket::create([
                'ticket_number' => Ticket::generateTicketNumber(),
                'user_id'       => $user->id,
                'category_id'   => $data['category_id'] ?? null,
                'subject'       => $data['subject'],
                'status'        => 'open',
                'priority'      => $data['priority'] ?? 'medium',
            ]);

            // Create initial message
            $attachments = $this->processAttachments($files);
            TicketMessage::create([
                'ticket_id'   => $ticket->id,
                'user_id'     => $user->id,
                'body'        => $data['body'] ?? $data['subject'],
                'attachments' => $attachments ?: null,
            ]);

            // Auto-response notification
            try {
                $user->notify(new TicketReceivedNotification($ticket));
            } catch (\Throwable $e) {
                \Log::warning('Ticket notification failed: ' . $e->getMessage());
            }

            return $ticket->load(['user:id,fullname,avatar,email', 'category', 'messages.user:id,fullname,avatar']);
        });
    }

    // ══════════════════════════════════════════════
    //  SHOW (with messages)
    // ══════════════════════════════════════════════

    public function show(User $user, Ticket $ticket): Ticket
    {
        $this->authorize($user, $ticket);

        return $ticket->load([
            'user:id,fullname,avatar,email,role_id',
            'category',
            'assignee:id,fullname,avatar',
            'messages.user:id,fullname,avatar,role_id',
        ]);
    }

    // ══════════════════════════════════════════════
    //  REPLY
    // ══════════════════════════════════════════════

    public function reply(User $user, Ticket $ticket, array $data, array $files = []): TicketMessage
    {
        $this->authorize($user, $ticket);

        $attachments = $this->processAttachments($files);

        $message = TicketMessage::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => $user->id,
            'body'        => $data['body'],
            'attachments' => $attachments ?: null,
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        // Auto-set to in_progress when admin replies
        if (in_array($user->role_id, ['superAdmin', 'saasAdmin']) && $ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return $message->load('user:id,fullname,avatar,role_id');
    }

    // ══════════════════════════════════════════════
    //  UPDATE STATUS
    // ══════════════════════════════════════════════

    public function updateStatus(User $user, Ticket $ticket, string $status): Ticket
    {
        $this->authorizeAdmin($user);

        $updates = ['status' => $status];
        if ($status === 'resolved') $updates['resolved_at'] = now();
        if ($status === 'closed')   $updates['closed_at'] = now();

        $ticket->update($updates);
        return $ticket->fresh(['user:id,fullname,avatar,email', 'category', 'assignee:id,fullname,avatar']);
    }

    // ══════════════════════════════════════════════
    //  ASSIGN
    // ══════════════════════════════════════════════

    public function assign(User $admin, Ticket $ticket, ?string $assigneeId): Ticket
    {
        $this->authorizeAdmin($admin);

        $ticket->update([
            'assigned_to' => $assigneeId,
            'status'      => $ticket->status === 'open' ? 'in_progress' : $ticket->status,
        ]);

        return $ticket->fresh(['user:id,fullname,avatar,email', 'category', 'assignee:id,fullname,avatar']);
    }

    // ══════════════════════════════════════════════
    //  STATS (Admin dashboard)
    // ══════════════════════════════════════════════

    public function stats(): array
    {
        return [
            'total'       => Ticket::count(),
            'open'        => Ticket::where('status', 'open')->count(),
            'in_progress' => Ticket::where('status', 'in_progress')->count(),
            'resolved'    => Ticket::where('status', 'resolved')->count(),
            'closed'      => Ticket::where('status', 'closed')->count(),
            'urgent'      => Ticket::where('priority', 'urgent')->whereNotIn('status', ['resolved', 'closed'])->count(),
            'unassigned'  => Ticket::whereNull('assigned_to')->whereNotIn('status', ['resolved', 'closed'])->count(),
        ];
    }

    // ══════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════

    private function authorize(User $user, Ticket $ticket): void
    {
        if (in_array($user->role_id, ['superAdmin', 'saasAdmin'])) return;
        if ($ticket->user_id !== $user->id && $ticket->assigned_to !== $user->id) {
            abort(403, 'Unauthorized');
        }
    }

    private function authorizeAdmin(User $user): void
    {
        if (!in_array($user->role_id, ['superAdmin', 'saasAdmin'])) {
            abort(403, 'Only admins can perform this action');
        }
    }

    private function processAttachments(array $files): array
    {
        $attachments = [];
        foreach ($files as $file) {
            $path = $file->store('ticket-attachments', 'public');
            $attachments[] = [
                'filename' => $file->getClientOriginalName(),
                'path'     => $path,
                'mime'     => $file->getMimeType(),
                'size'     => $file->getSize(),
            ];
        }
        return $attachments;
    }
}
