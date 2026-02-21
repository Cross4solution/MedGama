<?php

namespace Database\Factories;

use App\Models\CalendarSlot;
use Illuminate\Database\Eloquent\Factories\Factory;

class CalendarSlotFactory extends Factory
{
    protected $model = CalendarSlot::class;

    public function definition(): array
    {
        return [
            'slot_date'        => now()->addDays(fake()->unique()->numberBetween(1, 3650))->toDateString(),
            'start_time'       => sprintf('%02d:%02d', fake()->numberBetween(8, 17), fake()->randomElement([0, 15, 30, 45])),
            'duration_minutes' => 30,
            'is_available'     => true,
            'is_active'        => true,
        ];
    }
}
