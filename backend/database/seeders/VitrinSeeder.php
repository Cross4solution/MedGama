<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\MedStreamPost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Vitrin verisi — 10 klinik, 10 doktor ve BEŞ gönderi türünün hepsi.
 *
 * Neden ayrı bir tohumlayıcı:
 * DatabaseSeeder canlıda çalışan demo veriyi üretiyor ve ona dokunmak
 * istemedik. Bu tohumlayıcı yalnızca EKLER — hiçbir kaydı silmez, mevcut
 * klinik/doktorları değiştirmez.
 *
 * Tekrar çalıştırılabilir: her kayıt updateOrCreate ile sabit bir anahtara
 * bağlı (klinik codename, kullanıcı e-postası, gönderi metni). İkinci
 * çalıştırma kopya üretmez, sadece tarihleri tazeler.
 *
 * Gönderi türleri özellikle önemliydi: canlıda yalnızca text/image/video
 * vardı, oysa sistem `document` ve `mixed` de destekliyor — yani o iki yol
 * hiç denenmemişti. Buradaki dökümanlar SAHTE YOL DEĞİL: tohumlama sırasında
 * gerçek PDF dosyaları storage'a yazılıyor, çünkü indirme ucu yalnızca
 * medstream/ altındaki gerçek dosyalara izin veriyor — uydurma yol koysaydık
 * indirme düğmesi kırık olurdu.
 */
class VitrinSeeder extends Seeder
{
    /** Dökümanların yazılacağı disk klasörü (indirme ucu bu ön eki şart koşuyor). */
    private const BELGE_KLASOR = 'medstream/vitrin';

    public function run(): void
    {
        $klinikler = $this->klinikleriEkle();
        $doktorlar = $this->doktorlariEkle($klinikler);
        $this->gonderileriEkle($klinikler, $doktorlar);

        $this->command->info(sprintf(
            'Vitrin: %d klinik, %d doktor, %d gönderi (eklendi/tazelendi).',
            count($klinikler),
            count($doktorlar),
            $this->gonderiSayisi,
        ));
    }

    private int $gonderiSayisi = 0;

    // ══════════════════════════════════════════════════════════════════════
    //  KLİNİKLER
    // ══════════════════════════════════════════════════════════════════════

