<?php

namespace Database\Seeders;

use App\Models\TicketCategory;
use Illuminate\Database\Seeder;

class TicketCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'slug'       => 'technical',
                'name'       => ['en' => 'Technical', 'tr' => 'Teknik'],
                'description'=> ['en' => 'Bugs, errors, performance problems', 'tr' => 'Hatalar, aksaklıklar, performans sorunları'],
                'sort_order' => 1,
            ],
            [
                'slug'       => 'billing',
                'name'       => ['en' => 'Billing', 'tr' => 'Faturalandırma'],
                'description'=> ['en' => 'Invoices, payment issues, refunds', 'tr' => 'Faturalar, ödeme sorunları, iadeler'],
                'sort_order' => 2,
            ],
            [
                'slug'       => 'medical',
                'name'       => ['en' => 'Medical', 'tr' => 'Tıbbi'],
                'description'=> ['en' => 'Medical records, prescriptions, health data', 'tr' => 'Tıbbi kayıtlar, reçeteler, sağlık verileri'],
                'sort_order' => 3,
            ],
            [
                'slug'       => 'verification',
                'name'       => ['en' => 'Verification', 'tr' => 'Doğrulama'],
                'description'=> ['en' => 'Account verification, document approval', 'tr' => 'Hesap doğrulama, belge onayı'],
                'sort_order' => 4,
            ],
            [
                'slug'       => 'account',
                'name'       => ['en' => 'Account & Login', 'tr' => 'Hesap & Giriş'],
                'description'=> ['en' => 'Account access, password, profile issues', 'tr' => 'Hesap erişimi, şifre, profil sorunları'],
                'sort_order' => 5,
            ],
            [
                'slug'       => 'appointments',
                'name'       => ['en' => 'Appointments', 'tr' => 'Randevular'],
                'description'=> ['en' => 'Booking, rescheduling, cancellation', 'tr' => 'Randevu alma, değiştirme, iptal'],
                'sort_order' => 6,
            ],
            [
                'slug'       => 'telehealth',
                'name'       => ['en' => 'Telehealth', 'tr' => 'Uzaktan Sağlık'],
                'description'=> ['en' => 'Video call, audio, connection issues', 'tr' => 'Görüntülü arama, ses, bağlantı sorunları'],
                'sort_order' => 7,
            ],
            [
                'slug'       => 'feature-request',
                'name'       => ['en' => 'Feature Request', 'tr' => 'Özellik Talebi'],
                'description'=> ['en' => 'Suggestions and improvement ideas', 'tr' => 'Öneri ve iyileştirme fikirleri'],
                'sort_order' => 8,
            ],
            [
                'slug'       => 'other',
                'name'       => ['en' => 'Other', 'tr' => 'Diğer'],
                'description'=> ['en' => 'General questions and other topics', 'tr' => 'Genel sorular ve diğer konular'],
                'sort_order' => 9,
            ],
        ];

        foreach ($categories as $cat) {
            TicketCategory::updateOrCreate(
                ['slug' => $cat['slug']],
                $cat
            );
        }

        $this->command->info('✅ ' . count($categories) . ' ticket categories seeded.');
    }
}
