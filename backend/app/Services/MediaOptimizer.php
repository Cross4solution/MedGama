<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaOptimizer
{
    // Image size variants
    const VARIANTS = [
        'thumb'    => ['width' => 400,  'height' => 400,  'quality' => 75],
        'medium'   => ['width' => 1200, 'height' => 1200, 'quality' => 80],
        'original' => ['width' => 2048, 'height' => 2048, 'quality' => 85],
    ];

    // Max video duration (seconds) for auto-processing
    const MAX_VIDEO_DURATION = 600; // 10 min

    /**
     * Process and optimize an uploaded image.
     * Creates thumb, medium, original variants.
     * Returns array of variant URLs.
     */
    public static function processImage(UploadedFile $file, string $folder = 'medstream/photos'): array
    {
        $id = Str::uuid()->toString();
        $ext = 'webp'; // Convert all to WebP for best compression
        $results = [];

        foreach (self::VARIANTS as $variant => $config) {
            $filename = "{$id}_{$variant}.{$ext}";
            $path = "{$folder}/{$filename}";

            try {
                // Use GD to resize and convert to WebP
                $image = self::loadImage($file->getRealPath(), $file->getMimeType());
                if (!$image) {
                    // Fallback: store original without processing
                    $rawPath = $file->store($folder, 'public');
                    $url = asset('storage/' . $rawPath);
                    return [
                        'id'       => $id,
                        'original' => $url,
                        'medium'   => $url,
                        'thumb'    => $url,
                        'type'     => 'image',
                        'name'     => $file->getClientOriginalName(),
                    ];
                }

                $srcW = imagesx($image);
                $srcH = imagesy($image);

                // Calculate new dimensions maintaining aspect ratio
                $maxW = $config['width'];
                $maxH = $config['height'];
                $ratio = min($maxW / $srcW, $maxH / $srcH, 1); // Never upscale
                $newW = (int) round($srcW * $ratio);
                $newH = (int) round($srcH * $ratio);

                // Resize
                $resized = imagecreatetruecolor($newW, $newH);
                // Preserve transparency for WebP
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                imagecopyresampled($resized, $image, 0, 0, 0, 0, $newW, $newH, $srcW, $srcH);

                // Save to temp file
                $tmpPath = sys_get_temp_dir() . '/' . $filename;
                imagewebp($resized, $tmpPath, $config['quality']);
                imagedestroy($resized);

                // Store to disk
                Storage::disk('public')->put($path, file_get_contents($tmpPath));
                @unlink($tmpPath);

                $results[$variant] = asset('storage/' . $path);
            } catch (\Throwable $e) {
                \Log::warning("MediaOptimizer: Failed to process {$variant} variant", ['error' => $e->getMessage()]);
                // Fallback: store original
                if (empty($results)) {
                    $rawPath = $file->store($folder, 'public');
                    $url = asset('storage/' . $rawPath);
                    $results[$variant] = $url;
                }
            }
        }

        // Cleanup source GD resource
        if (isset($image) && is_resource($image)) {
            imagedestroy($image);
        }

        return [
            'id'       => $id,
            'original' => $results['original'] ?? ($results['medium'] ?? array_values($results)[0] ?? ''),
            'medium'   => $results['medium'] ?? ($results['original'] ?? ''),
            'thumb'    => $results['thumb'] ?? ($results['medium'] ?? ''),
            'type'     => 'image',
            'name'     => $file->getClientOriginalName(),
            'size'     => $file->getSize(),
        ];
    }

    /**
     * Process an uploaded video.
     * If FFmpeg is available: compress + extract thumbnail.
     * Otherwise: store as-is with no thumbnail.
     */
    public static function processVideo(UploadedFile $file, string $folder = 'medstream/videos'): array
    {
        $id = Str::uuid()->toString();
        $ext = $file->getClientOriginalExtension() ?: 'mp4';
        $filename = "{$id}.{$ext}";
        $path = "{$folder}/{$filename}";

        // Store original first
        $file->storeAs($folder, $filename, 'public');
        $storedPath = Storage::disk('public')->path($path);
        $url = asset('storage/' . $path);

        $result = [
            'id'        => $id,
            'original'  => $url,
            'thumb'     => null,
            'type'      => 'video',
            'name'      => $file->getClientOriginalName(),
            'size'      => $file->getSize(),
        ];

        // Try FFmpeg compression + thumbnail
        $ffmpeg = self::findFFmpeg();
        if ($ffmpeg && file_exists($storedPath)) {
            try {
                // Extract thumbnail at 1 second
                $thumbFilename = "{$id}_thumb.jpg";
                $thumbPath = "{$folder}/{$thumbFilename}";
                $thumbFullPath = Storage::disk('public')->path($thumbPath);

                $cmd = escapeshellcmd($ffmpeg) . ' -i ' . escapeshellarg($storedPath)
                    . ' -ss 00:00:01 -vframes 1 -vf scale=400:-1 -q:v 8 '
                    . escapeshellarg($thumbFullPath) . ' -y 2>&1';
                exec($cmd, $output, $returnCode);

                if ($returnCode === 0 && file_exists($thumbFullPath)) {
                    $result['thumb'] = asset('storage/' . $thumbPath);
                }

                // Compress video if larger than 20MB
                if ($file->getSize() > 20 * 1024 * 1024) {
                    $compressedFilename = "{$id}_compressed.mp4";
                    $compressedPath = "{$folder}/{$compressedFilename}";
                    $compressedFullPath = Storage::disk('public')->path($compressedPath);

                    $cmd = escapeshellcmd($ffmpeg) . ' -i ' . escapeshellarg($storedPath)
                        . ' -vcodec libx264 -crf 28 -preset fast -vf scale=1280:-2'
                        . ' -acodec aac -b:a 128k -movflags +faststart'
                        . ' ' . escapeshellarg($compressedFullPath) . ' -y 2>&1';
                    exec($cmd, $output2, $returnCode2);

                    if ($returnCode2 === 0 && file_exists($compressedFullPath)) {
                        // Use compressed version if smaller
                        $compressedSize = filesize($compressedFullPath);
                        if ($compressedSize < $file->getSize()) {
                            $result['original'] = asset('storage/' . $compressedPath);
                            $result['size'] = $compressedSize;
                            // Optionally delete the uncompressed original
                            Storage::disk('public')->delete($path);
                        } else {
                            @unlink($compressedFullPath);
                        }
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning("MediaOptimizer: FFmpeg processing failed", ['error' => $e->getMessage()]);
            }
        }

        return $result;
    }

    /**
     * Process an uploaded document (PDF, Word, Excel, PPT).
     * No optimization — just store and return metadata.
     */
    public static function processDocument(UploadedFile $file, string $folder = 'medstream/papers'): array
    {
        $id = Str::uuid()->toString();
        $ext = $file->getClientOriginalExtension() ?: 'pdf';
        $filename = "{$id}.{$ext}";
        $file->storeAs($folder, $filename, 'public');

        return [
            'id'       => $id,
            'original' => asset('storage/' . "{$folder}/{$filename}"),
            'thumb'    => null,
            'type'     => 'document',
            'name'     => $file->getClientOriginalName(),
            'size'     => $file->getSize(),
            'ext'      => strtolower($ext),
        ];
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

    /**
     * Find FFmpeg binary path.
     */
    private static function findFFmpeg(): ?string
    {
        foreach (['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', 'ffmpeg'] as $path) {
            $check = trim(shell_exec("which {$path} 2>/dev/null") ?? '');
            if ($check && file_exists($check)) return $check;
        }
        // Try direct execution
        exec('ffmpeg -version 2>&1', $output, $code);
        return $code === 0 ? 'ffmpeg' : null;
    }
}
