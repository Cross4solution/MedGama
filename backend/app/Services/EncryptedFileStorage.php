<?php

namespace App\Services;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Hasta belgelerinin diskte ŞİFRELİ saklanması (KVKK/GDPR/HIPAA at-rest).
 *
 * Dosya içeriği APP_KEY ile AES-256 şifrelenip yazılır; diske erişen (yedek,
 * disk imajı, yanlış yapılandırılmış paylaşım) biri anahtar olmadan okuyamaz.
 * İçeriğin başına sürüm işareti konur → ileride anahtar döndürme/format değişimi
 * mümkün, ayrıca şifresiz eski dosyalar sorunsuz okunmaya devam eder.
 */
class EncryptedFileStorage
{
    /** Şifreli içeriğin başındaki işaret. */
    private const MARKER = "MGENC1\n";

    private const DISK = 'local';

    /** Yüklenen dosyayı şifreleyip kaydeder, göreli yolu döner. */
    public function storeUploaded(UploadedFile $file, string $directory): string
    {
        $ext = $file->getClientOriginalExtension() ?: 'bin';
        $path = rtrim($directory, '/') . '/' . Str::uuid() . '.' . $ext;

        $plain = file_get_contents($file->getRealPath());
        if ($plain === false) {
            throw new \RuntimeException('Uploaded file could not be read.');
        }

        Storage::disk(self::DISK)->put($path, self::MARKER . Crypt::encryptString($plain));

        return $path;
    }

    /** Ham içeriği (ör. GD ile üretilmiş görsel) şifreleyip verilen yola yazar. */
    public function putContents(string $path, string $contents): string
    {
        Storage::disk(self::DISK)->put($path, self::MARKER . Crypt::encryptString($contents));

        return $path;
    }

    /**
     * Dosyayı çözülmüş halde döner.
     * Şifresiz (eski/demo) dosyalar olduğu gibi döner — okuma bozulmaz.
     */
    public function read(string $path): ?string
    {
        $disk = Storage::disk(self::DISK);
        $raw = null;

        if ($disk->exists($path)) {
            $raw = $disk->get($path);
        } elseif (Storage::disk('public')->exists($path)) {
            // Eski mesaj ekleri public diskteydi; okuma bozulmasın (demo verisi).
            $raw = Storage::disk('public')->get($path);
        }

        if ($raw === null || $raw === '') {
            return null;
        }

        if (!str_starts_with($raw, self::MARKER)) {
            return $raw; // şifresiz eski dosya
        }

        try {
            return Crypt::decryptString(substr($raw, strlen(self::MARKER)));
        } catch (DecryptException) {
            return null; // anahtar uyuşmuyor / bozuk
        }
    }

    public function exists(string $path): bool
    {
        return Storage::disk(self::DISK)->exists($path)
            || Storage::disk('public')->exists($path);
    }

    public function delete(string $path): void
    {
        Storage::disk(self::DISK)->delete($path);
    }

    /** Çözülmüş içeriği indirme yanıtı olarak döner. */
    public function downloadResponse(string $path, string $filename, ?string $mime = null)
    {
        $content = $this->read($path);
        if ($content === null) {
            abort(404, 'File not found.');
        }

        return response($content, 200, array_filter([
            'Content-Type'        => $mime ?: 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . addslashes($filename) . '"',
            'Content-Length'      => (string) strlen($content),
            // Şifre çözülmüş sağlık verisi ara katmanlarda önbelleğe alınmasın
            'Cache-Control'       => 'no-store, private',
        ]));
    }
}
