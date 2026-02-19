<?php

namespace Database\Factories;

use App\Models\MedStreamPost;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedStreamPostFactory extends Factory
{
    protected $model = MedStreamPost::class;

    public function definition(): array
    {
        return [
            'post_type'  => fake()->randomElement(['text', 'image', 'video']),
            'content'    => fake()->paragraphs(2, true),
            'is_hidden'  => false,
            'is_active'  => true,
        ];
    }
}
