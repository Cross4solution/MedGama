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
                'slug'       => 'account',
                'name'       => ['en' => 'Account & Login', 'tr' => 'Hesap & Giriş'],
                'description'=> ['en' => 'Account access, password, profile issues', 'tr' => 'Hesap erişimi, şifre, profil sorunları'],
                'sort_order' => 1,
            ],
            [
                'slug'       => 'appointments',
                'name'       => ['en' => 'Appointments', 'tr' => 'Randevular'],
                'description'=> ['en' => 'Booking, rescheduling, cancellation', 'tr' => 'Randevu alma, değiştirme, iptal'],
                'sort_order' => 2,
            ],
            [
                'slug'       => 'billing',
                'name'       => ['en' => 'Billing & Payments', 'tr' => 'Faturalandırma & Ödemeler'],
                'description'=> ['en' => 'Invoices, payment issues, refunds', 'tr' => 'Faturalar, ödeme sorunları, iadeler'],
                'sort_order' => 3,
            ],
            [
                'slug'       => 'technical',
                'name'       => ['en' => 'Technical Issue', 'tr' => 'Teknik Sorun'],
                'description'=> ['en' => 'Bugs, errors, performance problems', 'tr' => 'Hatalar, aksaklıklar, performans sorunları'],
                'sort_order' => 4,
            ],
            [
                'slug'       => 'telehealth',
                'name'       => ['en' => 'Telehealth', 'tr' => 'Uzaktan Sağlık'],
                'description'=> ['en' => 'Video call, audio, connection issues', 'tr' => 'Görüntülü arama, ses, bağlantı sorunları'],
                'sort_order' => 5,
            ],
            [
                'slug'       => 'feature-request',
                'name'       => ['en' => 'Feature Request', 'tr' => 'Özellik Talebi'],
                'description'=> ['en' => 'Suggestions and improvement ideas', 'tr' => 'Öneri ve iyileştirme fikirleri'],
                'sort_order' => 6,
            ],
            [
                'slug'       => 'other',
                'name'       => ['en' => 'Other', 'tr' => 'Diğer'],
                'description'=> ['en' => 'General questions and other topics', 'tr' => 'Genel sorular ve diğer konular'],
                'sort_order' => 7,
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
