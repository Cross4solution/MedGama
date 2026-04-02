<?php
 
 namespace Database\Seeders;
 
 use App\Models\User;
 use App\Models\MedStreamPost;
 use Illuminate\Database\Seeder;
 
 class MedStreamSampleSeeder extends Seeder
 {
     public function run(): void
     {
         $doctor = User::where('role_id', 'doctor')->first();
         $clinicOwner = User::where('role_id', 'clinicOwner')->first();
 
         if (!$doctor || !$clinicOwner) {
             $this->command->error('Test doctor or clinic owner not found. Please run DatabaseSeeder first.');
             return;
         }
 
         $posts = [
             [
                 'author_id' => $doctor->id,
                 'content' => 'Yeni yapılan bir araştırma, Akdeniz diyetinin kalp sağlığı üzerindeki olumlu etkilerini bir kez daha kanıtladı. Günlük beslenmenize zeytinyağı ve taze sebzeleri eklemeyi unutmayın! #saglik #beslenme #kalpsagligi',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subHours(2),
             ],
             [
                 'author_id' => $clinicOwner->id,
                 'clinic_id' => $clinicOwner->clinic_id,
                 'content' => 'Kliniğimizde yeni nesil görüntüleme cihazları ile artık çok daha hızlı ve güvenilir teşhis koyabiliyoruz. Detaylı bilgi ve randevu için profilimizdeki linke tıklayabilirsiniz.',
                 'post_type' => 'image',
                 'media_url' => '/images/default/default-page.jpg',
                 'is_active' => true,
                 'created_at' => now()->subHours(5),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Göz sağlığınızı korumak için 20-20-20 kuralını uygulayın: Her 20 dakikada bir, 20 fit (yaklaşık 6 metre) uzağa, 20 saniye boyunca bakın. Ekran başında vakit geçirenler için hayat kurtarıcı bir ipucu! 👓',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(1),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Uyku apnesi belirtileri: Gece uyku sırasında soluk kesme, aşırı horlama, sabah baş ağrısı ve gündüz uyku felci. Bu semptomları yaşıyorsanız mutlaka bir uzmanı görün. Erken teşhis tedaviyi çok daha etkili kılıyor! 😴',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subHours(12),
             ],
             [
                 'author_id' => $clinicOwner->id,
                 'clinic_id' => $clinicOwner->clinic_id,
                 'content' => 'Kardiyoloji bölümümüzde bu ay özel indirimli kalp sağlığı taraması uygulaması başladı. 50 yaş üstü tüm hastalarımız için ücretsiz tansiyon ve kolesterol ölçümü. Sağlığınız bizim önceliyimiz!',
                 'post_type' => 'image',
                 'media_url' => '/images/default/default-page.jpg',
                 'is_active' => true,
                 'created_at' => now()->subHours(18),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Migrenleri tetikleyen faktörler: Stresi, uyku deprivasyonunu, belirli gıdaları (çikolata, kafein) ve hava değişimlerini kontrol edin. Yaşam tarzı değişiklikleri çoğu zaman ilaç kadar etkili olabiliyor. Deneyerek bulun sizin için ne işe yarıyor! 🧠',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(2),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Diyabet yönetiminde kan şekeri kontrol etmek kadar önemli bir konu da düzenli hareket ve fiziksel aktivite. Haftada en az 150 dakika orta şiddette egzersiz yap. Sağlıklı yaşam seninle başlıyor! 🏃‍♂️💪',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(2)->subHours(8),
             ],
             [
                 'author_id' => $clinicOwner->id,
                 'clinic_id' => $clinicOwner->clinic_id,
                 'content' => 'Fizik tedavi bölümümüzde çalışan 8 uzman fizyoterapist, kas-iskelet sistemi problemlerinize modern yaklaşımla çözüm sunuyor. Online konsültasyon hizmetimiz 24/7 aktif!',
                 'post_type' => 'image',
                 'media_url' => '/images/default/default-page.jpg',
                 'is_active' => true,
                 'created_at' => now()->subDays(3),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Cilt bakım tipsinde en önemli adım temizleme! Sabah ve akşam ılık suyla yüzünüzü yıkayın, uygun bir moisturizer kullanın. Güneş koruyucu günlük olmalı - yaşlanmayı en hızlı ilerletenlerden biri UV ışınlarıdır. ☀️',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(3)->subHours(12),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Anksiyete ve panik ataklarla mücadelede en etkili yöntem derin nefes almadır. 4-7-8 tekniğini deneyin: 4 saniye nefes al, 7 saniye tut, 8 saniye çıkar. Bu sadece çalışmıyor, bilimsele de kanıtlanmış! 🧘‍♀️',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(4),
             ],
             [
                 'author_id' => $clinicOwner->id,
                 'clinic_id' => $clinicOwner->clinic_id,
                 'content' => 'Diş hekimliğinde yeni teknoloji: Digitally guided implant işleminde hassasiyet milimetrik düzeydedir. Ağrısız tedavi, daha kısa iyileşme süresi. Dişleriniz için artık daha güvenli seçenekler var!',
                 'post_type' => 'image',
                 'media_url' => '/images/default/default-page.jpg',
                 'is_active' => true,
                 'created_at' => now()->subDays(4)->subHours(6),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Osteoporozu erken yaşta yönetmek çok önemli! Kalsiyum ve D vitamini alımını artırın (süt, balık, yumurta). Kemik yoğunluğu testi düzenli aralıklarla yapılmalı. 55 yaş üstü tüm kadınlara zorunlu tavsiyem! 🦴',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(5),
             ],
             [
                 'author_id' => $doctor->id,
                 'content' => 'Enfeksiyonlardan korunmanın en basit yolu: Sık sık el yıkamak! 20 saniye boyunca sabun ve ılık suyla. Bu davranış grip, covid ve pek çok hastalığı %70 oranında azaltıyor. Basit ama çok güçlü! 🧼',
                 'post_type' => 'text',
                 'is_active' => true,
                 'created_at' => now()->subDays(5)->subHours(10),
             ],
             [
                 'author_id' => $clinicOwner->id,
                 'clinic_id' => $clinicOwner->clinic_id,
                 'content' => 'Ruh sağlığı danışmanlığı hizmetimiz artık Psikoloji, Psikiyatri ve Yaşam Koçluğu paketlerini içeriyor. Uzman ekibimiz stres, depresyon ve hayat danışmanlığında 15 yıl deneyime sahip.',
                 'post_type' => 'image',
                 'media_url' => '/images/default/default-page.jpg',
                 'is_active' => true,
                 'created_at' => now()->subDays(6),
             ],
         ];
 
         foreach ($posts as $postData) {
             MedStreamPost::create($postData);
         }
 
         $this->command->info('15 professional MedStream posts created successfully.');
     }
 }
