<?php

namespace Database\Factories;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClinicFactory extends Factory
{
    protected $model = Clinic::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->company(),
            'codename'    => fake()->unique()->slug(2),
            'fullname'    => fake()->company() . ' Clinic',
            'owner_id'    => User::factory()->clinicOwner(),
            'is_verified' => true,
            'is_active'   => true,
        ];
    }
}
