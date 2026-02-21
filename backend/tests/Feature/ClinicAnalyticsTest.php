<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CalendarSlot;
use App\Models\Clinic;
use App\Models\MedStreamEngagementCounter;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ClinicAnalyticsTest extends TestCase
{
    use DatabaseTransactions;

    private Clinic $clinic;
    private User $owner;
    private User $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner  = User::factory()->clinicOwner()->create();
        $this->clinic = Clinic::factory()->create(['owner_id' => $this->owner->id]);
        $this->owner->update(['clinic_id' => $this->clinic->id]);
        $this->doctor = User::factory()->doctor()->create(['clinic_id' => $this->clinic->id]);
    }

    // ── Authorization ──

    public function test_clinic_owner_can_access_own_analytics(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'appointments' => ['total', 'completed', 'confirmed', 'pending', 'cancelled', 'cancellation_rate'],
                    'new_patients',
                    'engagement' => ['total_posts', 'total_likes', 'total_comments'],
                ],
            ]);
    }

    public function test_clinic_owner_cannot_access_other_clinics_analytics(): void
    {
        $otherClinic = Clinic::factory()->create();

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$otherClinic->id}/summary");

        $response->assertStatus(403);
    }

    public function test_patient_cannot_access_clinic_analytics(): void
    {
        $patient = User::factory()->patient()->create();

        $response = $this->actingAs($patient, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertStatus(403);
    }

    public function test_admin_can_access_any_clinic_analytics(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertOk();
    }

    public function test_unauthenticated_user_cannot_access_analytics(): void
    {
        $response = $this->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertStatus(401);
    }

    // ── Summary Data ──

    public function test_summary_counts_appointments_correctly(): void
    {
        $patient = User::factory()->patient()->create();
        $slot1 = CalendarSlot::factory()->create(['doctor_id' => $this->doctor->id, 'clinic_id' => $this->clinic->id]);
        $slot2 = CalendarSlot::factory()->create(['doctor_id' => $this->doctor->id, 'clinic_id' => $this->clinic->id]);
        $slot3 = CalendarSlot::factory()->create(['doctor_id' => $this->doctor->id, 'clinic_id' => $this->clinic->id]);

        Appointment::factory()->create([
            'patient_id' => $patient->id, 'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id, 'slot_id' => $slot1->id,
            'status' => 'completed', 'created_by' => $patient->id,
        ]);
        Appointment::factory()->create([
            'patient_id' => $patient->id, 'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id, 'slot_id' => $slot2->id,
            'status' => 'cancelled', 'created_by' => $patient->id,
        ]);
        Appointment::factory()->create([
            'patient_id' => $patient->id, 'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id, 'slot_id' => $slot3->id,
            'status' => 'pending', 'created_by' => $patient->id,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertOk()
            ->assertJsonPath('data.appointments.total', 3)
            ->assertJsonPath('data.appointments.completed', 1)
            ->assertJsonPath('data.appointments.cancelled', 1)
            ->assertJsonPath('data.appointments.cancellation_rate', '33.3%');
    }

    public function test_summary_counts_new_patients(): void
    {
        $newPatient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create(['doctor_id' => $this->doctor->id, 'clinic_id' => $this->clinic->id]);

        Appointment::factory()->create([
            'patient_id' => $newPatient->id, 'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id, 'slot_id' => $slot->id,
            'created_by' => $newPatient->id,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertOk()
            ->assertJsonPath('data.new_patients', 1);
    }

    public function test_summary_aggregates_medstream_engagement(): void
    {
        $post = MedStreamPost::factory()->create([
            'author_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id,
        ]);

        MedStreamEngagementCounter::create([
            'post_id'       => $post->id,
            'like_count'    => 15,
            'comment_count' => 5,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary");

        $response->assertOk()
            ->assertJsonPath('data.engagement.total_posts', 1)
            ->assertJsonPath('data.engagement.total_likes', 15)
            ->assertJsonPath('data.engagement.total_comments', 5);
    }

    // ── Doctor Performance ──

    public function test_doctor_performance_returns_per_doctor_stats(): void
    {
        $patient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create(['doctor_id' => $this->doctor->id, 'clinic_id' => $this->clinic->id]);

        Appointment::factory()->create([
            'patient_id' => $patient->id, 'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id, 'slot_id' => $slot->id,
            'status' => 'completed', 'created_by' => $patient->id,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/doctors");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.doctor_id', $this->doctor->id)
            ->assertJsonPath('data.0.appointments.completed', 1);
    }

    public function test_doctor_performance_authorization(): void
    {
        $otherClinic = Clinic::factory()->create();

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$otherClinic->id}/doctors");

        $response->assertStatus(403);
    }

    // ── Engagement Endpoint ──

    public function test_engagement_returns_chart_js_format(): void
    {
        $post = MedStreamPost::factory()->create([
            'author_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id,
        ]);

        MedStreamEngagementCounter::create([
            'post_id'       => $post->id,
            'like_count'    => 20,
            'comment_count' => 8,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/engagement");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'totals' => ['posts', 'likes', 'comments'],
                    'chart'  => [
                        'labels',
                        'datasets' => [
                            ['label', 'data', 'backgroundColor', 'borderColor'],
                        ],
                    ],
                ],
            ])
            ->assertJsonPath('data.totals.posts', 1)
            ->assertJsonPath('data.totals.likes', 20)
            ->assertJsonPath('data.totals.comments', 8);
    }

    public function test_engagement_labels_are_daily(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/engagement");

        $response->assertOk();

        $labels = $response->json('data.chart.labels');
        $this->assertIsArray($labels);
        $this->assertGreaterThanOrEqual(1, count($labels));
    }

    public function test_engagement_authorization_blocks_other_clinic(): void
    {
        $otherClinic = Clinic::factory()->create();

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$otherClinic->id}/engagement");

        $response->assertStatus(403);
    }

    // ── Appointment Trend Endpoint ──

    public function test_appointment_trend_returns_chart_js_format(): void
    {
        $patient = User::factory()->patient()->create();
        $slot = CalendarSlot::factory()->create(['doctor_id' => $this->doctor->id, 'clinic_id' => $this->clinic->id]);

        Appointment::factory()->create([
            'patient_id' => $patient->id, 'doctor_id' => $this->doctor->id,
            'clinic_id' => $this->clinic->id, 'slot_id' => $slot->id,
            'status' => 'completed', 'created_by' => $patient->id,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/appointment-trend");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'chart' => [
                        'labels',
                        'datasets' => [
                            ['label', 'data', 'backgroundColor', 'borderColor'],
                        ],
                    ],
                ],
            ]);

        $datasets = $response->json('data.chart.datasets');
        $this->assertCount(3, $datasets);
        $this->assertEquals('Total', $datasets[0]['label']);
        $this->assertEquals('Completed', $datasets[1]['label']);
        $this->assertEquals('Cancelled', $datasets[2]['label']);
    }

    public function test_appointment_trend_authorization_blocks_patient(): void
    {
        $patient = User::factory()->patient()->create();

        $response = $this->actingAs($patient, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/appointment-trend");

        $response->assertStatus(403);
    }

    // ── Cache ──

    public function test_summary_is_cached(): void
    {
        Cache::flush();

        $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/summary")
            ->assertOk();

        $cacheKey = "clinic_summary:{$this->clinic->id}:" . now()->format('Y-m');
        $this->assertTrue(Cache::has($cacheKey));
    }

    public function test_engagement_is_cached(): void
    {
        Cache::flush();

        $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/analytics/clinic/{$this->clinic->id}/engagement")
            ->assertOk();

        $cacheKey = "clinic_engagement:{$this->clinic->id}:" . now()->format('Y-m');
        $this->assertTrue(Cache::has($cacheKey));
    }
}
