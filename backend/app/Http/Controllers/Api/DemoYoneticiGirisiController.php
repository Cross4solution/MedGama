<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Yönetim panelini şifresiz açar — tanıtım için, bilerek.
 *
 * Ne yaptığımızı yazalım: bu uç açıkken `/admin` adresine ulaşan herkes
 * yönetim paneline girer. Bağlantıyı bulan, tarayıcı geçmişinden görene,
 * iletilen bir ekran görüntüsünden okuyana kadar. Kimlik doğrulaması yok.
 *
 * Bu bilinçli bir karardı; müşteriye paneli göstermenin başka yolu
 * istenmedi. Zararı sınırlayan üç şey var:
 *
 *   1. Verilen oturum SALT OKUNUR bir hesaba ait. `SaltOkunurKullanici`
 *      middleware'i her yazma isteğini 403 ile geri çeviriyor — yani
 *      gelen kişi hiçbir kaydı silemez, değiştiremez, ekleyemez.
 *   2. Uç varsayılan olarak KAPALI. `DEMO_ADMIN_AUTO_LOGIN` tanımlı
 *      değilse 404 döner; yani unutulursa açık değil kapalı kalır.
 *   3. Yanıt `noindex` başlığıyla çıkıyor.
 *
 * Kapatmak: Render panelinden `DEMO_ADMIN_AUTO_LOGIN` değişkenini silin ya
 * da `false` yapın. Dağıtım beklemeye gerek yok, bir sonraki istekte kapanır.
 *
 * Tanıtım bitince kapatılmalı. Kalıcı bir düzen değil.
 */
class DemoYoneticiGirisiController extends Controller
{
    public function __invoke(): JsonResponse
    {
        if (!config('demo.yonetici_otomatik_giris')) {
            // 403 değil 404: kapalıyken böyle bir uç OLMADIĞINI söylüyoruz.
            // 403 "burada bir kapı var ama kapalı" demek olurdu ve kapıyı
            // arayan birine yol gösterirdi.
            return response()->json([
                'success' => false,
                'message' => 'Bulunamadı.',
            ], 404);
        }

        $eposta = (string) config('demo.yonetici_hesabi');
        $kullanici = User::where('email', $eposta)->first();

        if ($kullanici && !$kullanici->salt_okunur) {
            // Bu adres bu mekanizmaya ayrılmış. Gerçek bir yönetici hesabına
            // denk gelirse jeton ÜRETMİYORUZ: yanlış yapılandırılmış tek bir
            // değişken, tam yetkili bir hesabı herkese açardı.
            return response()->json([
                'success' => false,
                'message' => 'Demo hesabı yapılandırması geçersiz.',
                'code'    => 'DEMO_HESABI_GECERSIZ',
            ], 500);
        }

        if (!$kullanici) {
            // Render'ın ücretsiz katmanında kabuk erişimi yok; hesabın elle
            // açılması istenemiyor. Bu yüzden ilk istekte kendisi kuruluyor.
            $kullanici = new User();
            $kullanici->id = (string) Str::uuid();
            $kullanici->forceFill([
                'email'    => $eposta,
                'fullname' => 'Demo Yönetici',
                // Rastgele ve hiçbir yerde saklanmayan bir şifre: hesabın
                // normal giriş ekranından kullanılabilir olmasını istemiyoruz.
                'password' => Hash::make(Str::random(64)),
                'role_id'  => 'superAdmin',
                'email_verified_at' => now(),
                'is_active'   => true,
                'salt_okunur' => true,
            ])->save();
        }

        // Eski jetonlar birikmesin: her ziyaret yeni jeton üretiyor.
        $kullanici->tokens()->delete();

        return response()->json([
            'success' => true,
            'token'   => $kullanici->createToken('demo-yonetici')->plainTextToken,
            'user'    => new \App\Http\Resources\UserResource($kullanici),
        ])->header('X-Robots-Tag', 'noindex, nofollow');
    }
}
