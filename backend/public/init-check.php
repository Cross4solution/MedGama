<?php
/**
 * Raw PHP init-db — bypasses Laravel routing entirely.
 * If this works but /api/system/init-db doesn't, the issue is Laravel routing.
 * If this also 404s, the issue is nginx → PHP-FPM pipeline.
 *
 * URL: https://medgama-production.up.railway.app/init-check.php?key=MedaGama2026SecretInit
 */

header('Content-Type: application/json');

if (($_GET['key'] ?? '') !== 'MedaGama2026SecretInit') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized.']);
    exit;
}

$action = $_GET['action'] ?? 'info';

if ($action === 'info') {
    echo json_encode([
        'status'    => 'ok',
        'php'       => PHP_VERSION,
        'server'    => php_sapi_name(),
        'cwd'       => getcwd(),
        'doc_root'  => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
        'index_exists' => file_exists(__DIR__ . '/index.php'),
        'routes_cache_exists' => file_exists(__DIR__ . '/../bootstrap/cache/routes-v7.php'),
        'config_cache_exists' => file_exists(__DIR__ . '/../bootstrap/cache/config.php'),
        'env_exists' => file_exists(__DIR__ . '/../.env'),
        'vendor_exists' => is_dir(__DIR__ . '/../vendor'),
        'time'      => date('c'),
    ]);
    exit;
}

if ($action === 'seed') {
    // Bootstrap Laravel
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $seedOutput = \Illuminate\Support\Facades\Artisan::output();

        echo json_encode([
            'status'         => 'success',
            'message'        => 'Database migrated and seeded.',
            'migrate_output' => $migrateOutput,
            'seed_output'    => $seedOutput,
        ]);
    } catch (\Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'status'  => 'error',
            'message' => $e->getMessage(),
            'file'    => $e->getFile() . ':' . $e->getLine(),
        ]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Unknown action. Use ?action=info or ?action=seed']);
