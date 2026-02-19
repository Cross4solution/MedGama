<?php

namespace App\Jobs;

use App\Models\MedStreamPost;
use App\Services\MediaOptimizer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessMedStreamVideo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Retry up to 3 times, with 60s delay between attempts.
     */
    public int $tries = 3;
    public int $backoff = 60;

    /**
     * @param string $postId       The post to update after processing
     * @param string $tempPath     Absolute path to the temp video file
     * @param string $originalName Original client filename
     * @param int    $fileSize     Original file size in bytes
     * @param int    $mediaIndex   Index in the post's media JSON array
     */
    public function __construct(
        public string $postId,
        public string $tempPath,
        public string $originalName,
        public int    $fileSize,
        public int    $mediaIndex = 0,
    ) {}

    public function handle(): void
    {
        $post = MedStreamPost::withoutGlobalScopes()->find($this->postId);
        if (!$post) {
            $this->cleanup();
            return;
        }

        if (!file_exists($this->tempPath)) {
            \Log::warning('ProcessMedStreamVideo: temp file missing', ['path' => $this->tempPath, 'post_id' => $this->postId]);
            $this->markFailed($post);
            return;
        }

        try {
            $result = MediaOptimizer::processVideoFromPath(
                $this->tempPath,
                $this->originalName,
                $this->fileSize,
            );

            // Update the post's media array with the processed result
            $media = $post->media ?? [];
            $media[$this->mediaIndex] = array_merge($media[$this->mediaIndex] ?? [], $result, ['status' => 'ready']);
            $post->media = $media;

            // Set media_url if not yet set
            if (!$post->media_url) {
                $post->media_url = $result['thumb'] ?? $result['original'];
            }

            // Mark post as published (no longer processing)
            $post->media_processing = false;
            $post->save();
        } catch (\Throwable $e) {
            \Log::error('ProcessMedStreamVideo failed', [
                'post_id' => $this->postId,
                'error'   => $e->getMessage(),
            ]);
            $this->markFailed($post);
        } finally {
            $this->cleanup();
        }
    }

    /**
     * Mark post media as failed if processing errors out permanently.
     */
    public function failed(?\Throwable $exception): void
    {
        $post = MedStreamPost::withoutGlobalScopes()->find($this->postId);
        if ($post) {
            $this->markFailed($post);
        }
        $this->cleanup();
    }

    private function markFailed(MedStreamPost $post): void
    {
        $media = $post->media ?? [];
        if (isset($media[$this->mediaIndex])) {
            $media[$this->mediaIndex]['status'] = 'failed';
            $post->media = $media;
        }
        $post->media_processing = false;
        $post->save();
    }

    private function cleanup(): void
    {
        if (file_exists($this->tempPath)) {
            @unlink($this->tempPath);
        }
    }
}
