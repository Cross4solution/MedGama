<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Health check for Railway / load balancers — NO DB dependency
Route::get('/health', function () {
    return response('ok', 200)->header('Content-Type', 'text/plain');
});

// ── Debug: Prove Laravel routing works ──
Route::get('/ping', function () {
    return response()->json([
        'status' => 'ok',
        'laravel' => app()->version(),
        'time'    => now()->toIso8601String(),
        'php'     => PHP_VERSION,
    ]);
});

// ╔══════════════════════════════════════════════════════════════════╗
// ║  MIRROR of init-db in web.php (NO /api prefix)                  ║
// ║  URL: GET /system/init-db?key=MedaGama2026SecretInit            ║
// ╚══════════════════════════════════════════════════════════════════╝
Route::match(['get', 'post'], '/system/init-db', function (\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'MedaGama2026SecretInit') {
        return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
    }
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $seedOutput = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'status'         => 'success',
            'message'        => 'Database migrated and seeded.',
            'migrate_output' => $migrateOutput,
            'seed_output'    => $seedOutput,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status'  => 'error',
            'message' => $e->getMessage(),
            'trace'   => $e->getTraceAsString(),
        ], 500);
    }
});
