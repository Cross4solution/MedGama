<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaStreamController extends Controller
{
    /**
     * Stream a media file with Range request support (HTTP 206 Partial Content).
     * This enables video seeking in browsers even when the web server
     * (e.g. php artisan serve) does not natively support Range requests.
     *
     * GET /api/media/stream/{path}
     * where {path} is the storage-relative path, e.g. medstream/videos/uuid.mp4
     */
    public function stream(Request $request, string $path)
    {
        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            abort(404, 'File not found');
        }

        $fullPath = $disk->path($path);
        $fileSize = filesize($fullPath);
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

        $start = 0;
        $end = $fileSize - 1;
        $statusCode = 200;
        $headers = [
            'Content-Type'   => $mimeType,
            'Accept-Ranges'  => 'bytes',
            'Cache-Control'  => 'public, max-age=86400',
            'Content-Disposition' => 'inline',
        ];

        // Handle Range request
        $rangeHeader = $request->header('Range');
        if ($rangeHeader) {
            $statusCode = 206;

            // Parse "bytes=start-end"
            if (preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches)) {
                $start = intval($matches[1]);
                if (!empty($matches[2])) {
                    $end = intval($matches[2]);
                }
            }

            // Validate range
            if ($start > $end || $start >= $fileSize) {
                return response('', 416, [
                    'Content-Range' => "bytes */{$fileSize}",
                ]);
            }

            $end = min($end, $fileSize - 1);
            $length = $end - $start + 1;

            $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
            $headers['Content-Length'] = $length;
        } else {
            $headers['Content-Length'] = $fileSize;
        }

        $response = new StreamedResponse(function () use ($fullPath, $start, $end) {
            $handle = fopen($fullPath, 'rb');
            if ($handle === false) {
                return;
            }

            fseek($handle, $start);
            $remaining = $end - $start + 1;
            $bufferSize = 8192;

            while ($remaining > 0 && !feof($handle)) {
                $read = min($bufferSize, $remaining);
                $data = fread($handle, $read);
                if ($data === false) {
                    break;
                }
                echo $data;
                $remaining -= strlen($data);
                flush();
            }

            fclose($handle);
        }, $statusCode, $headers);

        return $response;
    }
}
