<?php

namespace Database\Factories;

use App\Models\ChatConversation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChatConversationFactory extends Factory
{
    protected $model = ChatConversation::class;

    public function definition(): array
    {
        return [
            'is_active' => true,
        ];
    }
}
