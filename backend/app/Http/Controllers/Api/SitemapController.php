<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use App\Models\DoctorProfile;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * GET /sitemap.xml — Auto-generated sitemap
     * Cached for 1 hour.
     */
    public function index()
    {
        $xml = Cache::remember('sitemap_xml', 3600, function () {
            return $this->buildSitemap();
        });

        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    private function buildSitemap(): string
    {
        $baseUrl = rtrim(config('app.frontend_url', 'https://medagama.com'), '/');
        $now = now()->toW3cString();

        $urls = [];

        // ── Static pages ──
        $staticPages = [
            ['loc' => '/',                'priority' => '1.0', 'changefreq' => 'daily'],
            ['loc' => '/about',           'priority' => '0.7', 'changefreq' => 'monthly'],
            ['loc' => '/for-patients',    'priority' => '0.7', 'changefreq' => 'monthly'],
            ['loc' => '/for-clinics',     'priority' => '0.7', 'changefreq' => 'monthly'],
            ['loc' => '/vasco-ai',        'priority' => '0.6', 'changefreq' => 'monthly'],
            ['loc' => '/contact',         'priority' => '0.5', 'changefreq' => 'monthly'],
            ['loc' => '/search',          'priority' => '0.8', 'changefreq' => 'daily'],
            ['loc' => '/explore',         'priority' => '0.8', 'changefreq' => 'daily'],
            ['loc' => '/privacy-policy',  'priority' => '0.3', 'changefreq' => 'yearly'],
            ['loc' => '/terms',           'priority' => '0.3', 'changefreq' => 'yearly'],
            ['loc' => '/cookie-policy',   'priority' => '0.3', 'changefreq' => 'yearly'],
        ];

        foreach ($staticPages as $page) {
            $urls[] = $this->urlEntry(
                $baseUrl . $page['loc'],
                $now,
                $page['changefreq'],
                $page['priority']
            );
        }

        // ── Doctor profiles ──
        // "is_suspended" diye bir sütun YOK — ne göçlerde ne modelde; kodda
        // yalnızca burada geçiyordu. Bu yüzden /sitemap.xml canlıda her
        // istekte SQL hatası verip 500 dönüyordu. Doğru süzgeç is_active:
        // hesabını silen kullanıcı is_active=false oluyor ve haritada
        // kalmamalı.
        $doctors = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->whereNotNull('fullname')
            ->select('id', 'updated_at')
            ->limit(5000)
            ->get();

        foreach ($doctors as $doc) {
            $urls[] = $this->urlEntry(
                $baseUrl . '/doctor/' . $doc->id,
                $doc->updated_at?->toW3cString() ?? $now,
                'weekly',
                '0.9'
            );
        }

        // ── Clinic profiles ──
        // Klinikler users tablosundan çekiliyordu ve oradan "codename"
        // seçiliyordu — o sütun users'ta YOK, clinics'te var. İkinci bir
        // hayalet sütun; uç zaten çalışmadığı için fark edilmemiş.
        // Doğrusu doğrudan clinics tablosu.
        $clinics = Clinic::where('is_active', true)
            ->whereNotNull('codename')
            ->select('id', 'codename', 'updated_at')
            ->limit(5000)
            ->get();

        foreach ($clinics as $clinic) {
            $slug = $clinic->codename ?: $clinic->id;
            $urls[] = $this->urlEntry(
                $baseUrl . '/clinic/' . $slug,
                $clinic->updated_at?->toW3cString() ?? $now,
                'weekly',
                '0.8'
            );
        }

        // ── Build XML ──
        $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        $xml .= implode("\n", $urls);
        $xml .= "\n</urlset>";

        return $xml;
    }

    private function urlEntry(string $loc, string $lastmod, string $changefreq, string $priority): string
    {
        return "  <url>\n"
            . "    <loc>{$loc}</loc>\n"
            . "    <lastmod>{$lastmod}</lastmod>\n"
            . "    <changefreq>{$changefreq}</changefreq>\n"
            . "    <priority>{$priority}</priority>\n"
            . "  </url>";
    }
}
