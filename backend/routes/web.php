<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    return view('welcome');
});

// Health check for Railway / load balancers
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $dbOk = true;
    } catch (\Throwable $e) {
        $dbOk = false;
    }
    return response()->json([
        'status' => $dbOk ? 'healthy' : 'degraded',
        'app'    => config('app.name'),
        'db'     => $dbOk ? 'connected' : 'disconnected',
        'time'   => now()->toIso8601String(),
    ], $dbOk ? 200 : 503);
});
