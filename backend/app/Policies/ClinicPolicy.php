<?php

namespace App\Policies;

use App\Models\Clinic;
use App\Models\User;

/**
 * Klinik üzerinde yetki.
 *
 * Bu sınıf EKSİKTİ. AccreditationController iki yerde
 * `$this->authorize('update', $clinic)` çağırıyor; Laravel eşleşen bir
 * politika bulamayınca HERKESİ reddediyor. Sonuç ölçüldü: akreditasyon
 * ekleme ve çıkarma uçları klinik sahibine de yöneticiye de 403 veriyordu,
 * yani özellik hiç çalışmıyordu.
 *
 * Hata sessizdi çünkü 403 "yetkin yok" gibi okunuyor — bozuk gibi değil.
 *
 * Yetki kliniğin SAHİBİNE ve platform yöneticisine veriliyor; akreditasyon
 * bir güven işareti olduğu için başka hiç kimseye açılmıyor. Belgenin
 * doğrulanması ayrı: `is_verified` pivot alanı zaten false yazılıyor ve
 * yalnız yönetici onaylıyor.
 */
class ClinicPolicy
{
    public function update(User $user, Clinic $clinic): bool
    {
        return $user->isAdmin() || $clinic->owner_id === $user->id;
    }

    public function delete(User $user, Clinic $clinic): bool
    {
        return $this->update($user, $clinic);
    }
}
