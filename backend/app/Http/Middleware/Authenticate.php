<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Auth\AuthenticationException;

class Authenticate extends Middleware
{
    /**
     * Kimlik doğrulandıktan sonra hesabın hâlâ AÇIK olduğu da doğrulanıyor.
     *
     * `is_active` yalnızca GİRİŞTE bakılıyordu. Ölçülen sonuç: bir yönetici
     * hesabı askıya aldıktan sonra o kullanıcının eldeki jetonu çalışmaya
     * devam ediyordu —
     *
     *     GET /api/auth/me        → 200   (hâlâ içeride)
     *     PUT /api/auth/profile   → 200   (yazabiliyor da)
     *     POST /api/auth/login    → 422   (yalnızca yeni giriş engelli)
     *
     * Yani askıya alma, kullanıcı kendi isteğiyle çıkış yapana kadar hiçbir
     * şey yapmıyordu. Yönetici ekranında "User suspended." yazıyor ve hesabın
     * durdurulduğu sanılıyor. Askıya almanın var oluş sebebi (taciz, ele
     * geçirilmiş hesap, ödeme yapmayan klinik) tam da bu durum.
     *
     * Denetim burada, çünkü jeton iptali tek başına yetmez: başka bir yoldan
     * üretilmiş ya da askıya alma anında yaratılmış bir jeton yine geçerdi.
     */
    protected function authenticate($request, array $guards)
    {
        parent::authenticate($request, $guards);

        $user = $request->user();

        if ($user instanceof \App\Models\User && !$user->is_active) {
            throw new AuthenticationException('Hesabınız askıya alınmış.', $guards);
        }
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo($request): ?string
    {
        // For API requests, do not redirect to a web login route.
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }

        return route('login');
    }
}
