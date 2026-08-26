<?php

namespace Tests\Feature;

use App\Models\DoctorFaq;
use App\Models\DoctorFollow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kapsanmayan son iki yazma ucu — takibi bırakma ve SSS sıralaması.
 *
 * İkisinin de tek koruması, sorgunun ÇAĞIRANIN KENDİ kayıtlarıyla sınırlı
 * olması: `where('follower_id', $user->id)` ve `where('doctor_id', $user->id)`.
 * Bu sınır bir gün düşerse uçlar 200 dönmeye devam eder; değişen tek şey KİMİN
 * kaydının değiştiğidir. Takip sayıları ve SSS sırası sessizce başkasının
 * profilinde oynar.
 *
 * İkisi de sorgu kurucusuyla yazıyor, yani toplu atama korumasının kapsamı
 * dışında — bu uçlarda `is_active`/`sort_order` gerçekten yazılıyor.
 * (Bkz. TopluAtamaSessizDusmeTest: örnek üzerinden yapılan aynı yazma sessizce
 * düşerdi.)
 */
class KalanYazmaUclariTest extends TestCase
{
    use RefreshDatabase;

    private function olarak(User $user): self
    {
        $jeton = $user->createToken('test')->plainTextToken;
        app('auth')->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer ' . $jeton);
    }

    public function test_takibi_birakma_yalnizca_kendi_kaydini_kapatiyor(): void
    {
        $hekim = User::factory()->doctor()->create(['is_active' => true, 'is_verified' => true]);
        $ben = User::factory()->patient()->create();
        $baskasi = User::factory()->patient()->create();

        foreach ([$ben, $baskasi] as $takipci) {
            DoctorFollow::create([
                'follower_id'    => $takipci->id,
                'following_id'   => $hekim->id,
                'following_type' => 'doctor',
                'is_active'      => true,
            ]);
        }

        $this->olarak($ben)
            ->postJson('/api/social/unfollow', ['target_type' => 'doctor', 'target_id' => $hekim->id])
            ->assertOk();

        $benimki = DoctorFollow::where('follower_id', $ben->id)->first();
        $onunki  = DoctorFollow::where('follower_id', $baskasi->id)->first();

        $this->assertFalse((bool) $benimki->is_active, 'kendi takibim kapanmadı');
        $this->assertTrue((bool) $onunki->is_active, 'başkasının takibi de kapandı');
    }

    public function test_takibi_birakma_oturum_istiyor(): void
    {
        $hekim = User::factory()->doctor()->create(['is_active' => true]);

        $this->postJson('/api/social/unfollow', [
            'target_type' => 'doctor',
            'target_id'   => $hekim->id,
        ])->assertStatus(401);
    }

    public function test_sss_siralamasi_baskasinin_kayitlarina_dokunmuyor(): void
    {
        $benimHekim = User::factory()->doctor()->create(['is_verified' => true]);
        $digerHekim = User::factory()->doctor()->create(['is_verified' => true]);

        $benim = DoctorFaq::create([
            'doctor_id' => $benimHekim->id,
            'question'  => 'Randevu nasıl alınır?',
            'answer'    => 'Profil sayfasından.',
            'sort_order' => 5,
        ]);

        $digeri = DoctorFaq::create([
            'doctor_id' => $digerHekim->id,
            'question'  => 'Ödeme nasıl yapılır?',
            'answer'    => 'Kartla.',
            'sort_order' => 5,
        ]);

        // Sıralama isteğine BAŞKASININ kaydını da koyuyoruz: kapsam sınırı
        // düşerse o kaydın sırası da değişir.
        $this->olarak($benimHekim)
            ->putJson('/api/doctor-profile/faqs/reorder', [
                'order' => [$digeri->id, $benim->id],
            ])
            ->assertOk();

        $this->assertSame(1, (int) $benim->fresh()->sort_order, 'kendi SSS sıram değişmedi');
        $this->assertSame(5, (int) $digeri->fresh()->sort_order, 'başka hekimin SSS sırası değişti');
    }

    public function test_sss_siralamasi_oturum_istiyor(): void
    {
        $this->putJson('/api/doctor-profile/faqs/reorder', ['order' => []])
            ->assertStatus(401);
    }
}
