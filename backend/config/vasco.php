<?php

/**
 * Vasco — semptomdan uzmanlığa yönlendiren yardımcı.
 *
 * Model kendi sunucumuza taşınana kadar dış bir uçla konuşuyor.
 */
return [
    'llm' => [
        'base'  => env('VASCO_LLM_BASE', 'https://generativelanguage.googleapis.com/v1beta/openai'),
        'key'   => env('VASCO_LLM_KEY'),
        'model' => env('VASCO_LLM_MODEL', 'gemini-2.5-flash-lite'),
    ],
];
