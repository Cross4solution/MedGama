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
         ];
 
         foreach ($posts as $postData) {
             MedStreamPost::create($postData);
         }
 
         $this->command->info('3 sample MedStream posts created successfully.');
     }
 }
