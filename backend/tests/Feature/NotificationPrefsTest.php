<?php
namespace Tests\Feature;

use App\Models\User;
use App\Support\NotificationPreferences;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationPrefsTest extends TestCase
{
    use RefreshDatabase;

    public function test_prefs_round_trip_through_api(): void
    {
        $u = User::factory()->patient()->create();
        Sanctum::actingAs($u);

        $this->getJson('/api/auth/profile/notification-preferences')
            ->assertOk()
            ->assertJsonPath('preferences.inapp_social', true);

        $this->putJson('/api/auth/profile/notification-preferences', [
            'inapp_social' => false,
            'email_review_received' => false,
        ])->assertOk();

        $u->refresh();
        $this->assertFalse(NotificationPreferences::ister($u, 'inapp_social'));
        $this->assertFalse(NotificationPreferences::ister($u, 'email_review_received'));
        $this->assertTrue(NotificationPreferences::ister($u, 'email_support'), 'dokunulmayan tercih bozulmamali');
    }

    public function test_mandatory_notifications_ignore_preferences(): void
    {
        $u = User::factory()->patient()->create();
        NotificationPreferences::yaz($u, ['inapp_social' => false, 'email_review_received' => false]);
        $u->refresh();

        // Bilinmeyen (= zorunlu) anahtar her zaman true
        $this->assertTrue(NotificationPreferences::ister($u, 'appointment_confirmed'));
        $this->assertTrue(NotificationPreferences::ister($u, 'appointment_reminder'));
    }

    public function test_social_notification_is_skipped_when_disabled(): void
    {
        $u = User::factory()->patient()->create();
        NotificationPreferences::yaz($u, ['inapp_social' => false]);
        $u->refresh();

        $post = \App\Models\MedStreamPost::factory()->create(['author_id' => $u->id]);
        $liker = User::factory()->patient()->create();

        $n = new \App\Notifications\PostLikedNotification($post, $liker);
        $this->assertSame([], $n->via($u), 'kapatilinca hic bildirim uretilmemeli');

        NotificationPreferences::yaz($u, ['inapp_social' => true]);
        $u->refresh();
        $this->assertContains('database', $n->via($u));
    }
}
