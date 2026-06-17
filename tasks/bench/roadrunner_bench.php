<?php
/**
 * RoadRunner/Octane (kalıcı worker) vs php-fpm (her istekte boot) — kontrollü benchmark.
 *
 * Mekanik:
 *  - php-fpm: HER istekte Laravel framework'ü yeniden bootstrap eder (env+config+provider'lar).
 *  - Octane/RoadRunner: bootstrap'ı BİR kez yapar, worker'da N istek boyunca yeniden kullanır.
 *
 * Bu script ikisini de aynı makinede ÖLÇER. Aynı interpreter + opcache + autoload paylaşılır,
 * böylece tek değişken "framework boot tekrarı" olur — net ve adil.
 *
 * Kullanım: php tasks/bench/roadrunner_bench.php [istek_sayısı]
 */

$ROOT = __DIR__ . '/../..';
$REQUESTS = isset($argv[1]) ? max(20, (int)$argv[1]) : 200;

require $ROOT . '/backend/vendor/autoload.php';

// Gerçek Laravel framework bootstrap'ı (env + config + service provider register/boot).
// fpm bunu HER istekte yapar; octane bir kez.
function bootLaravel($ROOT) {
    $app = require $ROOT . '/backend/bootstrap/app.php';   // taze Application
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();                                  // env+config+providers (ağır kısım)
    return $app;
}

// Temsili "istek işleme" işi: container'dan çözümleme + hafif CPU (her iki modda AYNI).
function handleRequest($app) {
    // container resolve (gerçek istekte olur)
    $app->make('config')->get('app.name');
    // hafif deterministik CPU (route eşleştirme + serialization temsili)
    $s = 0;
    for ($i = 0; $i < 2000; $i++) { $s += ($i * 7) % 13; }
    return $s;
}

function pct($arr, $p) {
    sort($arr);
    $idx = (int)floor(($p / 100) * (count($arr) - 1));
    return $arr[$idx];
}

// --- Önce tek seferlik boot maliyetini ölç ---
$bootStart = hrtime(true);
try {
    $app = bootLaravel($ROOT);
} catch (Throwable $e) {
    fwrite(STDERR, "BOOT_ERROR: " . $e->getMessage() . "\n");
    exit(2);
}
$bootMs = (hrtime(true) - $bootStart) / 1e6;

// Tek istek işleme maliyeti (warm)
$h0 = hrtime(true);
handleRequest($app);
$handleMs = (hrtime(true) - $h0) / 1e6;

// ============ MOD 1: php-fpm (her istekte yeniden boot + handle) ============
$fpmLat = [];
$fpmStart = hrtime(true);
for ($r = 0; $r < $REQUESTS; $r++) {
    $t = hrtime(true);
    $a = bootLaravel($ROOT);   // her istekte yeniden bootstrap (fpm gerçekliği)
    handleRequest($a);
    $fpmLat[] = (hrtime(true) - $t) / 1e6;
    unset($a);
}
$fpmTotal = (hrtime(true) - $fpmStart) / 1e6;

// ============ MOD 2: Octane/RoadRunner (bir kez boot, N handle) ============
$ocLat = [];
$ocBoot0 = hrtime(true);
$persistApp = bootLaravel($ROOT);          // worker başında BİR kez
$ocBootMs = (hrtime(true) - $ocBoot0) / 1e6;
$ocStart = hrtime(true);
for ($r = 0; $r < $REQUESTS; $r++) {
    $t = hrtime(true);
    handleRequest($persistApp);            // reuse — boot YOK
    $ocLat[] = (hrtime(true) - $t) / 1e6;
}
$ocHandleTotal = (hrtime(true) - $ocStart) / 1e6;
$ocTotal = $ocBootMs + $ocHandleTotal;     // worker ömründe amortize

// --- Sonuçlar ---
$fpmAvg = array_sum($fpmLat) / count($fpmLat);
$ocAvg  = array_sum($ocLat) / count($ocLat);
$fpmRps = 1000.0 / $fpmAvg;
$ocRps  = 1000.0 / $ocAvg;

$out = [
    'php_version'       => PHP_VERSION,
    'opcache'          => function_exists('opcache_get_status') ? 'on' : 'off',
    'requests'         => $REQUESTS,
    'boot_ms_single'   => round($bootMs, 2),
    'handle_ms_single' => round($handleMs, 3),
    'fpm' => [
        'avg_latency_ms' => round($fpmAvg, 2),
        'p50_ms'         => round(pct($fpmLat, 50), 2),
        'p99_ms'         => round(pct($fpmLat, 99), 2),
        'req_per_sec'    => round($fpmRps, 1),
        'total_ms'       => round($fpmTotal, 1),
    ],
    'octane_roadrunner' => [
        'avg_latency_ms' => round($ocAvg, 3),
        'p50_ms'         => round(pct($ocLat, 50), 3),
        'p99_ms'         => round(pct($ocLat, 99), 3),
        'req_per_sec'    => round($ocRps, 1),
        'total_ms'       => round($ocTotal, 1),
    ],
    'gains' => [
        'latency_reduction_pct' => round((1 - $ocAvg / $fpmAvg) * 100, 1),
        'throughput_multiplier' => round($ocRps / $fpmRps, 1),
    ],
];

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