    private function klinikleriEkle(): array
    {
        $veri = [
            ['anadolu-tup-bebek', 'Anadolu Tüp Bebek Merkezi', 'İzmir', 'Alsancak, Konak/İzmir', ['Tüp Bebek', 'Kadın Hastalıkları'], 'Üremeye yardımcı tedavilerde 18 yıllık deneyim. IVF, mikroenjeksiyon ve embriyo dondurma işlemlerinde yüksek başarı oranlarıyla çalışıyoruz.'],
            ['beyaz-dis-merkezi', 'Beyaz Diş Ağız ve Diş Sağlığı', 'Ankara', 'Çankaya, Ankara', ['Diş Hekimliği', 'Ortodonti'], 'İmplant, ortodonti ve estetik diş hekimliğinde dijital planlama ile tedavi. Tek seansta zirkonyum kaplama imkânı.'],
            ['derma-estetik', 'Derma Estetik Cilt Merkezi', 'İstanbul', 'Nişantaşı, Şişli/İstanbul', ['Dermatoloji', 'Estetik'], 'Medikal dermatoloji ve estetik uygulamalar. Lazer epilasyon, akne izi tedavisi ve cilt gençleştirmede sertifikalı ekip.'],
            ['noro-beyin-merkezi', 'Nöroloji ve Beyin Merkezi', 'Bursa', 'Nilüfer, Bursa', ['Nöroloji', 'Beyin Cerrahisi'], 'Baş ağrısı, epilepsi ve hareket bozukluklarında ileri tanı. EEG, EMG ve uyku laboratuvarı bünyemizde.'],
            ['umut-onkoloji', 'Umut Onkoloji Merkezi', 'İstanbul', 'Ataşehir, İstanbul', ['Onkoloji', 'Radyoloji'], 'Multidisipliner tümör konseyi ile kişiye özel tedavi planı. Kemoterapi, immünoterapi ve destek bakım hizmetleri.'],
            ['hareket-fizyoterapi', 'Hareket Fizyoterapi Kliniği', 'Antalya', 'Muratpaşa, Antalya', ['Fizik Tedavi', 'Ortopedi'], 'Ameliyat sonrası rehabilitasyon, sporcu sakatlıkları ve kronik ağrı yönetimi. Bire bir egzersiz programları.'],
            ['minik-adimlar-pediatri', 'Minik Adımlar Çocuk Sağlığı', 'Ankara', 'Yenimahalle, Ankara', ['Çocuk Sağlığı', 'Çocuk Nörolojisi'], 'Yenidoğandan ergenliğe kadar büyüme takibi, aşılama ve gelişim değerlendirmesi. Anne sütü danışmanlığı.'],
            ['nar-kadin-dogum', 'Nar Kadın Doğum Kliniği', 'İzmir', 'Karşıyaka, İzmir', ['Kadın Hastalıkları', 'Perinatoloji'], 'Gebelik takibi, riskli gebelik yönetimi ve 4 boyutlu ultrason. Doğuma hazırlık sınıfları düzenli olarak açılıyor.'],
            ['vita-uroloji', 'Vita Üroloji Kliniği', 'Adana', 'Seyhan, Adana', ['Üroloji', 'Androloji'], 'Böbrek taşı, prostat hastalıkları ve erkek sağlığında kapalı yöntem cerrahi. Lazer taş kırma ünitesi mevcut.'],
            ['nefes-kbb', 'Nefes KBB Kliniği', 'İstanbul', 'Kadıköy, İstanbul', ['Kulak Burun Boğaz', 'Alerji'], 'Burun tıkanıklığı, sinüzit ve horlama tedavisi. Endoskopik sinüs cerrahisi ve işitme testleri.'],
        ];

        $klinikler = [];

        foreach ($veri as $sira => [$kod, $ad, $sehir, $adres, $uzmanliklar, $tanitim]) {
            $sahip = User::updateOrCreate(
                ['email' => "{$kod}@medagama.com"],
                [
                    'password'          => 'Password123!',
                    'fullname'          => $ad,
                    'username'          => Str::slug($kod),
                    'role_id'           => 'clinicOwner',
                    'mobile'            => '+90555100' . str_pad((string) (10 + $sira), 4, '0', STR_PAD_LEFT),
                    'email_verified'    => true,
                    'email_verified_at' => now(),
                    'mobile_verified'   => true,
                    'is_verified'       => true,
                    'is_active'         => true,
                ]
            );

            // CRM alanları guarded — yalnızca forceFill ile yazılabiliyor.
            $sahip->forceFill([
                'is_crm_active'  => true,
                'crm_expires_at' => now()->addYear(),
            ])->save();

            $klinik = Clinic::updateOrCreate(
                ['codename' => $kod],
                [
                    'name'                 => $ad,
                    'codename'             => $kod,
                    'fullname'             => $ad,
                    'avatar'               => 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=300&q=80',
                    'owner_id'             => $sahip->id,
                    'address'              => $adres,
                    'phone'                => '+90 232 555 ' . str_pad((string) (1000 + $sira), 4, '0', STR_PAD_LEFT),
                    'biography'            => $tanitim,
                    'specialties'          => $uzmanliklar,
                    'is_verified'          => true,
                    'is_crm_active'        => true,
                    'crm_expires_at'       => now()->addYear(),
                    'onboarding_completed' => true,
                    'verification_status'  => 'verified',
                ]
            );

            $sahip->update(['clinic_id' => $klinik->id]);

            $klinikler[] = ['klinik' => $klinik, 'sahip' => $sahip, 'sehir' => $sehir];
        }

        return $klinikler;
    }

    // ══════════════════════════════════════════════════════════════════════
    //  DOKTORLAR
    // ══════════════════════════════════════════════════════════════════════

