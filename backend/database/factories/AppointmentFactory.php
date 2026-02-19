<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        return [
            'appointment_type' => fake()->randomElement(['inPerson', 'online']),
            'appointment_date' => now()->addDays(rand(1, 30))->toDateString(),
            'appointment_time' => fake()->time('H:i'),
            'status'           => 'pending',
            'is_active'        => true,
            'created_by'       => User::factory(),
        ];
    }

    public function confirmed(): static
    {
        return $this->state(['status' => 'confirmed']);
    }

    public function completed(): static
    {
        return $this->state(['status' => 'completed']);
    }
}
