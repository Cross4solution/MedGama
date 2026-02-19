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
            'slot_date'        => now()->addDays(rand(1, 30))->toDateString(),
            'start_time'       => fake()->time('H:i'),
            'duration_minutes' => 30,
            'is_available'     => true,
            'is_active'        => true,
        ];
    }
}
