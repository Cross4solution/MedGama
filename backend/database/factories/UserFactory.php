<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'fullname'       => fake()->name(),
            'email'          => fake()->unique()->safeEmail(),
            'password'       => static::$password ??= Hash::make('password'),
            'role_id'        => 'patient',
            'mobile'         => fake()->phoneNumber(),
            'email_verified' => true,
            'is_verified'    => true,
            'is_active'      => true,
        ];
    }

    public function patient(): static
    {
        return $this->state(['role_id' => 'patient']);
    }

    public function doctor(): static
    {
        return $this->state(['role_id' => 'doctor']);
    }

    public function clinicOwner(): static
    {
        return $this->state(['role_id' => 'clinicOwner']);
    }

    public function admin(): static
    {
        return $this->state(['role_id' => 'superAdmin']);
    }
}
