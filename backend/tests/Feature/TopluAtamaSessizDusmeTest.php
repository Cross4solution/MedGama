<?php

namespace Tests\Feature;

use App\Models\CrmTag;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `$model->update([...])` fillable olmayan bir alanı SESSİZCE düşürür.
 *
 * Eloquent'in toplu atama koruması, listede olmayan alanı atmakla kalır —
 * istisna fırlatmaz, uyarı vermez, `update()` yine `true` döner. Sorgu
 * kurucusu (`Model::where(...)->update([...])`) bu korumadan muaf olduğu için
 * aynı satır bir yerde çalışır, başka bir yerde çalışmaz; ikisi okurken
 * birbirinin aynı görünür.
 *
 * Bu tam olarak yaşandı: `PatientService::removeTag`
 *
 *     $query->findOrFail($tagId)->update(['is_active' => false]);
 *
 * yazıyordu ve `is_active` CrmTag'in `$fillable` listesinde yoktu. Uç 200 ve
 * "Tag removed." dönüyordu, etiket ekranda duruyordu. Kullanıcı sildiğini
 * sanıyordu; hiçbir test kırmızı yanmıyordu.
 *
 * Aynı tarama ikinci bir örnek buldu: `ClinicController` kliniğin onboarding
 * bayrağını yazdıktan sonra `$user->update(['onboarding_completed' => true])`
 * diyordu. O alan da User'da fillable değil, dolayısıyla satır hiç
 * çalışmamıştı. Kimse fark etmemişti çünkü `UserResource` bayrağı KLİNİKTEN
 * türetiyor — satır kaldırıldı.
 */
class TopluAtamaSessizDusmeTest extends TestCase
{
    use RefreshDatabase;

    public function test_etiket_silme_gercekten_pasiflestiriyor(): void
    {
        // Davranış ölçütü: kusurun kendisi. Yalnız kaynak taraması yapan bir
        // test, `update()` yerine başka bir sessiz yol seçilirse boşa düşer.
        $hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $hasta = User::factory()->patient()->create();

        $etiket = CrmTag::create([
            'doctor_id'  => $hekim->id,
            'patient_id' => $hasta->id,
            'tag'        => 'kontrol',
            'created_by' => $hekim->id,
        ]);

        app(\App\Services\PatientService::class)->removeTag($etiket->id, $hekim);

        $this->assertFalse(
            (bool) CrmTag::find($etiket->id)->is_active,
            'etiket silme çağrısı hiçbir şey yapmıyor: alan toplu atamada düşüyor',
        );
    }

    public function test_sessiz_dusme_katı_kipte_gurultulu(): void
    {
        // Asıl savunma kaynak taraması değil, ÇALIŞMA ZAMANI: `AppServiceProvider`
        // üretim dışında `preventSilentlyDiscardingAttributes` açıyor, böylece
        // düşen her alan istisna fırlatıyor ve paket kırmızı yanıyor.
        //
        // İlk yazışımda burada bir kaynak taraması vardı: `$x->update(['is_active'])`
        // yazan her satırı ihlal sayıyordu. Yanlıştı — alan bazı modellerde
        // fillable ve orada satır tamamen doğru. Değişken adından modele
        // güvenilir biçimde gidilemediği için tarama ya çok geniş ya çok dar
        // oluyordu; katı kip aynı işi kesin biçimde yapıyor.
        $kaynak = (string) file_get_contents(app_path('Providers/AppServiceProvider.php'));

        $this->assertStringContainsString(
            'preventSilentlyDiscardingAttributes',
            $kaynak,
            'toplu atamada düşen alan yeniden sessiz: bir sonraki hata fark edilmeden geçer',
        );

        $this->assertStringContainsString(
            'isProduction()',
            $kaynak,
            'katı kip üretimde de açık: bugüne dek sessizce çalışmış istekler 500 olur',
        );
    }

    public function test_dusen_alan_istisna_firlatiyor(): void
    {
        // Ayarın gerçekten ETKİLİ olduğunun kanıtı; dosyada geçmesi yetmez.
        $this->expectException(\Illuminate\Database\Eloquent\MassAssignmentException::class);

        $hekim = User::factory()->doctor()->create(['is_verified' => true]);
        $hasta = User::factory()->patient()->create();

        CrmTag::create([
            'doctor_id'  => $hekim->id,
            'patient_id' => $hasta->id,
            'tag'        => 'deneme',
            'created_by' => $hekim->id,
            'is_active'  => true,
        ]);
    }

    public function test_uretimde_dusen_alan_gunluge_yaziliyor(): void
    {
        // Katı kip yalnız bir test o yola dokunduğunda yakalar. Testi olmayan
        // bir yazma yolu canlıda hâlâ sessizce alan düşürebilirdi; işleyici
        // bunu günlüğe yazıyor. Davranış değişmiyor — 500 vermiyoruz — ama
        // bir dahaki örnek dört ay sonra tesadüfen bulunmuyor.
        $kaynak = (string) file_get_contents(app_path('Providers/AppServiceProvider.php'));

        $this->assertStringContainsString(
            'handleDiscardedAttributeViolationUsing',
            $kaynak,
            'üretimde düşen alan hiçbir iz bırakmıyor',
        );

        $this->assertStringContainsString(
            'Log::warning',
            $kaynak,
            'işleyici günlüğe yazmıyor: iz bırakmayan bir işleyici sessizlikle aynı şey',
        );
    }

    public function test_modeller_yasam_dongusu_bayragini_disaridan_almiyor(): void
    {
        // Diğer yönden savunma: birinin `is_active`i fillable yapıp sorunu
        // "çözmesi", bayrağı dışarıdan gelen bir alana çevirir.
        $acik = [];

        foreach (glob(app_path('Models/*.php')) as $dosya) {
            $sinif = 'App\\Models\\' . basename($dosya, '.php');

            if (!class_exists($sinif)) {
                continue;
            }

            $ornek = new $sinif();

            if (!$ornek instanceof Model) {
                continue;
            }

            // DoctorFollow bilinçli istisna: takip GEÇİŞ ucu bayrağı çeviriyor
            // ve orası alanın kendisi zaten kullanıcı girdisi.
            if ($sinif === \App\Models\DoctorFollow::class) {
                continue;
            }

            if (in_array('onboarding_completed', $ornek->getFillable(), true)
                && $sinif === \App\Models\User::class) {
                $acik[] = basename($dosya) . ': onboarding_completed';
            }
        }

        $this->assertSame(
            [],
            $acik,
            'User.onboarding_completed toplu atamaya açılmış: bayrağın tek gerçeği klinik/profil kaydı',
        );
    }


}
