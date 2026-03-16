<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Centralised image optimisation service.
 *
 * Converts uploaded images to WebP, generates size variants,
 * and returns public-relative URLs (/storage/…).
 */
class ImageService
{
    // ── Avatar variants ──
    const AVATAR_VARIANTS = [
        'thumb'    => ['width' => 128,  'height' => 128,  'quality' => 80],
        'medium'   => ['width' => 400,  'height' => 400,  'quality' => 82],
        'original' => ['width' => 800,  'height' => 800,  'quality' => 85],
    ];

    // ── Gallery variants ──
    const GALLERY_VARIANTS = [
        'thumb'    => ['width' => 400,  'height' => 400,  'quality' => 75],
        'medium'   => ['width' => 1200, 'height' => 1200, 'quality' => 80],
        'original' => ['width' => 2048, 'height' => 2048, 'quality' => 85],
    ];

    /**
     * Optimise an avatar upload → WebP with 3 variants.
     * Returns the "medium" variant URL (best for display) and stores all three.
     *
     * @return array{url: string, variants: array}
     */
    public static function optimiseAvatar(UploadedFile $file, string $folder = 'avatars'): array
    {
        return self::processVariants($file, $folder, self::AVATAR_VARIANTS);
    }

    /**
     * Optimise a single gallery image → WebP with 3 variants.
     *
     * @return array{url: string, variants: array}
     */
    public static function optimiseGalleryImage(UploadedFile $file, string $folder = 'doctor-gallery'): array
    {
        return self::processVariants($file, $folder, self::GALLERY_VARIANTS);
    }

    /**
     * Core: resize + convert to WebP for each variant.
     */
    private static function processVariants(UploadedFile $file, string $folder, array $variants): array
    {
        $id = Str::uuid()->toString();
        $results = [];

        foreach ($variants as $variant => $config) {
            $filename = "{$id}_{$variant}.webp";
            $path = "{$folder}/{$filename}";

            try {
                $image = self::loadImage($file->getRealPath(), $file->getMimeType());

                if (!$image) {
                    // GD unavailable or unsupported format → store as-is
                    $rawPath = $file->store($folder, 'public');
                    $url = '/storage/' . $rawPath;
                    return ['url' => $url, 'variants' => ['original' => $url, 'medium' => $url, 'thumb' => $url]];
                }

                $srcW = imagesx($image);
                $srcH = imagesy($image);

                $maxW = $config['width'];
                $maxH = $config['height'];
                $ratio = min($maxW / $srcW, $maxH / $srcH, 1);
                $newW = (int) round($srcW * $ratio);
                $newH = (int) round($srcH * $ratio);

                $resized = imagecreatetruecolor($newW, $newH);
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                imagecopyresampled($resized, $image, 0, 0, 0, 0, $newW, $newH, $srcW, $srcH);

                $tmpPath = sys_get_temp_dir() . '/' . $filename;
                imagewebp($resized, $tmpPath, $config['quality']);
                imagedestroy($resized);

                Storage::disk('public')->put($path, file_get_contents($tmpPath));
                @unlink($tmpPath);

                $results[$variant] = '/storage/' . $path;
            } catch (\Throwable $e) {
                \Log::warning("ImageService: variant {$variant} failed", ['error' => $e->getMessage()]);
                if (empty($results)) {
                    $rawPath = $file->store($folder, 'public');
                    $url = '/storage/' . $rawPath;
                    return ['url' => $url, 'variants' => ['original' => $url, 'medium' => $url, 'thumb' => $url]];
                }
            }
        }

        if (isset($image) && (is_resource($image) || $image instanceof \GdImage)) {
            imagedestroy($image);
        }

        // Use medium as default display URL
        $url = $results['medium'] ?? $results['original'] ?? array_values($results)[0] ?? '';

        return ['url' => $url, 'variants' => $results];
    }

    /**
     * Load image from file path using GD.
     */
    private static function loadImage(string $path, string $mime)
    {
        return match (true) {
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => @imagecreatefromjpeg($path),
            str_contains($mime, 'png')  => @imagecreatefrompng($path),
            str_contains($mime, 'gif')  => @imagecreatefromgif($path),
            str_contains($mime, 'webp') => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
            str_contains($mime, 'bmp')  => function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($path) : null,
            default => null,
        };
    }
}
