<?php

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class ChatMedStreamTest extends TestCase
{
    use DatabaseMigrations;

    // ── Chat Tests ──

    public function test_participant_can_view_conversation_messages(): void
    {
        $userA = User::factory()->doctor()->create();
        $userB = User::factory()->patient()->create();

        $conversation = ChatConversation::factory()->create([
            'user_one_id' => $userA->id,
            'user_two_id' => $userB->id,
        ]);

        ChatMessage::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $userA->id,
        ]);

        $response = $this->actingAs($userA, 'sanctum')
            ->getJson("/api/chat/conversations/{$conversation->id}/messages");

        $response->assertOk();
    }

    public function test_outsider_cannot_view_conversation_messages(): void
    {
        $userA    = User::factory()->create();
        $userB    = User::factory()->create();
        $outsider = User::factory()->create();

        $conversation = ChatConversation::factory()->create([
            'user_one_id' => $userA->id,
            'user_two_id' => $userB->id,
        ]);

        $response = $this->actingAs($outsider, 'sanctum')
            ->getJson("/api/chat/conversations/{$conversation->id}/messages");

        $response->assertStatus(403);
    }

    public function test_participant_can_send_message(): void
    {
        $doctor  = User::factory()->doctor()->create();
        $patient = User::factory()->patient()->create();

        $conversation = ChatConversation::factory()->create([
            'user_one_id' => $doctor->id,
            'user_two_id' => $patient->id,
        ]);

        $response = $this->actingAs($doctor, 'sanctum')
            ->postJson("/api/chat/conversations/{$conversation->id}/messages", [
                'content' => 'Hello patient, how are you?',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('chat_messages', [
            'conversation_id' => $conversation->id,
            'sender_id'       => $doctor->id,
            'content'         => 'Hello patient, how are you?',
        ]);
    }

    public function test_outsider_cannot_send_message(): void
    {
        $userA    = User::factory()->create();
        $userB    = User::factory()->create();
        $outsider = User::factory()->create();

        $conversation = ChatConversation::factory()->create([
            'user_one_id' => $userA->id,
            'user_two_id' => $userB->id,
        ]);

        $response = $this->actingAs($outsider, 'sanctum')
            ->postJson("/api/chat/conversations/{$conversation->id}/messages", [
                'content' => 'I should not be able to send this',
            ]);

        $response->assertStatus(403);
    }

    public function test_mark_as_read_updates_unread_messages(): void
    {
        $doctor  = User::factory()->doctor()->create();
        $patient = User::factory()->patient()->create();

        $conversation = ChatConversation::factory()->create([
            'user_one_id' => $doctor->id,
            'user_two_id' => $patient->id,
        ]);

        // Doctor sends 3 messages
        ChatMessage::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $doctor->id,
        ]);

        // Patient marks as read
        $response = $this->actingAs($patient, 'sanctum')
            ->postJson("/api/chat/conversations/{$conversation->id}/read");

        $response->assertOk()
            ->assertJsonPath('count', 3);

        // Verify all are read
        $unread = ChatMessage::where('conversation_id', $conversation->id)
            ->whereNull('read_at')
            ->count();
        $this->assertEquals(0, $unread);
    }

    // ── MedStream Tests ──

    public function test_author_can_delete_own_post(): void
    {
        $author = User::factory()->doctor()->create();

        $post = MedStreamPost::factory()->create([
            'author_id' => $author->id,
        ]);

        $response = $this->actingAs($author, 'sanctum')
            ->deleteJson("/api/medstream/posts/{$post->id}");

        $response->assertOk();
        $this->assertSoftDeleted('med_stream_posts', ['id' => $post->id]);
    }

    public function test_non_author_cannot_delete_post(): void
    {
        $author = User::factory()->doctor()->create();
        $other  = User::factory()->doctor()->create();

        $post = MedStreamPost::factory()->create([
            'author_id' => $author->id,
        ]);

        $response = $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/medstream/posts/{$post->id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_any_post(): void
    {
        $author = User::factory()->doctor()->create();
        $admin  = User::factory()->admin()->create();

        $post = MedStreamPost::factory()->create([
            'author_id' => $author->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/medstream/posts/{$post->id}");

        $response->assertOk();
        $this->assertSoftDeleted('med_stream_posts', ['id' => $post->id]);
    }

    public function test_posts_list_is_publicly_accessible(): void
    {
        MedStreamPost::factory()->count(3)->create([
            'author_id' => User::factory()->doctor()->create()->id,
        ]);

        $response = $this->getJson('/api/medstream/posts');

        $response->assertOk();
    }
}
