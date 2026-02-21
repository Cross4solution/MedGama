<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseMigrations;

    // ── Registration ──

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'fullname'              => 'Test Patient',
            'email'                 => 'patient@test.com',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id'               => 'patient',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'fullname', 'email']]);

        $this->assertDatabaseHas('users', ['email' => 'patient@test.com']);
    }

    public function test_registration_fails_with_invalid_data(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'fullname' => '',
            'email'    => 'not-an-email',
            'password' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    // ── Login ──

    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email'    => 'login@test.com',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'login@test.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['id', 'fullname'], 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'wrong@test.com',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'wrong@test.com',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'VALIDATION_ERROR');
    }

    // ── Authenticated Access ──

    public function test_authenticated_user_can_access_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJsonPath('code', 'UNAUTHENTICATED');
    }

    // ── Encrypted Medical History ──

    public function test_medical_history_is_accessible_after_encryption(): void
    {
        $user = User::factory()->create();

        $user->update(['medical_history' => 'Diabetes, Hypertension']);

        $user->refresh();
        $this->assertEquals('Diabetes, Hypertension', $user->medical_history);
    }
}