    private function doktorlariEkle(array $klinikler): array
    {
        $veri = [
            ['selin-arslan', 'Dr. Selin Arslan', 'Doç. Dr.', 'Kadın Hastalıkları ve Doğum', 16, 'Tüp bebek ve üremeye yardımcı tedaviler alanında çalışıyor. 2.000’in üzerinde IVF siklusu yönetti.', ['Türkçe', 'İngilizce'], 4.9, 213, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80'],
            ['mert-dogan', 'Dt. Mert Doğan', 'Dt.', 'Diş Hekimliği', 11, 'Dijital gülüş tasarımı ve implantoloji üzerine uzmanlaştı. Tek seans zirkonyum uygulamaları yapıyor.', ['Türkçe', 'Almanca'], 4.7, 168, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80'],
            ['ela-yildirim', 'Uzm. Dr. Ela Yıldırım', 'Uzm. Dr.', 'Dermatoloji', 9, 'Medikal dermatoloji, akne ve akne izi tedavisi ile lazer uygulamalarında deneyimli.', ['Türkçe', 'İngilizce', 'Fransızca'], 4.8, 194, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&q=80'],
            ['kaan-ozturk', 'Prof. Dr. Kaan Öztürk', 'Prof. Dr.', 'Nöroloji', 24, 'Epilepsi ve hareket bozuklukları üzerine akademik çalışmaları bulunuyor. EEG yorumlamada referans hekim.', ['Türkçe', 'İngilizce'], 4.9, 302, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80'],
            ['nazli-cetin', 'Doç. Dr. Nazlı Çetin', 'Doç. Dr.', 'Onkoloji', 15, 'Meme ve akciğer kanserinde immünoterapi protokolleri üzerine çalışıyor. Tümör konseyi koordinatörü.', ['Türkçe', 'İngilizce'], 4.9, 251, 'https://images.unsplash.com/photo-1638202993928-7267aba84c7f?w=300&q=80'],
            ['burak-sahin', 'Fzt. Burak Şahin', 'Fzt.', 'Fizik Tedavi ve Rehabilitasyon', 12, 'Sporcu sakatlıkları ve ameliyat sonrası rehabilitasyonda bire bir program yürütüyor.', ['Türkçe', 'İngilizce'], 4.6, 137, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&q=80'],
            ['deniz-korkmaz', 'Uzm. Dr. Deniz Korkmaz', 'Uzm. Dr.', 'Çocuk Sağlığı ve Hastalıkları', 13, 'Yenidoğan takibi, aşılama ve gelişim değerlendirmesi. Anne sütü danışmanlığı sertifikalı.', ['Türkçe', 'İngilizce'], 4.8, 221, 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&q=80'],
            ['irem-aydin', 'Uzm. Dr. İrem Aydın', 'Uzm. Dr.', 'Kadın Hastalıkları ve Doğum', 10, 'Riskli gebelik takibi ve perinatoloji. 4 boyutlu ultrason ile fetal anomali taraması yapıyor.', ['Türkçe', 'İngilizce'], 4.7, 156, 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&q=80'],
            ['emre-tas', 'Op. Dr. Emre Taş', 'Op. Dr.', 'Üroloji', 18, 'Böbrek taşı cerrahisi ve prostat hastalıklarında kapalı yöntemler. Lazer taş kırma uygulayıcısı.', ['Türkçe', 'Arapça'], 4.8, 189, 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&q=80'],
            ['ceren-kilic', 'Op. Dr. Ceren Kılıç', 'Op. Dr.', 'Kulak Burun Boğaz', 14, 'Endoskopik sinüs cerrahisi, horlama ve uyku apnesi tedavisi üzerine çalışıyor.', ['Türkçe', 'İngilizce'], 4.7, 174, 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&q=80'],
        ];

        $doktorlar = [];

        foreach ($veri as $sira => [$kod, $ad, $unvan, $uzmanlik, $yil, $ozgecmis, $diller, $puan, $yorum, $avatar]) {
            $klinik = $klinikler[$sira]['klinik'] ?? null;
            $sehir  = $klinikler[$sira]['sehir'] ?? 'İstanbul';

            $doktor = User::updateOrCreate(
                ['email' => "{$kod}@medagama.com"],
                [
                    'password'           => 'Password123!',
                    'fullname'           => $ad,
                    'username'           => Str::slug($kod),
                    'avatar'             => $avatar,
                    'role_id'            => 'doctor',
                    'mobile'             => '+90555200' . str_pad((string) (10 + $sira), 4, '0', STR_PAD_LEFT),
                    'email_verified'     => true,
                    'email_verified_at'  => now(),
                    'mobile_verified'    => true,
                    'is_verified'        => true,
                    'verification_status' => 'verified',
                    'is_active'          => true,
                    'clinic_id'          => $klinik?->id,
                ]
            );

            DoctorProfile::updateOrCreate(
                ['user_id' => $doktor->id],
                [
                    'user_id'             => $doktor->id,
                    'clinic_id'           => $klinik?->id,
                    'title'               => $unvan,
                    'specialty'           => $uzmanlik,
                    'bio'                 => $ozgecmis,
                    'experience_years'    => (string) $yil,
                    'languages'           => $diller,
                    'address'             => $klinik?->address ?? $sehir,
                    'online_consultation' => true,
                    'accepts_insurance'   => true,
                    'avg_rating'          => $puan,
                    'review_count'        => $yorum,
                    'onboarding_completed' => true,
                ]
            );

            $doktorlar[] = $doktor;
        }

        return $doktorlar;
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MEDSTREAM GÖNDERİLERİ — beş türün hepsi
    // ══════════════════════════════════════════════════════════════════════

    private function gonderileriEkle(array $klinikler, array $doktorlar): void
    {
        // Dökümanlar gerçek dosya olmak zorunda; indirme ucu uydurma yolu reddediyor.
        $brosur  = $this->belgeYaz('anadolu-tup-bebek-bilgilendirme.pdf', 'Tüp Bebek Tedavi Süreci — Hasta Bilgilendirme');
        $rapor   = $this->belgeYaz('umut-onkoloji-yillik-rapor.pdf', 'Umut Onkoloji Merkezi — Yillik Tedavi Sonuclari');
        $egzersiz = $this->belgeYaz('hareket-fizyoterapi-egzersiz-programi.pdf', 'Ameliyat Sonrasi Diz Rehabilitasyon Programi');

        $gonderiler = [
            // ---- text ----
            [
                'yazar' => $doktorlar[3] ?? null,
                'metin' => "🧠 MİGREN ATAĞINI TETİKLEYEN 7 ETKEN\n\nHastalarımın büyük kısmı atağın \"sebepsiz\" geldiğini söylüyor. Oysa günlük tutmaya başladıklarında örüntü çoğu zaman ortaya çıkıyor: uyku düzensizliği, öğün atlama, yoğun koku, hava basıncı değişimi, adet döngüsü, aşırı kafein ve stres sonrası gevşeme dönemi.\n\nAtak günlüğü tutmak tedavinin ilk adımıdır. Üç hafta boyunca kaydettiğiniz veriler, ilaç seçimini doğrudan değiştirebilir.",
                'tur'   => 'text',
                'gun'   => 1,
            ],
            [
                'yazar' => $doktorlar[6] ?? null,
                'metin' => "👶 BEBEĞİNİZDE ATEŞ: NE ZAMAN ACİLE GİTMELİ?\n\n3 aydan küçük bebeklerde 38°C ve üzeri her ateş acil değerlendirme gerektirir — istisnasız.\n\n3-6 ay arası: 38.5°C üzeri ya da huzursuzluk, beslenmede azalma varsa aynı gün başvurun.\n\n6 aydan büyük: ateşin derecesinden çok bebeğin genel hâli önemlidir. Ateş düştüğünde oynuyor, gülüyor ve sıvı alıyorsa beklenebilir. Ancak morarma, döküntü, boyun sertliği veya havale varsa derhal acile gidin.",
                'tur'   => 'text',
                'gun'   => 3,
            ],
            // ---- image ----
            [
                'yazar' => $doktorlar[1] ?? null,
                'metin' => '😁 Dijital gülüş tasarımı ile 8 günde tamamlanan vaka. Hastamızın ön dişlerindeki renklenme ve boy farkı, zirkonyum kaplama ile giderildi. Tedavi öncesi dijital tarama yapıldığı için prova aşamasında hiç değişiklik gerekmedi.',
                'tur'   => 'image',
                'medya' => [['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=80', 'name' => 'gulus-tasarimi.jpg']],
                'gun'   => 2,
            ],
            [
                'yazar' => $doktorlar[5] ?? null,
                'metin' => '💪 Ön çapraz bağ ameliyatı sonrası 6. hafta: denge tahtasında propriosepsiyon çalışması. Bu aşamayı atlayan sporcularda tekrar yaralanma riski belirgin şekilde artıyor. Programı hastanın ağrı eşiğine göre haftalık güncelliyoruz.',
                'tur'   => 'image',
                'medya' => [['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80', 'name' => 'rehabilitasyon.jpg']],
                'gun'   => 4,
            ],
            // ---- video ----
            [
                'yazar' => $doktorlar[9] ?? null,
                'metin' => '🫁 HORLAMA MI, UYKU APNESİ Mİ? Aradaki farkı ve evde uygulanabilecek ilk adımları anlattım. Eşiniz gece nefesinizin durduğunu söylüyorsa, bu artık basit bir horlama değildir — uyku testi gerekir.',
                'tur'   => 'video',
                'medya' => [['type' => 'video', 'url' => 'https://www.youtube.com/watch?v=5MuIMqhT8DM', 'name' => 'uyku-apnesi.mp4']],
                'gun'   => 5,
            ],
            [
                'yazar' => $doktorlar[0] ?? null,
                'metin' => '🔬 Tüp bebek sürecinde embriyo transferi nasıl yapılır? İşlemin ağrısız olduğunu ve yaklaşık 10 dakika sürdüğünü çoğu hastamız duyunca rahatlıyor. Süreci adım adım anlattım.',
                'tur'   => 'video',
                'medya' => [['type' => 'video', 'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'name' => 'embriyo-transferi.mp4']],
                'gun'   => 6,
            ],
            // ---- document ----
            [
                'yazar' => $klinikler[0]['sahip'] ?? null,
                'klinik' => $klinikler[0]['klinik'] ?? null,
                'metin' => '📄 Tüp bebek tedavisine başlayacak çiftler için hazırladığımız bilgilendirme kitapçığını paylaşıyoruz. Tedavi öncesi testler, ilaç takvimi, transfer günü ve sonrasında dikkat edilmesi gerekenler adım adım anlatılıyor.',
                'tur'   => 'document',
                'medya' => [['type' => 'document', 'url' => $brosur, 'original' => $brosur, 'name' => 'Tup-Bebek-Bilgilendirme.pdf']],
                'gun'   => 7,
            ],
            [
                'yazar' => $klinikler[5]['sahip'] ?? null,
                'klinik' => $klinikler[5]['klinik'] ?? null,
                'metin' => '📄 Diz protezi ve ön çapraz bağ ameliyatı sonrası uyguladığımız 12 haftalık rehabilitasyon programını yayımladık. Her hafta için hedef hareket açıklığı ve egzersiz sayıları belirtildi.',
                'tur'   => 'document',
                'medya' => [['type' => 'document', 'url' => $egzersiz, 'original' => $egzersiz, 'name' => 'Diz-Rehabilitasyon-Programi.pdf']],
                'gun'   => 8,
            ],
            // ---- mixed (görsel + döküman bir arada) ----
            [
                'yazar' => $klinikler[4]['sahip'] ?? null,
                'klinik' => $klinikler[4]['klinik'] ?? null,
                'metin' => "📊 2025 yılı tedavi sonuçlarımızı yayımladık. Meme kanserinde erken evre hastalarımızda 5 yıllık sağkalım oranı %94'e ulaştı.\n\nHem özet görseli hem de tam raporu ekte bulabilirsiniz. Şeffaflık, hasta güveninin temelidir.",
                'tur'   => 'mixed',
                'medya' => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80', 'name' => 'sonuc-ozeti.jpg'],
                    ['type' => 'document', 'url' => $rapor, 'original' => $rapor, 'name' => 'Yillik-Tedavi-Raporu.pdf'],
                ],
                'gun'   => 9,
            ],
            [
                'yazar' => $doktorlar[2] ?? null,
                'metin' => "✨ Akne izi tedavisinde fraksiyonel lazer öncesi ve sonrası — 4 seans, 6 ay ara.\n\nHastanın izin verdiği görselleri ve uyguladığımız seans protokolünü paylaşıyorum. Cilt tipi ve iz derinliğine göre seans sayısı değişebilir.",
                'tur'   => 'mixed',
                'medya' => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&q=80', 'name' => 'lazer-oncesi-sonrasi.jpg'],
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80', 'name' => 'seans-protokolu.jpg'],
                ],
                'gun'   => 10,
            ],
        ];

        foreach ($gonderiler as $g) {
            if (!$g['yazar']) {
                continue;
            }

            MedStreamPost::updateOrCreate(
                // Metin + yazar anahtar: ikinci çalıştırma kopya değil güncelleme yapar.
                ['content' => $g['metin'], 'author_id' => $g['yazar']->id],
                [
                    'author_id'  => $g['yazar']->id,
                    'clinic_id'  => $g['klinik']->id ?? $g['yazar']->clinic_id,
                    'content'    => $g['metin'],
                    'post_type'  => $g['tur'],
                    'media'      => $g['medya'] ?? null,
                    'media_url'  => $g['medya'][0]['url'] ?? null,
                    'is_active'  => true,
                    'created_at' => now()->subDays($g['gun'])->subHours($g['gun'] * 2),
                ]
            );

            $this->gonderiSayisi++;
        }
    }

    /**
     * Küçük ama GEÇERLİ bir PDF yazar ve genel yolunu döndürür.
     *
     * Elle kuruluyor çünkü tohumlayıcıya PDF kütüphanesi bağımlılığı eklemek
     * istemedik; tek sayfa, tek satır başlık yeterli. Amaç dosyanın gerçekten
     * var olması: indirme ucu diskte olmayan yolu reddediyor.
     */
    private function belgeYaz(string $dosyaAdi, string $baslik): string
    {
        $yol = self::BELGE_KLASOR . '/' . $dosyaAdi;

        if (!Storage::disk('public')->exists($yol)) {
            Storage::disk('public')->put($yol, $this->pdfUret($baslik));
        }

        return '/storage/' . $yol;
    }

    /** Tek sayfalık, tek satırlık geçerli bir PDF üretir. */
    private function pdfUret(string $baslik): string
    {
        // PDF'te parantez ve ters bölü kaçırılmalı, yoksa dosya bozulur.
        $metin = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $baslik);
        $akis  = "BT /F1 16 Tf 60 760 Td ({$metin}) Tj ET";

        $nesneler = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                . "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
            "5 0 obj\n<< /Length " . strlen($akis) . " >>\nstream\n{$akis}\nendstream\nendobj\n",
        ];

        $pdf     = "%PDF-1.4\n";
        $konumlar = [];

        foreach ($nesneler as $nesne) {
            $konumlar[] = strlen($pdf);
            $pdf .= $nesne;
        }

        $xrefKonum = strlen($pdf);
        $pdf .= "xref\n0 " . (count($nesneler) + 1) . "\n0000000000 65535 f \n";

        foreach ($konumlar as $k) {
            $pdf .= sprintf("%010d 00000 n \n", $k);
        }

        $pdf .= "trailer\n<< /Size " . (count($nesneler) + 1) . " /Root 1 0 R >>\n"
            . "startxref\n{$xrefKonum}\n%%EOF\n";

        return $pdf;
    }
}
