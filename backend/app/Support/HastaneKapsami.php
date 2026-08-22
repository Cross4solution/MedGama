<?php

namespace App\Support;

use App\Models\Clinic;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Bir hastane hesabının kapsamına giren klinikler.
 *
 * Neden ayrı bir sınıf: aynı sorgu üç ayrı serviste kopyalanmıştı
 * (BillingService, FinanceService, ClinicManagerService) ve üçünde de aynı
 * kusur vardı —
 *
 *     Clinic::where('hospital_id', $user->hospital_id)
 *
 * `hospital_id` BOŞ olduğunda bu sorgu `WHERE hospital_id IS NULL` haline
 * geliyor ve BAĞIMSIZ kliniklerin hepsini eşliyor. Yani hastaneye
 * bağlanmamış bir hastane hesabı, platformdaki bütün bağımsız kliniklerin
 * faturalarını ve cirosunu görüyordu. Ölçüldü: fatura listesinde başka bir
 * kliniğin kaydı göründü.
 *
 * Boş bağ artık "her şey" değil "hiçbir şey" demek. Yarım kalmış bir hesabın
 * boş liste görmesi, başkasının ciro tablosunu görmesinden iyidir.
 */
class HastaneKapsami
{
    /**
     * Kullanıcının hastanesine bağlı klinik kimlikleri.
     *
     * Hastane bağı yoksa BOŞ döner — çağıranlar bunu "eşleşme yok" olarak
     * kullanmalı, süzgeci atlamak için değil.
     */
    public static function klinikKimlikleri(User $user): Collection
    {
        if (!$user->hospital_id) {
            return collect();
        }

        return Clinic::where('hospital_id', $user->hospital_id)->pluck('id');
    }
}
