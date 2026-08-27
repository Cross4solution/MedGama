<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator;

/**
 * Canlıda süper yönetici hesabı açar (ya da var olanın şifresini yeniler).
 *
 * Neden ayrı bir komut:
 *
 * Tohumlamadaki `admin@medagama.com / Password123!` hesabı `DatabaseSeeder`
 * içinde duruyor ve canlı dağıtım onu ÇALIŞTIRMIYOR — kapsayıcı yalnız
 * `VitrinSeeder`'ı koşuyor. Yani canlıda yönetici hesabı kendiliğinden
 * oluşmuyor; birinin elle açması gerekiyor.
 *
 * Tam tohumlamayı canlıda koşmak da çözüm değil: demo hastaları, demo
 * hekimleri ve herkesçe bilinen bir şifreyi üretim veritabanına yazar.
 *
 * Şifre KOMUT SATIRINDA GEÇMİYOR. Gizli olarak soruluyor; böylece kabuk
 * geçmişine, Render'ın komut günlüğüne ve süreç listesine düşmüyor.
 *
 * Kullanım (Render → Shell):
 *
 *   php artisan yonetici:olustur ornek@alanadi.com
 */
class YoneticiOlustur extends Command
{
    protected $signature = 'yonetici:olustur
                            {eposta : Yöneticinin e-posta adresi}
                            {--ad= : Görünen ad (varsayılan: e-postanın baş kısmı)}
                            {--salt-okunur : Yalnız görüntüleyebilen hesap (tanıtım için)}';

    protected $description = 'Süper yönetici hesabı açar veya var olanın şifresini yeniler';

    public function handle(): int
    {
        $eposta = trim((string) $this->argument('eposta'));

        if (!filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
            $this->error("Geçersiz e-posta: {$eposta}");

            return self::FAILURE;
        }

        $sifre = (string) $this->secret('Şifre (ekranda görünmez)');
        $tekrar = (string) $this->secret('Şifre (tekrar)');

        if ($sifre !== $tekrar) {
            $this->error('Şifreler aynı değil.');

            return self::FAILURE;
        }

        // Kayıt akışıyla aynı ölçüt: canlıya zayıf bir yönetici şifresi
        // koymak, hesabı hiç açmamaktan daha kötü.
        $dogrulama = Validator::make(
            ['sifre' => $sifre],
            ['sifre' => ['required', Password::min(8)->letters()->mixedCase()->numbers()->symbols()]],
        );

        if ($dogrulama->fails()) {
            foreach ($dogrulama->errors()->all() as $hata) {
                $this->error($hata);
            }

            return self::FAILURE;
        }

        $mevcut = User::where('email', $eposta)->first();

        if ($mevcut && $mevcut->role_id !== 'superAdmin') {
            // Var olan bir hastayı sessizce yöneticiye terfi ettirmek, yanlış
            // adres yazıldığında fark edilmeyecek bir yetki sızıntısı olurdu.
            $this->error(
                "Bu e-posta zaten '{$mevcut->role_id}' rolüyle kayıtlı. "
                . 'Yönetici yapmak istiyorsanız önce o hesabı elden geçirin.',
            );

            return self::FAILURE;
        }

        $ad = (string) ($this->option('ad') ?: Str::before($eposta, '@'));

        // `id` toplu atamaya kapalı (User::$fillable), o yüzden forceFill.
        $kullanici = $mevcut ?? new User();

        if (!$mevcut) {
            $kullanici->id = (string) Str::uuid();
        }

        $kullanici->forceFill([
            'email'             => $eposta,
            'fullname'          => $mevcut->fullname ?? $ad,
            'password'          => Hash::make($sifre),
            'role_id'           => 'superAdmin',
            'email_verified_at' => $mevcut->email_verified_at ?? now(),
            'is_active'         => true,
            // Tanıtım hesabı: girer, gezer, hiçbir şeyi değiştiremez.
            'salt_okunur'       => (bool) $this->option('salt-okunur'),
        ])->save();

        $this->info($mevcut
            ? "Şifre yenilendi: {$kullanici->email}"
            : "Süper yönetici açıldı: {$kullanici->email}");

        if ($kullanici->salt_okunur) {
            $this->warn('Bu hesap SALT OKUNUR: hiçbir kaydı değiştiremez.');
        }
        $this->line('Panel: <alan-adı>/tr/admin');

        return self::SUCCESS;
    }
}
