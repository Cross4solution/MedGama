<?php

namespace Database\Factories;

use App\Models\PatientRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

class PatientRecordFactory extends Factory
{
    protected $model = PatientRecord::class;

    public function definition(): array
    {
        return [
            'file_url'    => fake()->url(),
            'upload_date' => now()->toDateString(),
            'record_type' => fake()->randomElement(['labResult', 'report', 'scan', 'other']),
            'description' => fake()->sentence(),
            'is_active'   => true,
        ];
    }
}
