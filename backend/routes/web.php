<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// ── SEO: Dynamic sitemap ──
Route::get('/sitemap.xml', [\App\Http\Controllers\Api\SitemapController::class, 'index'])
    ->middleware('cache.headers:static');

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
// Not: init-db'nin buradaki kopyası kaldırıldı. Şema onarımı tek yerden
// yapılır (routes/api.php). Bu kopya hata durumunda yığın izini dışarı
// veriyordu ve ikinci bir bakım noktası yaratıyordu.
